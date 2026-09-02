export default function LandingFooter() {
  return (
    <footer className="lfooter">
      <div className="lfooter__inner">
        <div className="lfooter__top">
          <div className="lfooter__brand">
            <span className="lnav__logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="lfooter__title">Resume Screener AI</span>
          </div>
          <p className="lfooter__tagline">
            High-speed, dual-engine AI resume screening platform engineered with FastAPI, PostgreSQL, and React.
          </p>
        </div>

        <div className="lfooter__chips">
          <span className="chip">FastAPI 0.110</span>
          <span className="chip">React 18 + TS</span>
          <span className="chip">PostgreSQL</span>
          <span className="chip">MongoDB Atlas</span>
          <span className="chip">Zero-Memory XML</span>
          <span className="chip">Docker & Render Ready</span>
        </div>

        <div className="lfooter__bottom">
          <span>© {new Date().getFullYear()} Resume Screener. All rights reserved.</span>
          <span>Designed with Clean Slate & Radiant Sapphire.</span>
        </div>
      </div>
    </footer>
  );
}
