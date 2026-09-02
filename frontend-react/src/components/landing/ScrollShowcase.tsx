import { useState } from "react";
import { use3DTilt } from "../../hooks/use3DTilt";
import { IconUpload, IconSparkle, IconGauge, IconBriefcase, IconPeople } from "../../icons";

export default function ScrollShowcase() {
  const [activeStep, setActiveStep] = useState(0);
  const tiltCard = use3DTilt({ maxRotation: 5, scale: 1.01 });

  const steps = [
    {
      id: "parsing",
      tag: "01 · Parse",
      title: "Sub-Second XML Extraction",
      desc: "Instant parsing for PDF, DOCX, and TXT files. Extracts experience, contact data, degrees, and full skill inventories.",
      icon: <IconUpload size={20} />,
      highlight: "0.002s execution speed",
      demoContent: (
        <div className="showcase__preview showcase__preview--parsing">
          <div className="showcase__scanner-bar" />
          <div className="showcase__file-item">
            <span className="dotmark" />
            <span>Senior_Engineer_Resume.pdf</span>
            <span className="tag">Parsed</span>
          </div>
          <div className="showcase__tags-row">
            <span className="miniskill have">Python</span>
            <span className="miniskill have">FastAPI</span>
            <span className="miniskill have">PostgreSQL</span>
            <span className="miniskill have">Docker</span>
          </div>
        </div>
      ),
    },
    {
      id: "scoring",
      tag: "02 · Score",
      title: "Dual-Engine AI Matching",
      desc: "Combines mathematical cosine vector similarity with deep contextual AI evaluation for hallucination-free ranking.",
      icon: <IconGauge size={20} />,
      highlight: "40% Vector · 60% Model Judgement",
      demoContent: (
        <div className="showcase__preview showcase__preview--scoring">
          <div className="showcase__score-dial">
            <div className="n">94.5</div>
            <div className="l">Fitness Score</div>
          </div>
          <div className="meter" style={{ marginTop: 12 }}>
            <div className="meter__track">
              <div className="meter__seg sim" style={{ width: "38%" }} />
              <div className="meter__seg llm" style={{ width: "57%" }} />
            </div>
            <div className="meter__legend">
              <span>Similarity: <b>88.0</b></span>
              <span>Model: <b>96.5</b></span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "skillgap",
      tag: "03 · Radar",
      title: "Automated Skill-Gap Analysis",
      desc: "Instantly compare candidates against job requirements. See matched qualifications and missing competencies.",
      icon: <IconBriefcase size={20} />,
      highlight: "90% Mandatory Skill Match",
      demoContent: (
        <div className="showcase__preview showcase__preview--matrix">
          <div className="miniskills">
            <span className="miniskill have">✓ Python</span>
            <span className="miniskill have">✓ FastAPI</span>
            <span className="miniskill have">✓ PostgreSQL</span>
            <span className="miniskill have">✓ Docker</span>
            <span className="miniskill miss">✗ Kubernetes</span>
          </div>
        </div>
      ),
    },
    {
      id: "pipeline",
      tag: "04 · Pipeline",
      title: "3D Kanban Shortlists",
      desc: "Drag candidates across Interview, Offer, and Talent Pool stages with one-click CSV export for your team.",
      icon: <IconPeople size={20} />,
      highlight: "Live Stage Management",
      demoContent: (
        <div className="showcase__preview showcase__preview--kanban">
          <div className="showcase__mini-board">
            <div className="showcase__mini-col">
              <span className="col-tag">Screened (3)</span>
              <div className="mini-card">Alex R. · 89.2</div>
            </div>
            <div className="showcase__mini-col active">
              <span className="col-tag">Interview (2)</span>
              <div className="mini-card high">Chitra A. · 96.4</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="showcase" className="lshowcase">
      <div className="lsection-head">
        <span className="lsection-eyebrow">
          <IconSparkle size={13} /> Pipeline
        </span>
        <h2 className="lsection-title">How It Works</h2>
        <p className="lsection-sub">
          A 4-step workflow from raw files to verified shortlists.
        </p>
      </div>

      <div className="lshowcase__grid">
        <div className="lshowcase__steps">
          {steps.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setActiveStep(idx)}
              className={"lshowcase__step" + (activeStep === idx ? " active" : "")}
            >
              <div className="lshowcase__step-top">
                <span className="lshowcase__step-icon">{s.icon}</span>
                <span className="lshowcase__step-tag">{s.tag}</span>
              </div>
              <h3 className="lshowcase__step-title">{s.title}</h3>
              <p className="lshowcase__step-desc">{s.desc}</p>
              <div className="lshowcase__step-hl">{s.highlight}</div>
            </div>
          ))}
        </div>

        <div className="lshowcase__viewer">
          <div
            ref={tiltCard.ref}
            style={tiltCard.style}
            {...tiltCard.bind}
            className="lshowcase__card"
          >
            <div className="cand__glare" style={tiltCard.glareStyle} />
            <div className="lshowcase__card-head">
              <span className="lshowcase__card-chip">{steps[activeStep].tag}</span>
              <span className="lshowcase__card-status">Live Preview</span>
            </div>
            <h4 className="lshowcase__card-title">{steps[activeStep].title}</h4>
            {steps[activeStep].demoContent}
          </div>
        </div>
      </div>
    </section>
  );
}
