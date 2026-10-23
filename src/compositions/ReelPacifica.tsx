import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// ─── Branding ────────────────────────────────────────────────────────────────
const BG = "#FAF8F3";
const INK = "#1A1A1A";
const GOLD = "#C9A24D";
const MUTED = "#6B665C";
const SERIF = "Georgia, Gelasio, 'Times New Roman', serif";
const SANS = "Montserrat, 'Helvetica Neue', Arial, sans-serif";

// Instagram safe zones
const SAFE_TOP = 250;
const SAFE_BOTTOM = 380;

// Local font files (Gelasio is metric-compatible with Georgia)
const FONT_FACES: [string, string, FontFaceDescriptors][] = [
  ["Gelasio", "fonts/Gelasio.ttf", { weight: "400 700" }],
  [
    "Gelasio",
    "fonts/Gelasio-Italic.ttf",
    { weight: "400 700", style: "italic" },
  ],
  ["Montserrat", "fonts/Montserrat.ttf", { weight: "100 900" }],
];

const useBrandFonts = () => {
  const [handle] = useState(() => delayRender("Loading brand fonts"));
  useEffect(() => {
    Promise.all(
      FONT_FACES.map(([family, file, desc]) =>
        new FontFace(family, `url(${staticFile(file)})`, desc).load(),
      ),
    )
      .then((faces) => faces.forEach((f) => document.fonts.add(f)))
      .catch((err) => console.error(err))
      .finally(() => continueRender(handle));
  }, [handle]);
};

// ─── Animation helpers ───────────────────────────────────────────────────────
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const progress = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: ease,
  });

const fadeUp = (
  frame: number,
  delay: number,
  distance = 40,
  duration = 22,
): React.CSSProperties => {
  const p = progress(frame, delay, duration);
  return { opacity: p, transform: `translateY(${(1 - p) * distance}px)` };
};

const SceneFade: React.FC<{
  duration: number;
  fadeIn?: number;
  fadeOut?: number;
  children: React.ReactNode;
}> = ({ duration, fadeIn = 12, fadeOut = 12, children }) => {
  const frame = useCurrentFrame();
  const inOp = fadeIn > 0 ? interpolate(frame, [0, fadeIn], [0, 1], clamp) : 1;
  const outOp =
    fadeOut > 0
      ? interpolate(frame, [duration - fadeOut, duration], [1, 0], clamp)
      : 1;
  return (
    <AbsoluteFill style={{ opacity: Math.min(inOp, outOp) }}>
      {children}
    </AbsoluteFill>
  );
};

const GoldLine: React.FC<{
  width: number;
  delay: number;
  duration?: number;
  thickness?: number;
}> = ({ width, delay, duration = 28, thickness = 3 }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, delay, duration);
  return (
    <div
      style={{
        width,
        height: thickness,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: width * p,
          height: thickness,
          background: GOLD,
          borderRadius: thickness,
        }}
      />
    </div>
  );
};

const Eyebrow: React.FC<{ text: string; delay: number }> = ({
  text,
  delay,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: 9,
        color: GOLD,
        textTransform: "uppercase",
        ...fadeUp(frame, delay, 20),
      }}
    >
      {text}
    </div>
  );
};

const SafeColumn: React.FC<{ children: React.ReactNode; gap?: number }> = ({
  children,
  gap = 40,
}) => (
  <AbsoluteFill
    style={{
      paddingTop: SAFE_TOP,
      paddingBottom: SAFE_BOTTOM,
      paddingLeft: 90,
      paddingRight: 90,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap,
      textAlign: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

// ─── Line-art icons ──────────────────────────────────────────────────────────
const circ = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

const LineIcon: React.FC<{
  paths: string[];
  size: number;
  delay: number;
  duration?: number;
  strokeWidth?: number;
}> = ({ paths, size, delay, duration = 45, strokeWidth = 3 }) => {
  const frame = useCurrentFrame();
  const stagger = duration / paths.length / 1.6;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ overflow: "visible" }}
    >
      {paths.map((d, i) => {
        const p = progress(
          frame,
          delay + i * stagger,
          Math.max(14, duration - i * stagger),
        );
        return (
          <path
            key={i}
            d={d}
            pathLength={1}
            fill="none"
            stroke={GOLD}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 1"
            strokeDashoffset={1 - p}
          />
        );
      })}
    </svg>
  );
};

