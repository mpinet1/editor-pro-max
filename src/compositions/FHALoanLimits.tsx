import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import {AnimatedTitle} from "../components/text/AnimatedTitle";
import {GradientBackground} from "../components/backgrounds/GradientBackground";
import {ParticleField} from "../components/backgrounds/ParticleField";
import {GridPattern} from "../components/backgrounds/GridPattern";
import {ProgressBar} from "../components/overlays/ProgressBar";
import {Watermark} from "../components/overlays/Watermark";
import {FONT_FAMILIES, loadDefaultFonts} from "../presets/fonts";
import {BRAND} from "../presets/brand";

const COLORS = {
  navy: "#0b1e3f",
  navyDeep: "#050f24",
  gold: "#f5b301",
  goldSoft: "#ffd15c",
  green: "#1fbf6b",
  red: "#ff4d6d",
  turquoise: "#14e1c7",
  white: "#ffffff",
  muted: "#9bb0c9",
};

/** Animated counter that counts from `from` to `to` with spring feel */
const AnimatedNumber: React.FC<{
  from: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  format?: (n: number) => string;
  textShadow?: string;
}> = ({
  from,
  to,
  duration = 30,
  prefix = "",
  suffix = "",
  fontSize = 160,
  color = COLORS.white,
  fontWeight = 900,
  format,
  textShadow,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({
    fps,
    frame,
    config: {damping: 20, stiffness: 90, mass: 1},
    durationInFrames: duration,
  });
  const value = interpolate(progress, [0, 1], [from, to]);
  const formatted = format
    ? format(value)
    : Math.round(value).toLocaleString("en-US");
  return (
    <div
      style={{
        fontSize,
        fontWeight,
        color,
        fontFamily: FONT_FAMILIES.display,
        letterSpacing: -2,
        lineHeight: 1,
        textShadow,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {prefix}
      {formatted}
      {suffix}
    </div>
  );
};

/** Small label pill above a number */
const Pill: React.FC<{text: string; color?: string; bg?: string}> = ({
  text,
  color = COLORS.navy,
  bg = COLORS.gold,
}) => (
  <div
    style={{
      padding: "12px 28px",
      background: bg,
      color,
      borderRadius: 999,
      fontSize: 32,
      fontWeight: 800,
      fontFamily: FONT_FAMILIES.display,
      textTransform: "uppercase",
      letterSpacing: 2,
    }}
  >
    {text}
  </div>
);

/** A DTI comparison bar (horizontal fill bar) */
const DTIBar: React.FC<{
  percent: number;
  label: string;
  color: string;
  delay: number;
}> = ({percent, label, color, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({
    fps,
    frame: Math.max(0, frame - delay),
    config: {damping: 18, stiffness: 80},
    durationInFrames: 30,
  });
  const width = interpolate(progress, [0, 1], [0, percent]);
  const numberShown = Math.round(
    interpolate(progress, [0, 1], [0, percent]),
  );
  return (
    <div style={{width: "100%", marginBottom: 40}}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: COLORS.white,
            fontFamily: FONT_FAMILIES.display,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color,
            fontFamily: FONT_FAMILIES.display,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {numberShown}%
        </div>
      </div>
      <div
        style={{
          height: 32,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: color,
            borderRadius: 999,
            boxShadow: `0 0 40px ${color}80`,
          }}
        />
      </div>
    </div>
  );
};

/** Scene wrapper that fades in/out so scenes blend across sequences */
const SceneShell: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  fadeIn?: number;
  fadeOut?: number;
}> = ({children, durationInFrames, fadeIn = 10, fadeOut = 10}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  return (
    <AbsoluteFill
      style={{
        opacity,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Scene timings (in frames @ 30fps)
const T = {
  hook: {from: 0, dur: 130},
  announce: {from: 130, dur: 95},
  before: {from: 225, dur: 130},
  after: {from: 355, dur: 160},
  diff: {from: 515, dur: 150},
  metro: {from: 665, dur: 155},
  practical: {from: 820, dur: 185},
  dti: {from: 1005, dur: 220},
  credit: {from: 1225, dur: 130},
  advice: {from: 1355, dur: 135},
  cta: {from: 1490, dur: 190},
};
const TOTAL_FRAMES = 1680;

const HookScene: React.FC = () => (
  <SceneShell durationInFrames={T.hook.dur}>
    <div style={{textAlign: "center"}}>
      <div style={{marginBottom: 40}}>
        <Pill text="Puerto Rico 2026" />
      </div>
      <AnimatedTitle
        text="¿Comprando casa\nen Puerto Rico\neste año?"
        fontSize={120}
        fontWeight={900}
        color={COLORS.white}
        fontFamily={FONT_FAMILIES.display}
        enterAnimation="slideUp"
        exitAnimation="fade"
        enterDuration={20}
        holdDuration={80}
        exitDuration={15}
        letterSpacing={-3}
        lineHeight={1.05}
        textShadow={`0 6px 40px ${COLORS.gold}55`}
        style={{whiteSpace: "pre-line"}}
      />
      <div style={{marginTop: 50}}>
        <AnimatedTitle
          text="Esto tienes que saber ↓"
          fontSize={54}
          fontWeight={600}
          color={COLORS.gold}
          enterAnimation="fade"
          exitAnimation="fade"
          enterDuration={25}
          holdDuration={70}
          exitDuration={15}
          letterSpacing={0}
        />
      </div>
    </div>
  </SceneShell>
);

const AnnounceScene: React.FC = () => (
  <SceneShell durationInFrames={T.announce.dur}>
    <div style={{textAlign: "center"}}>
      <div style={{marginBottom: 36}}>
        <Pill text="Enero 2026" bg={COLORS.green} color={COLORS.navyDeep} />
      </div>
      <AnimatedTitle
        text="Los límites FHA"
        fontSize={96}
        fontWeight={800}
        color={COLORS.white}
        fontFamily={FONT_FAMILIES.display}
        enterAnimation="slideLeft"
        exitAnimation="fade"
        enterDuration={15}
        holdDuration={65}
        exitDuration={15}
        letterSpacing={-2}
      />
      <div style={{marginTop: 10}}>
        <AnimatedTitle
          text="SUBIERON ↑"
          fontSize={160}
          fontWeight={900}
          color={COLORS.green}
          fontFamily={FONT_FAMILIES.display}
          enterAnimation="scale"
          exitAnimation="fade"
          enterDuration={20}
          holdDuration={60}
          exitDuration={15}
          letterSpacing={-2}
          textShadow={`0 0 60px ${COLORS.green}99`}
        />
      </div>
    </div>
  </SceneShell>
);

const BeforeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const strikeProgress = interpolate(frame, [35, 60], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <SceneShell durationInFrames={T.before.dur}>
      <div style={{textAlign: "center"}}>
        <div style={{marginBottom: 30}}>
          <Pill text="Antes" bg={COLORS.muted} color={COLORS.navyDeep} />
        </div>
        <div
          style={{
            fontSize: 42,
            color: COLORS.muted,
            fontWeight: 500,
            marginBottom: 24,
            fontFamily: FONT_FAMILIES.body,
          }}
        >
          Máximo FHA mayoría de municipios
        </div>
        <div style={{position: "relative", display: "inline-block"}}>
          <AnimatedNumber
            from={0}
            to={524225}
            duration={30}
            prefix="$"
            fontSize={170}
            color={COLORS.white}
            textShadow="0 4px 30px rgba(0,0,0,0.6)"
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              height: 10,
              background: COLORS.red,
              width: `${strikeProgress}%`,
              transform: "translateY(-50%) rotate(-4deg)",
              borderRadius: 4,
              boxShadow: `0 0 20px ${COLORS.red}cc`,
            }}
          />
        </div>
      </div>
    </SceneShell>
  );
};

const AfterScene: React.FC = () => (
  <SceneShell durationInFrames={T.after.dur}>
    <div style={{textAlign: "center"}}>
      <div style={{marginBottom: 30}}>
        <Pill text="Ahora 2026" bg={COLORS.gold} color={COLORS.navyDeep} />
      </div>
      <div
        style={{
          fontSize: 42,
          color: COLORS.goldSoft,
          fontWeight: 500,
          marginBottom: 24,
          fontFamily: FONT_FAMILIES.body,
        }}
      >
        Nuevo límite FHA
      </div>
      <AnimatedNumber
        from={524225}
        to={541287}
        duration={45}
        prefix="$"
        fontSize={200}
        color={COLORS.gold}
        textShadow={`0 0 60px ${COLORS.gold}99`}
      />
      <div style={{marginTop: 30}}>
        <AnimatedTitle
          text="En la mayoría de los municipios"
          fontSize={40}
          fontWeight={500}
          color={COLORS.muted}
          enterAnimation="fade"
          exitAnimation="fade"
          enterDuration={25}
          holdDuration={100}
          exitDuration={15}
        />
      </div>
    </div>
  </SceneShell>
);

const DiffScene: React.FC = () => (
  <SceneShell durationInFrames={T.diff.dur}>
    <div style={{textAlign: "center"}}>
      <div
        style={{
          fontSize: 48,
          color: COLORS.white,
          fontWeight: 600,
          marginBottom: 24,
          fontFamily: FONT_FAMILIES.display,
        }}
      >
        Son
      </div>
      <div style={{marginBottom: 20}}>
        <AnimatedNumber
          from={0}
          to={17000}
          duration={35}
          prefix="+$"
          fontSize={220}
          color={COLORS.green}
          textShadow={`0 0 60px ${COLORS.green}99`}
        />
      </div>
      <div
        style={{
          fontSize: 54,
          color: COLORS.white,
          fontWeight: 700,
          marginBottom: 60,
          fontFamily: FONT_FAMILIES.display,
        }}
      >
        más de margen
      </div>
      <div
        style={{
          padding: "24px 44px",
          background: "rgba(245,179,1,0.15)",
          border: `2px solid ${COLORS.gold}`,
          borderRadius: 24,
          display: "inline-block",
        }}
      >
        <div
          style={{
            fontSize: 40,
            color: COLORS.gold,
            fontWeight: 700,
            fontFamily: FONT_FAMILIES.display,
          }}
        >
          sigues pagando solo{" "}
          <span style={{fontSize: 64, fontWeight: 900}}>3.5%</span> de pronto
        </div>
      </div>
    </div>
  </SceneShell>
);

const MetroScene: React.FC = () => (
  <SceneShell durationInFrames={T.metro.dur}>
    <div style={{textAlign: "center"}}>
      <div style={{marginBottom: 30}}>
        <Pill
          text="San Juan · Zonas Metro"
          bg={COLORS.turquoise}
          color={COLORS.navyDeep}
        />
      </div>
      <div
        style={{
          fontSize: 44,
          color: COLORS.white,
          fontWeight: 500,
          marginBottom: 20,
          fontFamily: FONT_FAMILIES.body,
        }}
      >
        El tope puede llegar hasta
      </div>
      <AnimatedNumber
        from={541287}
        to={1249000}
        duration={50}
        prefix="$"
        fontSize={180}
        color={COLORS.turquoise}
        textShadow={`0 0 60px ${COLORS.turquoise}99`}
      />
      <div
        style={{
          marginTop: 24,
          fontSize: 44,
          color: COLORS.goldSoft,
          fontWeight: 700,
          fontFamily: FONT_FAMILIES.display,
        }}
      >
        en áreas de precio alto
      </div>
    </div>
  </SceneShell>
);

const PracticalScene: React.FC = () => (
  <SceneShell durationInFrames={T.practical.dur}>
    <div style={{textAlign: "center"}}>
      <div style={{marginBottom: 40}}>
        <AnimatedTitle
          text="¿Qué significa\nen la práctica?"
          fontSize={96}
          fontWeight={900}
          color={COLORS.gold}
          fontFamily={FONT_FAMILIES.display}
          enterAnimation="scale"
          exitAnimation="fade"
          enterDuration={20}
          holdDuration={40}
          exitDuration={15}
          letterSpacing={-2}
          lineHeight={1.05}
          style={{whiteSpace: "pre-line"}}
        />
      </div>
      <Sequence from={60}>
        <div
          style={{
            padding: "40px 50px",
            background: "rgba(31,191,107,0.12)",
            border: `2px solid ${COLORS.green}`,
            borderRadius: 28,
            textAlign: "left",
          }}
        >
          <AnimatedTitle
            text="Propiedades que se te salían del margen FHA por unos pocos miles…"
            fontSize={48}
            fontWeight={600}
            color={COLORS.white}
            enterAnimation="slideUp"
            exitAnimation="fade"
            enterDuration={20}
            holdDuration={60}
            exitDuration={15}
            lineHeight={1.25}
            textAlign="left"
            maxWidth="100%"
          />
          <div style={{height: 24}} />
          <AnimatedTitle
            text="este año pueden estar de nuevo en tu alcance."
            fontSize={56}
            fontWeight={900}
            color={COLORS.green}
            fontFamily={FONT_FAMILIES.display}
            enterAnimation="slideUp"
            exitAnimation="fade"
            enterDuration={25}
            holdDuration={55}
            exitDuration={15}
            lineHeight={1.2}
            textAlign="left"
            maxWidth="100%"
          />
        </div>
      </Sequence>
    </div>
  </SceneShell>
);

const DTIScene: React.FC = () => (
  <SceneShell durationInFrames={T.dti.dur}>
    <div style={{width: "100%", textAlign: "center"}}>
      <div style={{marginBottom: 20}}>
        <Pill text="Debt-to-Income" bg={COLORS.gold} color={COLORS.navyDeep} />
      </div>
      <AnimatedTitle
        text="FHA acepta más deuda"
        fontSize={72}
        fontWeight={800}
        color={COLORS.white}
        fontFamily={FONT_FAMILIES.display}
        enterAnimation="slideUp"
        exitAnimation="fade"
        enterDuration={15}
        holdDuration={180}
        exitDuration={15}
        letterSpacing={-1}
      />
      <div
        style={{
          marginTop: 50,
          padding: "40px 30px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 28,
        }}
      >
        <DTIBar
          percent={45}
          label="Préstamo convencional"
          color={COLORS.red}
          delay={30}
        />
        <DTIBar percent={57} label="FHA" color={COLORS.green} delay={70} />
      </div>
      <div
        style={{
          marginTop: 30,
          fontSize: 38,
          color: COLORS.goldSoft,
          fontWeight: 600,
          fontFamily: FONT_FAMILIES.body,
          lineHeight: 1.3,
        }}
      >
        → más margen = el banco te aprueba más
      </div>
    </div>
  </SceneShell>
);

const CreditScene: React.FC = () => (
  <SceneShell durationInFrames={T.credit.dur}>
    <div style={{textAlign: "center"}}>
      <div style={{marginBottom: 24}}>
        <Pill text="Crédito mínimo" bg={COLORS.turquoise} color={COLORS.navyDeep} />
      </div>
      <div
        style={{
          fontSize: 44,
          color: COLORS.muted,
          fontWeight: 500,
          marginBottom: 20,
          fontFamily: FONT_FAMILIES.body,
        }}
      >
        Para calificar con 3.5% de pronto
      </div>
      <AnimatedNumber
        from={0}
        to={580}
        duration={35}
        fontSize={320}
        color={COLORS.turquoise}
        textShadow={`0 0 80px ${COLORS.turquoise}99`}
      />
      <div
        style={{
          fontSize: 48,
          color: COLORS.white,
          fontWeight: 700,
          fontFamily: FONT_FAMILIES.display,
          marginTop: -10,
        }}
      >
        puntos de crédito
      </div>
    </div>
  </SceneShell>
);

const AdviceScene: React.FC = () => (
  <SceneShell durationInFrames={T.advice.dur}>
    <div style={{textAlign: "center"}}>
      <div
        style={{
          fontSize: 140,
          marginBottom: 20,
        }}
      >
        ⚠️
      </div>
      <AnimatedTitle
        text="Confirma con tu banco"
        fontSize={80}
        fontWeight={900}
        color={COLORS.gold}
        fontFamily={FONT_FAMILIES.display}
        enterAnimation="slideUp"
        exitAnimation="fade"
        enterDuration={15}
        holdDuration={95}
        exitDuration={15}
        letterSpacing={-1}
      />
      <div style={{marginTop: 30}}>
        <AnimatedTitle
          text="los límites actualizados\nantes de descartar propiedades"
          fontSize={44}
          fontWeight={500}
          color={COLORS.white}
          enterAnimation="fade"
          exitAnimation="fade"
          enterDuration={20}
          holdDuration={80}
          exitDuration={15}
          lineHeight={1.3}
          style={{whiteSpace: "pre-line"}}
        />
      </div>
    </div>
  </SceneShell>
);

const CTAScene: React.FC = () => (
  <SceneShell durationInFrames={T.cta.dur}>
    <div style={{textAlign: "center"}}>
      <div style={{marginBottom: 30}}>
        <Pill text="Canal VIP" bg={COLORS.gold} color={COLORS.navyDeep} />
      </div>
      <AnimatedTitle
        text="Listings 72h antes"
        fontSize={100}
        fontWeight={900}
        color={COLORS.white}
        fontFamily={FONT_FAMILIES.display}
        enterAnimation="scale"
        exitAnimation="fade"
        enterDuration={20}
        holdDuration={140}
        exitDuration={15}
        letterSpacing={-2}
        textShadow={`0 0 50px ${COLORS.gold}77`}
      />
      <div style={{marginTop: 24}}>
        <AnimatedTitle
          text="que cualquier otra plataforma"
          fontSize={42}
          fontWeight={500}
          color={COLORS.muted}
          enterAnimation="fade"
          exitAnimation="fade"
          enterDuration={25}
          holdDuration={130}
          exitDuration={15}
        />
      </div>
      <div style={{marginTop: 70}}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 20,
            padding: "28px 56px",
            background: COLORS.gold,
            color: COLORS.navyDeep,
            borderRadius: 999,
            fontSize: 54,
            fontWeight: 900,
            fontFamily: FONT_FAMILIES.display,
            boxShadow: `0 12px 60px ${COLORS.gold}77`,
          }}
        >
          👉 Link en bio
        </div>
      </div>
    </div>
  </SceneShell>
);

export const FHALoanLimits: React.FC = () => {
  loadDefaultFonts();

  return (
    <AbsoluteFill style={{background: COLORS.navyDeep}}>
      {/* Background */}
      <GradientBackground
        colors={[COLORS.navyDeep, COLORS.navy, "#0a2555"]}
        angle={155}
        animateAngle
        animateSpeed={0.2}
      />
      <GridPattern
        type="dots"
        spacing={60}
        size={2}
        color="rgba(245,179,1,0.08)"
        animate
        animateSpeed={0.3}
      />
      <ParticleField
        count={40}
        color="rgba(245,179,1,0.25)"
        speed={0.3}
        direction="up"
      />

      {/* Top banner */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: "10px 26px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 999,
            color: COLORS.white,
            fontSize: 26,
            fontWeight: 700,
            fontFamily: FONT_FAMILIES.display,
            letterSpacing: 1.5,
            backdropFilter: "blur(10px)",
          }}
        >
          🏠 FHA · PUERTO RICO · 2026
        </div>
      </div>

      {/* Scenes */}
      <Sequence from={T.hook.from} durationInFrames={T.hook.dur}>
        <HookScene />
      </Sequence>
      <Sequence from={T.announce.from} durationInFrames={T.announce.dur}>
        <AnnounceScene />
      </Sequence>
      <Sequence from={T.before.from} durationInFrames={T.before.dur}>
        <BeforeScene />
      </Sequence>
      <Sequence from={T.after.from} durationInFrames={T.after.dur}>
        <AfterScene />
      </Sequence>
      <Sequence from={T.diff.from} durationInFrames={T.diff.dur}>
        <DiffScene />
      </Sequence>
      <Sequence from={T.metro.from} durationInFrames={T.metro.dur}>
        <MetroScene />
      </Sequence>
      <Sequence from={T.practical.from} durationInFrames={T.practical.dur}>
        <PracticalScene />
      </Sequence>
      <Sequence from={T.dti.from} durationInFrames={T.dti.dur}>
        <DTIScene />
      </Sequence>
      <Sequence from={T.credit.from} durationInFrames={T.credit.dur}>
        <CreditScene />
      </Sequence>
      <Sequence from={T.advice.from} durationInFrames={T.advice.dur}>
        <AdviceScene />
      </Sequence>
      <Sequence from={T.cta.from} durationInFrames={T.cta.dur}>
        <CTAScene />
      </Sequence>

      {/* Progress bar */}
      <ProgressBar
        color={COLORS.gold}
        backgroundColor="rgba(255,255,255,0.1)"
        height={6}
        position="bottom"
      />

      {/* Watermark */}
      <Watermark
        text={BRAND.handle}
        corner="bottomLeft"
        opacity={0.7}
        fontSize={24}
        color={COLORS.white}
        margin={40}
      />
    </AbsoluteFill>
  );
};

export const FHA_TOTAL_FRAMES = TOTAL_FRAMES;
