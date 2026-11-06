import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {loadFont as loadLobster} from "@remotion/google-fonts/Lobster";
import {loadFont as loadPlayfair} from "@remotion/google-fonts/PlayfairDisplay";
import {loadFont as loadPoppins} from "@remotion/google-fonts/Poppins";

const {fontFamily: LOBSTER} = loadLobster();
const {fontFamily: PLAYFAIR} = loadPlayfair("italic", {weights: ["700"]});
const {fontFamily: POPPINS} = loadPoppins("normal", {weights: ["600", "800"]});

// ─── Timing (30 fps) ────────────────────────────────────────────────
export const COQUITO_FPS = 30;
const INTRO_END = 100;
const FIRST_CENTER = 132;
const CHAIR_GAP = 66; // frames between chairs reaching the centre
const OUTRO_START = 501;
export const COQUITO_DURATION = 651; // ~21.7 s

// ─── Layout ─────────────────────────────────────────────────────────
const CABLE_Y = 290;
const VILLAGE_BASE = 1580;
const GOLD = "linear-gradient(135deg,#fff3b0 0%,#f5c542 35%,#c8901a 65%,#ffe58a 100%)";

type Flavor = {
  file: string;
  pre: string;
  name: string;
  w: number;
  h: number;
  thumbPos: string;
};

const FLAVORS: Flavor[] = [
  {file: "original.jpg", pre: "Coquito", name: "Original", w: 1254, h: 1254, thumbPos: "94% 72%"},
  {file: "almendra.jpg", pre: "Coquito de", name: "Almendra", w: 1254, h: 1254, thumbPos: "94% 72%"},
  {file: "pistacho.jpg", pre: "Coquito de", name: "Pistacho", w: 1536, h: 1024, thumbPos: "94% 72%"},
  {file: "nutella.jpg", pre: "Coquito de", name: "Nutella", w: 1536, h: 1024, thumbPos: "94% 72%"},
  {file: "biscoff.jpg", pre: "Coquito de", name: "Biscoff", w: 1536, h: 1024, thumbPos: "94% 72%"},
  {file: "oreo.jpg", pre: "Coquito de", name: "Oreo", w: 626, h: 313, thumbPos: "94% 72%"},
];

const img = (f: string) => staticFile(`assets/coquito/${f}`);

const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// ─── Background: night sky + golden bokeh ───────────────────────────
const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg,#071326 0%,#122a52 40%,#3b3a63 72%,#7a4b5c 100%)",
      }}
    >
      {Array.from({length: 26}).map((_, i) => {
        const size = 30 + rand(i + 3) * 110;
        const x = rand(i + 11) * 1080;
        const y = rand(i + 29) * 1250;
        const drift = (frame * (0.15 + rand(i) * 0.35)) % 1300;
        const tw = 0.25 + 0.25 * Math.sin(frame / (12 + rand(i + 5) * 18) + i);
        const warm = rand(i + 7) > 0.35;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ((x - drift + 1300) % 1300) - 110,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: warm
                ? "radial-gradient(circle,rgba(255,214,120,0.9),rgba(255,170,60,0) 70%)"
                : "radial-gradient(circle,rgba(255,90,90,0.75),rgba(255,60,60,0) 70%)",
              opacity: tw,
              filter: "blur(4px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Miniature Christmas village (parallax) ─────────────────────────
const HOUSE_COLORS = ["#9b1c2c", "#7a4a2a", "#b3263a", "#5e3a24", "#e8dcc8", "#8c1f2f"];
const TILE_W = 2200;

const House: React.FC<{x: number; seed: number; frame: number}> = ({x, seed, frame}) => {
  const w = 170 + rand(seed) * 110;
  const h = 170 + rand(seed + 1) * 170;
  const roofH = 80 + rand(seed + 2) * 50;
  const color = HOUSE_COLORS[Math.floor(rand(seed + 3) * HOUSE_COLORS.length)];
  const cols = w > 230 ? 3 : 2;
  const rows = Math.max(1, Math.floor((h - 90) / 70));
  return (
    <div style={{position: "absolute", left: x, top: VILLAGE_BASE - h - roofH, width: w + 30}}>
      {/* roof */}
      <div
        style={{
          width: w + 30,
          height: roofH,
          background: "#2b2228",
          clipPath: "polygon(50% 0,100% 100%,0 100%)",
        }}
      />
      {/* snow on roof */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: w + 30,
          height: roofH * 0.55,
          background: "#f4f7fb",
          clipPath: "polygon(50% 0,100% 100%,92% 80%,80% 100%,62% 78%,45% 100%,30% 80%,15% 100%,0 100%)",
        }}
      />
      {/* body */}
      <div
        style={{
          marginLeft: 15,
          width: w,
          height: h,
          background: `linear-gradient(90deg, ${color} 0%, ${color} 70%, rgba(0,0,0,0.25) 100%), ${color}`,
          backgroundBlendMode: "multiply",
          position: "relative",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        {Array.from({length: rows * cols}).map((_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const lit = rand(seed * 7 + i) > 0.18;
          const flicker = 0.85 + 0.15 * Math.sin(frame / 6 + seed + i * 2);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 18 + c * ((w - 36) / cols) + 6,
                top: 22 + r * 70,
                width: (w - 36) / cols - 16,
                height: 44,
                borderRadius: "10px 10px 2px 2px",
                background: lit ? "#ffd56b" : "#3a2c2c",
                boxShadow: lit ? "0 0 22px 6px rgba(255,190,70,0.65)" : "none",
                opacity: lit ? flicker : 1,
                border: "3px solid rgba(40,20,20,0.7)",
              }}
            />
          );
        })}
        {/* door */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: w / 2 - 22,
            width: 44,
            height: 66,
            borderRadius: "22px 22px 0 0",
            background: "#ffb347",
            boxShadow: "0 0 30px 8px rgba(255,160,60,0.6)",
          }}
        />
      </div>
    </div>
  );
};