const ICON_PIN = [
  "M100 30 C70 30 50 52 50 80 C50 118 100 166 100 166 C100 166 150 118 150 80 C150 52 130 30 100 30 Z",
  circ(100, 80, 17),
  "M64 178 Q100 190 136 178",
];

const ICON_HOUSES = [
  "M8 166 H192",
  "M14 112 L52 80 L90 112",
  "M22 106 V166 M82 106 V166",
  "M45 166 V138 H59 V166",
  "M28 122 h12 v12 h-12 Z",
  "M64 122 h12 v12 h-12 Z",
  "M104 76 L148 40 L192 76",
  "M168 56 V42 H178 V64",
  "M112 70 V166 M184 70 V166",
  "M112 118 H184",
  "M124 84 h16 v18 h-16 Z",
  "M156 84 h16 v18 h-16 Z",
  "M122 132 h12 v14 h-12 Z",
  "M162 132 h12 v14 h-12 Z",
  "M141 166 V136 H155 V166",
];

const car = (cx: number) => [
  `M${cx - 20} 150 V134 Q${cx - 20} 128 ${cx - 15} 127 L${cx - 10} 112 H${cx + 10} L${cx + 15} 127 Q${cx + 20} 128 ${cx + 20} 134 V150 Z`,
  `M${cx - 8} 116 H${cx + 8} L${cx + 11} 124 H${cx - 11} Z`,
  `${circ(cx - 13, 138, 3)} ${circ(cx + 13, 138, 3)} M${cx - 5} 141 H${cx + 5}`,
  `M${cx - 17} 150 V157 H${cx - 11} V150 M${cx + 11} 150 V157 H${cx + 17} V150`,
];

const ICON_GARAGE = [
  "M6 166 H194",
  "M10 72 L100 34 L190 72",
  "M18 72 H182",
  "M24 72 V166 M176 72 V166",
  "M88 56 H112",
  ...car(54),
  ...car(100),
  ...car(146),
];

const ICON_DECK = [
  "M6 172 H194",
  "M34 120 H166 L186 140 H14 Z",
  "M14 140 V152 H186 V140",
  "M56 120 L42 140 M78 120 L71 140 M100 120 V140 M122 120 L129 140 M144 120 L158 140",
  "M24 152 V172 M100 152 V172 M176 152 V172",
  "M34 120 V84 M78 120 V84 M122 120 V84 M166 120 V84",
  "M30 84 H170",
  "M34 102 H166",
  circ(160, 42, 12),
  "M160 20 V24 M160 60 V64 M138 42 H142 M178 42 H182 M145 27 L148 30 M172 54 L175 57 M175 27 L172 30 M148 54 L145 57",
];

const ICON_COMMUNITY = [
  "M6 168 H194",
  circ(40, 90, 26),
  "M40 116 V168 M40 140 L30 130 M40 132 L50 122",
  "M160 42 L184 108 H136 Z",
  "M150 70 H170 M144 90 H176",
  "M160 108 V168",
  circ(100, 106, 11),
  "M84 168 V148 Q84 126 100 126 Q116 126 116 148 V168",
  circ(74, 118, 8),
  "M60 168 V154 Q60 134 74 134 Q81 134 85 138",
  circ(126, 118, 8),
  "M140 168 V154 Q140 134 126 134 Q119 134 115 138",
  "M70 52 q6 -6 12 0 q6 -6 12 0",
];

const ICON_PLAN = [
  "M40 44 H160 V164 H40 Z",
  "M40 104 H92 M112 104 H160",
  "M118 44 V82",
  "M70 164 V128",
  "M40 26 H160 M40 20 V32 M160 20 V32",
  "M176 44 V164 M170 44 H182 M170 164 H182",
];

// ─── Scene 1: Hook ───────────────────────────────────────────────────────────
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 100], [1.0, 1.12], clamp);
  return (
    <SceneFade duration={90} fadeIn={0} fadeOut={14}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile("terreno.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            transformOrigin: "50% 58%",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${BG} 0%, ${BG} 30%, rgba(250,248,243,0.75) 40%, rgba(250,248,243,0) 52%, rgba(250,248,243,0) 80%, rgba(250,248,243,0.55) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP + 70,
          alignItems: "center",
          textAlign: "center",
          padding: `${SAFE_TOP + 70}px 80px 0`,
        }}
      >
        <Eyebrow text="Solar disponible" delay={4} />
        <div style={{ height: 28 }} />
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 104,
            lineHeight: 1.08,
            color: INK,
            letterSpacing: -1,
            ...fadeUp(frame, 8, 50, 26),
          }}
        >
          ¿Qué puedes
          <br />
          construir{" "}
          <span style={{ fontStyle: "italic", color: GOLD }}>aquí</span>?
        </div>
        <div style={{ height: 36 }} />
        <GoldLine width={220} delay={26} />
      </AbsoluteFill>
    </SceneFade>
  );
};

