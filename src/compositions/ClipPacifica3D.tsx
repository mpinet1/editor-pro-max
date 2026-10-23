import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// ─── Config ──────────────────────────────────────────────────────────────────
/** Set to false to drop the pool scene (the clip becomes 3s shorter). */
export const SHOW_POOL = true;

const BG = "#FAF8F3";
const HORIZON = "#F2E4D3";
const INK = "#1A1A1A";
const GOLD = "#C9A24D";
const MUTED = "#6B665C";
const SERIF = "Georgia, Gelasio, 'Times New Roman', serif";
const SANS = "Montserrat, 'Helvetica Neue', Arial, sans-serif";
const SAFE_TOP = 250;
const SAFE_BOTTOM = 380;

// ─── Timeline (frames @ 30fps) ───────────────────────────────────────────────
type SceneKey = "lot" | "l1" | "l2" | "garage" | "deck" | "pool" | "orbit";

const SCENE_LIST: {
  key: SceneKey;
  dur: number;
  eyebrow: string;
  title: React.ReactNode;
}[] = [
  {
    key: "lot",
    dur: 120,
    eyebrow: "Solar disponible",
    title: "Imagina tu hogar aquí",
  },
  { key: "l1", dur: 120, eyebrow: "Vivienda", title: "Casa de 1 nivel…" },
  {
    key: "l2",
    dur: 90,
    eyebrow: "Vivienda",
    title: (
      <>
        …o de 2 niveles
        <br />
        <span style={{ fontSize: 54, color: MUTED }}>mínimo 2,225 p²</span>
      </>
    ),
  },
  {
    key: "garage",
    dur: 90,
    eyebrow: "Estacionamiento",
    title: (
      <>
        Garaje y carport
        <br />
        para hasta 3 autos
      </>
    ),
  },
  { key: "deck", dur: 120, eyebrow: "Exterior", title: "Terraza de madera" },
  ...(SHOW_POOL
    ? [
        {
          key: "pool" as const,
          dur: 90,
          eyebrow: "Exterior",
          title: "y tu piscina",
        },
      ]
    : []),
  {
    key: "orbit",
    dur: 90,
    eyebrow: "MP Real Estate",
    title: "Diseñada a tu medida",
  },
];

const S = {} as Record<SceneKey, number>;
{
  let t = 0;
  for (const s of SCENE_LIST) {
    S[s.key] = t;
    t += s.dur;
  }
}
export const CLIP_3D_DURATION = SCENE_LIST.reduce((a, s) => a + s.dur, 0);

// ─── Helpers ─────────────────────────────────────────────────────────────────
type V3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

const progress = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: ease,
  });

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
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all(
      FONT_FACES.map(([family, file, desc]) =>
        new FontFace(family, `url(${staticFile(file)})`, desc).load(),
      ),
    )
      .then((faces) => faces.forEach((f) => document.fonts.add(f)))
      .catch((err) => console.error(err))
      .finally(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready;
};

/** Loads a texture before the 3D canvas mounts; returns null until ready. */
const useTexture = (file: string) => {
  const [handle] = useState(() => delayRender(`Loading ${file}`));
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    new THREE.TextureLoader().load(
      staticFile(file),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        setTexture(tex);
        continueRender(handle);
      },
      undefined,
      (err) => {
        console.error(err);
        continueRender(handle);
      },
    );
  }, [file, handle]);
  return texture;
};

// ─── Build-up system: gold wireframe → solid, rising from the ground ─────────
type BuildState = { wire: number; solid: number };
const BuildCtx = createContext<BuildState>({ wire: 0, solid: 1 });

