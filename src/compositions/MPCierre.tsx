import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/fonts";

// Fonts are bundled locally so renders never depend on the network
const serif = "MP Cormorant";
const sans = "MP Jost";
loadFont({
  family: serif,
  url: staticFile("assets/mp/fonts/cormorant-500.woff2"),
  weight: "500",
});
loadFont({
  family: sans,
  url: staticFile("assets/mp/fonts/jost-400.woff2"),
  weight: "400",
});

// Brand palette (sampled from the logo files)
const BURGUNDY = "#6E2639";
const GOLD = "#B8915A";
const GOLD_LIGHT = "#E3C996";
const IVORY = "#FCFAF6";

const ease = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const t = (
  frame: number,
  from: number,
  to: number,
  out: [number, number] = [0, 1],
  easing = easeOut,
) =>
  interpolate(frame, [from, to], out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// ---------- Animated logo (coordinates match the 2000x2000 logo file) ----------
const CX = 999;
const R = 577;
const SPRING_Y = 797;
const BOTTOM = 1779;
const LEFT = CX - R;
const RIGHT = CX + R;

const AnimatedLogo: React.FC<{ frame: number }> = ({ frame }) => {
  const draw = t(frame, 0, 48, [0, 1], ease);
  const line = t(frame, 30, 62, [0, 1], ease);
  const knobs = t(frame, 52, 68);
  const doors = t(frame, 50, 90);

  const leftHalf = `M ${CX} ${BOTTOM} L ${LEFT} ${BOTTOM} L ${LEFT} ${SPRING_Y} A ${R} ${R} 0 0 1 ${CX} ${SPRING_Y - R}`;
  const rightHalf = `M ${CX} ${BOTTOM} L ${RIGHT} ${BOTTOM} L ${RIGHT} ${SPRING_Y} A ${R} ${R} 0 0 0 ${CX} ${SPRING_Y - R}`;

  const lineTop = 469;
  const lineH = (BOTTOM - lineTop) * line;

  return (
    <svg
      viewBox="380 180 1240 1640"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        <clipPath id="doorLeft">
          <rect x={430} y={700} width={CX - 15 - 430} height={700} />
        </clipPath>
        <clipPath id="doorRight">
          <rect x={CX + 15} y={700} width={600} height={700} />
        </clipPath>
      </defs>

      {[leftHalf, rightHalf].map((d) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          fill="none"
          stroke={BURGUNDY}
          strokeWidth={40}
          strokeLinejoin="round"
          strokeDasharray="1 1"
          strokeDashoffset={1 - draw}
        />
      ))}

      {/* Once drawn, a single closed path hides the seam where both halves meet */}
      <path
        d={`M ${LEFT} ${BOTTOM} L ${LEFT} ${SPRING_Y} A ${R} ${R} 0 0 1 ${RIGHT} ${SPRING_Y} L ${RIGHT} ${BOTTOM} Z`}
        fill="none"
        stroke={BURGUNDY}
        strokeWidth={40}
        strokeLinejoin="round"
        opacity={draw > 0.995 ? 1 : 0}
      />

      {/* Center line drops down from the top like the doors closing */}
      <rect x={CX - 15} y={lineTop} width={30} height={lineH} fill={BURGUNDY} />

      {/* Letters emerge from behind the center line, like doors opening */}
      <g clipPath="url(#doorLeft)">
        <image
          href={staticFile("assets/mp/letter-m.png")}
          x={460 + (1 - doors) * 140}
          y={820}
          width={515}
          height={430}
          opacity={doors}
        />
      </g>
      <g clipPath="url(#doorRight)">
        <image
          href={staticFile("assets/mp/letter-p.png")}
          x={1125 - (1 - doors) * 140}
          y={820}
          width={330}
          height={430}
          opacity={doors}
        />
      </g>

      {[935, 1065].map((x) => (
        <circle
          key={x}
          cx={x}
          cy={1537}
          r={25 * knobs}
          fill={BURGUNDY}
          opacity={knobs}
        />
      ))}
    </svg>
  );
};

