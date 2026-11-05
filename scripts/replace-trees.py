"""Coquito tree replacement for the chairlift village video.
All 7 flavors:
  python3 scripts/replace-trees.py <video> out.mp4 public/assets/coquito/trees green=pistacho,almendra,pistacho dark=cafe,cafe extras=scripts/coquito-extras.json
Replace the green cone tree and the dark bottle-brush tree in the reference
video with coquito-tree cutouts.  Usage:
  python3 composite.py <video> <out.mp4> <trees_dir> green=a,b,c dark=x,y
Flavor lists are assigned per detected segment (in time order, cycling)."""
import cv2, numpy as np, subprocess, sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kltrack import track_anchor

src, out, tdir = sys.argv[1], sys.argv[2], sys.argv[3]
opts = dict(a.split("=") for a in sys.argv[4:])
green_fl = opts.get("green", "pistacho").split(",")
dark_fl = opts.get("dark", "cafe").split(",")
SCALE = 2.25  # 480x816 -> 1080x1836

cap = cv2.VideoCapture(src)
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(f)
H0, W0 = frames[0].shape[:2]


def green_mask(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (24, 55, 35), (62, 255, 255))
    m[:380] = 0  # ignore the green elf on the chairlift
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    best = None
    for k in range(1, n):
        x, y, w, h, a = st[k]
        if a > 900 and (best is None or a > st[best][4]):
            best = k
    if best is None:
        return None, None
    mk = (lab == best).astype(np.uint8) * 255
    return mk, st[best]


