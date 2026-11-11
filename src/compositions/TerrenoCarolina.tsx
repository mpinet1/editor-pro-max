import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {Audio} from "@remotion/media";
import {loadFont as loadMontserrat} from "@remotion/google-fonts/Montserrat";
import {loadFont as loadPlayfair} from "@remotion/google-fonts/PlayfairDisplay";
import {fitText} from "@remotion/layout-utils";

/*
 * Reel: terreno de 8 cuerdas en Carolina (MP Real Estate).
 * 1080x1920 · 30 fps · 45 s. Sin voiceover todavía: el texto en pantalla
 * lleva el mensaje. Los efectos de sonido salen de scripts/gen-sfx.py.
 *
 * Las fotos, el mapa y el video del dron viven en public/assets/terreno/
 * (ignorado por git: el repo es público y revelaría la ubicación).
 */

const {fontFamily: montserrat} = loadMontserrat("normal", {
  weights: ["600", "800", "900"],
  subsets: ["latin", "latin-ext"],
});
const {fontFamily: playfair} = loadPlayfair("normal", {
  weights: ["700"],
  subsets: ["latin", "latin-ext"],
});

const C = {
  gold: "#F2C14E",
  goldSoft: "#D8B87F",
  green: "#7BD389",
  burgundy: "#8B3E4F",
  white: "#ffffff",
  cream: "#F5F0E8",
  black: "#111111",
};

const A = (f: string) => staticFile(`assets/terreno/${f}`);
const SFX = (f: string) => staticFile(`assets/sfx/${f}.wav`);

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// Instagram safe zone: 250 top, 380 bottom, 120 right.
const SAFE = {top: 250, bottom: 1920 - 380, left: 70, right: 1080 - 120};
const SAFE_W = SAFE.right - SAFE.left;

/* ------------------------------------------------------------------ */
/* Map (cenital) data, in pixels of cenital_limpio.jpg (1630 x 2576)   */
/* ------------------------------------------------------------------ */
const MAP = {w: 1630, h: 2576};
const POLY: [number, number][] = [
  [1510, 70], [1117, 93], [1138, 394], [1141, 589], [1124, 690], [1104, 740],
  [1040, 848], [1000, 897], [767, 1119], [672, 1231], [511, 1477], [220, 1889],
  [190, 1957], [184, 2007], [192, 2050], [208, 2079], [256, 2132], [305, 2153],
  [352, 2163], [455, 2162], [808, 2133], [865, 2135], [969, 2159], [1023, 2187],
  [1058, 2220], [1112, 2306], [1139, 2302], [1511, 2134], [1518, 1731],
  [1517, 1283], [1529, 768],
];
const POLY_D = "M" + POLY.map((p) => p.join(" ")).join(" L") + " Z";
// px per metre so the polygon equals 8 cuerdas (31,443 m²)
const PX_M = 7.2321;
// 4 fields of 90 x 45 m (minimum regulation size) placed inside the lot
const FIELDS = [
  {cx: 1312, cy: 768, a: 90},
  {cx: 896, cy: 1376, a: 130},
  {cx: 1280, cy: 1760, a: 80},
  {cx: 704, cy: 1920, a: 170},
];
const PIN = {x: 1180, y: 1330};

// Base scale so the map covers the 1080x1920 frame
const MAP_BASE = Math.max(1080 / MAP.w, 1920 / MAP.h);

type Cam = {x: number; y: number; z: number};
const lerpCam = (a: Cam, b: Cam, p: number): Cam => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  z: a.z + (b.z - a.z) * p,
});

