import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {AnimatedTitle} from "../components/text/AnimatedTitle";
import {GradientBackground} from "../components/backgrounds/GradientBackground";
import {ParticleField} from "../components/backgrounds/ParticleField";
import {ProgressBar} from "../components/overlays/ProgressBar";
import {Watermark} from "../components/overlays/Watermark";
import {SafeArea} from "../components/layout/SafeArea";
import {loadDefaultFonts, FONT_FAMILIES} from "../presets/fonts";

const BG_COLORS = ["#050b1f", "#0a1d3a", "#0d2a4e"];
const GOLD = "#f59e0b";
const EMERALD = "#10b981";
const RED = "#ef4444";
const WHITE = "#ffffff";
const MUTED = "#94a3b8";

// Animated number that counts up from `from` to `to` over `duration` frames
const CountUp: React.FC<{
  from: number;
  to: number;
  duration: number;
  fontSize: number;
  color: string;
  prefix?: string;
  suffix?: string;
}> = ({from, to, duration, fontSize, color, prefix = "$", suffix = ""}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({
    fps,
    frame,
    config: {damping: 20, stiffness: 80, mass: 1},
    durationInFrames: duration,
  });
  const value = interpolate(progress, [0, 1], [from, to]);
  return (
    <span
      style={{
        fontFamily: FONT_FAMILIES.display,
        fontWeight: 900,
        fontSize,
        color,
        letterSpacing: -2,
        textShadow: `0 0 40px ${color}55`,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {prefix}
      {Math.round(value).toLocaleString("en-US")}
      {suffix}
    </span>
  );
};

const Badge: React.FC<{text: string; color: string; delay?: number}> = ({
  text,
  color,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({
    fps,
    frame: frame - delay,
    config: {damping: 10, stiffness: 120},
  });
  const scale = interpolate(progress, [0, 1], [0.6, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  return (
    <div
      style={{
        display: "inline-block",
        padding: "14px 32px",
        borderRadius: 999,
        backgroundColor: `${color}22`,
        border: `2px solid ${color}`,
        color,
        fontFamily: FONT_FAMILIES.heading,
        fontWeight: 700,
        fontSize: 32,
        letterSpacing: 1,
        textTransform: "uppercase",
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 0 40px ${color}33`,
      }}
    >
      {text}
    </div>
  );
};

// Scene 1: Hook
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const iconScale = spring({fps, frame, config: {damping: 8, stiffness: 140}});
  return (
    <AbsoluteFill
      style={{justifyContent: "center", alignItems: "center", padding: 60}}
    >
      <div
        style={{
          fontSize: 180,
          marginBottom: 40,
          transform: `scale(${iconScale})`,
          filter: `drop-shadow(0 0 60px ${GOLD}88)`,
        }}
      >
        🏡
      </div>
      <AnimatedTitle
        text="¿Comprando casa en Puerto Rico este año?"
        fontSize={78}
        fontWeight={900}
        color={WHITE}
        enterAnimation="slideUp"
        exitAnimation="fade"
        enterDuration={18}
        holdDuration={70}
        exitDuration={12}
        letterSpacing={-2}
        lineHeight={1.05}
        textShadow={`0 4px 30px ${GOLD}55`}
        maxWidth="92%"
      />
    </AbsoluteFill>
  );
};

// Scene 2: Headline - "Hay un cambio"
const SceneHeadline: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 30,
      }}
    >
      <Sequence from={0} durationInFrames={120}>
        <AbsoluteFill
          style={{justifyContent: "center", alignItems: "center", padding: 60}}
        >
          <Badge text="Enero 2026" color={RED} />
          <div style={{height: 40}} />
          <AnimatedTitle
            text="Los límites FHA subieron"
            fontSize={96}
            fontWeight={900}
            color={WHITE}
            enterAnimation="slideUp"
            exitAnimation="fade"
            enterDuration={20}
            holdDuration={60}
            exitDuration={15}
            letterSpacing={-3}
            lineHeight={1.05}
            maxWidth="92%"
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

// Scene 3: Old limit
const SceneOldLimit: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: "clamp"});
  const exit = interpolate(frame, [110, 130], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [40, 75], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 30,
        opacity: opacity * exit,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILIES.heading,
          fontSize: 38,
          fontWeight: 600,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: 6,
        }}
      >
        Antes
      </div>
      <div style={{position: "relative", display: "inline-block"}}>
        <CountUp
          from={0}
          to={524225}
          duration={35}
          fontSize={140}
          color={WHITE}
        />
        <div
          style={{
            position: "absolute",
            top: "52%",
            left: "-2%",
            height: 8,
            width: `${lineWidth}%`,
            backgroundColor: RED,
            borderRadius: 4,
            boxShadow: `0 0 20px ${RED}`,
            transform: "rotate(-4deg)",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILIES.heading,
          fontSize: 34,
          fontWeight: 500,
          color: MUTED,
          marginTop: 20,
        }}
      >
        Máximo FHA en la mayoría de municipios
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: New limit with count-up
const SceneNewLimit: React.FC = () => {
  const frame = useCurrentFrame();
  const bgPulse = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.3, 0.6, 0.3]
  );
  const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: "clamp"});
  const exit = interpolate(frame, [160, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 30,
        opacity: opacity * exit,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${EMERALD}${Math.round(
            bgPulse * 60
          )
            .toString(16)
            .padStart(2, "0")} 0%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          fontFamily: FONT_FAMILIES.heading,
          fontSize: 38,
          fontWeight: 600,
          color: EMERALD,
          textTransform: "uppercase",
          letterSpacing: 6,
          zIndex: 1,
        }}
      >
        Este año
      </div>
      <div style={{zIndex: 1}}>
        <CountUp
          from={524225}
          to={541287}
          duration={60}
          fontSize={150}
          color={EMERALD}
        />
      </div>
      <Sequence from={70}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: FONT_FAMILIES.display,
              fontSize: 56,
              fontWeight: 900,
              color: GOLD,
              textShadow: `0 0 30px ${GOLD}`,
            }}
          >
            ▲ +$17,062
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

// Scene 5: Margin gain + 3.5% down
const SceneMargin: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 50,
      }}
    >
      <Sequence from={0}>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: `${GOLD}1a`,
              border: `3px solid ${GOLD}`,
              borderRadius: 32,
              padding: "50px 60px",
              textAlign: "center",
              opacity: interpolate(frame, [0, 15], [0, 1], {
                extrapolateRight: "clamp",
              }),
              transform: `translateY(${interpolate(
                frame,
                [0, 20],
                [40, 0],
                {extrapolateRight: "clamp"}
              )}px)`,
              maxWidth: 860,
            }}
          >
            <div
              style={{
                fontFamily: FONT_FAMILIES.heading,
                fontSize: 34,
                color: MUTED,
                marginBottom: 10,
              }}
            >
              Más margen
            </div>
            <div
              style={{
                fontFamily: FONT_FAMILIES.display,
                fontSize: 130,
                fontWeight: 900,
                color: GOLD,
                letterSpacing: -2,
                textShadow: `0 0 40px ${GOLD}88`,
              }}
            >
              +$17K
            </div>
          </div>
        </div>
      </Sequence>

      <Sequence from={30}>
        <div
          style={{
            backgroundColor: `${EMERALD}1a`,
            border: `3px solid ${EMERALD}`,
            borderRadius: 32,
            padding: "50px 60px",
            textAlign: "center",
            opacity: interpolate(frame - 30, [0, 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(
              frame - 30,
              [0, 20],
              [40, 0],
              {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
            )}px)`,
            maxWidth: 860,
          }}
        >
          <div
            style={{
              fontFamily: FONT_FAMILIES.heading,
              fontSize: 34,
              color: MUTED,
              marginBottom: 10,
            }}
          >
            Y sigues pagando solo
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILIES.display,
              fontSize: 130,
              fontWeight: 900,
              color: EMERALD,
              letterSpacing: -2,
              textShadow: `0 0 40px ${EMERALD}88`,
            }}
          >
            3.5%
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILIES.heading,
              fontSize: 34,
              color: WHITE,
              marginTop: 10,
            }}
          >
            de pronto
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

// Scene 6: High-cost areas
const SceneHighCost: React.FC = () => {
  const frame = useCurrentFrame();
  const pinScale = spring({
    fps: 30,
    frame,
    config: {damping: 7, stiffness: 120},
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div
        style={{
          fontSize: 180,
          transform: `scale(${pinScale})`,
          filter: `drop-shadow(0 0 40px ${RED})`,
        }}
      >
        📍
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILIES.heading,
          fontSize: 52,
          fontWeight: 700,
          color: WHITE,
          textAlign: "center",
          opacity: interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        San Juan · zonas metro
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILIES.heading,
          fontSize: 28,
          fontWeight: 500,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: 4,
          marginTop: 20,
          opacity: interpolate(frame, [30, 50], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        Tope puede llegar hasta
      </div>
      <Sequence from={50}>
        <CountUp
          from={541287}
          to={1249000}
          duration={50}
          fontSize={130}
          color={GOLD}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// Scene 7: "¿Qué significa en la práctica?"
const SceneQuestion: React.FC = () => {
  return (
    <AbsoluteFill
      style={{justifyContent: "center", alignItems: "center", padding: 60}}
    >
      <AnimatedTitle
        text="¿Qué significa en la práctica?"
        fontSize={88}
        fontWeight={900}
        color={WHITE}
        enterAnimation="scale"
        exitAnimation="fade"
        enterDuration={20}
        holdDuration={45}
        exitDuration={15}
        letterSpacing={-2}
        lineHeight={1.1}
        textShadow={`0 4px 30px ${GOLD}66`}
        maxWidth="92%"
      />
    </AbsoluteFill>
  );
};

// Scene 8: Within reach again
const SceneWithinReach: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div
        style={{
          fontSize: 120,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
          }),
          transform: `scale(${interpolate(frame, [0, 25], [0.6, 1], {
            extrapolateRight: "clamp",
          })})`,
        }}
      >
        ✨
      </div>
      <AnimatedTitle
        text="Propiedades que se te salieron en 2025…"
        fontSize={52}
        fontWeight={600}
        color={MUTED}
        enterAnimation="slideUp"
        exitAnimation="fade"
        enterDuration={15}
        holdDuration={50}
        exitDuration={15}
        letterSpacing={-1}
        lineHeight={1.15}
        maxWidth="92%"
      />
      <Sequence from={40}>
        <AnimatedTitle
          text="…este año pueden estar de nuevo a tu alcance"
          fontSize={64}
          fontWeight={900}
          color={EMERALD}
          enterAnimation="slideUp"
          exitAnimation="fade"
          enterDuration={20}
          holdDuration={60}
          exitDuration={15}
          letterSpacing={-1}
          lineHeight={1.15}
          textShadow={`0 0 40px ${EMERALD}66`}
          maxWidth="92%"
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// Scene 9: DTI comparison — 45% vs 57% bar chart
const SceneDTI: React.FC = () => {
  const frame = useCurrentFrame();
  const convProgress = interpolate(frame, [15, 50], [0, 45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fhaProgress = interpolate(frame, [55, 100], [0, 57], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });
  const BAR_MAX = 850;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 50,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILIES.heading,
          fontSize: 44,
          fontWeight: 800,
          color: WHITE,
          textAlign: "center",
          opacity: titleOpacity,
          lineHeight: 1.15,
          maxWidth: 900,
        }}
      >
        Deuda vs. ingreso mensual
      </div>

      {/* Convencional bar */}
      <div
        style={{
          width: BAR_MAX,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <div
            style={{
              fontFamily: FONT_FAMILIES.heading,
              fontSize: 36,
              fontWeight: 700,
              color: MUTED,
            }}
          >
            Convencional
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILIES.display,
              fontSize: 56,
              fontWeight: 900,
              color: MUTED,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(convProgress)}%
          </div>
        </div>
        <div
          style={{
            height: 48,
            width: BAR_MAX,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(convProgress / 60) * 100}%`,
              background: `linear-gradient(90deg, #475569, #64748b)`,
              borderRadius: 24,
            }}
          />
        </div>
      </div>

      {/* FHA bar */}
      <div
        style={{
          width: BAR_MAX,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <div
            style={{
              fontFamily: FONT_FAMILIES.heading,
              fontSize: 36,
              fontWeight: 800,
              color: EMERALD,
            }}
          >
            FHA
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILIES.display,
              fontSize: 56,
              fontWeight: 900,
              color: EMERALD,
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 0 20px ${EMERALD}66`,
            }}
          >
            {Math.round(fhaProgress)}%
          </div>
        </div>
        <div
          style={{
            height: 48,
            width: BAR_MAX,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(fhaProgress / 60) * 100}%`,
              background: `linear-gradient(90deg, ${EMERALD}, #34d399)`,
              borderRadius: 24,
              boxShadow: `0 0 30px ${EMERALD}88`,
            }}
          />
        </div>
      </div>

      <Sequence from={110}>
        <div
          style={{
            fontFamily: FONT_FAMILIES.heading,
            fontSize: 38,
            fontWeight: 700,
            color: WHITE,
            textAlign: "center",
            opacity: interpolate(frame - 110, [0, 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(
              frame - 110,
              [0, 20],
              [20, 0],
              {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
            )}px)`,
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          Más banco aprueba para ti
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

// Scene 10: Credit score 580
const SceneCreditScore: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILIES.heading,
          fontSize: 40,
          fontWeight: 600,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: 6,
          opacity: interpolate(frame, [0, 15], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        Crédito mínimo
      </div>
      <CountUp
        from={300}
        to={580}
        duration={40}
        fontSize={260}
        color={GOLD}
        prefix=""
      />
      <div
        style={{
          fontFamily: FONT_FAMILIES.heading,
          fontSize: 40,
          fontWeight: 700,
          color: WHITE,
          textAlign: "center",
          opacity: interpolate(frame, [45, 65], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          maxWidth: 900,
          lineHeight: 1.2,
        }}
      >
        Para calificar con 3.5% de pronto
      </div>
    </AbsoluteFill>
  );
};

// Scene 11: Confirm with your bank
const SceneConfirm: React.FC = () => {
  const frame = useCurrentFrame();
  const iconScale = spring({
    fps: 30,
    frame,
    config: {damping: 9, stiffness: 120},
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div
        style={{
          fontSize: 160,
          transform: `scale(${iconScale})`,
          filter: `drop-shadow(0 0 40px ${GOLD}88)`,
        }}
      >
        🏦
      </div>
      <AnimatedTitle
        text="Confirma con tu banco los límites actualizados"
        fontSize={64}
        fontWeight={900}
        color={WHITE}
        enterAnimation="slideUp"
        exitAnimation="fade"
        enterDuration={18}
        holdDuration={70}
        exitDuration={15}
        letterSpacing={-1.5}
        lineHeight={1.1}
        maxWidth="94%"
      />
      <AnimatedTitle
        text="antes de descartar propiedades"
        fontSize={44}
        fontWeight={500}
        color={MUTED}
        enterAnimation="fade"
        exitAnimation="fade"
        enterDuration={25}
        holdDuration={65}
        exitDuration={15}
        letterSpacing={-0.5}
        lineHeight={1.2}
        maxWidth="94%"
      />
    </AbsoluteFill>
  );
};

// Scene 12: CTA - Canal VIP
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const vipProgress = spring({
    fps,
    frame,
    config: {damping: 10, stiffness: 110},
  });
  const pulse = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2);
  const hoursProgress = interpolate(frame, [30, 70], [0, 72], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* VIP badge */}
      <div
        style={{
          padding: "20px 48px",
          borderRadius: 999,
          background: `linear-gradient(135deg, ${GOLD}, #fcd34d)`,
          fontFamily: FONT_FAMILIES.display,
          fontSize: 56,
          fontWeight: 900,
          color: "#1a0f00",
          letterSpacing: 4,
          transform: `scale(${interpolate(
            vipProgress,
            [0, 1],
            [0, 1]
          )}) scale(${pulse})`,
          boxShadow: `0 0 60px ${GOLD}aa, 0 0 120px ${GOLD}55`,
        }}
      >
        CANAL VIP
      </div>

      <Sequence from={25}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              fontFamily: FONT_FAMILIES.heading,
              fontSize: 42,
              fontWeight: 600,
              color: WHITE,
            }}
          >
            Listings
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILIES.display,
              fontSize: 220,
              fontWeight: 900,
              color: EMERALD,
              letterSpacing: -6,
              textShadow: `0 0 60px ${EMERALD}aa`,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {Math.round(hoursProgress)}h
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILIES.heading,
              fontSize: 40,
              fontWeight: 700,
              color: WHITE,
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            antes que cualquier
            <br />
            otra plataforma
          </div>
        </div>
      </Sequence>

      <Sequence from={100}>
        <div
          style={{
            marginTop: 20,
            padding: "28px 56px",
            borderRadius: 999,
            backgroundColor: WHITE,
            fontFamily: FONT_FAMILIES.heading,
            fontSize: 44,
            fontWeight: 900,
            color: "#0a0a0a",
            transform: `scale(${spring({
              fps,
              frame: frame - 100,
              config: {damping: 10, stiffness: 120},
            })})`,
            boxShadow: `0 10px 40px rgba(0,0,0,0.4)`,
          }}
        >
          👉 Link en bio
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

// Scene timings
const SCENES = [
  {Comp: SceneHook, duration: 120},
  {Comp: SceneHeadline, duration: 120},
  {Comp: SceneOldLimit, duration: 150},
  {Comp: SceneNewLimit, duration: 180},
  {Comp: SceneMargin, duration: 150},
  {Comp: SceneHighCost, duration: 180},
  {Comp: SceneQuestion, duration: 90},
  {Comp: SceneWithinReach, duration: 150},
  {Comp: SceneDTI, duration: 210},
  {Comp: SceneCreditScore, duration: 120},
  {Comp: SceneConfirm, duration: 150},
  {Comp: SceneCTA, duration: 210},
];

export const FHA_LOAN_LIMITS_DURATION = SCENES.reduce(
  (sum, s) => sum + s.duration,
  0
);

export const FHALoanLimits: React.FC = () => {
  loadDefaultFonts();

  let offset = 0;

  return (
    <AbsoluteFill style={{backgroundColor: BG_COLORS[0]}}>
      <GradientBackground
        colors={BG_COLORS}
        angle={160}
        animateAngle
        animateSpeed={0.15}
      />
      <ParticleField
        count={40}
        color="rgba(245, 158, 11, 0.25)"
        speed={0.3}
        direction="up"
      />

      <SafeArea paddingHorizontal={0} paddingVertical={0}>
        {SCENES.map(({Comp, duration}, i) => {
          const from = offset;
          offset += duration;
          return (
            <Sequence key={i} from={from} durationInFrames={duration}>
              <Comp />
            </Sequence>
          );
        })}
      </SafeArea>

      <ProgressBar color={GOLD} height={6} position="bottom" />
      <Watermark
        text="@soyenriquerocha"
        corner="topRight"
        opacity={0.7}
        fontSize={22}
        color={WHITE}
        margin={50}
      />
    </AbsoluteFill>
  );
};
