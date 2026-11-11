import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {loadFont as loadPlayfair} from "@remotion/google-fonts/PlayfairDisplay";
import {loadFont as loadMontserrat} from "@remotion/google-fonts/Montserrat";

const {fontFamily: playfair} = loadPlayfair("normal", {
  weights: ["700", "900"],
  subsets: ["latin", "latin-ext"],
});
loadPlayfair("italic", {weights: ["400"], subsets: ["latin", "latin-ext"]});
const {fontFamily: montserrat} = loadMontserrat("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});

const C = {
  bg: "#FAF7F0",
  gold: "#C4A052",
  goldText: "#B8923F",
  cream: "#F2E6C6",
  red: "#C8102E",
  black: "#141414",
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/** 0→1 progress between two frames with ease-out. */
const prog = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: ease});

/** Text that slides up from behind a mask. */
const Reveal: React.FC<{
  start: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dur?: number;
}> = ({start, children, style, dur = 22}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, start, dur);
  return (
    <div style={{overflow: "hidden", paddingBottom: 12, marginBottom: -12, ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 110}%)`, opacity: p > 0 ? 1 : 0}}>
        {children}
      </div>
    </div>
  );
};

/** Fade + small rise. */
const FadeUp: React.FC<{start: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  start,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, start, 20);
  return (
    <div style={{opacity: p, transform: `translateY(${(1 - p) * 30}px)`, ...style}}>{children}</div>
  );
};

/** SVG stroke that draws itself. */
const Draw: React.FC<{
  d: string;
  start: number;
  dur: number;
  length: number;
  stroke: string;
  width: number;
}> = ({d, start, dur, length, stroke, width}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, start, dur);
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={length}
      strokeDashoffset={length * (1 - p)}
    />
  );
};

const Illustration: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const pop = (start: number) =>
    spring({frame: frame - start, fps, config: {damping: 12, stiffness: 160}});

  const wallFill = prog(frame, 100, 14);
  const ladderP = spring({frame: frame - 128, fps, config: {damping: 15, stiffness: 110}});
  const rollerP = spring({frame: frame - 138, fps, config: {damping: 14, stiffness: 120}});
  // Roller "paints" up and down once it's in place
  const paint = frame > 160 ? Math.sin((frame - 160) / 9) * 22 : 0;

  const banner = spring({frame: frame - 150, fps, config: {damping: 13, stiffness: 140}});
  const bannerText = prog(frame, 162, 18);

  // Subtle idle float for the whole illustration
  const float = Math.sin(frame / 30) * 3;

  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{position: "absolute", inset: 0, transform: `translateY(${float}px)`}}
    >
      {/* Walls */}
      <rect x={200} y={944} width={400} height={216} fill="#ffffff" opacity={wallFill} />
      <Draw
        d="M200 1160 L200 944 L600 944 L600 1160"
        start={88}
        dur={22}
        length={840}
        stroke={C.black}
        width={6}
      />
      {/* Roof */}
      <Draw
        d="M158 960 L400 808 L642 960"
        start={78}
        dur={24}
        length={580}
        stroke={C.black}
        width={7}
      />
      {/* Ground */}
      <Draw d="M118 1162 L972 1162" start={72} dur={30} length={860} stroke={C.black} width={6} />

      {/* Windows & door */}
      {[
        {x: 240, y: 995, w: 82, h: 72, s: 108},
        {x: 478, y: 995, w: 82, h: 72, s: 114},
        {x: 365, y: 1040, w: 70, h: 120, s: 120},
      ].map((r, i) => {
        const p = pop(r.s);
        return (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={C.cream}
            stroke={C.goldText}
            strokeWidth={4}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: `scale(${p})`,
            }}
          />
        );
      })}

      {/* Ladder */}
      <g
        style={{
          transform: `translate(${(1 - ladderP) * 260}px, 0) rotate(${(1 - ladderP) * 12}deg)`,
          transformOrigin: "740px 1160px",
          opacity: ladderP > 0.01 ? 1 : 0,
        }}
      >
        <line x1={760} y1={888} x2={700} y2={1160} stroke={C.goldText} strokeWidth={5} strokeLinecap="round" />
        <line x1={825} y1={888} x2={780} y2={1160} stroke={C.goldText} strokeWidth={5} strokeLinecap="round" />
        {[944, 1000, 1055, 1110].map((y) => {
          const t1 = (y - 888) / 272;
          return (
            <line
              key={y}
              x1={760 - 60 * t1}
              y1={y}
              x2={825 - 45 * t1}
              y2={y}
              stroke={C.goldText}
              strokeWidth={5}
            />
          );
        })}
      </g>

      {/* Paint roller */}
      <g
        style={{
          transform: `translate(${(1 - rollerP) * 220}px, ${paint - (1 - rollerP) * 120}px) rotate(${(1 - rollerP) * -25}deg)`,
          transformOrigin: "895px 1075px",
          opacity: rollerP > 0.01 ? 1 : 0,
        }}
      >
        <path
          d="M950 940 L967 940 L967 995 L895 995 L895 1030"
          fill="none"
          stroke={C.black}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <rect x={838} y={918} width={112} height={44} rx={8} fill={C.cream} stroke={C.black} strokeWidth={6} />
        <rect x={882} y={1028} width={26} height={95} rx={12} fill={C.black} />
      </g>

      {/* "EN REMODELACIÓN" tape */}
      <g
        style={{
          transform: `rotate(${-9 + (1 - banner) * -14}deg) scale(${0.4 + banner * 0.6})`,
          transformOrigin: "412px 1086px",
          opacity: Math.min(1, banner * 2),
        }}
      >
        <rect x={142} y={1058} width={540} height={56} fill={C.gold} />
        <text
          x={412}
          y={1097}
          textAnchor="middle"
          fontFamily={montserrat}
          fontWeight={800}
          fontSize={30}
          letterSpacing={6}
          fill={C.black}
          opacity={bannerText}
        >
          EN REMODELACIÓN
        </text>
      </g>
    </svg>
  );
};

const Diciembre: React.FC<{start: number}> = ({start}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const box = prog(frame, start, 16);
  const letters = "DICIEMBRE".split("");
  // Gold shimmer sweeping across the box every ~3 seconds
  const shimmerX = interpolate((frame - start - 30) % 90, [0, 30], [-150, 520], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        top: 1395,
        height: 80,
        width: 382,
        background: C.black,
        clipPath: `inset(0 ${(1 - box) * 100}% 0 0)`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{display: "flex", fontFamily: montserrat, fontWeight: 800, fontSize: 42, color: "#fff"}}>
        {letters.map((l, i) => {
          const s = spring({frame: frame - start - 8 - i * 2, fps, config: {damping: 12, stiffness: 180}});
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: i === letters.length - 1 ? 0 : 7,
                transform: `translateY(${(1 - s) * 40}px)`,
                opacity: s,
              }}
            >
              {l}
            </span>
          );
        })}
      </div>
      {frame > start + 30 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: shimmerX,
            width: 80,
            background: "linear-gradient(90deg, transparent, rgba(196,160,82,0.45), transparent)",
            transform: "skewX(-20deg)",
          }}
        />
      )}
    </div>
  );
};

export const SalinasRemodel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const bar = prog(frame, 0, 24);
  const brand = prog(frame, 8, 26);
  const salinas = spring({frame: frame - 44, fps, config: {damping: 11, stiffness: 120}});
  const question = spring({frame: frame - 54, fps, config: {damping: 8, stiffness: 160}});
  const divider = prog(frame, 62, 20);
  const arrowBounce = frame > 215 ? Math.abs(Math.sin((frame - 215) / 7)) * 8 : 0;

  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: montserrat, color: C.black}}>
      {/* Gold left bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 22,
          height: `${bar * 100}%`,
          background: C.gold,
        }}
      />

      {/* Brand */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 250,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: interpolate(brand, [0, 1], [2, 9]),
          opacity: brand,
          whiteSpace: "nowrap",
        }}
      >
        MP <span style={{color: C.goldText}}>REAL ESTATE</span>
      </div>

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 318,
          fontFamily: playfair,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 104,
          lineHeight: 1.0,
        }}
      >
        <Reveal start={18}>¿Estás buscando</Reveal>
        <Reveal start={26}>casa en</Reveal>
      </div>

      <div
        style={{
          position: "absolute",
          left: 100,
          top: 520,
          fontFamily: playfair,
          fontWeight: 900,
          fontSize: 152,
          lineHeight: 1,
          display: "flex",
          alignItems: "baseline",
        }}
      >
        <span
          style={{
            color: C.red,
            display: "inline-block",
            transform: `translateY(${(1 - salinas) * 60}px) scale(${0.85 + salinas * 0.15})`,
            transformOrigin: "left bottom",
            opacity: Math.min(1, salinas * 1.5),
          }}
        >
          Salinas
        </span>
        <span
          style={{
            display: "inline-block",
            transform: `scale(${question}) rotate(${(1 - question) * 30}deg)`,
            transformOrigin: "center bottom",
          }}
        >
          ?
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 719,
          width: 200 * divider,
          height: 3,
          background: C.gold,
        }}
      />

      <Illustration />

      {/* Body copy */}
      <FadeUp start={180} style={{position: "absolute", left: 100, top: 1232, width: 880}}>
        <div style={{fontSize: 44, fontWeight: 400, lineHeight: 1.3}}>
          Tengo una <b style={{fontWeight: 700}}>en remodelación</b> que sale al mercado en
        </div>
      </FadeUp>

      <Diciembre start={200} />

      {/* Contact */}
      <div style={{position: "absolute", left: 100, top: 1515}}>
        <Reveal start={222} style={{fontFamily: playfair, fontWeight: 700, fontSize: 80, lineHeight: 1.05}}>
          Contáctame
        </Reveal>
      </div>
      <FadeUp start={232} style={{position: "absolute", left: 100, top: 1615}}>
        <div style={{fontSize: 26, fontWeight: 600, letterSpacing: 6, color: C.goldText, whiteSpace: "nowrap"}}>
          ESCRÍBEME POR WHATSAPP{" "}
          <span style={{display: "inline-block", transform: `translateY(${arrowBounce}px)`}}>↓</span>
        </div>
      </FadeUp>

      {/* Footer */}
      <FadeUp start={244} style={{position: "absolute", left: 100, top: 1742}}>
        <div style={{fontSize: 22, whiteSpace: "nowrap", color: "#333"}}>
          <b style={{color: C.black, fontWeight: 700}}>Melissa Pinet Salicrup</b> · Realtor® · Lic. C-24860 ·{" "}
          <b style={{color: C.black, fontWeight: 700}}>787-401-7832</b>
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};