/** Map with an SVG overlay that shares the same coordinate space. */
const MapShot: React.FC<{
  from: Cam;
  to: Cam;
  dur: number;
  ease?: (t: number) => number;
  children?: React.ReactNode;
}> = ({from, to, dur, ease = Easing.inOut(Easing.quad), children}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, dur], [0, 1], {...clamp, easing: ease});
  const raw = lerpCam(from, to, p);
  const s = MAP_BASE * Math.max(1, raw.z);
  // keep the map covering the whole frame
  const cam = {
    x: Math.min(MAP.w - 540 / s, Math.max(540 / s, raw.x)),
    y: Math.min(MAP.h - 960 / s, Math.max(960 / s, raw.y)),
  };
  return (
    <AbsoluteFill style={{overflow: "hidden", background: "#0b1a0b"}}>
      <div
        style={{
          position: "absolute",
          width: MAP.w,
          height: MAP.h,
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${540 - cam.x * s}px, ${960 - cam.y * s}px) scale(${s})`,
        }}
      >
        <Img src={A("cenital_limpio.jpg")} style={{width: MAP.w, height: MAP.h}} />
        <svg
          width={MAP.w}
          height={MAP.h}
          viewBox={`0 0 ${MAP.w} ${MAP.h}`}
          style={{position: "absolute", inset: 0, overflow: "visible"}}
        >
          {children}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

const LotOutline: React.FC<{paint?: number; dash?: boolean}> = ({paint = 0, dash = true}) => {
  const frame = useCurrentFrame();
  const id = "sweep" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  // sweep the fill top → bottom, the way the drone travels
  const clipY = 40 + paint * 2300;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={MAP.w} height={clipY} />
        </clipPath>
      </defs>
      {paint > 0 && (
        <g clipPath={`url(#${id})`}>
          <path d={POLY_D} fill={C.gold} fillOpacity={0.45} />
          {/* bright leading edge of the brush */}
          {paint < 1 && <rect x={0} y={clipY - 18} width={MAP.w} height={18} fill={C.gold} opacity={0.0} />}
        </g>
      )}
      <path
        d={POLY_D}
        fill="none"
        stroke={C.white}
        strokeWidth={6 / MAP_BASE}
        strokeDasharray={dash ? `${26 / MAP_BASE} ${16 / MAP_BASE}` : undefined}
        strokeDashoffset={-frame * 2}
        strokeLinejoin="round"
        style={{filter: "drop-shadow(0 0 6px rgba(0,0,0,0.8))"}}
      />
    </g>
  );
};

