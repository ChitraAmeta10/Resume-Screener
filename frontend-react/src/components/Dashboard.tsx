import { useEffect, useState } from "react";
import { api, errorDetail } from "../api";
import { useToast } from "../toast";
import { band } from "../utils";
import {
  IconStack,
  IconSparkle,
  IconBriefcase,
  IconPeople,
  IconGauge,
  IconStar,
  IconUpload,
  IconChevronLeft,
} from "../icons";
import { use3DTilt } from "../hooks/use3DTilt";
import Counter from "./landing/Counter";
import type { Dashboard as DashboardData, User } from "../types";

interface Props {
  user: User;
  onOpenJob: (id: string) => void;
  onNewJob: () => void;
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function firstName(email: string): string {
  const local = (email.split("@")[0] || "there").replace(/[._-].*$/, "");
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default function Dashboard({ user, onOpenJob, onNewJob }: Props) {
  const toast = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterBand, setFilterBand] = useState<"all" | "strong" | "moderate" | "weak">("all");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<DashboardData>("/v1/dashboard")
      .then((d) => alive && setData(d))
      .catch((e) => toast(errorDetail(e), true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="dash-loading">
        <span className="spinner dark" /> Loading interactive overview…
      </div>
    );
  }
  if (!data) return null;

  if (!data.total_jobs) {
    return (
      <div className="dash-empty">
        <div className="dash-empty__icon">
          <IconStack size={32} />
        </div>
        <h2>Ready to Screen Your First Batch?</h2>
        <p>
          Create a job and Resume Screener AI will instantly parse resumes, extract skills,
          and score candidates with dual-engine precision.
        </p>
        <button className="btn btn--lg" onClick={onNewJob}>
          <IconSparkle size={16} /> Create First Job
        </button>
      </div>
    );
  }

  const isAdmin = data.scope === "team";
  const fd = data.fit_distribution;
  const distTot = fd.strong + fd.moderate + fd.weak;
  const pct = (n: number) => (distTot ? ((n / distTot) * 100).toFixed(1) + "%" : "0%");
  const maxSkill = data.top_skills.length ? data.top_skills[0].count : 1;

  const filteredCandidates = data.top_candidates.filter((c) => {
    if (filterBand === "all") return true;
    return band(c.final_score) === filterBand;
  });

  return (
    <div className="dash-view">
      {/* Dynamic Welcome Hero */}
      <div className="dash-hero">
        <div className="dash-hero__left">
          <div className="dash-hero__status">
            <span className="live-dot" />
            <span>AI Screening Engine Active · {data.llm_provider.toUpperCase()}</span>
          </div>
          <h1 className="dash-hero__title">
            {greeting()}, <span className="gradient-text">{firstName(user.email)}</span>
          </h1>
          <p className="dash-hero__sub">
            {isAdmin
              ? `Org-wide intelligence across ${data.total_jobs} active job${data.total_jobs !== 1 ? "s" : ""} and ${data.recruiters} recruiters.`
              : `Screening pipeline active across ${data.total_jobs} job${data.total_jobs !== 1 ? "s" : ""} · ${data.total_candidates} total candidates scored.`}
          </p>
        </div>

        <div className="dash-hero__actions">
          <button className="btn" onClick={onNewJob}>
            <IconSparkle size={15} /> + New Job
          </button>
        </div>
      </div>

      {/* Kinetic 3D Metric KPI Cards */}
      <div className="dash-kpi-grid">
        <KpiCard
          accent="sapphire"
          icon={<IconBriefcase size={20} />}
          number={data.total_jobs}
          label={isAdmin ? "Jobs (All Recruiters)" : "Active Jobs"}
          tag="Pipeline"
        />
        <KpiCard
          accent="cyan"
          icon={<IconPeople size={20} />}
          number={data.total_candidates}
          label="Candidates Screened"
          tag={`${data.scored_candidates} scored`}
        />
        <KpiCard
          accent="emerald"
          icon={<IconGauge size={20} />}
          number={data.avg_fit_score}
          decimals={1}
          suffix=" Fit"
          label="Average Match Fit"
          tag="Dual-Engine Score"
        />
        <KpiCard
          accent="indigo"
          icon={<IconStar size={20} />}
          number={fd.strong}
          label="Strong Fits"
          tag={`Top ${(distTot ? ((fd.strong / distTot) * 100).toFixed(0) : 0)}% of pool`}
        />
      </div>

      {/* 2-Column Analytical Bento */}
      <div className="dash-analytics-grid">
        {/* Fit Distribution Panel */}
        <div className="dash-card">
          <div className="dash-card__head">
            <div>
              <h3>Candidate Fit Distribution</h3>
              <p className="dash-card__sub">Semantic cosine similarity + LLM reasoner match</p>
            </div>
            <span className="dash-card__badge">{data.scored_candidates} Evaluated</span>
          </div>

          <div className="dash-dist__meter">
            {fd.strong > 0 && (
              <div
                className="dash-dist__seg seg--strong"
                style={{ width: pct(fd.strong) }}
                title={`Strong: ${fd.strong} (${pct(fd.strong)})`}
              />
            )}
            {fd.moderate > 0 && (
              <div
                className="dash-dist__seg seg--moderate"
                style={{ width: pct(fd.moderate) }}
                title={`Moderate: ${fd.moderate} (${pct(fd.moderate)})`}
              />
            )}
            {fd.weak > 0 && (
              <div
                className="dash-dist__seg seg--weak"
                style={{ width: pct(fd.weak) }}
                title={`Weak: ${fd.weak} (${pct(fd.weak)})`}
              />
            )}
          </div>

          <div className="dash-dist__filters">
            <button
              type="button"
              className={`dash-dist__btn ${filterBand === "all" ? "active" : ""}`}
              onClick={() => setFilterBand("all")}
            >
              All ({distTot})
            </button>
            <button
              type="button"
              className={`dash-dist__btn btn--strong ${filterBand === "strong" ? "active" : ""}`}
              onClick={() => setFilterBand("strong")}
            >
              <span className="dot dot--strong" /> Strong ({fd.strong})
            </button>
            <button
              type="button"
              className={`dash-dist__btn btn--moderate ${filterBand === "moderate" ? "active" : ""}`}
              onClick={() => setFilterBand("moderate")}
            >
              <span className="dot dot--moderate" /> Moderate ({fd.moderate})
            </button>
            <button
              type="button"
              className={`dash-dist__btn btn--weak ${filterBand === "weak" ? "active" : ""}`}
              onClick={() => setFilterBand("weak")}
            >
              <span className="dot dot--weak" /> Weak ({fd.weak})
            </button>
          </div>
        </div>

        {/* Top In-Demand Skills Panel */}
        <div className="dash-card">
          <div className="dash-card__head">
            <div>
              <h3>Top Skills in Talent Pool</h3>
              <p className="dash-card__sub">Extracted across all parsed resumes</p>
            </div>
            <span className="dash-card__badge">{data.top_skills.length} Tracked</span>
          </div>

          <div className="dash-skills__list">
            {data.top_skills.length ? (
              data.top_skills.slice(0, 6).map((s) => (
                <div className="dash-skill-row" key={s.skill}>
                  <div className="dash-skill-row__meta">
                    <span className="name">{s.skill}</span>
                    <span className="count">{s.count} candidates</span>
                  </div>
                  <div className="dash-skill-row__track">
                    <div
                      className="dash-skill-row__fill"
                      style={{ width: `${Math.round((s.count / maxSkill) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="dash-empty-note">No candidate skills parsed yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Ranked Candidates Leaderboard */}
      <div className="dash-card">
        <div className="dash-card__head">
          <div>
            <h3>Top Ranked Shortlist</h3>
            <p className="dash-card__sub">
              {filterBand === "all" ? "Leading candidates across active roles" : `Filtered by ${filterBand} fit`}
            </p>
          </div>
        </div>

        <div className="dash-cand-list">
          {filteredCandidates.length ? (
            filteredCandidates.map((c, i) => {
              const b = band(c.final_score);
              return (
                <div
                  className="dash-cand-item"
                  key={c.candidate_id}
                  onClick={() => onOpenJob(c.job_id)}
                >
                  <span className="dash-cand-item__rank">#{String(i + 1).padStart(2, "0")}</span>
                  <div className="dash-cand-item__avatar">
                    {(c.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="dash-cand-item__info">
                    <div className="dash-cand-item__name">{c.full_name}</div>
                    <div className="dash-cand-item__job">{c.job_title}</div>
                  </div>
                  {c.coverage != null && (
                    <span className="dash-cand-item__cov">
                      {Math.round(c.coverage * 100)}% Skill Coverage
                    </span>
                  )}
                  <span className={`fit ${b}`}>
                    {c.final_score.toFixed(1)} Fit
                  </span>
                  <button className="btn btn--ghost btn--sm">
                    Open Job
                  </button>
                </div>
              );
            })
          ) : (
            <p className="dash-empty-note">No candidates match this filter.</p>
          )}
        </div>
      </div>

      {/* Active Jobs Grid */}
      <div className="dash-sect-head">
        <h2>Active Screening Pipelines</h2>
        <span className="count">{data.jobs.length} Jobs Total</span>
      </div>

      <div className="dash-jobs-grid">
        {data.jobs.map((j) => (
          <JobCardItem key={j.id} job={j} onOpen={() => onOpenJob(j.id)} />
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  accent,
  icon,
  number,
  decimals = 0,
  suffix = "",
  label,
  tag,
}: {
  accent: "sapphire" | "cyan" | "emerald" | "indigo";
  icon: React.ReactNode;
  number: number;
  decimals?: number;
  suffix?: string;
  label: string;
  tag: string;
}) {
  const tilt = use3DTilt({ maxRotation: 6, scale: 1.02 });

  return (
    <div
      ref={tilt.ref}
      style={tilt.style}
      {...tilt.bind}
      className={`dash-kpi-card kpi--${accent}`}
    >
      <div className="cand__glare" style={tilt.glareStyle} />
      <div className="dash-kpi-card__top">
        <span className="dash-kpi-card__label">{label}</span>
        <div className="dash-kpi-card__icon">{icon}</div>
      </div>
      <div className="dash-kpi-card__num">
        <Counter target={number} decimals={decimals} suffix={suffix} />
      </div>
      <div className="dash-kpi-card__tag">{tag}</div>
    </div>
  );
}

function JobCardItem({ job, onOpen }: { job: any; onOpen: () => void }) {
  const tilt = use3DTilt({ maxRotation: 6, scale: 1.02 });

  return (
    <div
      ref={tilt.ref}
      style={tilt.style}
      {...tilt.bind}
      className="dash-job-card"
      onClick={onOpen}
    >
      <div className="cand__glare" style={tilt.glareStyle} />
      <div className="dash-job-card__head">
        <h4 className="dash-job-card__title">{job.title}</h4>
        <span className="status-pill">Active</span>
      </div>

      <div className="dash-job-card__stats">
        <div className="stat">
          <span className="stat__lbl">Candidates</span>
          <span className="stat__val">{job.candidate_count}</span>
        </div>
        <div className="stat">
          <span className="stat__lbl">Avg Match</span>
          <span className="stat__val highlight">{job.avg_score.toFixed(1)}%</span>
        </div>
        <div className="stat">
          <span className="stat__lbl">Strong Fits</span>
          <span className="stat__val strong">{job.strong_count}</span>
        </div>
      </div>

      <div className="dash-job-card__foot">
        <span>Click to manage & screen candidates</span>
        <span className="arrow">→</span>
      </div>
    </div>
  );
}