const Pine: React.FC<{x: number; scale: number; base: number; blur?: number}> = ({
  x,
  scale,
  base,
  blur = 0,
}) => {
  const tiers = [0, 1, 2];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: base - 300 * scale,
        width: 180 * scale,
        height: 300 * scale,
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
    >
      {tiers.map((t) => (
        <div
          key={t}
          style={{
            position: "absolute",
            left: (20 - t * 10) * scale,
            top: t * 80 * scale,
            width: (140 + t * 20) * scale,
            height: 150 * scale,
            background: "linear-gradient(180deg,#f4f8ff 0%,#f4f8ff 14%,#1d4a33 26%,#0f2e20 100%)",
            clipPath: "polygon(50% 0,100% 100%,0 100%)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 78 * scale,
          bottom: 0,
          width: 24 * scale,
          height: 40 * scale,
          background: "#3b2516",
        }}
      />
    </div>
  );
};

const Village: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame * 1.6) % TILE_W;
  const items: React.ReactNode[] = [];
  for (let copy = 0; copy < 2; copy++) {
    let x = copy * TILE_W;
    let i = 0;
    while (x < (copy + 1) * TILE_W - 200) {
      const seed = i * 13 + 5;
      items.push(<House key={`h${copy}-${i}`} x={x - offset} seed={seed} frame={frame} />);
      x += 230 + rand(seed) * 110;
      if (rand(seed + 9) > 0.45) {
        items.push(
          <Pine key={`p${copy}-${i}`} x={x - offset - 40} scale={0.7 + rand(seed + 4) * 0.4} base={VILLAGE_BASE + 10} />,
        );
        x += 80;
      }
      i++;
    }
  }
  return <AbsoluteFill>{items}</AbsoluteFill>;
};

const Ground: React.FC = () => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        top: VILLAGE_BASE - 20,
        left: -100,
        right: -100,
        bottom: 0,
        background: "linear-gradient(180deg,#f2f6fc 0%,#dfe7f3 45%,#c3cfe2 100%)",
        borderRadius: "50% 50% 0 0 / 40px 40px 0 0",
      }}
    />
  </AbsoluteFill>
);