const Build: React.FC<{
  t0: number;
  rise?: number;
  children: React.ReactNode;
}> = ({ t0, rise = 0.8, children }) => {
  const frame = useCurrentFrame();
  if (frame < t0) return null;
  const wire = interpolate(
    frame,
    [t0, t0 + 8, t0 + 24, t0 + 38],
    [0, 1, 1, 0],
    clamp,
  );
  const solid = interpolate(frame, [t0 + 10, t0 + 32], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const y = interpolate(frame, [t0, t0 + 32], [-rise, 0], {
    ...clamp,
    easing: ease,
  });
  return (
    <BuildCtx.Provider value={{ wire, solid }}>
      <group position={[0, y, 0]}>{children}</group>
    </BuildCtx.Provider>
  );
};

type MatKey =
  | "white"
  | "glass"
  | "gold"
  | "wood"
  | "woodDark"
  | "stone"
  | "dark"
  | "fabric"
  | "car";

const Mat: React.FC<{ kind: MatKey; color?: string; opacity: number }> = ({
  kind,
  color,
  opacity,
}) => {
  const transparent = opacity < 1 || kind === "glass";
  switch (kind) {
    case "glass":
      return (
        <meshStandardMaterial
          color="#A9C2CC"
          metalness={0.9}
          roughness={0.06}
          envMapIntensity={1.6}
          transparent
          depthWrite={false}
          opacity={0.55 * opacity}
        />
      );
    case "gold":
      return (
        <meshStandardMaterial
          color={GOLD}
          metalness={0.85}
          roughness={0.28}
          transparent={transparent}
          opacity={opacity}
        />
      );
    case "car":
      return (
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.22}
          envMapIntensity={1.3}
          transparent={transparent}
          opacity={opacity}
        />
      );
    default: {
      const base: Record<string, [string, number]> = {
        white: ["#F5F3EF", 0.85],
        wood: ["#A9744A", 0.7],
        woodDark: ["#7E5435", 0.75],
        stone: ["#E4DED3", 0.9],
        dark: ["#232527", 0.5],
        fabric: ["#EFEAE0", 1],
      };
      const [c, r] = base[kind];
      return (
        <meshStandardMaterial
          color={color ?? c}
          roughness={r}
          transparent={transparent}
          opacity={opacity}
        />
      );
    }
  }
};

const Box: React.FC<{
  size: V3;
  pos: V3;
  kind?: MatKey;
  color?: string;
  rot?: V3;
  cyl?: boolean;
  shadow?: boolean;
}> = ({
  size,
  pos,
  kind = "white",
  color,
  rot = [0, 0, 0],
  cyl = false,
  shadow = true,
}) => {
  const { wire, solid } = useContext(BuildCtx);
  const geometry = useMemo(
    () =>
      cyl
        ? new THREE.CylinderGeometry(size[0], size[0], size[1], 24)
        : new THREE.BoxGeometry(size[0], size[1], size[2]),
    [cyl, size[0], size[1], size[2]],
  );
  const edges = useMemo(
    () => new THREE.EdgesGeometry(geometry, 30),
    [geometry],
  );
  return (
    <group position={pos} rotation={rot}>
      {solid > 0 && (
        <mesh
          geometry={geometry}
          castShadow={shadow && kind !== "glass" && solid > 0.6}
          receiveShadow
        >
          <Mat kind={kind} color={color} opacity={solid} />
        </mesh>
      )}
      {wire > 0 && (
        <>
          <lineSegments geometry={edges}>
            <lineBasicMaterial color={GOLD} transparent opacity={wire} />
          </lineSegments>
          <mesh geometry={geometry}>
            <meshBasicMaterial
              color={GOLD}
              transparent
              opacity={wire * 0.14}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
};

// Static (always-visible) context mesh
const Static: React.FC<{
  size: V3;
  pos: V3;
  color: string;
  rough?: number;
}> = ({ size, pos, color, rough = 0.9 }) => (
  <mesh position={pos} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={rough} />
  </mesh>
);

// ─── Environment & lights ────────────────────────────────────────────────────
const Environment: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    scene.fog = new THREE.Fog(HORIZON, 70, 190);
    pmrem.dispose();
  }, [gl, scene]);
  return null;
};

const Lights: React.FC = () => (
  <>
    <hemisphereLight args={["#FFF3E2", "#B9C79F", 0.6]} />
    <directionalLight
      position={[38, 24, 30]}
      color="#FFC58A"
      intensity={3.3}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-40}
      shadow-camera-right={40}
      shadow-camera-top={40}
      shadow-camera-bottom={-40}
      shadow-camera-near={1}
      shadow-camera-far={140}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
      shadow-radius={4}
    />
    <directionalLight
      position={[-30, 18, -20]}
      color="#FFE7CF"
      intensity={0.45}
    />
  </>
);

// ─── Drone camera ────────────────────────────────────────────────────────────
const CAMERA_KEYS: { t: number; pos: V3; target: V3 }[] = [
  { t: S.lot, pos: [8, 80, 78], target: [0, 0, 0] },
  { t: S.lot + 112, pos: [24, 44, 56], target: [0, 0, 0] },
  { t: S.l1 + 105, pos: [27, 17, 32], target: [-3, 2, 1] },
  { t: S.l2 + 80, pos: [20, 16, 34], target: [-3, 4, 1] },
  { t: S.garage + 78, pos: [11, 9.5, 34], target: [4, 1.8, 4] },
  { t: S.deck + 26, pos: [2, 36, 12], target: [-4, 0, -6] },
  { t: S.deck + 112, pos: [-18, 10, -30], target: [-3, 1, -6] },
  ...(SHOW_POOL
    ? [{ t: S.pool + 84, pos: [14, 10, -30] as V3, target: [2, 0, -7] as V3 }]
    : []),
];
const ORBIT_CENTER = new THREE.Vector3(-1, 0, 0);

