import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Loop,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import {loadFont as loadCormorant} from "@remotion/google-fonts/CormorantGaramond";
import {loadFont as loadMontserrat} from "@remotion/google-fonts/Montserrat";

const {fontFamily: SERIF} = loadCormorant("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});
loadCormorant("italic", {weights: ["300", "400"], subsets: ["latin"]});
const {fontFamily: SANS} = loadMontserrat("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

// ─── Brand ────────────────────────────────────────────────────────────
const C = {
  bg: "#0E0D0B",
  ivory: "#F4EEE3",
  gold: "#C8A97E",
  goldSoft: "rgba(200,169,126,0.55)",
  muted: "#A39A8B",
};

export const CASA_VILLA_CELESTE_COPY = {
  location: "Carolina · Puerto Rico",
  website: "casavillacelestepr.com",
  instagram: "@villacelestehouse",
  facebook: "Casa Villa Celeste",
};

const A = (f: string) => staticFile(`assets/villa/${f}`);
const GRADE = "contrast(1.06) saturate(0.82) sepia(0.10) brightness(0.96)";
const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const FADE = 16; // cross-fade frames between scenes

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: EASE});

// ─── Primitives ──────────────────────────────────────────────────────

/** Fades a scene in and out so neighbouring scenes cross-dissolve. */
const SceneFade: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, FADE, durationInFrames - FADE, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

/** Text that rises out of a mask with a soft blur. */
const Reveal: React.FC<{
  delay?: number;
  dur?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({delay = 0, dur = 28, children, style}) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, dur);
  return (
    <div style={{overflow: "hidden", ...style}}>
      <div
        style={{
          transform: `translateY(${(1 - p) * 60}%)`,
          opacity: p,
          filter: `blur(${(1 - p) * 8}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const GoldLine: React.FC<{delay?: number; width?: number; dur?: number}> = ({
  delay = 0,
  width = 220,
  dur = 30,
}) => {
  const frame = useCurrentFrame();
  const p = ease(frame, delay, dur);
  return (
    <div
      style={{
        width: width * p,
        height: 1.5,
        background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
        margin: "0 auto",
      }}
    />
  );
};

const Eyebrow: React.FC<{text: string; delay?: number; color?: string}> = ({
  text,
  delay = 0,
  color = C.gold,
}) => (
  <Reveal delay={delay}>
    <div
      style={{
        fontFamily: SANS,
        fontWeight: 400,
        fontSize: 26,
        letterSpacing: "0.5em",
        textTransform: "uppercase",
        color,
        textAlign: "center",
        paddingLeft: "0.5em",
      }}
    >
      {text}
    </div>
  </Reveal>
);

/** Image or video panel that unveils with a clip-path wipe and slow push-in. */
const MediaPanel: React.FC<{
  src: string;
  video?: boolean;
  delay?: number;
  style: React.CSSProperties;
  zoomFrom?: number;
  zoomTo?: number;
  focus?: string;
  playbackRate?: number;
}> = ({
  src,
  video,
  delay = 0,
  style,
  zoomFrom = 1.14,
  zoomTo = 1.02,
  focus = "50% 50%",
  playbackRate = 0.7,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const reveal = ease(frame, delay, 34);
  const scale = interpolate(frame, [delay, durationInFrames], [zoomFrom, zoomTo], clamp);
  const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: focus,
    transform: `scale(${scale})`,
    filter: GRADE,
  };
  return (
    <div
      style={{
        position: "absolute",
        overflow: "hidden",
        clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`,
        ...style,
      }}
    >
      {video ? (
        <Sequence from={delay} layout="none">
          <Loop durationInFrames={160}>
            <OffthreadVideo src={src} muted playbackRate={playbackRate} style={mediaStyle} />
          </Loop>
        </Sequence>
      ) : (
        <Img src={src} style={mediaStyle} />
      )}
      {/* inner hairline */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 0 1px rgba(244,238,227,0.12), inset 0 0 120px rgba(0,0,0,0.35)",
        }}
      />
    </div>
  );
};

/** Blurred, darkened full-bleed backdrop. */
const Backdrop: React.FC<{src: string; dim?: number; blur?: number}> = ({
  src,
  dim = 0.72,
  blur = 18,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.25, 1.12], clamp);
  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: `${GRADE} blur(${blur}px)`,
        }}
      />
      <AbsoluteFill style={{background: `rgba(14,13,11,${dim})`}} />
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none"}}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