// ---------- Icons (thin gold line icons) ----------
const iconProps = {
  fill: "none",
  stroke: GOLD,
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width={38} height={38} {...iconProps}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" width={38} height={38} {...iconProps}>
    <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
    <path d="M3 6l9 7 9-7" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width={38} height={38} {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.3" cy="6.7" r="0.6" fill={GOLD} />
  </svg>
);

const ContactRow: React.FC<{
  frame: number;
  start: number;
  icon: React.ReactNode;
  text: string;
}> = ({ frame, start, icon, text }) => {
  const p = t(frame, start, start + 26);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 30,
        opacity: p,
        transform: `translateX(${(1 - p) * -24}px)`,
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          flexShrink: 0,
          borderRadius: "50%",
          border: `1.5px solid ${GOLD}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: sans,
          fontWeight: 400,
          fontSize: 40,
          letterSpacing: "0.05em",
          color: BURGUNDY,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------- Main composition ----------
export const MPCierre: React.FC = () => {
  const frame = useCurrentFrame();

  // very slow push-in for life during the hold
  const logoScale = interpolate(frame, [0, 180], [1.04, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  const rule = t(frame, 72, 104, [0, 1], ease);
  const brand = t(frame, 78, 112);
  const realtor = t(frame, 92, 120);
  const name = t(frame, 104, 132);

  // gold glint travelling along the rule
  const glint = interpolate(frame, [118, 150], [-0.2, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  // thin gold frame drawn around the card
  const frameDraw = t(frame, 10, 70, [0, 1], ease);

  return (
    <AbsoluteFill style={{ backgroundColor: IVORY }}>
      {/* soft warm light */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 55% at 50% 30%, rgba(227,201,150,0.18), rgba(252,250,246,0) 70%)`,
        }}
      />

      {/* fine double gold border */}
      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", inset: 0 }}
      >
        {[
          { inset: 44, w: 1.5, o: 0.75 },
          { inset: 56, w: 0.8, o: 0.45 },
        ].map(({ inset, w, o }) => (
          <rect
            key={inset}
            x={inset}
            y={inset}
            width={1080 - inset * 2}
            height={1920 - inset * 2}
            fill="none"
            stroke={GOLD}
            strokeWidth={w}
            opacity={o}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - frameDraw}
          />
        ))}
      </svg>

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: (1080 - 470) / 2,
          width: 470,
          height: 622,
          transform: `scale(${logoScale})`,
          transformOrigin: "50% 60%",
        }}
      >
        <AnimatedLogo frame={frame} />
      </div>

      {/* Wordmark block */}
      <div
        style={{
          position: "absolute",
          top: 880,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 54,
            color: BURGUNDY,
            letterSpacing: `${0.62 - brand * 0.18}em`,
            marginRight: `-${0.62 - brand * 0.18}em`,
            opacity: brand,
            filter: `blur(${(1 - brand) * 6}px)`,
          }}
        >
          MP REAL ESTATE
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 36,
            width: 600 * rule,
            height: 3,
            background: GOLD,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${glint * 100}%`,
              width: 140,
              marginLeft: -70,
              background: `linear-gradient(90deg, rgba(255,255,255,0), ${GOLD_LIGHT}, #fff6e0, ${GOLD_LIGHT}, rgba(255,255,255,0))`,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 36,
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 32,
            color: GOLD,
            letterSpacing: "0.4em",
            marginRight: "-0.4em",
            opacity: realtor,
            transform: `translateY(${(1 - realtor) * 14}px)`,
          }}
        >
          REALTOR® · LIC. C-24860
        </div>

        <div
          style={{
            marginTop: 72,
            fontFamily: serif,
            fontStyle: "normal",
            fontWeight: 500,
            fontSize: 78,
            color: BURGUNDY,
            letterSpacing: "0.01em",
            opacity: name,
            transform: `translateY(${(1 - name) * 18}px)`,
          }}
        >
          Melissa Pinet Salicrup
        </div>
      </div>

      {/* Contacts */}
      <div
        style={{
          position: "absolute",
          top: 1300,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          <ContactRow
            frame={frame}
            start={120}
            icon={<PhoneIcon />}
            text="787-401-7832"
          />
          <ContactRow
            frame={frame}
            start={128}
            icon={<MailIcon />}
            text="melissapinetrealestate@gmail.com"
          />
          <ContactRow
            frame={frame}
            start={136}
            icon={<InstagramIcon />}
            text="@mps_realestatepr"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