const DroneCamera: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const posCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        CAMERA_KEYS.map((k) => new THREE.Vector3(...k.pos)),
        false,
        "centripetal",
      ),
    [],
  );
  const tgtCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        CAMERA_KEYS.map((k) => new THREE.Vector3(...k.target)),
        false,
        "centripetal",
      ),
    [],
  );
  const times = CAMERA_KEYS.map((k) => k.t);
  const us = CAMERA_KEYS.map((_, i) => i / (CAMERA_KEYS.length - 1));
  const last = CAMERA_KEYS[CAMERA_KEYS.length - 1];

  let pos: THREE.Vector3;
  let target: THREE.Vector3;
  if (frame <= last.t) {
    // Ease the very start so the drone glides in, then move continuously along the spline
    const eased = interpolate(frame, [0, 60], [0, 60], {
      ...clamp,
      easing: Easing.in(Easing.quad),
    });
    const f = frame < 60 ? (eased + frame) / 2 : frame;
    const u = interpolate(f, times, us, clamp);
    pos = posCurve.getPoint(u);
    target = tgtCurve.getPoint(u);
  } else {
    // Final slow orbit around the finished house
    const start = new THREE.Vector3(...last.pos).sub(ORBIT_CENTER);
    const radius = Math.hypot(start.x, start.z);
    const angle0 = Math.atan2(start.x, start.z);
    const p = interpolate(frame, [last.t, CLIP_3D_DURATION + 20], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.sin),
    });
    const angle = angle0 - p * 1.05;
    pos = new THREE.Vector3(
      ORBIT_CENTER.x + Math.sin(angle) * radius * (1 + p * 0.08),
      start.y + p * 3,
      ORBIT_CENTER.z + Math.cos(angle) * radius * (1 + p * 0.08),
    );
    target = new THREE.Vector3(...last.target).lerp(
      new THREE.Vector3(-3, 2.5, 0),
      easeInOut(p),
    );
  }
  camera.position.copy(pos);
  camera.lookAt(target);
  // Shift the subject into the upper part of the frame, clear of the text panel
  const cam = camera as THREE.PerspectiveCamera;
  cam.setViewOffset(1080, 1920 + 520, 0, 520, 1080, 1920);
  cam.updateProjectionMatrix();
  return null;
};

// ─── Site: ground, lot, street, neighbours ───────────────────────────────────
const LOT_W = 22;
const LOT_D = 30;
const SETBACK = 3.05; // 10 ft

const makeLabelTexture = (text: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(250,248,243,0.92)";
  const w = 700;
  ctx.beginPath();
  ctx.roundRect((1024 - w) / 2, 20, w, 120, 60);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = "600 64px Montserrat";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 512, 82);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

