import { useEffect, useState } from "react";
import { api, errorDetail } from "../api";
import { useToast } from "../toast";
import { band, STAGES } from "../utils";
import type { PooledCandidate, Stage } from "../types";

interface Props {
  onOpenJob: (id: string) => void;
}

/** A Kanban board of every candidate grouped by hiring-pipeline stage. */
export default function PipelineBoard({ onOpenJob }: Props) {
  const toast = useToast();
  const [rows, setRows] = useState<PooledCandidate[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (e) {
      setRows(prev); // revert on failure
      toast(errorDetail(e), true);
    }
  }

  return (
    <>
      <div className="dash__head">
        <h1>Pipeline</h1>
        <p>Every candidate across your jobs, grouped by hiring stage. Move them forward or back.</p>
      </div>

      {loading ? (
        <div className="loadrow">
          <span className="spinner dark" /> Loading pipeline…
        </div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h3>No candidates yet</h3>
          <p>Upload resumes to a job and they'll appear here as you move them through stages.</p>
        </div>
      ) : (
        <div className="board">
          {STAGES.map((st) => {
            const items = rows.filter((r) => r.status === st.v);
            return (
              <div className="board__col" key={st.v}>
                <div className="board__colhead">
                  <span className={"stagedot stage-" + st.v} />
                  {st.t}
                  <span className="board__count">{items.length}</span>
                </div>
                <div className="board__list">
                  {items.length === 0 ? (
                    <div className="board__empty">—</div>
                  ) : (
                    items.map((r) => {
                      const b = band(r.final_score || 0);
                      return (
                        <div className="boardcard" key={r.candidate_id}>
                          <div className="boardcard__top">
                            <span className="boardcard__name" onClick={() => onOpenJob(r.job_id)}>
                              {r.full_name}
                            </span>
                            <span className="boardcard__score" style={{ color: `var(--${b})` }}>
                              {(r.final_score || 0).toFixed(0)}
                            </span>
                          </div>
                          <div className="boardcard__job" onClick={() => onOpenJob(r.job_id)}>
                            {r.job_title}
                          </div>
                          <select
                            className={"stagesel stage-" + r.status}
                            value={r.status}
                            onChange={(e) => move(r.candidate_id, e.target.value as Stage)}
                          >
                            {STAGES.map((s) => (
                              <option key={s.v} value={s.v}>
                                {s.t}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