def dark_mask(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    hue_ok = cv2.inRange(hsv, (95, 0, 0), (170, 255, 75))
    grey_ok = cv2.inRange(hsv, (0, 0, 0), (180, 45, 60))
    m = hue_ok | grey_ok
    m[:330] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    best = None
    for k in range(1, n):
        x, y, w, h, a = st[k]
        if y + h >= H0 - 4 and a > 14000 and w > 90 and (best is None or a > st[best][4]):
            best = k
    if best is None:
        return None, None
    mk = (lab == best).astype(np.uint8) * 255
    return mk, st[best]


def apex(mk, st):
    x, y, w, h, _ = st
    xs = np.where(mk[y : y + 3].any(axis=0))[0]
    return float(xs.mean()), float(y)


# ── detection pass ──
G, Dk = [], []
for f in frames:
    gm, gs = green_mask(f)
    dm, ds = dark_mask(f)
    if gs is not None:
        ax, ay = apex(gm, gs)
        G.append(dict(m=gm, st=gs, ax=ax, ay=ay, base=gs[1] + gs[3], h=gs[3], x=gs[0], w=gs[2]))
    else:
        G.append(None)
    if ds is not None:
        ax, ay = apex(dm, ds)
        # width measured near the bottom of the visible part
        rows = dm[max(ds[1], H0 - 60) : H0]
        wb = max((np.ptp(np.where(r)[0]) if r.any() else 0) for r in rows)
        Dk.append(dict(m=dm, st=ds, ax=ax, ay=ay, wb=wb))
    else:
        Dk.append(None)


def segments(track, key="ax", jump=60):
    segs, cur = [], []
    for i, d in enumerate(track):
        if d is None:
            if cur:
                segs.append(cur)
                cur = []
            continue
        if cur and abs(track[cur[-1]][key] - d[key]) > jump:
            segs.append(cur)
            cur = []
        cur.append(i)
    if cur:
        segs.append(cur)
    return [s for s in segs if len(s) >= 6]


def smooth(vals, win=9):
    v = np.array(vals, float)
    if len(v) < 3:
        return v
    k = min(win, len(v) // 2 * 2 - 1)
    pad = np.pad(v, (k // 2, k // 2), mode="edge")
    return np.convolve(pad, np.ones(k) / k, mode="valid")


plan = [dict() for _ in frames]  # frame -> list of placements

# green tree placements
gsegs = segments(G)
gsegs = [sg for sg in gsegs if np.median([G[i]["h"] for i in sg]) > 110]
for si, seg in enumerate(gsegs):
    fl = green_fl[si % len(green_fl)]
    hs = np.array([G[i]["h"] for i in seg], float)
    # true height = max over a window (partially off-frame frames under-report)
    hmax = np.array([hs[max(0, j - 25) : j + 26].max() for j in range(len(seg))])
    cx = []
    for j, i in enumerate(seg):
        d = G[i]
        if d["x"] <= 1 and d["ax"] < 6:  # apex off the left edge
            cx.append(d["x"] + d["w"] - 0.42 * hmax[j])
        else:
            cx.append(d["ax"])
    cx, base, hh = smooth(cx), smooth([G[i]["base"] for i in seg]), smooth(hmax)
    for j, i in enumerate(seg):
        plan[i].setdefault("g", (fl, cx[j], base[j], hh[j]))

# dark tree placements (tracked by the run of dark pixels along the bottom edge)
def bottom_run(f):
    hsv = cv2.cvtColor(f[H0 - 30 :], cv2.COLOR_BGR2HSV)
    m = (cv2.inRange(hsv, (95, 0, 0), (170, 255, 75)) | cv2.inRange(hsv, (0, 0, 0), (180, 45, 60))) > 0
    cov = np.convolve(m.mean(axis=0), np.ones(7) / 7, mode="same") > 0.5
    runs, start = [], None
    for x, v in enumerate(list(cov) + [False]):
        if v and start is None:
            start = x
        if not v and start is not None:
            runs.append((start, x - 1))
            start = None
    runs = [r for r in runs if r[0] < 150 and r[1] - r[0] > 25]
    return max(runs, key=lambda r: r[1] - r[0]) if runs else None


dsegs = segments(Dk)
dsegs = [sg for sg in dsegs if np.median([Dk[i]["wb"] for i in sg]) > 150 and np.median([Dk[i]["ay"] for i in sg]) < 450]
for si, seg in enumerate(dsegs):
    fl = dark_fl[si % len(dark_fl)]
    lo, hi = max(0, seg[0] - 6), min(len(frames) - 1, seg[-1] + 60)
    rng, runs = [], []
    for i in range(lo, hi + 1):
        r = bottom_run(frames[i])
        if r is None:
            if i > seg[-1]:
                break
            continue
        rng.append(i)
        runs.append(r)
    xr = smooth([r[1] for r in runs], 7)
    early = [j for j, i in enumerate(rng) if i in seg][:15]
    wfull = max(max(runs[j][1] - runs[j][0] for j in early), 200)
    off = float(np.median([runs[j][1] - Dk[rng[j]]["ax"] for j in early]))
    ays = [Dk[i]["ay"] for i in seg[: max(1, len(seg) // 2)]]
    ay0 = float(np.median(ays))
    for j, i in enumerate(rng):
        if xr[j] < 4:
            break
        plan[i]["d"] = (fl, xr[j] - off, ay0, wfull)

print("green segments:", [(s[0], s[-1]) for s in gsegs])
print("dark segments:", [(s[0], s[-1]) for s in dsegs])

# extra anchored trees (white tree, small dark tree, planted tree)
extras = json.load(open(opts["extras"])) if "extras" in opts else []
grays = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in frames]
extra_plan = []
for e in extras:
    tr = track_anchor(grays, e["key"], e["bx"], e["by"], e["h"], e["lo"], e["hi"])
    extra_plan.append((e, tr))
    print("extra", e["flavor"], min(tr), max(tr))

# ── cutouts ──
cache = {}


def cut(fl):
    if fl not in cache:
        im = cv2.imread(f"{tdir}/{fl}-cut.png", cv2.IMREAD_UNCHANGED)
        a = im[:, :, 3]
        ys, xs = np.where(a > 20)
        im = im[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        # feather edges so crop borders (snow kept by bg removal) don't show as straight lines
        hh, ww = im.shape[:2]
        yy = np.linspace(0, 1, hh)[:, None]
        xx = np.linspace(0, 1, ww)[None, :]
        ramp = np.clip((1 - yy) / 0.12, 0, 1) * np.clip(xx / 0.05, 0, 1) * np.clip((1 - xx) / 0.05, 0, 1)
        im = im.copy()
        im[:, :, 3] = (im[:, :, 3] * ramp).astype(np.uint8)
        # find apex x of the tree in the cutout
        top = np.where(im[:12, :, 3].max(axis=0) > 60)[0]
        cache[fl] = (im, float(top.mean()))
    return cache[fl]


def paste(dst, fl, apex_x, top_y, height):
    im, apx = cut(fl)
    s = height / im.shape[0]
    nw, nh = max(2, int(im.shape[1] * s)), max(2, int(im.shape[0] * s))
    r = cv2.resize(im, (nw, nh), interpolation=cv2.INTER_AREA)
    r = cv2.GaussianBlur(r, (0, 0), 0.7)
    x0, y0 = int(round(apex_x - apx * s)), int(round(top_y))
    H, W = dst.shape[:2]
    # soft contact shadow
    sh = np.zeros((H, W), np.float32)
    cv2.ellipse(sh, (int(apex_x), int(top_y + nh * 0.97)), (int(nw * 0.5), int(nh * 0.05)), 0, 0, 360, 0.45, -1)
    sh = cv2.GaussianBlur(sh, (0, 0), nw * 0.05 + 1)
    dst[:] = (dst * (1 - sh[..., None])).astype(np.uint8)
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + nw), min(H, y0 + nh)
    if xa >= xb or ya >= yb:
        return
    part = r[ya - y0 : yb - y0, xa - x0 : xb - x0]
    al = part[:, :, 3:4].astype(np.float32) / 255
    # nudge colours toward the scene's soft, cool light
    hsvp = cv2.cvtColor(part[:, :, :3], cv2.COLOR_BGR2HSV).astype(np.float32)
    hsvp[..., 1] *= 0.85
    hsvp[..., 2] *= 0.94
    rgb = cv2.cvtColor(hsvp.clip(0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    dst[ya:yb, xa:xb] = (rgb * al + dst[ya:yb, xa:xb] * (1 - al)).astype(np.uint8)


Wo, Ho = int(W0 * SCALE), int(H0 * SCALE)
ff = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{Wo}x{Ho}", "-r", "60",
     "-i", "-", "-i", src, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
     "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out],
    stdin=subprocess.PIPE,
)
for i, f in enumerate(frames):
    p = plan[i]
    mask = np.zeros(f.shape[:2], np.uint8)
    if G[i] is not None and "g" in p:
        mask |= G[i]["m"]
    if "d" in p:
        _, dax, day, dw = p["d"]
        hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
        dm = cv2.inRange(hsv, (95, 0, 0), (170, 255, 75)) | cv2.inRange(hsv, (0, 0, 0), (180, 45, 60))
        tri = np.zeros_like(dm)
        cv2.fillPoly(tri, [np.array([[dax, day - 15], [dax + dw * 0.75, H0 + 40], [dax - dw * 0.75, H0 + 40]], np.int32)], 255)
        dm = cv2.morphologyEx(dm & tri, cv2.MORPH_CLOSE, np.ones((13, 13), np.uint8))
        mask |= dm
    if mask.any():
        mask = cv2.dilate(mask, np.ones((11, 11), np.uint8))
        f = cv2.inpaint(f, mask, 6, cv2.INPAINT_TELEA)
    big = cv2.resize(f, (Wo, Ho), interpolation=cv2.INTER_LANCZOS4)
    for e, tr in extra_plan:
        if i in tr:
            bx, by, hh = tr[i]
            th = hh * e.get("scale", 1.15)
            paste(big, e["flavor"], bx * SCALE, (by + 0.04 * hh - th) * SCALE, th * SCALE)
    if "g" in p:
        fl, cx, base, h = p["g"]
        th = h * 1.22
        paste(big, fl, cx * SCALE, (base - th * 0.95) * SCALE, th * SCALE)
    if "d" in p:
        fl, ax, ay, wb = p["d"]
        im, _ = cut(fl)
        th = wb * 1.12 * im.shape[0] / im.shape[1]
        paste(big, fl, ax * SCALE, (ay - 8) * SCALE, th * SCALE)
    ff.stdin.write(big.tobytes())
ff.stdin.close()
ff.wait()
print("done", out)