const Frame: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    <div
      style={{
        position: "absolute",
        inset: 34,
        border: "1px solid rgba(200,169,126,0.28)",
      }}
    />
    <AbsoluteFill
      style={{background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)"}}
    />
  </AbsoluteFill>
);

const Title: React.FC<{text: string; delay?: number; size?: number; italic?: boolean}> = ({
  text,
  delay = 0,
  size = 104,
  italic,
}) => (
  <Reveal delay={delay} dur={34}>
    <div
      style={{
        fontFamily: SERIF,
        fontWeight: 300,
        fontStyle: italic ? "italic" : "normal",
        fontSize: size,
        lineHeight: 1.02,
        color: C.ivory,
        textAlign: "center",
        letterSpacing: "0.01em",
      }}
    >
      {text}
    </div>
  </Reveal>
);

const Body: React.FC<{text: string; delay?: number}> = ({text, delay = 0}) => (
  <Reveal delay={delay}>
    <div
      style={{
        fontFamily: SERIF,
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: 44,
        color: C.muted,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  </Reveal>
);

// ─── Scenes ──────────────────────────────────────────────────────────

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const bg = interpolate(frame, [0, 60], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{opacity: bg}}>
        <Backdrop src={A("exterior.jpg")} dim={0.78} blur={6} />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: "center", alignItems: "center", gap: 34}}>
        <Eyebrow text="Casa Villa" delay={14} />
        <Title text="Celeste" italic size={230} delay={26} />
        <GoldLine delay={46} width={300} />
        <Eyebrow text={CASA_VILLA_CELESTE_COPY.location} delay={58} color={C.muted} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const EditorialScene: React.FC<{
  src: string;
  focus?: string;
  eyebrow: string;
  title: string;
  body: string;
  mediaHeight?: number;
}> = ({src, focus, eyebrow, title, body, mediaHeight = 1300}) => (
  <AbsoluteFill style={{background: C.bg}}>
    <MediaPanel src={src} focus={focus} style={{left: 0, top: 0, width: 1080, height: mediaHeight}} />
    <AbsoluteFill
      style={{
        top: mediaHeight - 180,
        height: 180,
        background: `linear-gradient(transparent, ${C.bg})`,
      }}
    />
    <div
      style={{
        position: "absolute",
        top: mediaHeight + 70,
        left: 80,
        right: 80,
        display: "flex",
        flexDirection: "column",
        gap: 30,
      }}
    >
      <Eyebrow text={eyebrow} delay={18} />
      <Title text={title} delay={26} size={92} />
      <GoldLine delay={40} />
      <Body text={body} delay={46} />
    </div>
  </AbsoluteFill>
);

const Weddings: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <div style={{position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", gap: 26}}>
      <Eyebrow text="03 — Weddings" delay={6} />
      <Title text="Say “I do” at Celeste" delay={14} size={92} />
    </div>
    <MediaPanel src={A("wed-bride.jpg")} delay={22} focus="50% 30%" style={{left: 70, top: 470, width: 455, height: 1180}} />
    <MediaPanel src={A("wed-table.jpg")} delay={34} style={{left: 545, top: 470, width: 465, height: 520}} />
    <MediaPanel src={A("wed-arch.jpg")} delay={46} focus="40% 50%" style={{left: 545, top: 1010, width: 465, height: 640}} />
    <div style={{position: "absolute", top: 1710, left: 0, right: 0}}>
      <Body text="Ceremonies & receptions, beautifully hosted" delay={60} />
    </div>
  </AbsoluteFill>
);

const CELEBRATIONS = ["Birthdays", "Baby Showers", "Bachelorette Parties", "Holiday Gatherings", "Family Getaways"];

const Celebrations: React.FC = () => (
  <AbsoluteFill>
    <Backdrop src={A("pool-night.jpg")} dim={0.8} blur={14} />
    <AbsoluteFill style={{justifyContent: "center", alignItems: "center", gap: 30}}>
      <Eyebrow text="04 — Celebrations" delay={4} />
      <GoldLine delay={10} width={160} />
      <div style={{height: 20}} />
      {CELEBRATIONS.map((item, i) => (
        <Title key={item} text={item} italic={i % 2 === 1} size={86} delay={16 + i * 14} />
      ))}
    </AbsoluteFill>
  </AbsoluteFill>
);

const Stars: React.FC<{delay: number}> = ({delay}) => (
  <Reveal delay={delay}>
    <div style={{textAlign: "center", color: C.gold, fontSize: 34, letterSpacing: "0.4em", paddingLeft: "0.4em"}}>
      ★★★★★
    </div>
  </Reveal>
);

const Quote: React.FC<{text: string; author: string; delay: number}> = ({text, author, delay}) => (
  <div style={{display: "flex", flexDirection: "column", gap: 34, padding: "0 110px"}}>
    <Stars delay={delay} />
    <Reveal delay={delay + 8} dur={36}>
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 66,
          lineHeight: 1.22,
          color: C.ivory,
          textAlign: "center",
        }}
      >
        “{text}”
      </div>
    </Reveal>
    <Eyebrow text={author} delay={delay + 22} color={C.muted} />
  </div>
);

