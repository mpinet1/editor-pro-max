"""Genera efectos de sonido sintéticos (libres de derechos) en public/assets/sfx/."""
import numpy as np, wave, os
SR = 44100
out = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "sfx")
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)

def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    s = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    st = np.stack([s, s], 1)
    with wave.open(os.path.join(out, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())

def t(d): return np.arange(int(SR * d)) / SR
def env(n, a, r):  # attack / release in samples ratio
    e = np.ones(n); A = int(n * a); R = int(n * r)
    if A: e[:A] = np.linspace(0, 1, A)
    if R: e[-R:] = np.linspace(1, 0, R) ** 2
    return e
def bandnoise(n, f_start, f_end):
    # noise through a moving one-pole lowpass/highpass approximation
    x = rng.standard_normal(n); y = np.zeros(n); lp = 0.0; hp_prev = 0.0
    fc = np.geomspace(f_start, f_end, n)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    for i in range(n):
        lp += a[i] * (x[i] - lp); y[i] = lp
    return y - np.convolve(y, np.ones(40) / 40, "same") * 0.6

def whoosh(d=0.45, f0=400, f1=4000):
    n = int(SR * d); x = bandnoise(n, f0, f1)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return x * e

save("whoosh", whoosh())
save("swoosh_largo", whoosh(1.6, 300, 2500))
tt = t(0.12); save("pop", np.sin(2 * np.pi * (900 - 2500 * tt) * tt) * np.exp(-tt * 35))
tt = t(0.05); save("click", (np.sin(2 * np.pi * 2200 * tt) + 0.5 * rng.standard_normal(len(tt))) * np.exp(-tt * 140))
tt = t(0.03); save("tick", np.sin(2 * np.pi * 3200 * tt) * np.exp(-tt * 220))
tt = t(1.2); save("ding", sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) * g for f, k, g in [(1320, 3, 1), (2640, 5, .4), (3960, 8, .2)]))
tt = t(0.35); save("drop", np.sin(2 * np.pi * (1200 * np.exp(-tt * 9)) * tt) * env(len(tt), .02, .5))
tt = t(1.4); boom = np.sin(2 * np.pi * (55 + 60 * np.exp(-tt * 12)) * tt) * np.exp(-tt * 3.2)
noise = rng.standard_normal(len(tt)) * np.exp(-tt * 30) * 0.4
save("impact", boom + noise)
save("impact_suave", boom * np.exp(-tt * 1.5) * 0.7)
print("ok")