// ─── Scene 2: Location ───────────────────────────────────────────────────────
const SceneLocation: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneFade duration={90}>
      <SafeColumn gap={34}>
        <LineIcon paths={ICON_PIN} size={230} delay={6} duration={34} />
        <Eyebrow text="Ubicación" delay={14} />
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 110,
            color: INK,
            lineHeight: 1.05,
            ...fadeUp(frame, 18),
          }}
        >
          Urb. Pacifica
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 44,
            fontWeight: 400,
            letterSpacing: 2,
            color: INK,
            ...fadeUp(frame, 26),
          }}
        >
          Encantada <span style={{ color: GOLD }}>·</span> Trujillo Alto
        </div>
        <GoldLine width={520} delay={32} duration={34} />
      </SafeColumn>
    </SceneFade>
  );
};

// ─── Scene 3: Lot illustration ───────────────────────────────────────────────
// Lot corners in original image pixels (1280×720)
type Pt = [number, number];
const BL: Pt = [505, 284];
const BR: Pt = [812, 284];
const FR: Pt = [850, 492];
const FL: Pt = [352, 478];
const lerp = (a: Pt, b: Pt, t: number): Pt => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
const quad = (u: number, v: number): Pt =>
  lerp(lerp(BL, BR, u), lerp(FL, FR, u), v);
const poly = (pts: Pt[]) =>
  `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L")} Z`;
const rect = (u0: number, u1: number, v0: number, v1: number) =>
  poly([quad(u0, v0), quad(u1, v0), quad(u1, v1), quad(u0, v1)]);

const IMG_SCALE = 2;
const IMG_LEFT = 540 - 600 * IMG_SCALE;
const IMG_TOP = 190;