const ForegroundTrees: React.FC = () => {
  const frame = useCurrentFrame();
  const span = 2600;
  const off = (frame * 5) % span;
  return (
    <AbsoluteFill>
      {[0, 1].map((copy) =>
        [120, 1150, 1900].map((px, i) => (
          <Pine
            key={`${copy}-${i}`}
            x={px + copy * span - off}
            scale={1.5 + rand(i + 40) * 0.4}
            base={2110}
            blur={7}
          />
        )),
      )}
    </AbsoluteFill>
  );
};

const Snow: React.FC<{count: number; minSize: number; maxSize: number; speed: number; blur?: number}> = ({
  count,
  minSize,
  maxSize,
  speed,
  blur = 0,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {Array.from({length: count}).map((_, i) => {
        const size = minSize + rand(i * 5 + 1) * (maxSize - minSize);
        const y = (rand(i * 5 + 2) * 2000 + frame * speed * (0.6 + rand(i * 5 + 3) * 0.8)) % 2000 - 40;
        const x = rand(i * 5 + 4) * 1140 - 30 + Math.sin(frame / 25 + i) * 22 - frame * 0.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ((x % 1140) + 1140) % 1140 - 30,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "white",
              opacity: 0.85,
              filter: blur ? `blur(${blur}px)` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Chairlift ──────────────────────────────────────────────────────
const Cable: React.FC = () => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        top: CABLE_Y - 4,
        left: -20,
        width: 1120,
        height: 8,
        background: "linear-gradient(180deg,#5a5a5a,#111)",
        boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
      }}
    />
  </AbsoluteFill>
);

const chairX = (frame: number, center: number) =>
  interpolate(frame, [center - 45, center - 8, center + 20, center + 50], [1300, 0, 0, -1300], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

const Chair: React.FC<{flavor: Flavor; center: number}> = ({flavor, center}) => {
  const frame = useCurrentFrame();
  if (frame < center - 46 || frame > center + 51) return null;

  const x = chairX(frame, center);
  const v = x - chairX(frame - 1, center);
  // swing: lean against motion + damped wobble after stopping / starting
  const sinceStop = frame - (center - 8);
  const wobble =
    sinceStop > 0 ? Math.sin(sinceStop * 0.32) * 5 * Math.exp(-sinceStop / 14) : 0;
  const angle = Math.max(-9, Math.min(9, v * 0.12)) + wobble;

  const maxW = 820;
  const maxH = 800;
  const ratio = flavor.w / flavor.h;
  const cardW = ratio >= maxW / maxH ? maxW : maxH * ratio;
  const cardH = cardW / ratio;
  const hanger = 110;
  const pad = 26;

  return (
    <div
      style={{
        position: "absolute",
        left: 540 + x,
        top: CABLE_Y - 14,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "0 0",
      }}
    >
      {/* grip on cable */}
      <div
        style={{
          position: "absolute",
          left: -34,
          top: -12,
          width: 68,
          height: 40,
          borderRadius: 12,
          background: "linear-gradient(180deg,#444,#0d0d0d)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.6)",
        }}
      />
      {/* hanger bar */}
      <div
        style={{
          position: "absolute",
          left: -7,
          top: 20,
          width: 14,
          height: hanger,
          background: "linear-gradient(90deg,#333,#0a0a0a)",
        }}
      />
      {/* chair back frame */}
      <div
        style={{
          position: "absolute",
          left: -cardW / 2 - pad,
          top: hanger + 10,
          width: cardW + pad * 2,
          height: cardH + pad * 2,
          border: "12px solid #151515",
          borderRadius: 26,
          boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
          background: "rgba(10,10,10,0.25)",
        }}
      />
      {/* product card */}
      <div
        style={{
          position: "absolute",
          left: -cardW / 2,
          top: hanger + 10 + pad,
          width: cardW,
          height: cardH,
          padding: 6,
          borderRadius: 22,
          background: GOLD,
          boxShadow: "0 0 40px rgba(255,200,90,0.45)",
          boxSizing: "border-box",
        }}
      >
        <Img
          src={img(flavor.file)}
          style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 17, display: "block"}}
        />
      </div>
      {/* seat + footrest */}
      <div
        style={{
          position: "absolute",
          left: -cardW / 2 - pad - 30,
          top: hanger + 10 + cardH + pad * 2 - 6,
          width: cardW + pad * 2 + 60,
          height: 26,
          borderRadius: 13,
          background: "linear-gradient(180deg,#3a3a3a,#050505)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -cardW / 2 + 40,
          top: hanger + 10 + cardH + pad * 2 + 50,
          width: cardW - 80,
          height: 12,
          borderRadius: 6,
          background: "#111",
        }}
      />
      {[-1, 1].map((s) => (
        <div
          key={s}
          style={{
            position: "absolute",
            left: s < 0 ? -cardW / 2 + 40 : cardW / 2 - 52,
            top: hanger + 10 + cardH + pad * 2 + 14,
            width: 12,
            height: 46,
            background: "#111",
          }}
        />
      ))}
    </div>
  );
};

const FlavorLabel: React.FC<{flavor: Flavor; center: number; index: number}> = ({flavor, center, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const start = center - 10;
  if (frame < start || frame > center + 36) return null;
  const pop = spring({frame: frame - start, fps, config: {damping: 11, stiffness: 160}});
  const out = interpolate(frame, [center + 22, center + 34], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: "center", top: 1290, opacity: out}}>
      <div
        style={{
          transform: `scale(${0.6 + 0.4 * pop}) translateY(${(1 - pop) * 40}px)`,
          padding: "22px 64px 30px",
          borderRadius: 40,
          background: "linear-gradient(180deg,#c4122f,#7e0a1e)",
          border: "6px solid #f5c542",
          boxShadow: "0 0 50px rgba(255,190,80,0.55), 0 20px 40px rgba(0,0,0,0.5)",
          textAlign: "center",
        }}
      >
        <div style={{fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 700, fontSize: 52, color: "white", lineHeight: 1.1}}>
          {flavor.pre}
        </div>
        <div
          style={{
            fontFamily: LOBSTER,
            fontSize: 120,
            lineHeight: 1.05,
            background: GOLD,
            WebkitBackgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 4px 0 #6b0a17)",
          }}
        >
          {flavor.name}
        </div>
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: POPPINS,
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: 4,
          color: "#1b2a4a",
        }}
      >
        {index + 1} / {FLAVORS.length}
      </div>
    </AbsoluteFill>
  );
};

