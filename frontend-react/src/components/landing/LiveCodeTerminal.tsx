import { useState } from "react";
import { use3DTilt } from "../../hooks/use3DTilt";
import { IconSparkle, IconGauge } from "../../icons";

const CODE_SNIPPETS = {
  python: `@router.post("/v1/jobs/{job_id}/resumes/upload")
async def screen_resume(job_id: UUID, file: UploadFile):
    # 1. Direct zero-memory XML streaming
    raw_text = extract_text_stream(file.file)
    
    # 2. Extract structured candidate profile
    profile = await extract_candidate_profile(
        resume_text=raw_text,
        schema=CandidateProfileSchema
    )
    
    # 3. Dual-Engine semantic vector + LLM scoring
    score = calculate_fitness_score(
        job_description=job.description,
        candidate_skills=profile.skills,
        weights={"similarity": 0.40, "model": 0.60}
    )
    return {"candidate": profile, "fit_score": score.final}`,

  json: `{
  "candidate": {
    "full_name": "Chitra Ameta",
    "email": "ametachitra10@gmail.com",
    "experience_years": 5.0,
    "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "TypeScript"],
    "education": [{"degree": "MCA AI", "year": 2026}]
  },
  "fitness_score": {
    "similarity_vector": 0.920,
    "llm_reasoning_score": 0.965,
    "final_weighted_score": 94.7,
    "status": "strong_fit"
  }
}`,

  math: `# Cosine Similarity over L2 Normalized Skill Vectors
import numpy as np

def cosine_distance(vec_job, vec_cand):
    dot_product = np.dot(vec_job, vec_cand)
    norm_job = np.linalg.norm(vec_job)
    norm_cand = np.linalg.norm(vec_cand)
    return dot_product / (norm_job * norm_cand)

# Weighted Composite
final = (0.40 * (sim * 100.0)) + (0.60 * llm_score)
print(f"Computed Candidate Fit: {final:.2f}/100")
# Output: Computed Candidate Fit: 94.70/100`,
};

export default function LiveCodeTerminal() {
  const [activeTab, setActiveTab] = useState<"python" | "json" | "math">("python");
  const [running, setRunning] = useState(false);
  const tilt = use3DTilt({ maxRotation: 5, scale: 1.01 });

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 800);
  };

  return (
    <section className="lterminal-sect">
      <div className="lsection-head">
        <span className="lsection-eyebrow">
          <IconSparkle size={13} /> Developer & Vibe Coding Engine
        </span>
        <h2 className="lsection-title">Built for Precision & Developers</h2>
        <p className="lsection-sub">
          Inspect the live asynchronous pipeline. Type-safe Pydantic models, vector math, and sub-millisecond execution.
        </p>
      </div>

      <div
        ref={tilt.ref}
        style={tilt.style}
        {...tilt.bind}
        className={"lterminal" + (running ? " running" : "")}
      >
        <div className="cand__glare" style={tilt.glareStyle} />
        
        {/* Terminal Header */}
        <div className="lterminal__head">
          <div className="lterminal__dots">
            <span className="dot dot--red" />
            <span className="dot dot--yellow" />
            <span className="dot dot--green" />
          </div>

          <div className="lterminal__tabs">
            <button
              onClick={() => setActiveTab("python")}
              className={"lterminal__tab" + (activeTab === "python" ? " active" : "")}
            >
              extractor.py
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={"lterminal__tab" + (activeTab === "json" ? " active" : "")}
            >
              payload.json
            </button>
            <button
              onClick={() => setActiveTab("math")}
              className={"lterminal__tab" + (activeTab === "math" ? " active" : "")}
            >
              similarity_vector.py
            </button>
          </div>

          <button className="lterminal__run-btn" onClick={handleRun} disabled={running}>
            <IconGauge size={13} />
            <span>{running ? "Executing..." : "Run Test"}</span>
          </button>
        </div>

        {/* Terminal Code Body */}
        <div className="lterminal__body">
          <pre className="lterminal__code">
            <code>{CODE_SNIPPETS[activeTab]}</code>
          </pre>
        </div>

        {/* Terminal Footer Status */}
        <div className="lterminal__foot">
          <span className="status-item">
            <span className="live-pulse" /> FastAPI Worker: Online
          </span>
          <span className="status-item">Latency: 0.002s</span>
          <span className="status-item">Status: 200 OK</span>
        </div>
      </div>
    </section>
  );
}