const Site: React.FC<{ lotTex: THREE.Texture }> = ({ lotTex }) => {
  const frame = useCurrentFrame();
  const label = useMemo(() => makeLabelTexture("Retiro 10 pies"), []);

  // Gold lot outline draws around the perimeter
  const outlineP = interpolate(frame, [24, 78], [0, 4], {
    ...clamp,
    easing: easeInOut,
  });
  const corners: [number, number][] = [
    [-LOT_W / 2, LOT_D / 2],
    [LOT_W / 2, LOT_D / 2],
    [LOT_W / 2, -LOT_D / 2],
    [-LOT_W / 2, -LOT_D / 2],
  ];
  const fadeGuides = interpolate(frame, [S.l1 + 20, S.l1 + 60], [1, 0], clamp);
  const outlineOpacity = interpolate(
    frame,
    [S.l1 + 20, S.l1 + 60],
    [1, 0.45],
    clamp,
  );

  const dashes: React.ReactNode[] = [];
  const DASH = 0.9;
  const GAP = 0.6;
  const n = Math.floor(LOT_W / (DASH + GAP));
  for (const z of [LOT_D / 2 - SETBACK, -LOT_D / 2 + SETBACK]) {
    for (let i = 0; i < n; i++) {
      const appear = progress(frame, 70 + i * 1.6, 8);
      if (appear <= 0) continue;
      const x = -LOT_W / 2 + (DASH + GAP) * i + DASH / 2 + GAP / 2;
      dashes.push(
        <mesh key={`${z}-${i}`} position={[x, 0.05, z]} scale={[appear, 1, 1]}>
          <boxGeometry args={[DASH, 0.04, 0.12]} />
          <meshStandardMaterial
            color={GOLD}
            metalness={0.6}
            roughness={0.35}
            transparent
            opacity={fadeGuides}
          />
        </mesh>,
      );
    }
  }
  const labelOpacity = progress(frame, 92, 18) * fadeGuides;

  return (
    <group>
      {/* Lawn */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, -0.02, 0]}
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#A8BE8C" roughness={1} />
      </mesh>
      {/* The lot, textured with the real drone photo */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0.005, 0]}
      >
        <planeGeometry args={[LOT_W, LOT_D]} />
        <meshStandardMaterial map={lotTex} roughness={1} />
      </mesh>
      {/* Sidewalk & street */}
      <Static
        size={[160, 0.1, 2.4]}
        pos={[0, 0.03, LOT_D / 2 + 1.3]}
        color="#ECE8E0"
      />
      <Static
        size={[160, 0.04, 10]}
        pos={[0, 0.0, LOT_D / 2 + 7.6]}
        color="#CFCBC3"
      />
      <Static
        size={[160, 0.1, 2.4]}
        pos={[0, 0.03, LOT_D / 2 + 13.9]}
        color="#ECE8E0"
      />
      {/* Neighbouring houses as white architectural-model massing */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (LOT_W + 1.5), 0, 0]}>
          <Static
            size={[13, 3.4, 13]}
            pos={[side * -1, 1.7, 2]}
            color="#F1EEE8"
          />
          <Static size={[10, 3, 9]} pos={[side * -2, 4.9, 1]} color="#F1EEE8" />
          <Static
            size={[6, 0.1, 7]}
            pos={[side * 3, 0.03, 11.5]}
            color="#E4DED3"
          />
        </group>
      ))}
      {[-48, -24, 0, 24, 48].map((x) => (
        <group key={x} position={[x, 0, LOT_D / 2 + 22]}>
          <Static size={[12, 3.4, 11]} pos={[0, 1.7, 0]} color="#F1EEE8" />
          <Static size={[9, 3, 8]} pos={[1, 4.9, 0.5]} color="#F1EEE8" />
        </group>
      ))}
      {[-24, 24].map((x) => (
        <Static
          key={x}
          size={[12, 6.4, 11]}
          pos={[x, 3.2, -26]}
          color="#F1EEE8"
        />
      ))}
      <Static size={[12, 6.4, 11]} pos={[0, 3.2, -28]} color="#F1EEE8" />
      {/* Stylised maquette trees */}
      {(
        [
          [-12.5, -9, 1.6],
          [12.6, -11, 1.9],
          [-13, 12.5, 1.4],
          [13, 13.5, 1.5],
          [-36, 6, 2.2],
          [35, -4, 2.4],
        ] as V3[]
      ).map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 2.4, 10]} />
            <meshStandardMaterial color="#8A6A4C" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.4 + r * 0.8, 0]} castShadow>
            <sphereGeometry args={[r, 24, 18]} />
            <meshStandardMaterial color="#9DB485" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Gold lot outline */}
      {corners.map((c, i) => {
        const next = corners[(i + 1) % 4];
        const f = Math.min(Math.max(outlineP - i, 0), 1);
        if (f <= 0) return null;
        const dx = next[0] - c[0];
        const dz = next[1] - c[1];
        const len = Math.hypot(dx, dz);
        return (
          <mesh
            key={i}
            position={[c[0] + (dx * f) / 2, 0.07, c[1] + (dz * f) / 2]}
            rotation={[0, -Math.atan2(dz, dx), 0]}
          >
            <boxGeometry args={[len * f + 0.2, 0.08, 0.2]} />
            <meshStandardMaterial
              color={GOLD}
              metalness={0.8}
              roughness={0.3}
              emissive={GOLD}
              emissiveIntensity={0.25}
              transparent
              opacity={outlineOpacity}
            />
          </mesh>
        );
      })}
      {corners.map((c, i) => {
        const s = progress(frame, 24 + i * 13, 10);
        return s > 0 ? (
          <mesh key={`c${i}`} position={[c[0], 0.25 * s, c[1]]} scale={s}>
            <cylinderGeometry args={[0.22, 0.22, 0.5, 20]} />
            <meshStandardMaterial
              color={GOLD}
              metalness={0.85}
              roughness={0.25}
              transparent
              opacity={outlineOpacity}
            />
          </mesh>
        ) : null;
      })}
      {dashes}
      {labelOpacity > 0 &&
        [LOT_D / 2 - SETBACK / 2, -LOT_D / 2 + SETBACK / 2].map((z) => (
          <mesh key={z} position={[0, 0.09, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[9, 1.4]} />
            <meshBasicMaterial
              map={label}
              transparent
              opacity={labelOpacity}
              depthWrite={false}
            />
          </mesh>
        ))}
    </group>
  );
};

