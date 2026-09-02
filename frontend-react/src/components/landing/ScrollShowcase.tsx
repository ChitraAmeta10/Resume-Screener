import { useState } from "react";
import { use3DTilt } from "../../hooks/use3DTilt";
import { IconUpload, IconSparkle, IconGauge, IconBriefcase, IconPeople } from "../../icons";

export default function ScrollShowcase() {
  const [activeStep, setActiveStep] = useState(0);
  const tiltCard = use3DTilt({ maxRotation: 6, scale: 1.01 });

  const steps = [
    {
      id: "parsing",
      tag: "01 · High-Speed Extraction",
      title: "Direct XML Streaming with Zero Memory Overhead",
      desc: "Handles single or bulk uploads (up to 10 files) in PDF, DOCX, or TXT. Extracts contact info, years of experience, structured education degrees, and detailed skill tags in milliseconds.",
      icon: <IconUpload size={22} />,
      highlight: "0.002s extraction latency per resume",
      demoContent: (
        <div className="showcase__preview showcase__preview--parsing">
          <div className="showcase__scanner-bar" />
          <div className="showcase__file-item">
            <span className="dotmark" />
            <span>Senior_Backend_Engineer_Resume.pdf</span>
            <span className="tag">Parsed</span>
          </div>
          <div className="showcase__file-item">
            <span className="dotmark" />
            <span>FullStack_Developer_Chitra.docx</span>
            <span className="tag">Parsed</span>
          </div>
          <div className="showcase__tags-row">
            <span className="miniskill have">Python 3.12</span>
            <span className="miniskill have">FastAPI</span>
            <span className="miniskill have">PostgreSQL</span>
            <span className="miniskill have">Docker</span>
            <span className="miniskill have">TypeScript</span>
          </div>
        </div>
      ),
    },
    {
      id: "scoring",
      tag: "02 · Dual-Engine Scoring",
      title: "Vector Similarity + AI Model Judgement",
      desc: "Combines fast mathematical cosine distance across semantic tokens with deep LLM evaluation. Weigh experience depth, project relevance, and education without hallucination.",
      icon: <IconGauge size={22} />,
      highlight: "Customizable weights: 40% Similarity · 60% Model Judgement",
      demoContent: (
        <div className="showcase__preview showcase__preview--scoring">
          <div className="showcase__score-dial">
            <div className="n">91.4</div>
            <div className="l">Overall Fit Score</div>
          </div>
          <div className="meter" style={{ marginTop: 16 }}>
            <div className="meter__track">
              <div className="meter__seg sim" style={{ width: "38%" }} />
              <div className="meter__seg llm" style={{ width: "57%" }} />
            </div>
            <div className="meter__legend">
              <span>Similarity ×0.4 · <b>88.2</b></span>
              <span>Model ×0.6 · <b>94.5</b></span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "skillgap",
      tag: "03 · Skill-Gap Analysis",
      title: "Instant Coverage Radar & Missing Skill Detection",
      desc: "Pinpoint exact match percentages against your job description. See immediately which mandatory skills the applicant possesses and what specific competencies are missing.",
      icon: <IconBriefcase size={22} />,
      highlight: "9/10 Required Skills Matched (90% Coverage)",
      demoContent: (
        <div className="showcase__preview showcase__preview--matrix">
          <div className="showcase__gap-title">Required Skills for Senior Python Engineer:</div>
          <div className="miniskills" style={{ marginTop: 10 }}>
            <span className="miniskill have">✓ Python</span>
            <span className="miniskill have">✓ FastAPI</span>
            <span className="miniskill have">✓ PostgreSQL</span>
            <span className="miniskill have">✓ Redis</span>
            <span className="miniskill have">✓ Docker</span>
            <span className="miniskill have">✓ Microservices</span>
            <span className="miniskill miss">✗ Kubernetes</span>
          </div>
        </div>
      ),
    },
    {
      id: "pipeline",
      tag: "04 · 3D Kanban Pipeline",
      title: "Drag, Move, and Shortlist Across All Stages",
      desc: "Move candidates seamlessly from Screened to Interview, Offer, or Talent Pool. Export instant CSV shortlists for hiring managers with one click.",
      icon: <IconPeople size={22} />,
      highlight: "Live status updates & persistent multi-job dashboard",
      demoContent: (
        <div className="showcase__preview showcase__preview--kanban">
          <div className="showcase__mini-board">
            <div className="showcase__mini-col">
              <span className="col-tag">Screened (4)</span>
              <div className="mini-card">Alex R. · 89.2</div>
              <div className="mini-card">Elena M. · 84.0</div>
            </div>
            <div className="showcase__mini-col active">
              <span className="col-tag">Interview (2)</span>
              <div className="mini-card high">Chitra A. · 94.8</div>
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
          <IconSparkle size={13} /> Interactive Tour
        </span>
        <h2 className="lsection-title">How Resume Screener Works</h2>
        <p className="lsection-sub">
          A seamless 4-step workflow that transforms messy PDF/DOCX resumes into verified, scored candidate shortlists.
        </p>
      </div>

      <div className="lshowcase__grid">
        {/* Left Interactive Step Selectors */}
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

        {/* Right 3D Interactive Card Preview */}
        <div className="lshowcase__viewer">
          <div
            ref={tiltCard.ref}
            style={tiltCard.style}
            {...tiltCard.bind}
            className="lshowcase__card"
          >
            <div className="cand__glare" style={tiltCard.glareStyle} />
            <div className="lshowcase__card-head">
              <span className="lshowcase__card-chip">
                {steps[activeStep].tag}
              </span>
              <span className="lshowcase__card-status">Live Engine Preview</span>
            </div>
            <h4 className="lshowcase__card-title">{steps[activeStep].title}</h4>
            {steps[activeStep].demoContent}
          </div>
        </div>
      </div>
    </section>
  );
}