const Testimonials: React.FC = () => (
  <AbsoluteFill>
    <Backdrop src={A("pool-night.jpg")} dim={0.74} blur={10} />
    <Sequence durationInFrames={100}>
      <SceneFade>
        <AbsoluteFill style={{justifyContent: "center"}}>
          <Quote
            delay={6}
            text="Wow, that place was a paradise. My family and I had a great time — and the host was amazing."
            author="William · December 2022"
          />
        </AbsoluteFill>
      </SceneFade>
    </Sequence>
    <Sequence from={90}>
      <SceneFade>
        <AbsoluteFill style={{justifyContent: "center"}}>
          <Quote delay={6} text="The house was beautiful. We loved our time here." author="Virmarie · October 2022" />
        </AbsoluteFill>
      </SceneFade>
    </Sequence>
  </AbsoluteFill>
);

const Events: React.FC = () => {
  const L = 60;
  const W = 960;
  const G = 12;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <div style={{position: "absolute", top: 200, left: 0, right: 0, display: "flex", flexDirection: "column", gap: 26}}>
        <Eyebrow text="05 — Events" delay={4} />
        <Title text="Unforgettable nights" italic delay={12} size={96} />
      </div>
      <MediaPanel video src={A("ev-karaoke.mp4")} delay={18} style={{left: L, top: 490, width: 560, height: 420}} />
      <MediaPanel video src={A("ev-dance.mp4")} delay={26} focus="50% 40%" style={{left: L + 560 + G, top: 490, width: W - 560 - G, height: 420}} />
      <MediaPanel video src={A("ev-tent.mp4")} delay={34} style={{left: L, top: 490 + 420 + G, width: W, height: 340}} />
      <MediaPanel video src={A("ev-cook.mp4")} delay={42} focus="50% 40%" style={{left: L, top: 490 + 760 + 2 * G, width: 330, height: 420}} />
      <MediaPanel src={A("red-tables.jpg")} delay={50} style={{left: L + 330 + G, top: 490 + 760 + 2 * G, width: W - 330 - G, height: 420}} />
    </AbsoluteFill>
  );
};

const Details: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <MediaPanel src={A("food.jpg")} delay={0} style={{left: 0, top: 0, width: 1080, height: 820}} focus="70% 50%" />
    <MediaPanel src={A("pool-night.jpg")} delay={14} style={{left: 0, top: 832, width: 1080, height: 640}} focus="50% 60%" />
    <AbsoluteFill style={{top: 1300, background: `linear-gradient(transparent, ${C.bg} 32%)`}} />
    <div style={{position: "absolute", top: 1560, left: 0, right: 0, display: "flex", flexDirection: "column", gap: 26}}>
      <Eyebrow text="06 — Your Event" delay={24} />
      <Title text="Every detail, elevated" delay={32} size={88} />
    </div>
  </AbsoluteFill>
);

const IconRow: React.FC<{icon: React.ReactNode; text: string; delay: number}> = ({icon, text, delay}) => (
  <Reveal delay={delay}>
    <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 22}}>
      {icon}
      <span style={{fontFamily: SANS, fontWeight: 300, fontSize: 32, letterSpacing: "0.12em", color: C.ivory}}>
        {text}
      </span>
    </div>
  </Reveal>
);