// ─── Logo card (crop from the flyer, framed in gold) ────────────────
const LogoCard: React.FC<{width: number}> = ({width}) => (
  <div
    style={{
      width,
      height: width * (560 / 580),
      padding: 7,
      borderRadius: 36,
      background: GOLD,
      boxShadow: "0 0 70px rgba(255,200,90,0.55), 0 25px 50px rgba(0,0,0,0.5)",
      boxSizing: "border-box",
    }}
  >
    <Img
      src={img("logo-crop.png")}
      style={{width: "100%", height: "100%", borderRadius: 30, display: "block", objectFit: "cover"}}
    />
  </div>
);

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame > INTRO_END + 5) return null;
  const s = spring({frame: frame - 4, fps, config: {damping: 12, stiffness: 110}});
  const tag = spring({frame: frame - 22, fps, config: {damping: 14}});
  const out = interpolate(frame, [INTRO_END - 18, INTRO_END], [1, 0], clamp);
  const outScale = interpolate(frame, [INTRO_END - 18, INTRO_END], [1, 0.85], clamp);
  const float = Math.sin(frame / 14) * 8;
  return (
    <AbsoluteFill style={{alignItems: "center", paddingTop: 420, opacity: out}}>
      <div style={{transform: `translateY(${(1 - s) * -500 + float}px) scale(${outScale}) rotate(${(1 - s) * -8}deg)`}}>
        <LogoCard width={660} />
      </div>
      <div
        style={{
          marginTop: 50,
          opacity: tag,
          transform: `translateY(${(1 - tag) * 40}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: LOBSTER,
            fontSize: 104,
            background: GOLD,
            WebkitBackgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 5px 0 #6b0a17) drop-shadow(0 0 20px rgba(0,0,0,0.5))",
          }}
        >
          Sabores de Navidad
        </div>
        <div
          style={{
            fontFamily: POPPINS,
            fontWeight: 800,
            fontSize: 38,
            letterSpacing: 8,
            color: "white",
            textShadow: "0 3px 12px rgba(0,0,0,0.7)",
          }}
        >
          ¡SÚBETE A LA MAGIA!
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame() - OUTRO_START;
  const {fps} = useVideoConfig();
  if (frame < 0) return null;
  const bg = interpolate(frame, [0, 15], [0, 1], clamp);
  const logo = spring({frame, fps, config: {damping: 12, stiffness: 120}});
  const title = spring({frame: frame - 10, fps, config: {damping: 14}});
  const cta = spring({frame: frame - 60, fps, config: {damping: 9, stiffness: 140}});
  const pulse = 1 + 0.04 * Math.sin(frame / 5) * (frame > 75 ? 1 : 0);
  const rows = [FLAVORS.slice(0, 3), FLAVORS.slice(3)];
  return (
    <AbsoluteFill style={{alignItems: "center"}}>
      <AbsoluteFill style={{background: "rgba(5,12,30,0.55)", opacity: bg}} />
      <div style={{marginTop: 130, transform: `scale(${logo})`}}>
        <LogoCard width={450} />
      </div>
      <div
        style={{
          marginTop: 36,
          fontFamily: LOBSTER,
          fontSize: 84,
          background: GOLD,
          WebkitBackgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 4px 0 #6b0a17)",
          opacity: title,
          transform: `translateY(${(1 - title) * 30}px)`,
        }}
      >
        6 sabores navideños
      </div>
      <div style={{marginTop: 26, display: "flex", flexDirection: "column", gap: 22, alignItems: "center"}}>
        {rows.map((row, r) => (
          <div key={r} style={{display: "flex", gap: 22}}>
            {row.map((f, i) => {
              const idx = r * 3 + i;
              const p = spring({frame: frame - 18 - idx * 4, fps, config: {damping: 12, stiffness: 150}});
              return (
                <div key={f.name} style={{width: 228, textAlign: "center", transform: `scale(${p})`, opacity: p}}>
                  <div
                    style={{
                      width: 228,
                      height: 228,
                      padding: 5,
                      borderRadius: 24,
                      background: GOLD,
                      boxSizing: "border-box",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div style={{width: "100%", height: "100%", borderRadius: 19, overflow: "hidden"}}>
                      <Img
                        src={img(f.file)}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transform: "scale(1.7)",
                          transformOrigin: f.thumbPos,
                          display: "block",
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: POPPINS,
                      fontWeight: 800,
                      fontSize: 30,
                      color: "white",
                      textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                    }}
                  >
                    {f.name}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 50,
          transform: `scale(${cta * pulse})`,
          padding: "26px 70px",
          borderRadius: 60,
          background: "linear-gradient(180deg,#e0193a,#8e0b20)",
          border: "6px solid #f5c542",
          boxShadow: "0 0 60px rgba(255,190,80,0.6), 0 18px 36px rgba(0,0,0,0.5)",
          fontFamily: POPPINS,
          fontWeight: 800,
          fontSize: 56,
          color: "white",
          letterSpacing: 1,
        }}
      >
        ¡Haz tu pedido hoy! 🎄
      </div>
    </AbsoluteFill>
  );
};

// ─── Main composition ───────────────────────────────────────────────
export const CoquitoTelesilla: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [COQUITO_DURATION - 12, COQUITO_DURATION - 1], [1, 0], clamp);
  const fadeIn = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: "#071326", opacity: Math.min(fadeIn, fadeOut)}}>
      <Sky />
      <Snow count={60} minSize={3} maxSize={6} speed={1.5} blur={1} />
      <Village />
      <Ground />
      <Cable />
      {FLAVORS.map((f, i) => (
        <Chair key={f.name} flavor={f} center={FIRST_CENTER + i * CHAIR_GAP} />
      ))}
      {FLAVORS.map((f, i) => (
        <FlavorLabel key={f.name} flavor={f} index={i} center={FIRST_CENTER + i * CHAIR_GAP} />
      ))}
      <Intro />
      <Outro />
      <ForegroundTrees />
      <Snow count={45} minSize={7} maxSize={16} speed={3.2} blur={2} />
      <AbsoluteFill
        style={{background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)"}}
      />
    </AbsoluteFill>
  );
};