// ─── House ───────────────────────────────────────────────────────────────────
const Level1: React.FC = () => {
  const t = S.l1;
  return (
    <>
      <Build t0={t + 4}>
        <Box size={[11, 3.2, 12]} pos={[-4, 1.6, 1.5]} />
        <Box size={[11.6, 0.18, 12.6]} pos={[-4, 0.09, 1.5]} kind="stone" />
      </Build>
      <Build t0={t + 22} rise={0.3}>
        <Box size={[4.2, 2.5, 0.1]} pos={[-7, 1.45, 7.55]} kind="glass" />
        <Box size={[3.6, 2.5, 0.1]} pos={[-2.6, 1.45, 7.55]} kind="glass" />
        <Box size={[8.2, 2.6, 0.1]} pos={[-4.4, 1.5, -4.55]} kind="glass" />
      </Build>
      <Build t0={t + 30} rise={0.3}>
        <Box size={[1.5, 3.2, 0.3]} pos={[0.55, 1.6, 7.6]} kind="wood" />
        <Box size={[1.0, 2.5, 0.06]} pos={[0.55, 1.3, 7.78]} kind="woodDark" />
        {/* thin gold mullions */}
        <Box size={[0.07, 2.5, 0.07]} pos={[-7, 1.45, 7.62]} kind="gold" />
        <Box size={[0.07, 2.5, 0.07]} pos={[-2.6, 1.45, 7.62]} kind="gold" />
      </Build>
      <Build t0={t + 46} rise={0.5}>
        <Box size={[11.8, 0.32, 12.8]} pos={[-4, 3.36, 1.5]} />
        <Box
          size={[11.9, 0.07, 12.9]}
          pos={[-4, 3.2, 1.5]}
          kind="gold"
          shadow={false}
        />
      </Build>
    </>
  );
};

const Level2: React.FC = () => {
  const t = S.l2;
  return (
    <>
      <Build t0={t + 2}>
        <Box size={[8.5, 3, 8.5]} pos={[-4.75, 5.02, 0.25]} />
      </Build>
      <Build t0={t + 16} rise={0.3}>
        <Box size={[6.4, 2.3, 0.1]} pos={[-5.1, 4.95, 4.55]} kind="glass" />
        <Box size={[6.4, 2.3, 0.1]} pos={[-4.75, 4.95, -4.05]} kind="glass" />
        <Box size={[0.14, 3, 0.14]} pos={[-1.35, 5.02, 4.6]} kind="gold" />
        <Box size={[1.6, 3, 0.25]} pos={[-0.95 + 0.6, 5.02, 4.5]} kind="wood" />
      </Build>
      <Build t0={t + 30} rise={0.5}>
        <Box size={[9.4, 0.3, 9.4]} pos={[-4.75, 6.67, 0.25]} />
        <Box
          size={[9.5, 0.07, 9.5]}
          pos={[-4.75, 6.5, 0.25]}
          kind="gold"
          shadow={false}
        />
      </Build>
      {/* Glass balcony on the level-1 roof */}
      <Build t0={t + 44} rise={0.3}>
        <Box size={[11.4, 1.05, 0.06]} pos={[-4, 4.05, 7.75]} kind="glass" />
        <Box size={[0.06, 1.05, 3.1]} pos={[1.75, 4.05, 6.2]} kind="glass" />
        <Box size={[0.06, 1.05, 3.1]} pos={[-9.75, 4.05, 6.2]} kind="glass" />
        <Box size={[11.45, 0.06, 0.1]} pos={[-4, 4.6, 7.75]} kind="gold" />
        <Box size={[0.1, 0.06, 3.1]} pos={[1.75, 4.6, 6.2]} kind="gold" />
        <Box size={[0.1, 0.06, 3.1]} pos={[-9.75, 4.6, 6.2]} kind="gold" />
      </Build>
    </>
  );
};

