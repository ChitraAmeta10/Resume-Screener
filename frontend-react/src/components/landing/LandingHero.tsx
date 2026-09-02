import { use3DTilt } from "../../hooks/use3DTilt";
import { IconSparkle, IconUpload, IconGauge, IconStack, IconBriefcase, IconPeople } from "../../icons";
import FloatingBadge from "./FloatingBadge";
import HolographicDoc from "./HolographicDoc";

interface Props {
  onOpenAuth: () => void;
  onExploreDemo: () => void;
}

const MARQUEE_ITEMS = [
  { name: "Chitra Ameta", role: "AI Backend Lead", score: "94.8", match: "9/10 Skills", b: "strong" },
  { name: "Alex Rivera", role: "Full-Stack Dev", score: "88.5", match: "8/10 Skills", b: "strong" },
  { name: "Elena Rostova", role: "ML Platform Eng", score: "91.2", match: "9/10 Skills", b: "strong" },
  { name: "David Kim", role: "Python Core Dev", score: "86.0", match: "7/10 Skills", b: "moderate" },
  { name: "Sarah Chen", role: "Cloud Architect", score: "82.4", match: "7/10 Skills", b: "moderate" },
];

export default function LandingHero({ onOpenAuth, onExploreDemo }: Props) {
  const tiltMain = use3DTilt({ maxRotation: 9, scale: 1.02 });
  const tiltSub = use3DTilt({ maxRotation: 12, scale: 1.03 });

  return (
    <section className="lhero">
      {/* Floating 3D Left Wing Parallax Elements */}
      <div className="lhero__float-wing lhero__float-wing--left">
        <HolographicDoc
          name="Chitra Ameta"
          role="Senior AI Backend Engineer"
          score="94.8"
          skills={["Python", "FastAPI", "PostgreSQL", "Docker"]}
          className="lhero__float-item lhero__float-item--1"
        />
        <FloatingBadge
          icon={<IconSparkle size={18} />}
          title="Direct XML Parsing"
          subtitle="0.002s Execution Time"
          score="⚡ Ultra Fast"
          scoreColor="cyan"
          className="lhero__float-item lhero__float-item--2"
        />
      </div>

      {/* Floating 3D Right Wing Parallax Elements */}
      <div className="lhero__float-wing lhero__float-wing--right">
        <FloatingBadge
          icon={<IconStack size={18} />}
          title="Dual-Engine Scorer"
          subtitle="Vector Distance + LLM"
          score="96.5 AI"
          scoreColor="strong"
          className="lhero__float-item lhero__float-item--3"
        />
        <HolographicDoc
          name="Alex Rivera"
          role="Senior Full-Stack Architect"
          score="89.2"
          skills={["React", "TypeScript", "Node.js", "Redis"]}
          className="lhero__float-item lhero__float-item--4"
        />
      </div>

      <div className="lhero__badge">
        <span className="lhero__badge-dot" />
        <IconSparkle size={13} />
        <span>Next-Gen Dual-Engine AI Screener · Sub-Second Parsing</span>
      </div>

      <h1 className="lhero__title">
        Screen Hundreds of Resumes in Seconds with <span className="gradient-text">3D Precision</span>.
      </h1>

      <p className="lhero__sub">
        Extract complex candidate profiles, match semantic skill vectors, and score fitness with bias-free reasoning. Built with <b>FastAPI, PostgreSQL & React</b> for modern high-velocity hiring teams.
      </p>

      <div className="lhero__actions">
        <button className="btn btn--lg" onClick={onOpenAuth}>
          <IconSparkle size={18} /> Launch Screener Free
        </button>
        <button className="btn btn--ghost btn--lg" onClick={onExploreDemo}>
          <IconUpload size={18} /> Try Interactive Simulator
        </button>
      </div>

      <div className="lhero__stats">
        <div className="lhero__stat">
          <span className="n">0.002s</span>
          <span className="l">XML Parsing Speed</span>
        </div>
        <div className="lhero__stat-divider" />
        <div className="lhero__stat">
          <span className="n">100%</span>
          <span className="l">Offline / Privacy Ready</span>
        </div>
        <div className="lhero__stat-divider" />
        <div className="lhero__stat">
          <span className="n">Dual-Engine</span>
          <span className="l">Semantic + Reasoning</span>
        </div>
      </div>

      {/* 3D Floating Hero Showcase Card Stack */}
      <div className="lhero__stage">
        <div
          ref={tiltMain.ref}
          style={tiltMain.style}
          {...tiltMain.bind}
          className="lhero__card lhero__card--primary"
        >
          <div className="cand__glare" style={tiltMain.glareStyle} />
          <div className="lhero__card-top">
            <div className="lhero__avatar">CA</div>
            <div>
              <div className="lhero__card-name">Chitra Ameta</div>
              <div className="lhero__card-role">Senior Full-Stack AI Engineer</div>
            </div>
            <span className="fit strong">94.8 Fit Score</span>
          </div>

          <div className="lhero__card-skills">
            <span className="chip">Python</span>
            <span className="chip">FastAPI</span>
            <span className="chip">React</span>
            <span className="chip">PostgreSQL</span>
            <span className="chip">Docker</span>
            <span className="chip">RAG & LLMs</span>
          </div>

          <div className="lhero__card-meter">
            <div className="meter__track">
              <div className="meter__seg sim" style={{ width: "42%" }} />
              <div className="meter__seg llm" style={{ width: "56%" }} />
            </div>
            <div className="meter__legend">
              <span>Similarity <b>92%</b></span>
              <span>Model Judgement <b>96%</b></span>
            </div>
          </div>

          <div className="lhero__card-quote">
            “Exceptional match across backend microservices, SQL databases, and modern UI engineering with 4.5+ years of verified production experience.”
          </div>
        </div>

        {/* Floating Mini 3D Badge */}
        <div
          ref={tiltSub.ref}
          style={tiltSub.style}
          {...tiltSub.bind}
          className="lhero__card lhero__card--badge"
        >
          <div className="cand__glare" style={tiltSub.glareStyle} />
          <IconGauge size={24} />
          <div>
            <div className="n">99.4%</div>
            <div className="l">Extraction Accuracy</div>
          </div>
        </div>
      </div>

      {/* 3D Infinite Scrolling Ribbon Marquee */}
      <div className="lhero__marquee-wrap">
        <div className="lhero__marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <div key={idx} className="lhero__marquee-card">
              <div className="avatar-dot">{item.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="name">{item.name}</div>
                <div className="role">{item.role} · {item.match}</div>
              </div>
              <span className={`fit ${item.b}`}>{item.score}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
