"""Optical-flow tracker for anchor points (tree base + height) in the reference video."""
import cv2, numpy as np

CUT = 818  # first frame of the closing shot


def track_anchor(grays, key, bx, by, h, lo, hi, region=None):
    """Track an anchor (base x, base y, height) from frame `key` both ways within [lo, hi].
    Returns dict frame -> (bx, by, h)."""
    H, W = grays[0].shape
    out = {key: (bx, by, h)}
    for step in (1, -1):
        x, y, s = bx, by, h
        pts = None
        f = key
        while True:
            nf = f + step
            if nf < lo or nf > hi or (f < CUT <= nf) or (nf < CUT <= f):
                break
            if pts is None or len(pts) < 25 or (nf % 8 == 0):
                rx0 = int(max(0, x - (region or 2.2) * s))
                rx1 = int(min(W, x + (region or 2.2) * s))
                ry0 = int(max(0, y - 1.3 * s))
                ry1 = int(min(H, y + 0.9 * s))
                if rx1 - rx0 < 20 or ry1 - ry0 < 20:
                    break
                m = np.zeros((H, W), np.uint8)
                m[ry0:ry1, rx0:rx1] = 255
                pts = cv2.goodFeaturesToTrack(grays[f], 200, 0.01, 5, mask=m)
                if pts is None or len(pts) < 8:
                    break
            npts, st, _ = cv2.calcOpticalFlowPyrLK(grays[f], grays[nf], pts, None, winSize=(25, 25), maxLevel=3)
            good = st.ravel() == 1
            if good.sum() < 8:
                break
            A, inl = cv2.estimateAffinePartial2D(pts[good], npts[good], method=cv2.RANSAC, ransacReprojThreshold=2.5)
            if A is None:
                break
            sc = float(np.sqrt(A[0, 0] ** 2 + A[0, 1] ** 2))
            sc = min(max(sc, 0.97), 1.03)
            nx = A[0, 0] * x + A[0, 1] * y + A[0, 2]
            ny = A[1, 0] * x + A[1, 1] * y + A[1, 2]
            x, y, s = nx, ny, s * sc
            pts = npts[good].reshape(-1, 1, 2)
            out[nf] = (x, y, s)
            f = nf
            if x + 0.6 * s < -10 or x - 0.6 * s > W + 10 or y - s > H:
                break
    # temporal smoothing
    ks = sorted(out)
    arr = np.array([out[k] for k in ks])
    if len(arr) > 9:
        pad = np.pad(arr, ((4, 4), (0, 0)), mode="edge")
        arr = np.stack([np.convolve(pad[:, c], np.ones(9) / 9, mode="valid") for c in range(3)], axis=1)
    return {k: tuple(v) for k, v in zip(ks, arr)}