const Car: React.FC<{ t0: number; x: number; z: number; color: string }> = ({
  t0,
  x,
  z,
  color,
}) => (
  <Build t0={t0} rise={0.4}>
    <group position={[x, 0, z]}>
      <Box
        size={[1.9, 0.62, 4.5]}
        pos={[0, 0.62, 0]}
        kind="car"
        color={color}
      />
      <Box
        size={[1.62, 0.5, 2.3]}
        pos={[0, 1.17, -0.25]}
        kind="car"
        color="#1E272D"
      />
      <Box
        size={[1.66, 0.05, 2.36]}
        pos={[0, 1.44, -0.25]}
        kind="car"
        color={color}
      />
      <Box
        size={[0.42, 0.07, 0.04]}
        pos={[-0.62, 0.78, 2.26]}
        kind="fabric"
        shadow={false}
      />
      <Box
        size={[0.42, 0.07, 0.04]}
        pos={[0.62, 0.78, 2.26]}
        kind="fabric"
        shadow={false}
      />
      {(
        [
          [-0.93, 1.45],
          [0.93, 1.45],
          [-0.93, -1.45],
          [0.93, -1.45],
        ] as [number, number][]
      ).map(([wx, wz], i) => (
        <Box
          key={i}
          cyl
          size={[0.36, 0.26, 0]}
          pos={[wx, 0.36, wz]}
          rot={[0, 0, Math.PI / 2]}
          kind="dark"
        />
      ))}
    </group>
  </Build>
);

const Garage: React.FC = () => {
  const t = S.garage;
  return (
    <>
      <Build t0={t + 2} rise={0.1}>
        <Box size={[8.8, 0.05, 7]} pos={[6.2, 0.03, 11.5]} kind="stone" />
      </Build>
      <Build t0={t + 6}>
        <Box size={[3.7, 3.1, 0.25]} pos={[3.6, 1.55, 0.12]} />
        <Box size={[0.25, 3.1, 8]} pos={[5.4, 1.55, 4]} />
        <Box size={[3.9, 0.28, 8.3]} pos={[3.6, 3.16, 4.1]} />
        <Box
          size={[3.95, 0.06, 8.35]}
          pos={[3.6, 3.0, 4.1]}
          kind="gold"
          shadow={false}
        />
      </Build>
      <Build t0={t + 18} rise={0.6}>
        {[0.4, 7.8].map((z) => (
          <Box
            key={z}
            cyl
            size={[0.09, 2.95, 0]}
            pos={[10.4, 1.47, z]}
            kind="gold"
          />
        ))}
        <Box size={[5.4, 0.22, 8.3]} pos={[8.0, 3.05, 4.1]} kind="white" />
        <Box
          size={[5.3, 0.05, 8.2]}
          pos={[8.0, 2.92, 4.1]}
          kind="wood"
          shadow={false}
        />
      </Build>
      <Car t0={t + 34} x={3.6} z={4.4} color="#EDEBE6" />
      <Car t0={t + 44} x={6.85} z={4.4} color="#17181A" />
      <Car t0={t + 54} x={9.2} z={4.4} color="#B7A07A" />
    </>
  );
};

const Bulb: React.FC<{ pos: V3; glow: number }> = ({ pos, glow }) => (
  <mesh position={pos}>
    <sphereGeometry args={[0.09, 12, 10]} />
    <meshStandardMaterial
      color="#FFE2B0"
      emissive="#FFC977"
      emissiveIntensity={2.5 * glow}
    />
  </mesh>
);

