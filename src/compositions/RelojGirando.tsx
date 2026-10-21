import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";

// Reloj con fondo transparente. En la duración del video, el minutero da 12
// vueltas y el horario 1 vuelta completa, así el clip hace loop perfecto.
export const RelojGirando: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, width} = useVideoConfig();

  const progress = frame / durationInFrames;
  const hourAngle = progress * 360;
  const minuteAngle = progress * 360 * 12;

  const size = width * 0.9;
  const c = 500; // centro del viewBox 1000x1000

  const ticks = Array.from({length: 60}, (_, i) => {
    const isHour = i % 5 === 0;
    return (
      <line
        key={i}
        x1={c}
        y1={isHour ? 70 : 75}
        x2={c}
        y2={isHour ? 130 : 105}
        stroke="#1a1a1a"
        strokeWidth={isHour ? 14 : 5}
        strokeLinecap="round"
        transform={`rotate(${i * 6} ${c} ${c})`}
      />
    );
  });

  const numbers = Array.from({length: 12}, (_, i) => {
    const n = i + 1;
    const a = (n * 30 * Math.PI) / 180;
    const r = 310;
    return (
      <text
        key={n}
        x={c + r * Math.sin(a)}
        y={c - r * Math.cos(a)}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={78}
        fontWeight={700}
        fontFamily="Inter, Helvetica, Arial, sans-serif"
        fill="#1a1a1a"
      >
        {n}
      </text>
    );
  });

  return (
    <AbsoluteFill style={{justifyContent: "center", alignItems: "center"}}>
      <svg width={size} height={size} viewBox="0 0 1000 1000">
        {/* Aro exterior y esfera */}
        <circle cx={c} cy={c} r={480} fill="#1a1a1a" />
        <circle cx={c} cy={c} r={448} fill="#ffffff" />
        {ticks}
        {numbers}

        {/* Horario */}
        <line
          x1={c}
          y1={c + 40}
          x2={c}
          y2={c - 220}
          stroke="#1a1a1a"
          strokeWidth={26}
          strokeLinecap="round"
          transform={`rotate(${hourAngle} ${c} ${c})`}
        />
        {/* Minutero */}
        <line
          x1={c}
          y1={c + 50}
          x2={c}
          y2={c - 340}
          stroke="#1a1a1a"
          strokeWidth={16}
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} ${c} ${c})`}
        />
        {/* Centro */}
        <circle cx={c} cy={c} r={26} fill="#e53935" />
        <circle cx={c} cy={c} r={10} fill="#1a1a1a" />
      </svg>
    </AbsoluteFill>
  );
};
