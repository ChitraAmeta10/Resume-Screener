import { useState, useEffect } from "react";
import { IconSparkle } from "../../icons";

interface Props {
  onOpenAuth: () => void;
  scrollProgress: number;
}

export default function LandingNav({ onOpenAuth, scrollProgress }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className={"lnav" + (scrolled ? " lnav--scrolled" : "")}>
      <div className="lnav__inner">
        <div className="lnav__brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="lnav__logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="lnav__title">
            Resume Screener <span className="lnav__dot">AI</span>
          </span>
        </div>

        <div className="lnav__links">
          <button className="lnav__link" onClick={() => scrollTo("showcase")}>
            Interactive Tour
          </button>
          <button className="lnav__link" onClick={() => scrollTo("bento")}>
            Features
          </button>
          <button className="lnav__link" onClick={() => scrollTo("playground")}>
            Live Simulator
          </button>
          <button className="lnav__link" onClick={() => scrollTo("faq")}>
            FAQ
          </button>
        </div>

        <div className="lnav__actions">
          <button className="btn btn--sm" onClick={onOpenAuth}>
            <IconSparkle size={14} /> Launch App
          </button>
        </div>
      </div>
      <div className="lnav__progress" style={{ width: `${scrollProgress}%` }} />
    </nav>
  );
}
