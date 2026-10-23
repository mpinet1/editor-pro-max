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

// Crossfade: each scene fades in over the previous one (which stays opaque underneath)
const CROSSFADE = 12;

const SceneFade: React.FC<{
  fadeIn?: number;
  children: React.ReactNode;
}> = ({ fadeIn = CROSSFADE, children }) => {
  const frame = useCurrentFrame();
  const opacity =
    fadeIn > 0 ? interpolate(frame, [0, fadeIn], [0, 1], clamp) : 1;
  return (
    <AbsoluteFill style={{ opacity, background: BG }}>{children}</AbsoluteFill>
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
        fontWeight: 700,
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

// ─── Scene 1: Hook ───────────────────────────────────────────────────────────
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 100], [1.0, 1.12], clamp);
  return (
    <SceneFade fadeIn={0}>
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
    <SceneFade>
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
    <SceneFade>
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

// ─── Scenes 4–8: Full-bleed photo cards ──────────────────────────────────────
type KenBurns = {
  origin: string;
  position?: string;
  from?: number;
  to?: number;
};

const PhotoScene: React.FC<{
  duration: number;
  src: string;
  kenBurns: KenBurns;
  eyebrow: string;
  title: React.ReactNode;
  gradientStart?: number;
  children?: React.ReactNode;
}> = ({
  duration,
  src,
  kenBurns,
  eyebrow,
  title,
  gradientStart = 34,
  children,
}) => {
  const frame = useCurrentFrame();
  const { origin, position = "50% 50%", from = 1, to = 1.08 } = kenBurns;
  const scale = interpolate(
    frame,
    [0, duration + CROSSFADE],
    [from, to],
    clamp,
  );
  const solid = Math.min(gradientStart + 30, 85);
  return (
    <SceneFade>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: position,
            transform: `scale(${scale})`,
            transformOrigin: origin,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(250,248,243,0) ${gradientStart}%, rgba(250,248,243,0.9) ${solid}%, rgba(250,248,243,0.9) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: SAFE_TOP + 20,
          right: 48,
          padding: "8px 18px",
          borderRadius: 40,
          background: "rgba(250,248,243,0.78)",
          fontFamily: SANS,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: 1.5,
          color: INK,
          opacity: progress(frame, 10, 16),
        }}
      >
        Imagen ilustrativa
      </div>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          textAlign: "center",
          padding: `0 80px ${SAFE_BOTTOM + 30}px`,
        }}
      >
        <Eyebrow text={eyebrow} delay={8} />
        <div style={{ height: 24 }} />
        {children}
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 70,
            lineHeight: 1.15,
            color: INK,
            maxWidth: 920,
            ...fadeUp(frame, 14),
          }}
        >
          {title}
        </div>
        <div style={{ height: 32 }} />
        <GoldLine width={200} delay={24} thickness={2} />
      </AbsoluteFill>
    </SceneFade>
  );
};

const Counter: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(
    interpolate(frame, [10, 64], [0, 2225], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    }),
  );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        marginBottom: 18,
        ...fadeUp(frame, 8),
      }}
    >
      <span
        style={{
          fontFamily: SERIF,
          fontSize: 210,
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
          fontSize: 90,
          color: GOLD,
          fontStyle: "italic",
        }}
      >
        p²
      </span>
    </div>
  );
};

// ─── Scene 9: Closing ────────────────────────────────────────────────────────
const SceneClose: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneFade>
      <SafeColumn gap={0}>
        <div style={{ width: 440, height: 220, ...fadeUp(frame, 4, 30) }}>
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
            fontSize: 88,
            whiteSpace: "nowrap",
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
            fontSize: 40,
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
            fontSize: 86,
            fontWeight: 600,
            letterSpacing: 2,
            color: INK,
            ...fadeUp(frame, 44),
          }}
        >
          <svg
            width={74}
            height={74}
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
          height: 130,
          ...fadeUp(frame, 54, 16),
        }}
      >
        <Img
          src={staticFile("realtor.png")}
          style={{
            height: "100%",
            width: "auto",
            objectFit: "contain",
            mixBlendMode: "multiply",
          }}
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
// [start, duration] per scene; each Sequence runs CROSSFADE frames longer so
// the next scene can fade in on top of it.
const T = {
  hook: [0, 90],
  location: [90, 90],
  lot: [180, 150],
  house: [330, 90],
  area: [420, 90],
  garage: [510, 90],
  deck: [600, 90],
  community: [690, 60],
  close: [750, 150],
} as const;

const Scene: React.FC<{
  at: readonly [number, number];
  name: string;
  last?: boolean;
  children: React.ReactNode;
}> = ({ at, name, last, children }) => (
  <Sequence
    from={at[0]}
    durationInFrames={at[1] + (last ? 0 : CROSSFADE)}
    name={name}
  >
    {children}
  </Sequence>
);

export const ReelPacifica: React.FC = () => {
  useBrandFonts();
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Scene at={T.hook} name="1 · Hook">
        <SceneHook />
      </Scene>
      <Scene at={T.location} name="2 · Ubicación">
        <SceneLocation />
      </Scene>
      <Scene at={T.lot} name="3 · Solar">
        <SceneLot />
      </Scene>
      <Scene at={T.house} name="4 · Casa">
        <PhotoScene
          duration={T.house[1]}
          src="casa.jpg"
          kenBurns={{ origin: "50% 40%" }}
          eyebrow="Vivienda"
          title={
            <>
              Casa unifamiliar
              <br />
              de 1 o 2 pisos
            </>
          }
        />
      </Scene>
      <Scene at={T.area} name="5 · Área">
        <PhotoScene
          duration={T.area[1]}
          src="casa.jpg"
          kenBurns={{
            origin: "30% 30%",
            position: "30% 50%",
            from: 1.15,
            to: 1.23,
          }}
          eyebrow="Área de construcción"
          gradientStart={22}
          title={
            <>
              Construcción mínima
              <br />
              de 2,225 p²
            </>
          }
        >
          <Counter />
        </PhotoScene>
      </Scene>
      <Scene at={T.garage} name="6 · Garaje">
        <PhotoScene
          duration={T.garage[1]}
          src="garaje.jpg"
          kenBurns={{ origin: "50% 50%" }}
          eyebrow="Estacionamiento"
          title={
            <>
              Garaje y carport
              <br />
              hasta 3 autos
            </>
          }
        />
      </Scene>
      <Scene at={T.deck} name="7 · Terraza">
        <PhotoScene
          duration={T.deck[1]}
          src="terraza.jpg"
          kenBurns={{ origin: "50% 60%" }}
          eyebrow="Exterior"
          title={
            <>
              Terraza de madera
              <br />
              <span style={{ fontSize: 46, fontStyle: "italic", color: MUTED }}>
                (con permisos aprobados)
              </span>
            </>
          }
        />
      </Scene>
      <Scene at={T.community} name="8 · Comunidad">
        <PhotoScene
          duration={T.community[1]}
          src="comunidad.jpg"
          kenBurns={{ origin: "50% 40%" }}
          eyebrow="Comunidad"
          gradientStart={30}
          title={<>Comunidad con asociación de residentes y áreas comunes</>}
        />
      </Scene>
      <Scene at={T.close} name="9 · Cierre" last>
        <SceneClose />
      </Scene>
    </AbsoluteFill>
  );
};
