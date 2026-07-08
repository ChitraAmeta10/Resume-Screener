import { useEffect, useRef, useState } from "react";
import { api, errorDetail } from "../api";
import { useToast } from "../toast";
import { band, bandLabel } from "../utils";
import { IconSearch } from "../icons";
import StageSelect from "./StageSelect";
import type { PooledCandidate } from "../types";

interface Props {
  onOpenJob: (id: string) => void;
}

export default function TalentPool({ onOpenJob }: Props) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<PooledCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const debounce = useRef<number | undefined>(undefined);

  function load(q: string) {
    setLoading(true);
    api<PooledCandidate[]>("/v1/candidates" + (q ? "?search=" + encodeURIComponent(q) : ""))
      .then((r) => setRows(r))
      .catch((e) => toast(errorDetail(e), true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(v: string) {
    setSearch(v);
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => load(v), 220);
  }

  return (
    <>
      <div className="dash__head">
        <h1>All candidates</h1>
        <p>Search every candidate across all your jobs by name, email, or skill.</p>
      </div>

      <div className="poolsearch">
        <IconSearch />
        <input
          type="text"
          placeholder="Search by name, email, or skill — e.g. Kubernetes"
          autoComplete="off"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="poolcount">
        {rows.length} candidate{rows.length !== 1 ? "s" : ""}
        {search ? ` matching “${search}”` : ""}
      </div>

      <div className="panel flush">
        {loading ? (
          <div className="loadrow">
            <span className="spinner dark" /> Searching…
          </div>
        ) : rows.length === 0 ? (
          <p style={{ color: "var(--faint)", fontSize: 13.5, margin: 0, padding: "8px 2px" }}>
            {search
              ? "No candidates match that search."
              : "No candidates yet — upload resumes to a job to build your talent pool."}
          </p>
        ) : (
          rows.map((r) => {
            const b = band(r.final_score || 0);
            const skills = (r.skills || []).slice(0, 8);
            const more = (r.skills || []).length - skills.length;
            return (
              <div className="poolrow" key={r.candidate_id} onClick={() => onOpenJob(r.job_id)}>
                <div>
                  <div className="nm">
                    {r.full_name || "Unknown"}
                    <span className={"fit " + b}>{bandLabel(b)}</span>
                  </div>
                  <div className="jt">
                    {r.job_title || "—"} ·{" "}
                    {r.experience_years != null ? r.experience_years + " yrs" : "—"}
                    {r.email ? " · " + r.email : ""}
                  </div>
                  <div className="sk">
                    {skills.map((s) => (
                      <span className="miniskill" key={s}>
                        {s}
                      </span>
                    ))}
                    {more > 0 && <span className="miniskill">+{more}</span>}
                  </div>
                </div>
                <div className="r">
                  <div className="sc" style={{ color: `var(--${b})` }}>
                    {(r.final_score || 0).toFixed(1)}
                  </div>
                  {r.coverage != null && (
                    <div className="cov">{Math.round(r.coverage * 100)}% skills</div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <StageSelect
                      candidateId={r.candidate_id}
                      fullName={r.full_name}
                      status={r.status}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