const igIcon = (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.4">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="0.6" fill={C.gold} />
  </svg>
);
const fbIcon = (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.4">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M15.5 8H14a2 2 0 0 0-2 2v11M10 13h5" />
  </svg>
);

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const underline = ease(frame, 70, 40);
  return (
    <AbsoluteFill>
      <Backdrop src={A("exterior.jpg")} dim={0.86} blur={8} />
      <AbsoluteFill style={{alignItems: "center", paddingTop: 300, gap: 30}}>
        <Eyebrow text="Casa Villa" delay={6} />
        <Title text="Celeste" italic size={210} delay={14} />
        <GoldLine delay={30} width={300} />
        <Eyebrow text={CASA_VILLA_CELESTE_COPY.location} delay={36} color={C.muted} />

        <div style={{height: 90}} />
        <Eyebrow text="Reserve your date" delay={52} />
        <Reveal delay={60} dur={34}>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 76,
              color: C.ivory,
              letterSpacing: "0.02em",
              textAlign: "center",
            }}
          >
            {CASA_VILLA_CELESTE_COPY.website}
          </div>
        </Reveal>
        <div style={{width: 640 * underline, height: 1.5, background: C.gold, marginTop: -14}} />

        <div style={{height: 50}} />
        <Reveal delay={84}>
          <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
            <div style={{padding: 16, background: C.ivory, border: `1px solid ${C.gold}`}}>
              <Img src={A("qr-website.png")} style={{width: 220, height: 220, display: "block"}} />
            </div>
            <div style={{fontFamily: SANS, fontSize: 20, letterSpacing: "0.45em", color: C.muted, paddingLeft: "0.45em"}}>
              SCAN TO BOOK
            </div>
          </div>
        </Reveal>

        <div style={{height: 40}} />
        <IconRow icon={igIcon} text={CASA_VILLA_CELESTE_COPY.instagram} delay={96} />
        <IconRow icon={fbIcon} text={CASA_VILLA_CELESTE_COPY.facebook} delay={104} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Timeline (cuts follow the original edit so the music still lands) ──
type Scene = {from: number; to: number; el: React.ReactNode};

const SCENES: Scene[] = [
  {from: 0, to: 135, el: <Intro />},
  {
    from: 135,
    to: 240,
    el: (
      <EditorialScene
        src={A("exterior.jpg")}
        focus="50% 60%"
        eyebrow="01 — The Residence"
        title="A private estate"
        body="Tropical elegance in the heart of Carolina"
      />
    ),
  },
  {
    from: 240,
    to: 330,
    el: (
      <EditorialScene
        src={A("pool-night.jpg")}
        focus="55% 55%"
        eyebrow="02 — The Pool"
        title="Evenings under the palms"
        body="Lantern-lit terraces & a resort-style pool"
      />
    ),
  },
  {from: 330, to: 480, el: <Weddings />},
  {from: 480, to: 630, el: <Celebrations />},
  {from: 630, to: 825, el: <Testimonials />},
  {from: 825, to: 1020, el: <Events />},
  {from: 1020, to: 1185, el: <Details />},
  {from: 1185, to: 1410, el: <EndCard />},
];

export const CASA_VILLA_CELESTE_DURATION = 1410;

export const CasaVillaCeleste: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      {SCENES.map((s, i) => {
        const start = Math.max(0, s.from - (i === 0 ? 0 : FADE / 2));
        const end = Math.min(durationInFrames, s.to + (i === SCENES.length - 1 ? 0 : FADE / 2));
        return (
          <Sequence key={i} from={start} durationInFrames={end - start}>
            {i === SCENES.length - 1 ? (
              <EndFade>{s.el}</EndFade>
            ) : (
              <SceneFade>{s.el}</SceneFade>
            )}
          </Sequence>
        );
      })}
      <Frame />
      <Grain />
      <Audio
        src={A("music.wav")}
        volume={(f) =>
          interpolate(f, [0, 10, durationInFrames - 50, durationInFrames - 2], [0, 1, 1, 0], clamp)
        }
      />
    </AbsoluteFill>
  );
};

/** Last scene: fade in only, then a gentle fade to black at the very end. */
const EndFade: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, FADE, durationInFrames - 20, durationInFrames],
    [0, 1, 1, 0],
    clamp,
  );
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};
