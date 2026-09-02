import { use3DTilt } from "../../hooks/use3DTilt";
import { IconSparkle } from "../../icons";

interface Props {
  name: string;
  role: string;
  score: string;
  skills: string[];
  style?: React.CSSProperties;
  className?: string;
}

export default function HolographicDoc({
  name,
  role,
  score,
  skills,
  style = {},
  className = "",
}: Props) {
  const tilt = use3DTilt({ maxRotation: 14, scale: 1.04 });

  return (
    <div
      ref={tilt.ref}
      style={{ ...tilt.style, ...style }}
      {...tilt.bind}
      className={`lholo-doc ${className}`}
    >
      <div className="cand__glare" style={tilt.glareStyle} />
      <div className="lholo-doc__scan-beam" />
      
      <div className="lholo-doc__header">
        <div className="lholo-doc__file-tag">
          <span className="dot" /> PDF Resume
        </div>
        <div className="lholo-doc__score">{score}</div>
      </div>

      <div className="lholo-doc__candidate">
        <div className="lholo-doc__avatar">{name.slice(0, 2).toUpperCase()}</div>
        <div>
          <div className="lholo-doc__name">{name}</div>
          <div className="lholo-doc__role">{role}</div>
        </div>
      </div>

      {/* Simulated Resume Wireframe Lines */}
      <div className="lholo-doc__lines">
        <div className="line line--lg" />
        <div className="line line--md" />
        <div className="line line--sm" />
      </div>

      <div className="lholo-doc__skills">
        {skills.slice(0, 4).map((s) => (
          <span key={s} className="lholo-doc__chip">
            {s}
          </span>
        ))}
      </div>

      <div className="lholo-doc__verified">
        <IconSparkle size={12} /> Verified Structured Payload
      </div>
    </div>
  );
}
