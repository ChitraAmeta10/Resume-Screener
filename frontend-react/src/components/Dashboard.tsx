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
} from "../icons";
import { use3DTilt } from "../hooks/use3DTilt";
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
      <div className="loadrow">
        <span className="spinner dark" /> Loading overview…
      </div>
    );
  }
  if (!data) return null;

  if (!data.total_jobs) {
    return (
      <div className="empty">
        <IconStack />
        <h3>Nothing to screen yet</h3>
        <p>
          Create your first job and Resume Screener will extract its required skills,
          then rank every resume you upload against it.
        </p>
        <button className="btn" onClick={onNewJob}>
          New job
        </button>
      </div>
    );
  }

  const isAdmin = data.scope === "team";
  const fd = data.fit_distribution;
  const distTot = fd.strong + fd.moderate + fd.weak;
  const pct = (n: number) => (distTot ? ((n / distTot) * 100).toFixed(1) + "%" : "0%");
  const maxSkill = data.top_skills.length ? data.top_skills[0].count : 1;

  return (
    <>
      <div className={"hero" + (isAdmin ? " hero--admin" : "")}>
        <div className="hero__row">
          <div>
            <div className="hero__eyebrow">
              <IconSparkle /> {greeting()}
              {isAdmin ? " · Team overview" : ""}
            </div>
            <h1 className="hero__title">
              Welcome back, <span>{firstName(user.email)}</span>
            </h1>
            <p className="hero__sub">
              {isAdmin
                ? `Org-wide view — every recruiter's activity across ${data.total_jobs} job${
                    data.total_jobs !== 1 ? "s" : ""
                  } and ${data.recruiters} team member${data.recruiters !== 1 ? "s" : ""}.`
                : `Here's your screening activity across ${data.total_jobs} job${
                    data.total_jobs !== 1 ? "s" : ""
                  } · running on ${data.llm_provider} LLM · ${data.database}.`}
            </p>
          </div>
          <div className="hero__badges">
            {isAdmin && <span className="hero__scope">Org-wide</span>}
            <span className="hero__role">{user.role}</span>
          </div>
        </div>
      </div>

      <div className="kpis">
        <Kpi accent="gold" icon={<IconBriefcase />} n={data.total_jobs} label={isAdmin ? "Jobs (all recruiters)" : "Active jobs"} />
        <Kpi
          accent="blue"
          icon={<IconPeople size={18} />}
          n={data.total_candidates}
          label="Candidates screened"
          sub={`${data.scored_candidates} scored`}
        />
        <Kpi
          accent="green"
          icon={<IconGauge />}
          n={data.avg_fit_score.toFixed(1)}
          label="Average fit"
          sub="out of 100"
        />
        {isAdmin ? (
          <Kpi
            accent="violet"
            icon={<IconPeople size={18} />}
            n={data.recruiters}
            label="Team members"
            sub="on this workspace"
          />
        ) : (
          <Kpi
            accent="violet"
            icon={<IconStar />}
            n={fd.strong}
            label="Strong fits"
            sub={`of ${data.scored_candidates} scored`}
          />
        )}
      </div>

      <div className="dash__grid">
        <div className="panel">
          <h3>Fit distribution</h3>
          <div className="distbar">
            {fd.strong > 0 && <span className="dist-s" style={{ width: pct(fd.strong) }} />}
            {fd.moderate > 0 && <span className="dist-m" style={{ width: pct(fd.moderate) }} />}
            {fd.weak > 0 && <span className="dist-w" style={{ width: pct(fd.weak) }} />}
          </div>
          <div className="distlegend">
            <span>
              <span className="dot dist-s" />
              Strong fit · <b>{fd.strong}</b>
            </span>
            <span>
              <span className="dot dist-m" />
              Moderate · <b>{fd.moderate}</b>
            </span>
            <span>
              <span className="dot dist-w" />
              Weak · <b>{fd.weak}</b>
            </span>
          </div>
        </div>

        <div className="panel">
          <h3>Top skills in talent pool</h3>
          {data.top_skills.length ? (
            <div className="skillbars">
              {data.top_skills.map((s) => (
                <div className="skillbar" key={s.skill}>
                  <span className="nm">{s.skill}</span>
                  <div className="track">
                    <div className="fill" style={{ width: ((s.count / maxSkill) * 100).toFixed(0) + "%" }} />
                  </div>
                  <span className="ct">{s.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--faint)", fontSize: 13, margin: 0 }}>No candidate skills yet.</p>
          )}
        </div>
      </div>

      <div className="panel">
        <h3>Top candidates</h3>
        {data.top_candidates.length ? (
          data.top_candidates.map((t, i) => (
            <div className="toprow" key={t.candidate_id} onClick={() => onOpenJob(t.job_id)}>
              <span className="rk">{i + 1}</span>
              <div>
                <div className="nm">{t.full_name}</div>
                <div className="jt">{t.job_title}</div>
              </div>
              <span className="cov">
                {t.coverage != null ? Math.round(t.coverage * 100) + "% skills" : ""}
              </span>
              <span className="sc" style={{ color: `var(--${band(t.final_score)})` }}>
                {t.final_score.toFixed(1)}
              </span>
            </div>
          ))
        ) : (
          <p style={{ color: "var(--faint)", fontSize: 13, margin: 0 }}>
            Upload resumes to see a shortlist.
          </p>
        )}
      </div>

      <div className="sectlabel">Jobs</div>
      <div className="jobcards">
        {data.jobs.map((j) => (
          <div className="jobcard" key={j.id} onClick={() => onOpenJob(j.id)}>
            <h4>{j.title}</h4>
            <div className="row">
              <span>Candidates</span>
              <b>{j.candidate_count}</b>
            </div>
            <div className="row">
              <span>Avg fit</span>
              <b>{j.avg_score.toFixed(1)}</b>
            </div>
            <div className="row">
              <span>Strong fits</span>
              <b>{j.strong_count}</b>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Kpi({
  accent,
  icon,
  n,
  label,
  sub,
}: {
  accent: "gold" | "blue" | "green" | "violet";
  icon: React.ReactNode;
  n: number | string;
  label: string;
  sub?: string;
}) {
  const tilt = use3DTilt({ maxRotation: 8, scale: 1.02 });

  return (
    <div
      ref={tilt.ref}
      style={tilt.style}
      {...tilt.bind}
      className={"kpi kpi--" + accent}
    >
      <div className="cand__glare" style={tilt.glareStyle} />
      <div className="kpi__top">
        <span className="kpi__label">{label}</span>
        <span className="kpi__icon">{icon}</span>
      </div>
      <div className="kpi__n">{n}</div>
      {sub && <div className="kpi__s">{sub}</div>}
    </div>
  );
}