const Terrace: React.FC = () => {
  const t = S.deck;
  const frame = useCurrentFrame();
  const glow = progress(frame, t + 78, 24);
  const x0 = -9.5;
  const x1 = -0.5;
  const z0 = -10.2;
  const z1 = -4.6;
  const planks = [];
  for (let x = x0 + 0.3; x < x1; x += 0.45) {
    planks.push(
      <Box
        key={x}
        size={[0.03, 0.012, z1 - z0]}
        pos={[x, 0.307, (z0 + z1) / 2]}
        kind="woodDark"
        shadow={false}
      />,
    );
  }
  const posts: [number, number][] = [
    [-9.1, -9.8],
    [-4.3, -9.8],
    [-9.1, -5.2],
    [-4.3, -5.2],
  ];
  const slats = [];
  for (let x = -9.0; x <= -4.3; x += 0.42) {
    slats.push(
      <Box key={x} size={[0.1, 0.14, 4.9]} pos={[x, 3.12, -7.5]} kind="wood" />,
    );
  }
  return (
    <>
      <Build t0={t + 6} rise={0.3}>
        <Box
          size={[x1 - x0, 0.3, z1 - z0]}
          pos={[(x0 + x1) / 2, 0.15, (z0 + z1) / 2]}
          kind="wood"
        />
        {planks}
        <Box
          size={[x1 - x0 + 0.04, 0.05, 0.05]}
          pos={[(x0 + x1) / 2, 0.31, z0]}
          kind="gold"
          shadow={false}
        />
      </Build>
      <Build t0={t + 28}>
        {posts.map(([x, z]) => (
          <Box
            key={`${x}${z}`}
            size={[0.2, 2.9, 0.2]}
            pos={[x, 1.75, z]}
            kind="woodDark"
          />
        ))}
      </Build>
      <Build t0={t + 38} rise={0.5}>
        <Box size={[5.2, 0.22, 0.22]} pos={[-6.7, 3.0, -9.8]} kind="woodDark" />
        <Box size={[5.2, 0.22, 0.22]} pos={[-6.7, 3.0, -5.2]} kind="woodDark" />
        {slats}
      </Build>
      {/* Outdoor furniture */}
      <Build t0={t + 54} rise={0.3}>
        <Box size={[2.0, 0.07, 1.0]} pos={[-6.7, 1.05, -7.5]} kind="wood" />
        <Box size={[0.1, 0.72, 0.1]} pos={[-6.7, 0.66, -7.5]} kind="gold" />
        {[-7.4, -6.0].flatMap((x) =>
          [-8.4, -6.6].map((z) => (
            <Box
              key={`${x}${z}`}
              size={[0.55, 0.5, 0.55]}
              pos={[x, 0.55, z]}
              kind="fabric"
            />
          )),
        )}
      </Build>
      <Build t0={t + 64} rise={0.3}>
        <Box size={[0.75, 0.32, 2.0]} pos={[-2.6, 0.46, -7.6]} kind="fabric" />
        <Box size={[0.75, 0.32, 2.0]} pos={[-1.5, 0.46, -7.6]} kind="fabric" />
        <Box
          size={[0.75, 0.5, 0.15]}
          pos={[-2.6, 0.75, -8.5]}
          rot={[-0.5, 0, 0]}
          kind="fabric"
        />
        <Box
          size={[0.75, 0.5, 0.15]}
          pos={[-1.5, 0.75, -8.5]}
          rot={[-0.5, 0, 0]}
          kind="fabric"
        />
        <Box
          size={[2.4, 0.4, 0.9]}
          pos={[-6.7, 0.5, -4.95 - 0.1]}
          kind="stone"
        />
        <Box size={[2.3, 0.18, 0.75]} pos={[-6.7, 0.79, -5.05]} kind="fabric" />
      </Build>
      {/* Warm string lights on the pergola */}
      {glow > 0 && (
        <>
          {Array.from({ length: 11 }).map((_, i) => (
            <Bulb
              key={`a${i}`}
              pos={[
                -9.1 + i * 0.48,
                2.82 - Math.sin((i / 10) * Math.PI) * 0.25,
                -9.8,
              ]}
              glow={glow}
            />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <Bulb
              key={`b${i}`}
              pos={[
                -9.1 + i * 0.48,
                2.82 - Math.sin((i / 10) * Math.PI) * 0.25,
                -5.2,
              ]}
              glow={glow}
            />
          ))}
          <pointLight
            position={[-6.7, 2.4, -7.5]}
            color="#FFC27A"
            intensity={14 * glow}
            distance={9}
            decay={1.6}
          />
        </>
      )}
    </>
  );
};