const SceneLot: React.FC = () => {
  const frame = useCurrentFrame();
  const outline = progress(frame, 14, 40);
  const setback = progress(frame, 52, 34);
  const labels = progress(frame, 76, 18);
  const house = progress(frame, 88, 26);
  const zoom = interpolate(frame, [0, 150], [1, 1.04], clamp);
  const [hcx, hcy] = quad(0.5, 0.5);

  const labelStyle = {
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 12,
    fill: INK,
    stroke: BG,
    strokeWidth: 3.5,
    paintOrder: "stroke",
    letterSpacing: 0.6,
  } as const;

  return (
    <SceneFade duration={150}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: IMG_LEFT,
            top: IMG_TOP,
            width: 1280 * IMG_SCALE,
            height: 720 * IMG_SCALE,
            transform: `scale(${zoom})`,
            transformOrigin: `${(hcx / 1280) * 100}% ${(hcy / 720) * 100}%`,
          }}
        >
          <Img
            src={staticFile("terreno.jpg")}
            style={{ width: "100%", height: "100%" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(250,248,243,0.5)",
            }}
          />
          <svg
            viewBox="0 0 1280 720"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          >
            <defs>
              <mask id="setbackReveal">
                <path
                  d={rect(0.1, 0.9, 0.15, 0.85)}
                  pathLength={1}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={10}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - setback}
                />
              </mask>
            </defs>
            {/* Lot outline */}
            <path
              d={poly([BL, BR, FR, FL])}
              pathLength={1}
              fill={`rgba(201,162,77,${0.12 * outline})`}
              stroke={BG}
              strokeWidth={7}
              strokeLinejoin="round"
              strokeDasharray="1 1"
              strokeDashoffset={1 - outline}
            />
            <path
              d={poly([BL, BR, FR, FL])}
              pathLength={1}
              fill="none"
              stroke={GOLD}
              strokeWidth={3.5}
              strokeLinejoin="round"
              strokeDasharray="1 1"
              strokeDashoffset={1 - outline}
            />
            {[BL, BR, FR, FL].map((p, i) => (
              <circle
                key={i}
                cx={p[0]}
                cy={p[1]}
                r={5 * progress(frame, 22 + i * 9, 12)}
                fill={GOLD}
              />
            ))}
            {/* Setbacks (dashed) */}
            <path
              d={rect(0.1, 0.9, 0.15, 0.85)}
              fill="none"
              stroke={GOLD}
              strokeWidth={2.2}
              strokeDasharray="7 5"
              mask="url(#setbackReveal)"
            />
            <g opacity={labels}>
              <text
                x={quad(0.5, 0.075)[0]}
                y={quad(0.5, 0.075)[1] + 4.5}
                textAnchor="middle"
                style={labelStyle}
              >
                Retiro 10 pies
              </text>
              <text
                x={quad(0.5, 0.93)[0]}
                y={quad(0.5, 0.93)[1] + 4.5}
                textAnchor="middle"
                style={labelStyle}
              >
                Retiro 10 pies
              </text>
            </g>
            {/* House footprint */}
            <g
              opacity={house}
              transform={`translate(${hcx} ${hcy}) scale(${0.85 + 0.15 * house}) translate(${-hcx} ${-hcy})`}
            >
              <path
                d={rect(0.24, 0.76, 0.3, 0.7)}
                fill="rgba(201,162,77,0.42)"
                stroke={GOLD}
                strokeWidth={2.6}
                strokeLinejoin="round"
              />
              <path
                d={poly([quad(0.24, 0.5), quad(0.76, 0.5)]).replace(" Z", "")}
                stroke={BG}
                strokeWidth={1.6}
                fill="none"
              />
              <text
                x={hcx}
                y={hcy - 6}
                textAnchor="middle"
                style={{ ...labelStyle, fontSize: 13 }}
              >
                Casa
              </text>
            </g>
          </svg>
        </div>
      </AbsoluteFill>
      {/* Blend photo edges into the background */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${BG} 0%, ${BG} 20%, rgba(250,248,243,0) 36%, rgba(250,248,243,0) 64%, ${BG} 80%, ${BG} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          textAlign: "center",
          paddingTop: SAFE_TOP + 20,
        }}
      >
        <Eyebrow text="El solar" delay={4} />
        <div style={{ height: 18 }} />
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 76,
            color: INK,
            ...fadeUp(frame, 8),
          }}
        >
          Visualiza tu{" "}
          <span style={{ fontStyle: "italic", color: GOLD }}>hogar</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: SAFE_BOTTOM + 40,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 34,
            color: MUTED,
            ...fadeUp(frame, 96, 16),
          }}
        >
          Ilustración conceptual
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// ─── Scenes 4–8: Feature cards ───────────────────────────────────────────────
const FeatureScene: React.FC<{
  duration: number;
  eyebrow: string;
  icon: string[];
  text: React.ReactNode;
  fontSize?: number;
}> = ({ duration, eyebrow, icon, text, fontSize = 74 }) => {
  const frame = useCurrentFrame();
  return (
    <SceneFade duration={duration}>
      <SafeColumn gap={44}>
        <LineIcon paths={icon} size={400} delay={4} duration={40} />
        <Eyebrow text={eyebrow} delay={14} />
        <div
          style={{
            fontFamily: SERIF,
            fontSize,
            lineHeight: 1.15,
            color: INK,
            maxWidth: 880,
            ...fadeUp(frame, 20),
          }}
        >
          {text}
        </div>
        <GoldLine width={160} delay={30} />
      </SafeColumn>
    </SceneFade>
  );
};

const SceneArea: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(
    interpolate(frame, [12, 66], [0, 2225], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    }),
  );
  return (
    <SceneFade duration={90}>
      <SafeColumn gap={30}>
        <LineIcon paths={ICON_PLAN} size={220} delay={2} duration={36} />
        <Eyebrow text="Área de construcción" delay={8} />
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            ...fadeUp(frame, 10),
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 230,
              color: INK,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {count.toLocaleString("en-US")}
          </span>
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 96,
              color: GOLD,
              fontStyle: "italic",
            }}
          >
            p²
          </span>
        </div>
        <GoldLine width={420} delay={30} />
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 64,
            color: INK,
            lineHeight: 1.15,
            ...fadeUp(frame, 36),
          }}
        >
          Construcción mínima
          <br />
          de 2,225 p²
        </div>
      </SafeColumn>
    </SceneFade>
  );
};

