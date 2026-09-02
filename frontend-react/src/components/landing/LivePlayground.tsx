import { useState } from "react";
import { use3DTilt } from "../../hooks/use3DTilt";
import { IconSparkle, IconUpload, IconGauge } from "../../icons";

interface Props {
  onOpenAuth: () => void;
}

const CANDIDATES = [
  {
    id: "chitra",
    name: "Chitra Ameta",
    role: "Senior AI Backend Lead",
    score: 96.4,
    sim: 92.0,
    llm: 98.0,
    matched: ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
    missing: [],
    reason: "Outstanding alignment across backend microservices, SQL performance, and asynchronous Python architecture.",
  },
  {
    id: "alex",
    name: "Alex Rivera",
    role: "Full-Stack Web Architect",
    score: 88.5,
    sim: 84.0,
    llm: 91.5,
    matched: ["React", "TypeScript", "Node.js", "MongoDB"],
    missing: ["FastAPI", "PostgreSQL"],
    reason: "Strong frontend and asynchronous API background. Transferable relational database skills.",
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    role: "DevOps & Cloud Engineer",
    score: 72.0,
    sim: 68.0,
    llm: 74.5,
    matched: ["Docker", "Linux", "CI/CD"],
    missing: ["Python", "FastAPI", "PostgreSQL"],
    reason: "Deep infrastructure and containerization experience. Missing direct application backend engineering.",
  },
];

export default function LivePlayground({ onOpenAuth }: Props) {
  const [selectedId, setSelectedId] = useState("chitra");
  const [scanning, setScanning] = useState(false);
  const tiltSimulator = use3DTilt({ maxRotation: 5, scale: 1.01 });

  const activeCand = CANDIDATES.find((c) => c.id === selectedId) || CANDIDATES[0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setScanning(true);
    setTimeout(() => setScanning(false), 400);
  };

  return (
    <section id="playground" className="lplay">
      <div className="lsection-head">
        <span className="lsection-eyebrow">
          <IconGauge size={13} /> Simulator
        </span>
        <h2 className="lsection-title">Live Screening Engine</h2>
        <p className="lsection-sub">
          Select a sample resume to inspect live extraction and dual-engine scoring.
        </p>
      </div>

      <div className="lplay__cand-selector">
        {CANDIDATES.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            className={"lplay__cand-btn" + (selectedId === c.id ? " active" : "")}
          >
            <div className="lplay__cand-btn-name">{c.name}</div>
            <div className="lplay__cand-btn-role">{c.role}</div>
            <div className="lplay__cand-btn-score">{c.score.toFixed(1)} Fit</div>
          </button>
        ))}
      </div>

      <div
        ref={tiltSimulator.ref}
        style={tiltSimulator.style}
        {...tiltSimulator.bind}
        className={"lplay__simulator" + (scanning ? " scanning" : "")}
      >
        <div className="cand__glare" style={tiltSimulator.glareStyle} />
        {scanning && <div className="lplay__laser-beam" />}

        <div className="lplay__sim-header">
          <div>
            <span className="lplay__sim-target">Target Role: <b>Senior Python / AI Developer</b></span>
            <h3 className="lplay__sim-name">{activeCand.name} · <span className="role">{activeCand.role}</span></h3>
          </div>
          <div className="lplay__sim-score-box">
            <span className="n">{activeCand.score.toFixed(1)}</span>
            <span className="l">Fit Score</span>
          </div>
        </div>

        <div className="lplay__sim-grid">
          <div className="lplay__sim-col">
            <div className="lplay__sim-label">Matched Skills ({activeCand.matched.length})</div>
            <div className="miniskills">
              {activeCand.matched.map((s) => (
                <span key={s} className="miniskill have">✓ {s}</span>
              ))}
            </div>

            {activeCand.missing.length > 0 && (
              <>
                <div className="lplay__sim-label" style={{ marginTop: 12 }}>Missing Requirements</div>
                <div className="miniskills">
                  {activeCand.missing.map((s) => (
                    <span key={s} className="miniskill miss">✗ {s}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="lplay__sim-col">
            <div className="lplay__sim-label">Engine Breakdown</div>
            <div className="meter" style={{ marginTop: 4 }}>
              <div className="meter__track">
                <div className="meter__seg sim" style={{ width: `${activeCand.sim * 0.4}%` }} />
                <div className="meter__seg llm" style={{ width: `${activeCand.llm * 0.6}%` }} />
              </div>
              <div className="meter__legend">
                <span>Vector: <b>{activeCand.sim}%</b></span>
                <span>AI Model: <b>{activeCand.llm}%</b></span>
              </div>
            </div>

            <div className="lplay__sim-reasoning">
              “{activeCand.reason}”
            </div>
          </div>
        </div>

        <div className="lplay__sim-cta">
          <span>Ready to screen your actual candidate pool?</span>
          <button className="btn" onClick={onOpenAuth}>
            <IconUpload size={16} /> Screen Your Resumes Free
          </button>
        </div>
      </div>
    </section>
  );
}