const Field: React.FC<{cx: number; cy: number; a: number; appear: number}> = ({cx, cy, a, appear}) => {
  const L = 90 * PX_M;
  const W = 45 * PX_M;
  const sw = 5 / MAP_BASE;
  return (
    <g
      transform={`translate(${cx} ${cy}) rotate(${a}) scale(${appear})`}
      opacity={Math.min(1, appear * 1.5)}
    >
      <rect x={-L / 2} y={-W / 2} width={L} height={W} fill={C.green} fillOpacity={0.35} stroke={C.white} strokeWidth={sw} />
      <line x1={0} y1={-W / 2} x2={0} y2={W / 2} stroke={C.white} strokeWidth={sw} />
      <circle r={9.15 * PX_M} fill="none" stroke={C.white} strokeWidth={sw} />
      {/* penalty boxes */}
      <rect x={-L / 2} y={-20.15 * PX_M} width={16.5 * PX_M} height={40.3 * PX_M} fill="none" stroke={C.white} strokeWidth={sw * 0.8} />
      <rect x={L / 2 - 16.5 * PX_M} y={-20.15 * PX_M} width={16.5 * PX_M} height={40.3 * PX_M} fill="none" stroke={C.white} strokeWidth={sw * 0.8} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Photos / video with movement                                        */
/* ------------------------------------------------------------------ */
const Photo: React.FC<{
  src: string;
  dur: number;
  from: {x: number; y: number; z: number}; // focus point in % and zoom
  to: {x: number; y: number; z: number};
  ease?: (t: number) => number;
}> = ({src, dur, from, to, ease = Easing.inOut(Easing.quad)}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, dur], [0, 1], {...clamp, easing: ease});
  const c = lerpCam(from, to, p);
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${c.x}% ${c.y}%`,
          transform: `scale(${c.z})`,
          transformOrigin: `${c.x}% ${c.y}%`,
        }}
      />
    </AbsoluteFill>
  );
};

const Drone: React.FC<{startSec: number; dur: number; z0: number; z1: number; x?: number}> = ({
  startSec,
  dur,
  z0,
  z1,
  x = 50,
}) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, dur], [z0, z1], clamp);
  return (
    <AbsoluteFill style={{overflow: "hidden", background: "#000"}}>
      <OffthreadVideo
        src={A("drone_pasada.mov")}
        startFrom={Math.round(startSec * 30)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${x}% 50%`,
          transform: `scale(${z})`,
          // the source is low-res: a touch of sharpening + saturation
          filter: "contrast(1.08) saturate(1.15)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Transitions (entry of each scene)                                   */
/* ------------------------------------------------------------------ */
type Entry = "zoom" | "whip" | "flash" | "cut";

const SceneIn: React.FC<{type: Entry; children: React.ReactNode}> = ({type, children}) => {
  const frame = useCurrentFrame();
  let style: React.CSSProperties = {};
  let flash = 0;
  if (type === "zoom") {
    const p = interpolate(frame, [0, 9], [0, 1], {...clamp, easing: easeOut});
    style = {transform: `scale(${1.6 - 0.6 * p})`, filter: `blur(${(1 - p) * 14}px)`};
  } else if (type === "whip") {
    const p = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: easeOut});
    style = {transform: `translateX(${(1 - p) * 100}%)`, filter: `blur(${(1 - p) * 30}px)`};
  } else if (type === "flash") {
    flash = interpolate(frame, [0, 3, 6], [1, 1, 0], clamp);
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{background: "#fff", opacity: flash}} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */
const stroke = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${C.black}`,
  paintOrder: "stroke fill",
  textShadow: "0 8px 28px rgba(0,0,0,0.65)",
});

/** Pop: scale 0 → 110% → 100% in ~0.25 s; quick exit at the end. */
const usePop = (delay: number, dur: number) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const s = interpolate(f, [0, 5, 8], [0, 1.1, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  return {transform: `scale(${s * (0.6 + 0.4 * out)})`, opacity: f < 0 ? 0 : out};
};

const Line: React.FC<{
  text: string;
  color?: string;
  max?: number;
  min?: number;
  width?: number;
}> = ({text, color = C.white, max = 150, width = SAFE_W - 40}) => {
  const {fontSize} = fitText({text, withinWidth: width, fontFamily: montserrat, fontWeight: 900});
  const size = Math.min(max, fontSize);
  return (
    <div
      style={{
        fontFamily: montserrat,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.02,
        color,
        whiteSpace: "nowrap",
        letterSpacing: -1,
        ...stroke(Math.max(6, size / 14)),
      }}
    >
      {text}
    </div>
  );
};

/** A block of big lines that pops in, centred in the safe area at `y`. */
const BigText: React.FC<{
  lines: {text: string; color?: string; max?: number}[];
  y: number;
  delay?: number;
  dur: number;
  stagger?: number;
}> = ({lines, y, delay = 4, dur, stagger = 3}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        width: SAFE_W,
        top: y,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      {lines.map((l, i) => (
        <PopLine key={i} delay={delay + i * stagger} dur={dur}>
          <Line text={l.text} color={l.color} max={l.max} />
        </PopLine>
      ))}
    </div>
  );
};

const PopLine: React.FC<{delay: number; dur: number; children: React.ReactNode}> = ({delay, dur, children}) => {
  const st = usePop(delay, dur);
  return <div style={{...st, transformOrigin: "center"}}>{children}</div>;
};

const Emoji: React.FC<{e: string; size: number; delay: number; dur: number; style?: React.CSSProperties}> = ({
  e,
  size,
  delay,
  dur,
  style,
}) => {
  const st = usePop(delay, dur);
  return (
    <div style={{fontSize: size, lineHeight: 1, filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.6))", ...st, ...style}}>
      {e}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */
const FULL: Cam = {x: 850, y: 1190, z: 1.0};

const S1: React.FC<{dur: number}> = ({dur}) => (
  <>
    <MapShot from={{x: 900, y: 1250, z: 3.2}} to={{x: 856, y: 1200, z: 1.0}} dur={30} ease={easeOut}>
      <LotOutline />
    </MapShot>
    <BigText
      y={640}
      delay={10}
      dur={dur}
      lines={[
        {text: "AQUÍ CABEN", color: C.white, max: 120},
        {text: "4 CANCHAS", color: C.gold, max: 160},
        {text: "DE FÚTBOL ⚽", color: C.white, max: 120},
      ]}
    />
  </>
);

const FIELD_START = 12;
const FIELD_GAP = 21; // 0.7 s

const S2: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const count = FIELDS.filter((_, i) => frame >= FIELD_START + i * FIELD_GAP).length;
  const lastPop = FIELD_START + (count - 1) * FIELD_GAP;
  const numPop = interpolate(frame - lastPop, [0, 4, 8], [0.4, 1.15, 1], clamp);
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  return (
    <>
      <MapShot from={{x: 856, y: 1200, z: 1.0}} to={{x: 856, y: 1230, z: 1.04}} dur={dur}>
        <LotOutline />
        {FIELDS.map((f, i) => (
          <Field
            key={i}
            {...f}
            appear={spring({frame: frame - FIELD_START - i * FIELD_GAP, fps, config: {damping: 12, stiffness: 170}})}
          />
        ))}
      </MapShot>
      {count > 0 && (
        <div
          style={{
            position: "absolute",
            left: SAFE.left,
            top: 270,
            display: "flex",
            alignItems: "baseline",
            gap: 20,
            opacity: out,
          }}
        >
          <div
            style={{
              fontFamily: montserrat,
              fontWeight: 900,
              fontSize: 260,
              lineHeight: 1,
              color: C.green,
              transform: `scale(${numPop})`,
              transformOrigin: "left bottom",
              ...stroke(14),
            }}
          >
            {count}
          </div>
          <div style={{fontFamily: montserrat, fontWeight: 900, fontSize: 70, color: C.white, ...stroke(7)}}>
            {count === 1 ? "CANCHA" : "CANCHAS"}
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          top: SAFE.bottom - 70,
          fontFamily: montserrat,
          fontWeight: 600,
          fontSize: 30,
          color: C.white,
          background: "rgba(0,0,0,0.55)",
          padding: "10px 18px",
          borderRadius: 8,
          opacity: interpolate(frame, [10, 20], [0, 1], clamp) * out,
        }}
      >
        Referencia visual aproximada · canchas de 90 × 45 m
      </div>
    </>
  );
};

const S3: React.FC<{dur: number}> = ({dur}) => (
  <>
    <Drone startSec={0.3} dur={dur} z0={1.0} z1={1.12} x={45} />
    <div style={{position: "absolute", left: 0, right: 120, top: 760, display: "flex", justifyContent: "center"}}>
      <BigText y={0} delay={6} dur={dur} lines={[{text: "CAROLINA 📍", color: C.white, max: 150}]} />
    </div>
  </>
);

const Pin: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = frame - start;
  const drop = spring({frame: f, fps, config: {damping: 9, stiffness: 180}, durationInFrames: 12});
  const ripple = interpolate(f, [10, 34], [0, 1], clamp);
  const s = 1 / (MAP_BASE * 1.7); // keep the pin ~constant on screen
  return (
    <g transform={`translate(${PIN.x} ${PIN.y}) scale(${s})`}>
      {ripple > 0 && ripple < 1 && (
        <ellipse rx={40 + ripple * 220} ry={(40 + ripple * 220) * 0.45} fill="none" stroke={C.white} strokeWidth={8} opacity={1 - ripple} />
      )}
      <g transform={`translate(0 ${-(1 - drop) * 900})`} opacity={f < 0 ? 0 : 1}>
        <ellipse cx={0} cy={0} rx={30} ry={10} fill="rgba(0,0,0,0.45)" />
        <path
          d="M0 0 C -14 -40 -60 -70 -60 -120 A 60 60 0 1 1 60 -120 C 60 -70 14 -40 0 0 Z"
          fill={C.white}
          stroke={C.gold}
          strokeWidth={10}
        />
        <circle cx={0} cy={-120} r={24} fill={C.burgundy} />
      </g>
    </g>
  );
};

const S4: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  const lbl = interpolate(frame, [18, 26], [0, 1], {...clamp, easing: easeOut});
  return (
    <>
      <MapShot from={{x: PIN.x, y: PIN.y - 120, z: 1.6}} to={{x: PIN.x, y: PIN.y - 120, z: 1.75}} dur={dur}>
        <LotOutline />
        <Pin start={4} />
      </MapShot>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 120,
          top: 1180,
          display: "flex",
          justifyContent: "center",
          opacity: lbl * out,
          transform: `translateY(${(1 - lbl) * 40}px)`,
        }}
      >
        <Line text="BO. CARRUZO" color={C.gold} max={120} width={820} />
      </div>
    </>
  );
};

const PAINT_DUR = 100;
const S5: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const paint = interpolate(frame, [6, PAINT_DUR], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <MapShot from={{x: 1150, y: 600, z: 1.35}} to={{x: 800, y: 1650, z: 1.35}} dur={dur}>
      <LotOutline paint={paint} />
    </MapShot>
  );
};

const Counter: React.FC<{to: number; start: number; frames: number; format: (n: number) => string; style: React.CSSProperties}> = ({
  to,
  start,
  frames,
  format,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + frames], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return <div style={style}>{format(Math.round(to * p))}</div>;
};

const S6: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  const inn = interpolate(frame, [2, 8], [0, 1], clamp);
  const big = interpolate(frame, [32, 36, 40], [1, 1.12, 1], clamp);
  return (
    <>
      <MapShot from={{x: 800, y: 1650, z: 1.35}} to={FULL} dur={dur} ease={easeOut}>
        <LotOutline paint={1} />
      </MapShot>
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE_W,
          top: 560,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: inn * out,
        }}
      >
        <div style={{display: "flex", alignItems: "baseline", gap: 24, transform: `scale(${big})`}}>
          <Counter
            to={8}
            start={2}
            frames={30}
            format={(n) => String(n)}
            style={{fontFamily: montserrat, fontWeight: 900, fontSize: 300, lineHeight: 1, color: C.gold, ...stroke(16)}}
          />
          <div style={{fontFamily: montserrat, fontWeight: 900, fontSize: 120, color: C.white, ...stroke(10)}}>CUERDAS</div>
        </div>
        <Counter
          to={31000}
          start={2}
          frames={30}
          format={(n) => `+${n.toLocaleString("en-US")} m²`}
          style={{fontFamily: montserrat, fontWeight: 900, fontSize: 96, color: C.white, marginTop: 10, ...stroke(8)}}
        />
      </div>
    </>
  );
};

const S7: React.FC<{dur: number}> = ({dur}) => (
  <>
    {/* speed ramp: fast travel along the road, then brake */}
    <Photo
      src={A("dron_aereo_1.jpg")}
      dur={dur}
      from={{x: 25, y: 75, z: 1.25}}
      to={{x: 70, y: 60, z: 1.05}}
      ease={Easing.bezier(0.05, 0.9, 0.2, 1)}
    />
    <BigText
      y={700}
      delay={6}
      dur={dur}
      lines={[
        {text: "BORDEADO POR", color: C.white, max: 130},
        {text: "LA CARRETERA 🛣️", color: C.gold, max: 130},
      ]}
    />
  </>
);

const S8: React.FC<{dur: number}> = ({dur}) => (
  <>
    <Photo src={A("suelo_carretera.jpg")} dur={dur} from={{x: 50, y: 55, z: 1.0}} to={{x: 42, y: 55, z: 1.3}} />
    <BigText
      y={720}
      delay={5}
      dur={dur}
      lines={[
        {text: "ACCESO", color: C.white, max: 160},
        {text: "DIRECTO ✅", color: C.green, max: 150},
      ]}
    />
  </>
);

const USES = [
  {t: "CASA", e: "🏡", c: C.white},
  {t: "FINCA", e: "🐎", c: C.gold},
  {t: "HACIENDA", e: "🌿", c: C.green},
  {t: "DESARROLLO", e: "🏘️", c: C.white},
];
const S9: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const step = dur / USES.length;
  return (
    <>
      <Photo src={A("dron_aereo_2.jpg")} dur={dur} from={{x: 20, y: 50, z: 1.1}} to={{x: 75, y: 50, z: 1.1}} ease={(t) => t} />
      {USES.map((u, i) => (
        <Sequence key={u.t} from={Math.round(i * step)} durationInFrames={Math.round(step)} layout="none">
          <div style={{position: "absolute", left: SAFE.left, width: SAFE_W, top: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
            <Emoji e={u.e} size={170} delay={0} dur={Math.round(step) + (i === USES.length - 1 ? 0 : 6)} />
            <PopLine delay={1} dur={Math.round(step) + (i === USES.length - 1 ? 0 : 6)}>
              <Line text={u.t} color={u.c} max={150} />
            </PopLine>
          </div>
        </Sequence>
      ))}
      {/* keep frame unused var lint quiet */}
      <span style={{display: "none"}}>{frame}</span>
    </>
  );
};

const S10: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const small = interpolate(frame, [14, 22], [0, 1], clamp) * interpolate(frame, [dur - 5, dur], [1, 0], clamp);
  return (
    <>
      <Drone startSec={26} dur={dur} z0={1.05} z1={1.2} x={40} />
      <BigText
        y={680}
        delay={6}
        dur={dur}
        lines={[
          {text: "POTENCIAL DE", color: C.white, max: 130},
          {text: "SEGREGACIÓN", color: C.gold, max: 140},
        ]}
      />
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE_W,
          top: 990,
          textAlign: "center",
          fontFamily: montserrat,
          fontWeight: 800,
          fontSize: 44,
          color: C.white,
          opacity: small,
          ...stroke(5),
        }}
      >
        sujeto a permisos
      </div>
    </>
  );
};

const S11: React.FC<{dur: number}> = ({dur}) => (
  <>
    <MapShot from={{x: 1000, y: 1300, z: 1.6}} to={{x: 880, y: 1220, z: 1.1}} dur={dur} ease={easeOut}>
      <LotOutline paint={1} />
    </MapShot>
    <BigText
      y={700}
      delay={4}
      dur={dur}
      lines={[
        {text: "CALIFICACIÓN", color: C.white, max: 120},
        {text: "RR-O", color: C.gold, max: 200},
      ]}
    />
  </>
);

const S12: React.FC<{dur: number}> = ({dur}) => (
  <>
    <Photo
      src={A("suelo_terreno.jpg")}
      dur={dur}
      from={{x: 30, y: 45, z: 1.35}}
      to={{x: 50, y: 45, z: 1.05}}
      ease={Easing.bezier(0.05, 0.9, 0.2, 1)}
    />
    <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0) 75%)"}} />
    <div style={{position: "absolute", left: SAFE.left, width: SAFE_W, top: 470, display: "flex", justifyContent: "center"}}>
      <Emoji e="💰" size={220} delay={2} dur={dur} />
    </div>
    <BigText
      y={760}
      delay={6}
      dur={dur}
      stagger={4}
      lines={[
        {text: "FINANCIAMIENTO", color: C.gold, max: 200},
        {text: "POR DUEÑO", color: C.white, max: 200},
      ]}
    />
  </>
);

const S13: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const bob = Math.abs(Math.sin(frame / 6)) * 18;
  return (
    <>
      <MapShot from={{x: 880, y: 1250, z: 1.3}} to={{x: 850, y: 1288, z: 1.0}} dur={dur}>
        <LotOutline paint={1} />
      </MapShot>
      <BigText
        y={620}
        delay={6}
        dur={dur}
        lines={[
          {text: "¿QUÉ", color: C.white, max: 150},
          {text: "CONSTRUIRÍAS", color: C.gold, max: 150},
          {text: "TÚ AQUÍ?", color: C.white, max: 150},
        ]}
      />
      <div style={{position: "absolute", left: SAFE.left, width: SAFE_W, top: 1110, display: "flex", justifyContent: "center", transform: `translateY(${bob}px)`}}>
        <Emoji e="👇" size={150} delay={14} dur={dur} />
      </div>
    </>
  );
};

const EndCard: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const r = (d: number) => {
    const p = interpolate(frame, [d, d + 14], [0, 1], {...clamp, easing: easeOut});
    return {opacity: p, transform: `translateY(${(1 - p) * 40}px)`};
  };
  const line = interpolate(frame, [10, 30], [0, 1], {...clamp, easing: easeOut});
  return (
    <AbsoluteFill style={{background: C.cream, fontFamily: montserrat, color: C.black}}>
      <div style={{position: "absolute", left: 0, top: 0, width: 22, height: "100%", background: "#C4A052"}} />
      <div style={{position: "absolute", left: 100, right: 140, top: 560}}>
        <div style={{...r(4), fontSize: 30, fontWeight: 600, letterSpacing: 10}}>
          MP <span style={{color: "#B8923F"}}>REAL ESTATE</span>
        </div>
        <div style={{...r(8), fontFamily: playfair, fontWeight: 700, fontSize: 92, lineHeight: 1.05, marginTop: 40}}>
          Melissa Pinet Salicrup
        </div>
        <div style={{height: 4, width: 220 * line, background: "#C4A052", marginTop: 40}} />
        <div style={{...r(16), fontSize: 46, fontWeight: 600, marginTop: 40}}>Realtor® · Lic. C-24860</div>
        <div style={{...r(20), fontSize: 64, fontWeight: 900, marginTop: 20}}>787-401-7832</div>
        <div
          style={{
            ...r(26),
            display: "inline-block",
            marginTop: 70,
            border: `5px solid ${C.black}`,
            padding: "10px 24px",
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: 6,
          }}
        >
          REALTOR®
        </div>
      </div>
      <span style={{display: "none"}}>{dur}</span>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */
type SceneDef = {C: React.FC<{dur: number}>; dur: number; entry: Entry};
const SCENES: SceneDef[] = [
  {C: S1, dur: 90, entry: "zoom"},
  {C: S2, dur: 120, entry: "cut"},
  {C: S3, dur: 90, entry: "whip"},
  {C: S4, dur: 90, entry: "flash"},
  {C: S5, dur: 120, entry: "zoom"},
  {C: S6, dur: 90, entry: "cut"},
  {C: S7, dur: 90, entry: "zoom"},
  {C: S8, dur: 90, entry: "whip"},
  {C: S9, dur: 120, entry: "cut"},
  {C: S10, dur: 90, entry: "flash"},
  {C: S11, dur: 60, entry: "zoom"},
  {C: S12, dur: 90, entry: "whip"},
  {C: S13, dur: 120, entry: "cut"},
  {C: EndCard, dur: 90, entry: "flash"},
];
const STARTS = SCENES.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].dur], []);
export const TERRENO_DURATION = SCENES.reduce((a, s) => a + s.dur, 0);

type Hit = {at: number; sfx: string; vol?: number};
const at = (scene: number, offset = 0) => STARTS[scene] + offset;
const SFX_HITS: Hit[] = [
  {at: at(0), sfx: "whoosh", vol: 0.7},
  {at: at(0, 10), sfx: "impact", vol: 0.5},
  ...FIELDS.map((_, i) => ({at: at(1, FIELD_START + i * FIELD_GAP), sfx: "click", vol: 0.9})),
  {at: at(2), sfx: "whoosh", vol: 0.8},
  {at: at(3, 4), sfx: "drop", vol: 0.7},
  {at: at(3, 14), sfx: "ding", vol: 0.5},
  {at: at(4, 4), sfx: "swoosh_largo", vol: 0.7},
  ...Array.from({length: 10}, (_, i) => ({at: at(5, 2 + i * 3), sfx: "tick", vol: 0.6})),
  {at: at(5, 32), sfx: "impact", vol: 0.45},
  {at: at(6), sfx: "whoosh", vol: 0.8},
  {at: at(7), sfx: "whoosh", vol: 0.6},
  {at: at(7, 5), sfx: "pop", vol: 0.8},
  ...USES.map((_, i) => ({at: at(8, Math.round((i * 120) / USES.length)), sfx: "pop", vol: 0.8})),
  {at: at(9), sfx: "whoosh", vol: 0.8},
  {at: at(10, 4), sfx: "pop", vol: 0.8},
  {at: at(11, 6), sfx: "impact", vol: 0.9},
  {at: at(12, 6), sfx: "pop", vol: 0.7},
  {at: at(13), sfx: "impact_suave", vol: 0.8},
];

export const TerrenoCarolina: React.FC = () => {
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {SCENES.map((s, i) => (
        <Sequence key={i} from={STARTS[i]} durationInFrames={s.dur} premountFor={30}>
          <SceneIn type={s.entry}>
            <s.C dur={s.dur} />
          </SceneIn>
        </Sequence>
      ))}
      {SFX_HITS.map((h, i) => (
        <Sequence key={`sfx${i}`} from={h.at} durationInFrames={60} layout="none">
          <Audio src={SFX(h.sfx)} volume={h.vol ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
