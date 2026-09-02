import { useState } from "react";
import { use3DTilt } from "../../hooks/use3DTilt";
import { IconSparkle, IconStack, IconGauge, IconPeople, IconBriefcase } from "../../icons";

export default function BentoGrid() {
  const [sliderSim, setSliderSim] = useState(40);
  const tilt1 = use3DTilt({ maxRotation: 6, scale: 1.015 });
  const tilt2 = use3DTilt({ maxRotation: 6, scale: 1.015 });
  const tilt3 = use3DTilt({ maxRotation: 6, scale: 1.015 });
  const tilt4 = use3DTilt({ maxRotation: 6, scale: 1.015 });

  const simWeight = sliderSim / 100;
  const llmWeight = (100 - sliderSim) / 100;
  const sampleSim = 88.0;
  const sampleLLM = 94.0;
  const calculatedScore = (simWeight * sampleSim + llmWeight * sampleLLM).toFixed(1);

  return (
    <section id="bento" className="lbento">
      <div className="lsection-head">
        <span className="lsection-eyebrow">
          <IconSparkle size={13} /> Architectural Excellence
        </span>
        <h2 className="lsection-title">Engineered for Accuracy, Speed & Scale</h2>
        <p className="lsection-sub">
          Explore the core innovations that make Resume Screener faster, more reliable, and completely customizable.
        </p>
      </div>

      <div className="lbento__grid">
        {/* Bento 1: Dynamic Weighting Simulator (Large) */}
        <div
          ref={tilt1.ref}
          style={tilt1.style}
          {...tilt1.bind}
          className="lbento__item lbento__item--wide"
        >
          <div className="cand__glare" style={tilt1.glareStyle} />
          <div className="lbento__icon"><IconGauge size={22} /></div>
          <h3>Dynamic Dual-Engine Weight Physics</h3>
          <p>
            Tune the exact balance between statistical token similarity and deep contextual AI judgment in real time with interactive sliders.
          </p>

          <div className="lbento__sim-box">
            <div className="lbento__sim-controls">
              <label>Weight Balance</label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={sliderSim}
                onChange={(e) => setSliderSim(+e.target.value)}
              />
              <div className="lbento__sim-vals">
                <span>Similarity: <b>{Math.round(simWeight * 100)}%</b></span>
                <span>AI Judgment: <b>{Math.round(llmWeight * 100)}%</b></span>
              </div>
            </div>

            <div className="lbento__sim-result">
              <div className="n">{calculatedScore}</div>
              <div className="l">Live Calculated Fit</div>
            </div>
          </div>
        </div>

        {/* Bento 2: Direct XML & Memory Efficiency */}
        <div
          ref={tilt2.ref}
          style={tilt2.style}
          {...tilt2.bind}
          className="lbento__item"
        >
          <div className="cand__glare" style={tilt2.glareStyle} />
          <div className="lbento__icon"><IconSparkle size={22} /></div>
          <h3>Zero-Memory XML Parser</h3>
          <p>
            Direct XML streaming parses complex `.docx` and `.pdf` files in <b>0.002 seconds</b> with less than 1MB RAM, preventing container crashes.
          </p>
          <div className="lbento__speed-tag">⚡ 500x faster than legacy parsers</div>
        </div>

        {/* Bento 3: Polyglot Persistence */}
        <div
          ref={tilt3.ref}
          style={tilt3.style}
          {...tilt3.bind}
          className="lbento__item"
        >
          <div className="cand__glare" style={tilt3.glareStyle} />
          <div className="lbento__icon"><IconStack size={22} /></div>
          <h3>Polyglot Persistence</h3>
          <p>
            Structured hiring tables in <b>PostgreSQL</b> + raw unconstrained resume payloads stored in <b>MongoDB Atlas</b> for full auditability.
          </p>
          <div className="lbento__chips">
            <span className="chip">PostgreSQL</span>
            <span className="chip">MongoDB</span>
            <span className="chip">Redis Cache</span>
          </div>
        </div>

        {/* Bento 4: Privacy & Offline Reliability */}
        <div
          ref={tilt4.ref}
          style={tilt4.style}
          {...tilt4.bind}
          className="lbento__item lbento__item--wide"
        >
          <div className="cand__glare" style={tilt4.glareStyle} />
          <div className="lbento__icon"><IconBriefcase size={22} /></div>
          <h3>100% Offline Capability & Zero Vendor Lock-in</h3>
          <p>
            Works with OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, or completely offline with deterministic heuristic algorithms when API keys or quotas are exhausted.
          </p>
          <div className="lbento__providers">
            <span className="provider-badge active">OpenAI GPT-4o</span>
            <span className="provider-badge active">Claude Sonnet 3.5</span>
            <span className="provider-badge active">Offline Heuristic Fallback</span>
          </div>
        </div>
      </div>
    </section>
  );
}
