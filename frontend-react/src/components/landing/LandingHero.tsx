import { use3DTilt } from "../../hooks/use3DTilt";
import { IconSparkle, IconUpload, IconGauge } from "../../icons";

interface Props {
  onOpenAuth: () => void;
  onExploreDemo: () => void;
}

export default function LandingHero({ onOpenAuth, onExploreDemo }: Props) {
  const tiltMain = use3DTilt({ maxRotation: 9, scale: 1.02 });
  const tiltSub = use3DTilt({ maxRotation: 12, scale: 1.03 });

  return (
    <section className="lhero">
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
    </section>
  );
}