// ─── Scene 9: Closing ────────────────────────────────────────────────────────
const SceneClose: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneFade duration={150} fadeOut={0}>
      <SafeColumn gap={0}>
        <div style={{ width: 440, height: 250, ...fadeUp(frame, 4, 30) }}>
          <Img
            src={staticFile("logo-mp.png")}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
        <div style={{ height: 56 }} />
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 54,
            color: INK,
            ...fadeUp(frame, 16),
          }}
        >
          Contáctame para más información
        </div>
        <div style={{ height: 40 }} />
        <GoldLine width={200} delay={24} />
        <div style={{ height: 40 }} />
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 78,
            color: INK,
            ...fadeUp(frame, 28),
          }}
        >
          Melissa Pinet Salicrup
        </div>
        <div style={{ height: 18 }} />
        <div
          style={{
            fontFamily: SANS,
            fontSize: 34,
            fontWeight: 500,
            letterSpacing: 3,
            color: MUTED,
            ...fadeUp(frame, 36),
          }}
        >
          Realtor® <span style={{ color: GOLD }}>|</span> Lic. C-24860
        </div>
        <div style={{ height: 44 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontFamily: SANS,
            fontSize: 66,
            fontWeight: 600,
            letterSpacing: 2,
            color: INK,
            ...fadeUp(frame, 44),
          }}
        >
          <svg
            width={58}
            height={58}
            viewBox="0 0 24 24"
            fill="none"
            stroke={GOLD}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
          </svg>
          787-401-7832
        </div>
      </SafeColumn>
      <div
        style={{
          position: "absolute",
          right: 70,
          bottom: SAFE_BOTTOM + 80,
          height: 76,
          ...fadeUp(frame, 54, 16),
        }}
      >
        <Img
          src={staticFile("realtor.png")}
          style={{ height: "100%", width: "auto", objectFit: "contain" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: SAFE_BOTTOM + 20,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 24,
          color: MUTED,
          letterSpacing: 0.5,
          ...fadeUp(frame, 58, 10),
        }}
      >
        Sujeto a condiciones restrictivas y permisos aplicables.
      </div>
    </SceneFade>
  );
};

// ─── Main composition ────────────────────────────────────────────────────────
export const ReelPacifica: React.FC = () => {
  useBrandFonts();
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Sequence from={0} durationInFrames={90} name="1 · Hook">
        <SceneHook />
      </Sequence>
      <Sequence from={90} durationInFrames={90} name="2 · Ubicación">
        <SceneLocation />
      </Sequence>
      <Sequence from={180} durationInFrames={150} name="3 · Solar">
        <SceneLot />
      </Sequence>
      <Sequence from={330} durationInFrames={90} name="4 · Casa">
        <FeatureScene
          duration={90}
          eyebrow="Vivienda"
          icon={ICON_HOUSES}
          text={
            <>
              Casa unifamiliar
              <br />
              de 1 o 2 pisos
            </>
          }
        />
      </Sequence>
      <Sequence from={420} durationInFrames={90} name="5 · Área">
        <SceneArea />
      </Sequence>
      <Sequence from={510} durationInFrames={90} name="6 · Garaje">
        <FeatureScene
          duration={90}
          eyebrow="Estacionamiento"
          icon={ICON_GARAGE}
          text={
            <>
              Garaje y carport
              <br />
              hasta 3 autos
            </>
          }
        />
      </Sequence>
      <Sequence from={600} durationInFrames={90} name="7 · Terraza">
        <FeatureScene
          duration={90}
          eyebrow="Exterior"
          icon={ICON_DECK}
          text={
            <>
              Terraza de madera
              <br />
              <span style={{ fontSize: 46, fontStyle: "italic", color: MUTED }}>
                (con permisos aprobados)
              </span>
            </>
          }
        />
      </Sequence>
      <Sequence from={690} durationInFrames={60} name="8 · Comunidad">
        <FeatureScene
          duration={60}
          eyebrow="Comunidad"
          icon={ICON_COMMUNITY}
          fontSize={62}
          text={<>Comunidad con asociación de residentes y áreas comunes</>}
        />
      </Sequence>
      <Sequence from={750} durationInFrames={150} name="9 · Cierre">
        <SceneClose />
      </Sequence>
    </AbsoluteFill>
  );
};
