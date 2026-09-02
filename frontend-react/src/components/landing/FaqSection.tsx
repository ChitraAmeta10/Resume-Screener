import { useState } from "react";
import { IconSparkle, IconUpload } from "../../icons";

interface Props {
  onOpenAuth: () => void;
}

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "What file formats does Resume Screener support?",
    a: "Resume Screener parses PDF (.pdf), Microsoft Word (.docx), and plain text (.txt / .md) files. Our zero-memory XML parser extracts text and tables directly from DOCX packages in under 2 milliseconds.",
  },
  {
    q: "How does the dual-engine scoring calculate candidate fitness?",
    a: "It combines mathematical Cosine Similarity over L2-normalized semantic tokens with deep contextual AI judgment (via OpenAI, Claude, or offline heuristics). You can customize the weighting slider (e.g. 40% similarity, 60% LLM) to fit your exact hiring criteria.",
  },
  {
    q: "Can I run this self-hosted or completely offline?",
    a: "Yes! The entire backend is built with FastAPI and PostgreSQL/SQLite with an offline heuristic engine that requires zero external API keys or cloud connections. You can also self-host via Docker or Render.",
  },
  {
    q: "Is candidate data kept private and secure?",
    a: "Yes. In offline mode, no data ever leaves your server. If cloud LLMs are connected, resumes are processed strictly in memory during extraction with no persistent model training.",
  },
  {
    q: "How does skill-gap analysis work?",
    a: "When you create a job, Resume Screener extracts mandatory competencies from the job description. Each uploaded resume is analyzed to show matched skills and specific missing requirements with a percentage coverage score.",
  },
];

export default function FaqSection({ onOpenAuth }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="lfaq">
      <div className="lsection-head">
        <span className="lsection-eyebrow">
          <IconSparkle size={13} /> Common Questions
        </span>
        <h2 className="lsection-title">Frequently Asked Questions</h2>
        <p className="lsection-sub">
          Everything you need to know about the architecture, security, and scoring mechanics.
        </p>
      </div>

      <div className="lfaq__list">
        {FAQS.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              className={"lfaq__item" + (isOpen ? " open" : "")}
              onClick={() => setOpenIdx(isOpen ? null : i)}
            >
              <div className="lfaq__q">
                <span>{item.q}</span>
                <span className="lfaq__toggle">{isOpen ? "−" : "+"}</span>
              </div>
              {isOpen && <div className="lfaq__a">{item.a}</div>}
            </div>
          );
        })}
      </div>

      {/* 3D High Impact CTA Banner */}
      <div className="lcta">
        <div className="lcta__glow" />
        <div className="lcta__content">
          <span className="lhero__badge-dot" />
          <h2>Ready to revolutionize your hiring pipeline?</h2>
          <p>
            Create your first job, upload resumes in bulk, and watch Resume Screener rank every applicant with instant clarity.
          </p>
          <div className="lcta__actions">
            <button className="btn btn--lg" onClick={onOpenAuth}>
              <IconSparkle size={18} /> Launch Free Workspace Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