const makeWaterTexture = () => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, "#3CC6CC");
  g.addColorStop(1, "#22AEBB");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = 3;
  for (let row = 0; row < 14; row++) {
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y =
        row * 37 +
        Math.sin((x / 512) * Math.PI * 4 + row) * 9 +
        Math.sin((x / 512) * Math.PI * 10) * 3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1.3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const Pool: React.FC = () => {
  const t = S.pool;
  const frame = useCurrentFrame();
  const water = useMemo(() => makeWaterTexture(), []);
  const fill = progress(frame, t + 30, 46);
  water.offset.set(frame * 0.0025, frame * 0.0016);
  const x0 = 0.8;
  const x1 = 9.2;
  const z0 = -11.2;
  const z1 = -5.6;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const w = x1 - x0;
  const d = z1 - z0;
  return (
    <>
      <Build t0={t + 2} rise={0.1}>
        <Box
          size={[w + 2.4, 0.06, d + 2.0]}
          pos={[cx, 0.03, cz]}
          kind="stone"
        />
      </Build>
      <Build t0={t + 10} rise={0.3}>
        <Box
          size={[w + 0.8, 0.16, 0.4]}
          pos={[cx, 0.14, z0 - 0.2]}
          kind="white"
        />
        <Box
          size={[w + 0.8, 0.16, 0.4]}
          pos={[cx, 0.14, z1 + 0.2]}
          kind="white"
        />
        <Box size={[0.4, 0.16, d]} pos={[x0 - 0.2, 0.14, cz]} kind="white" />
        <Box size={[0.4, 0.16, d]} pos={[x1 + 0.2, 0.14, cz]} kind="white" />
        <Box
          size={[w + 0.84, 0.04, 0.44]}
          pos={[cx, 0.06, z1 + 0.2]}
          kind="gold"
          shadow={false}
        />
      </Build>
      <Build t0={t + 18} rise={0.05}>
        <Box
          size={[w, 0.02, d]}
          pos={[cx, 0.07, cz]}
          color="#BFE4E6"
          kind="stone"
        />
      </Build>
      {fill > 0 && (
        <mesh
          position={[x0 + (w * fill) / 2, 0.11 + fill * 0.03, cz]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[w * fill, d]} />
          <meshStandardMaterial
            map={water}
            roughness={0.04}
            metalness={0.25}
            envMapIntensity={1.4}
            transparent
            opacity={0.55 + 0.4 * fill}
            emissive="#1DA9B3"
            emissiveIntensity={0.18}
          />
        </mesh>
      )}
    </>
  );
};

// ─── HTML overlay ────────────────────────────────────────────────────────────
const fadeUp = (
  frame: number,
  delay: number,
  distance = 34,
  duration = 20,
): React.CSSProperties => {
  const p = progress(frame, delay, duration);
  return { opacity: p, transform: `translateY(${(1 - p) * distance}px)` };
};

const Caption: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  dur: number;
  last: boolean;
}> = ({ eyebrow, title, dur, last }) => {
  const frame = useCurrentFrame();
  const out = last ? 1 : interpolate(frame, [dur - 10, dur], [1, 0], clamp);
  const line = progress(frame, 18, 26);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        textAlign: "center",
        padding: `0 80px ${SAFE_BOTTOM + 30}px`,
        opacity: out,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 9,
          color: GOLD,
          textTransform: "uppercase",
          ...fadeUp(frame, 4, 18),
        }}
      >
        {eyebrow}
      </div>
      <div style={{ height: 24 }} />
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 68,
          lineHeight: 1.15,
          color: INK,
          maxWidth: 920,
          ...fadeUp(frame, 8),
        }}
      >
        {title}
      </div>
      <div style={{ height: 30 }} />
      <div
        style={{
          width: 200,
          height: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 200 * line, height: 2, background: GOLD }} />
      </div>
    </AbsoluteFill>
  );
};

// ─── Main composition ────────────────────────────────────────────────────────
export const ClipPacifica3D: React.FC = () => {
  const { width, height } = useVideoConfig();
  const fontsReady = useBrandFonts();
  const lotTex = useTexture("terreno-lot.jpg");
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${BG} 0%, ${BG} 30%, ${HORIZON} 62%)`,
      }}
    >
      {fontsReady && lotTex && (
        <ThreeCanvas
          width={width}
          height={height}
          shadows="soft"
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          camera={{ fov: 58, near: 0.5, far: 400, position: [8, 80, 78] }}
        >
          <Environment />
          <Lights />
          <DroneCamera />
          <Site lotTex={lotTex} />
          <Level1 />
          <Level2 />
          <Garage />
          <Terrace />
          {SHOW_POOL && <Pool />}
        </ThreeCanvas>
      )}
      {/* Warm-white panel behind the captions */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(250,248,243,0) 52%, rgba(250,248,243,0.9) 70%, rgba(250,248,243,0.94) 100%)",
        }}
      />
      {/* Soft top fade so the sky blends into the brand background */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(250,248,243,0.85) 0%, rgba(250,248,243,0) 14%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: SAFE_TOP + 20,
          right: 48,
          padding: "8px 18px",
          borderRadius: 40,
          background: "rgba(250,248,243,0.8)",
          fontFamily: SANS,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: 1.5,
          color: INK,
          opacity: progress(frame, 10, 16),
        }}
      >
        Ilustración conceptual
      </div>
      {SCENE_LIST.map((s, i) => (
        <Sequence
          key={s.key}
          from={S[s.key]}
          durationInFrames={s.dur}
          name={s.key}
        >
          <Caption
            eyebrow={s.eyebrow}
            title={s.title}
            dur={s.dur}
            last={i === SCENE_LIST.length - 1}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
