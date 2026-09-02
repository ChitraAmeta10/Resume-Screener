import { use3DTilt } from "../../hooks/use3DTilt";

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  score?: string;
  scoreColor?: "strong" | "cyan" | "moderate";
  className?: string;
  style?: React.CSSProperties;
}

export default function FloatingBadge({
  icon,
  title,
  subtitle,
  score,
  scoreColor = "cyan",
  className = "",
  style = {},
}: Props) {
  const tilt = use3DTilt({ maxRotation: 12, scale: 1.05 });

  return (
    <div
      ref={tilt.ref}
      style={{ ...tilt.style, ...style }}
      {...tilt.bind}
      className={`lfloat-badge ${className}`}
    >
      <div className="cand__glare" style={tilt.glareStyle} />
      <div className="lfloat-badge__icon">{icon}</div>
      <div className="lfloat-badge__info">
        <div className="lfloat-badge__title">{title}</div>
        <div className="lfloat-badge__sub">{subtitle}</div>
      </div>
      {score && (
        <div className={`lfloat-badge__score lfloat-badge__score--${scoreColor}`}>
          {score}
        </div>
      )}
    </div>
  );
}
