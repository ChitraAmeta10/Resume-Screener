import { useState } from "react";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import ThreeScene from "./ThreeScene";
import ParticleCanvas from "./ParticleCanvas";
import LiveCodeTerminal from "./LiveCodeTerminal";
import LandingNav from "./LandingNav";
import LandingHero from "./LandingHero";
import ScrollShowcase from "./ScrollShowcase";
import BentoGrid from "./BentoGrid";
import LivePlayground from "./LivePlayground";
import FaqSection from "./FaqSection";
import LandingFooter from "./LandingFooter";
import AuthView from "../AuthView";

interface Props {
  onAuthed: (token: string) => void;
}

export default function LandingPage({ onAuthed }: Props) {
  const { scrollProgress } = useScrollProgress();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const scrollToPlayground = () => {
    const el = document.getElementById("playground");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lpage">
      <ThreeScene />
      <ParticleCanvas />

      <LandingNav
        scrollProgress={scrollProgress}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="lpage__content">
        <LandingHero
          onOpenAuth={() => setAuthModalOpen(true)}
          onExploreDemo={scrollToPlayground}
        />

        <ScrollShowcase />

        <LiveCodeTerminal />

        <BentoGrid />

        <LivePlayground onOpenAuth={() => setAuthModalOpen(true)} />

        <FaqSection onOpenAuth={() => setAuthModalOpen(true)} />
      </main>

      <LandingFooter />

      {/* Auth Modal overlay */}
      {authModalOpen && (
        <div className="modal show" onClick={(e) => e.target === e.currentTarget && setAuthModalOpen(false)}>
          <div className="lpage__auth-modal-box">
            <button className="lpage__auth-close" onClick={() => setAuthModalOpen(false)}>
              ✕
            </button>
            <AuthView onAuthed={onAuthed} />
          </div>
        </div>
      )}
    </div>
  );
}
