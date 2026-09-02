import { useEffect, useState, useMemo } from "react";
import { api, errorDetail } from "../api";
import { useToast } from "../toast";
import { band, STAGES } from "../utils";
import { use3DTilt } from "../hooks/use3DTilt";
import { IconSearch, IconSparkle, IconPeople, IconChevronLeft } from "../icons";
import type { PooledCandidate, Stage } from "../types";

interface Props {
  onOpenJob: (id: string) => void;
}

const STAGE_ORDER: Stage[] = ["new", "screened", "interview", "offer", "rejected"];

export default function PipelineBoard({ onOpenJob }: Props) {
  const toast = useToast();
  const [rows, setRows] = useState<PooledCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<string>("all");

  function load() {
    setLoading(true);
    api<PooledCandidate[]>("/v1/candidates")
      .then(setRows)
      .catch((e) => toast(errorDetail(e), true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function move(candidateId: string, next: Stage) {
    const prev = rows;
    setRows((rs) =>
      rs.map((r) => (r.candidate_id === candidateId ? { ...r, status: next } : r))
    );
    try {
      await api(`/v1/candidates/${candidateId}/status`, {
        method: "PATCH",
        json: { status: next },
      });
      toast(`Moved to ${next.toUpperCase()}`);
    } catch (e) {
      setRows(prev); // revert on failure
      toast(errorDetail(e), true);
    }
  }

  // Distinct jobs for filter dropdown
  const jobs = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.job_id && r.job_title) {
        map.set(r.job_id, r.job_title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [rows]);

  // Filtered rows by search & job
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (selectedJob !== "all" && r.job_id !== selectedJob) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.full_name?.toLowerCase().includes(q) ||
        r.job_title?.toLowerCase().includes(q) ||
        (r.skills || []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [rows, search, selectedJob]);

  return (
    <div className="pipeline-view">
      {/* Pipeline Header */}
      <div className="dash-hero">
        <div className="dash-hero__left">
          <div className="dash-hero__status">
            <span className="live-dot" />
            <span>Interactive Kanban Pipeline</span>
          </div>
          <h1 className="dash-hero__title">Candidate Hiring Pipeline</h1>
          <p className="dash-hero__sub">
            Track candidates across stages, evaluate dual-engine scores, and advance candidates with 1 click.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="pipe-controls">
        <div className="pipe-search">
          <IconSearch size={16} />
          <input
            type="text"
            placeholder="Search candidate name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pipe-filters">
          <div className="pipe-filter-item">
            <label>Filter by Job:</label>
            <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}>
              <option value="all">All Roles ({jobs.length})</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div className="pipe-total-badge">
            <b>{filteredRows.length}</b> Candidates in Pipeline
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loadrow">
          <span className="spinner dark" /> Loading pipeline stages…
        </div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <IconPeople size={40} />
          <h3>No Candidates in Pipeline Yet</h3>
          <p>Upload resumes to your jobs to populate the hiring stages automatically.</p>
        </div>
      ) : (
        <div className="board">
          {STAGES.map((st) => {
            const items = filteredRows.filter((r) => r.status === st.v);
            return (
              <div className="board__col" key={st.v}>
                <div className={`board__colhead colhead--${st.v}`}>
                  <span className={`stagedot stage-${st.v}`} />
                  <span className="title">{st.t}</span>
                  <span className="board__count">{items.length}</span>
                </div>

                <div className="board__list">
                  {items.length === 0 ? (
                    <div className="board__empty">
                      <span>No candidates in {st.t}</span>
                    </div>
                  ) : (
                    items.map((r) => (
                      <KanbanCard
                        key={r.candidate_id}
                        row={r}
                        onOpenJob={onOpenJob}
                        onMove={move}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KanbanCard({
  row: r,
  onOpenJob,
  onMove,
}: {
  row: PooledCandidate;
  onOpenJob: (id: string) => void;
  onMove: (id: string, s: Stage) => void;
}) {
  const tilt = use3DTilt({ maxRotation: 5, scale: 1.01 });
  const b = band(r.final_score || 0);
  const currentIdx = STAGE_ORDER.indexOf(r.status);
  const nextStage = currentIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[currentIdx + 1] : null;
  const prevStage = currentIdx > 0 ? STAGE_ORDER[currentIdx - 1] : null;

  return (
    <div
      ref={tilt.ref}
      style={tilt.style}
      {...tilt.bind}
      className="boardcard"
    >
      <div className="cand__glare" style={tilt.glareStyle} />

      <div className="boardcard__top">
        <div className="boardcard__avatar">
          {(r.full_name || "U").charAt(0).toUpperCase()}
        </div>
        <div className="boardcard__titlebox">
          <span className="boardcard__name" onClick={() => onOpenJob(r.job_id)}>
            {r.full_name}
          </span>
          <span className="boardcard__job" onClick={() => onOpenJob(r.job_id)}>
            {r.job_title}
          </span>
        </div>
        <span className={`fit ${b}`}>
          {(r.final_score || 0).toFixed(0)} Fit
        </span>
      </div>

      {r.skills && r.skills.length > 0 && (
        <div className="boardcard__skills">
          {r.skills.slice(0, 3).map((s) => (
            <span className="miniskill" key={s}>
              {s}
            </span>
          ))}
          {r.skills.length > 3 && (
            <span className="miniskill">+{r.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* 1-Click Quick Stepper & Stage Dropdown */}
      <div className="boardcard__actions">
        <div className="boardcard__stepper">
          {prevStage && (
            <button
              type="button"
              className="stepper-btn back"
              title={`Move back to ${prevStage}`}
              onClick={() => onMove(r.candidate_id, prevStage)}
            >
              ◀ Back
            </button>
          )}
          {nextStage && (
            <button
              type="button"
              className="stepper-btn next"
              title={`Advance to ${nextStage}`}
              onClick={() => onMove(r.candidate_id, nextStage)}
            >
              Advance ➔
            </button>
          )}
        </div>

        <select
          className={`stagesel stage-${r.status}`}
          value={r.status}
          onChange={(e) => onMove(r.candidate_id, e.target.value as Stage)}
        >
          {STAGES.map((s) => (
            <option key={s.v} value={s.v}>
              {s.t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
