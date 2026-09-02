import { useState } from "react";
import { use3DTilt } from "../../hooks/use3DTilt";
import { IconSparkle, IconUpload, IconGauge } from "../../icons";

interface Props {
  onOpenAuth: () => void;
}

interface SampleCandidate {
  id: string;
  name: string;
  role: string;
  experience: number;
  skills: string[];
  simScore: number;
  llmScore: number;
  finalScore: number;
  reasoning: string;
  matchedSkills: string[];
  missingSkills: string[];
}

const CANDIDATES: SampleCandidate[] = [
  {
    id: "chitra",
    name: "Chitra Ameta",
    role: "Senior AI Backend Engineer",
    experience: 5.0,
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "TypeScript", "React", "RAG & LLMs"],
    simScore: 92.0,
    llmScore: 96.5,
    finalScore: 94.7,
    reasoning: "Exceptional alignment with backend microservice architecture, API design, and asynchronous Python frameworks. Strong track record in PostgreSQL performance tuning.",
    matchedSkills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"],
    missingSkills: [],
  },
  {
    id: "alex",
    name: "Alex Rivera",
    role: "Full-Stack Web Developer",
    experience: 3.5,
    skills: ["TypeScript", "React", "Node.js", "MongoDB", "Express", "REST APIs", "TailwindCSS"],
    simScore: 81.5,
    llmScore: 86.0,
    finalScore: 84.2,
    reasoning: "Solid frontend and API capability. Moderate Python background but strong transferable asynchronous TypeScript and database integration skills.",
    matchedSkills: ["React", "TypeScript", "REST APIs", "MongoDB"],
    missingSkills: ["Python", "FastAPI", "PostgreSQL"],
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    role: "Cloud DevOps & Platform Engineer",
    experience: 6.0,
    skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Docker", "Prometheus", "Go"],
    simScore: 68.0,
    llmScore: 73.0,
    finalScore: 71.0,
    reasoning: "Deep infrastructure, containerization, and cloud deployment mastery. Lacks direct Python application and ORM database development background required for this specific role.",
    matchedSkills: ["Docker", "Linux", "CI/CD"],
    missingSkills: ["Python", "FastAPI", "PostgreSQL", "React"],
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
    setTimeout(() => setScanning(false), 500);
  };

  return (
    <section id="playground" className="lplay">
      <div className="lsection-head">
        <span className="lsection-eyebrow">
          <IconGauge size={13} /> Interactive Playground
        </span>
        <h2 className="lsection-title">Test the Screening Engine Live</h2>
        <p className="lsection-sub">
          Select a sample resume below to see how our dual-engine parser evaluates skills, calculates fit scores, and provides structured reasoning in real time.
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
            <div className="lplay__cand-btn-score">{c.finalScore.toFixed(1)} Fit</div>
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
            <span className="lplay__sim-target">Evaluating Against: <b>Senior Python / AI Developer Job Description</b></span>
            <h3 className="lplay__sim-name">{activeCand.name} · <span className="role">{activeCand.role}</span></h3>
          </div>
          <div className="lplay__sim-score-box">
            <span className="n">{activeCand.finalScore.toFixed(1)}</span>
            <span className="l">Fit Score</span>
          </div>
        </div>

        <div className="lplay__sim-grid">
          {/* Left: Skill Coverage Breakdown */}
          <div className="lplay__sim-col">
            <div className="lplay__sim-label">Matched Skills ({activeCand.matchedSkills.length})</div>
            <div className="miniskills">
              {activeCand.matchedSkills.map((s) => (
                <span key={s} className="miniskill have">✓ {s}</span>
              ))}
            </div>

            {activeCand.missingSkills.length > 0 && (
              <>
                <div className="lplay__sim-label" style={{ marginTop: 14 }}>Missing Required Skills ({activeCand.missingSkills.length})</div>
                <div className="miniskills">
                  {activeCand.missingSkills.map((s) => (
                    <span key={s} className="miniskill miss">✗ {s}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: AI Model Reasoning & Composition */}
          <div className="lplay__sim-col">
            <div className="lplay__sim-label">Dual-Engine Breakdown</div>
            <div className="meter" style={{ marginTop: 4 }}>
              <div className="meter__track">
                <div className="meter__seg sim" style={{ width: `${activeCand.simScore * 0.4}%` }} />
                <div className="meter__seg llm" style={{ width: `${activeCand.llmScore * 0.6}%` }} />
              </div>
              <div className="meter__legend">
                <span>Similarity: <b>{activeCand.simScore}%</b></span>
                <span>Model Judgement: <b>{activeCand.llmScore}%</b></span>
              </div>
            </div>

            <div className="lplay__sim-reasoning">
              <span className="q">“</span>{activeCand.reasoning}<span className="q">”</span>
            </div>
          </div>
        </div>

        <div className="lplay__sim-cta">
          <span>Ready to screen your actual candidate pool?</span>
          <button className="btn" onClick={onOpenAuth}>
            <IconUpload size={16} /> Upload & Screen Your Resumes Free
          </button>
        </div>
      </div>
    </section>
  );
}
