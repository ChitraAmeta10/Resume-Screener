import { useState } from "react";
import { use3DTilt } from "../../hooks/use3DTilt";
import { IconSparkle, IconStack, IconGauge, IconBriefcase } from "../../icons";

export default function BentoGrid() {
  const [sliderSim, setSliderSim] = useState(40);
  const tilt1 = use3DTilt({ maxRotation: 6, scale: 1.015 });
  const tilt2 = use3DTilt({ maxRotation: 6, scale: 1.015 });
  const tilt3 = use3DTilt({ maxRotation: 6, scale: 1.015 });
  const tilt4 = use3DTilt({ maxRotation: 6, scale: 1.015 });

  const simWeight = sliderSim / 100;
  const llmWeight = (100 - sliderSim) / 100;
  const calculatedScore = (simWeight * 88.0 + llmWeight * 96.0).toFixed(1);

  return (
    <section id="bento" className="lbento">
      <div className="lsection-head">
        <span className="lsection-eyebrow">
          <IconSparkle size={13} /> Features
        </span>
        <h2 className="lsection-title">Speed, Accuracy & Scale</h2>
        <p className="lsection-sub">
          Architected for high-velocity hiring teams.
        </p>
      </div>

      <div className="lbento__grid">
        {/* Bento 1: Dynamic Weighting */}
        <div
          ref={tilt1.ref}
          style={tilt1.style}
          {...tilt1.bind}
          className="lbento__item lbento__item--wide"
        >
          <div className="cand__glare" style={tilt1.glareStyle} />
          <div className="lbento__icon"><IconGauge size={20} /></div>
          <h3>Custom Scoring Weights</h3>
          <p>
            Adjust the exact ratio between mathematical token similarity and AI reasoning in real time.
          </p>

          <div className="lbento__sim-box">
            <div className="lbento__sim-controls">
              <label>Weight Ratio</label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={sliderSim}
                onChange={(e) => setSliderSim(+e.target.value)}
              />
              <div className="lbento__sim-vals">
                <span>Vector: <b>{sliderSim}%</b></span>
                <span>AI Model: <b>{100 - sliderSim}%</b></span>
              </div>
            </div>

            <div className="lbento__sim-result">
              <div className="n">{calculatedScore}</div>
              <div className="l">Calculated Fit</div>
            </div>
          </div>
        </div>

        {/* Bento 2: Sub-Second Parser */}
        <div
          ref={tilt2.ref}
          style={tilt2.style}
          {...tilt2.bind}
          className="lbento__item"
        >
          <div className="cand__glare" style={tilt2.glareStyle} />
          <div className="lbento__icon"><IconSparkle size={20} /></div>
          <h3>0.002s XML Streamer</h3>
          <p>
            Lightweight streaming XML parser with zero memory spikes and instant table extraction.
          </p>
          <div className="lbento__speed-tag">⚡ 500x Faster</div>
        </div>

        {/* Bento 3: Polyglot Persistence */}
        <div
          ref={tilt3.ref}
          style={tilt3.style}
          {...tilt3.bind}
          className="lbento__item"
        >
          <div className="cand__glare" style={tilt3.glareStyle} />
          <div className="lbento__icon"><IconStack size={20} /></div>
          <h3>Polyglot Storage</h3>
          <p>
            Relational candidate metadata in <b>PostgreSQL</b> + raw unconstrained resume payloads in <b>MongoDB</b>.
          </p>
          <div className="lbento__chips">
            <span className="chip">PostgreSQL</span>
            <span className="chip">MongoDB</span>
          </div>
        </div>

        {/* Bento 4: Privacy & Offline Mode */}
        <div
          ref={tilt4.ref}
          style={tilt4.style}
          {...tilt4.bind}
          className="lbento__item lbento__item--wide"
        >
          <div className="cand__glare" style={tilt4.glareStyle} />
          <div className="lbento__icon"><IconBriefcase size={20} /></div>
          <h3>100% Offline Ready · Zero Data Leakage</h3>
          <p>
            Compatible with OpenAI GPT-4o, Claude 3.5 Sonnet, or deterministic offline heuristics for zero cloud dependencies.
          </p>
          <div className="lbento__providers">
            <span className="provider-badge active">GPT-4o</span>
            <span className="provider-badge active">Claude Sonnet</span>
            <span className="provider-badge active">Offline Heuristic Engine</span>
          </div>
        </div>
      </div>
    </section>
  );
}
