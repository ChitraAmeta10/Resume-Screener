import { useEffect, useRef, useState } from "react";
import { api, ApiError, errorDetail } from "../api";
import { useToast } from "../toast";
import { band, bandLabel, fmtW } from "../utils";
import { IconUpload, IconPeople } from "../icons";
import { use3DTilt } from "../hooks/use3DTilt";
import StageSelect from "./StageSelect";
import type {
  Job,
  RankedCandidate,
  SkillGapReport,
  CandidateSkillGap,
  UploadResponse,
  Stage,
} from "../types";

interface Props {
  job: Job;
}

type Weights = { sim: number; llm: number };
type SortBy = "fit" | "coverage" | "experience";
type FilterBand = "all" | "strong" | "moderate" | "weak";

const ACCEPT = /\.(pdf|docx|txt)$/i;

function computeFinal(rc: RankedCandidate, w: Weights): number {
  const sim = +(rc.score?.similarity_score ?? 0);
  const llm = +(rc.score?.llm_score ?? 0);
  return Math.max(0, Math.min(100, w.sim * sim * 100 + w.llm * llm));
}

export default function JobDetail({ job }: Props) {
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [ranked, setRanked] = useState<RankedCandidate[]>([]);
  const [gap, setGap] = useState<SkillGapReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);

  const [weights, setWeights] = useState<Weights>({ sim: 0.4, llm: 0.6 });
  const [sortBy, setSortBy] = useState<SortBy>("fit");
  const [filterBand, setFilterBand] = useState<FilterBand>("all");

  const fileInput = useRef<HTMLInputElement>(null);

  async function loadRanked(rescore = false) {
    setLoading(true);
    try {
      const [r, g] = await Promise.all([
        api<RankedCandidate[]>(
          `/v1/jobs/${job.id}/ranked-candidates` + (rescore ? "?rescore=true" : "")
        ),
        api<SkillGapReport>(`/v1/jobs/${job.id}/skill-gap`).catch(() => null as any),
      ]);
      setRanked(r);
      setGap(g);
    } catch (e) {
      toast(errorDetail(e), true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setFiles([]);
    setFilterBand("all");
    setSortBy("fit");
    loadRanked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const ok = Array.from(list).filter((f) => ACCEPT.test(f.name));
    setFiles((prev) => [...prev, ...ok]);
  }

  async function runUpload() {
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    try {
      const out = await api<UploadResponse>(`/v1/jobs/${job.id}/resumes/upload`, {
        method: "POST",
        form: fd,
      });
      const n = (out.created || []).length;
      const errs = out.errors || [];
      setFiles([]);
      toast(
        `${n} candidate${n !== 1 ? "s" : ""} added` +
          (errs.length ? `, ${errs.length} skipped` : "") +
          "."
      );
      await loadRanked();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422)
        toast("None of those files could be read. Use PDF, DOCX, or TXT.", true);
      else toast(errorDetail(e), true);
    } finally {
      setUploading(false);
    }
  }

  const required = gap?.required_skills ?? [];
  const gapMap: Record<string, CandidateSkillGap> = {};
  (gap?.candidates ?? []).forEach((g) => (gapMap[g.candidate_id] = g));

  let rows = ranked.map((rc) => ({
    rc,
    final: computeFinal(rc, weights),
    gap: gapMap[rc.candidate.id],
  }));
  if (filterBand !== "all") rows = rows.filter((r) => band(r.final) === filterBand);
  rows.sort((a, b) => sortVal(b, sortBy) - sortVal(a, sortBy));

  function exportCSV() {
    if (!rows.length) {
      toast("Nothing to export.", true);
      return;
    }
    const head = [
      "Rank", "Name", "Email", "Experience (yrs)", "Fit score", "Fit band",
      "Similarity", "Model score", "Skills matched", "Skills required",
      "Coverage %", "Stage", "Skills",
    ];
    const lines: (string | number)[][] = [head];
    rows.forEach((r, i) => {
      const c = r.rc.candidate;
      const s = r.rc.score;
      const g = r.gap;
      lines.push([
        i + 1, c.full_name, c.email || "", c.experience_years,
        r.final.toFixed(1), bandLabel(band(r.final)),
        ((s.similarity_score || 0) * 100).toFixed(1), (s.llm_score || 0).toFixed(1),
        g ? g.matched.length : "", g ? g.matched.length + g.missing.length : "",
        g ? Math.round(g.coverage * 100) : "", c.status,
        (c.skills || []).join("; "),
      ]);
    });
    const csv = lines.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const name = (job.title || "candidates").replace(/[^\w.-]+/g, "_").slice(0, 60);
    download(csv, name + "-shortlist.csv");
    toast(`Exported ${rows.length} candidate${rows.length !== 1 ? "s" : ""}.`);
  }

  return (
    <>
      <div className="jobhead">
        <h1>{job.title}</h1>
        <div className="chips">
          {(job.required_skills || []).length ? (
            job.required_skills.map((s) => (
              <span className="chip req" key={s}>
                {s}
              </span>
            ))
          ) : (
            <span>No skills detected</span>
          )}
        </div>
        {job.description && (
          <details className="jobdesc" open>
            <summary>Job description</summary>
            <p>{job.description}</p>
          </details>
        )}
      </div>

      {/* upload card */}
      <div className="card">
        <div className="card__title">
          <h3>Screen resumes</h3>
          <span className="hint">PDF · DOCX · TXT · up to 10 files</span>
        </div>
        <div
          className={"drop" + (dragging ? " drag" : "") + (uploading ? " scanning" : "")}
          onClick={(e) => {
            const t = e.target as HTMLElement;
            if (t.classList.contains("drop") || t.tagName === "P" || t.classList.contains("sub"))
              fileInput.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer?.files ?? null);
          }}
        >
          <IconUpload />
          <p>
            Drag resumes here, or{" "}
            <span className="pick" onClick={() => fileInput.current?.click()}>
              browse files
            </span>
          </p>
          <div className="sub">They're parsed, structured, and scored against this job.</div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
        {files.length > 0 && (
          <ul className="filelist">
            {files.map((f, i) => (
              <li key={i}>
                <span className="dotmark" />
                {f.name}
              </li>
            ))}
          </ul>
        )}
        <div className="uploadbar">
          {uploading ? (
            <span className="loadrow">
              <span className="spinner dark" /> Screening {files.length} resume
              {files.length > 1 ? "s" : ""}…
            </span>
          ) : (
            files.length > 0 && (
              <button className="btn" onClick={runUpload}>
                Screen {files.length} resume{files.length > 1 ? "s" : ""}
              </button>
            )
          )}
        </div>
      </div>

      {/* results */}
      <div>
        <div className="card__title" style={{ margin: "4px 2px 14px" }}>
          <h3>Ranked candidates{ranked.length ? " · " + ranked.length : ""}</h3>
          {ranked.length > 0 && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => loadRanked(true).then(() => toast("Scores refreshed."))}
            >
              Re-score
            </button>
          )}
        </div>

        {loading ? (
          <div className="loadrow">
            <span className="spinner dark" /> Scoring candidates…
          </div>
        ) : ranked.length === 0 ? (
          <div className="empty">
            <IconPeople size={40} />
            <h3>No candidates yet</h3>
            <p>
              Upload resumes above and Resume Screener will rank them against this job by
              skill fit and model judgement.
            </p>
          </div>
        ) : (
          <>
            <div className="controls">
              <div className="grp weight">
                <label>Weighting</label>
                <span className="swatch sim" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(weights.sim * 100)}
                  onChange={(e) => {
                    const sim = Math.max(0, Math.min(1, +e.target.value / 100));
                    setWeights({ sim, llm: 1 - sim });
                  }}
                />
                <span className="swatch llm" />
                <span className="wv">
                  Similarity <b>{fmtW(weights.sim)}</b> · Model <b>{fmtW(weights.llm)}</b>
                </span>
              </div>
              <div className="grp">
                <label>Sort</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                  <option value="fit">Fit score</option>
                  <option value="coverage">Skill coverage</option>
                  <option value="experience">Experience</option>
                </select>
              </div>
              <div className="grp">
                <label>Show</label>
                <select value={filterBand} onChange={(e) => setFilterBand(e.target.value as FilterBand)}>
                  <option value="all">All fits</option>
                  <option value="strong">Strong fit</option>
                  <option value="moderate">Moderate fit</option>
                  <option value="weak">Weak fit</option>
                </select>
              </div>
              <div className="grp spacer">
                <button className="btn btn--ghost btn--sm" onClick={exportCSV}>
                  Export CSV
                </button>
              </div>
            </div>

            {required.length > 0 && (
              <div className="reqbar">
                <span className="lbl">Required skills</span>
                {required.map((s) => (
                  <span className="req" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="rank">
              {rows.length === 0 ? (
                <div className="loadrow">No candidates match this filter.</div>
              ) : (
                rows.map((r, i) => (
                  <CandidateCard
                    key={r.rc.candidate.id}
                    rc={r.rc}
                    rank={i}
                    final={r.final}
                    gap={r.gap}
                    required={required}
                    weights={weights}
                    onStatus={(st) => {
                      setRanked((prev) =>
                        prev.map((x) =>
                          x.candidate.id === r.rc.candidate.id
                            ? { ...x, candidate: { ...x.candidate, status: st } }
                            : x
                        )
                      );
                    }}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function sortVal(r: { rc: RankedCandidate; final: number; gap?: CandidateSkillGap }, by: SortBy): number {
  if (by === "coverage") return r.gap ? r.gap.coverage : -1;
  if (by === "experience") return +(r.rc.candidate.experience_years || 0);
  return r.final;
}

function CandidateCard({
  rc,
  rank,
  final,
  gap,
  required,
  weights,
  onStatus,
}: {
  rc: RankedCandidate;
  rank: number;
  final: number;
  gap?: CandidateSkillGap;
  required: string[];
  weights: Weights;
  onStatus: (s: Stage) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState<{ raw_text: string } | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const cand = rc.candidate;
  const sc = rc.score;

  const tilt = use3DTilt({ maxRotation: 6, scale: 1.01 });

  async function toggleDoc() {
    if (doc) {
      setDoc(null);
      return;
    }
    setDocLoading(true);
    try {
      setDoc(await api<{ raw_text: string }>(`/v1/candidates/${cand.id}/document`));
    } catch (e) {
      toast(errorDetail(e), true);
    } finally {
      setDocLoading(false);
    }
  }
  const sim = +(sc.similarity_score || 0);
  const llm = +(sc.llm_score || 0);
  const simContrib = weights.sim * sim * 100;
  const llmContrib = weights.llm * llm;
  const b = band(final);
  const reqTotal = required.length;
  const skills = cand.skills || [];

  return (
    <div
      ref={tilt.ref}
      style={{
        ...tilt.style,
        animationDelay: `${Math.min(rank * 0.08, 0.8)}s`,
      }}
      {...tilt.bind}
      className={"cand" + (rank === 0 ? " top" : "")}
    >
      <div className="cand__glare" style={tilt.glareStyle} />
      <div className="cand__main">
        <div className="cand__num">{String(rank + 1).padStart(2, "0")}</div>
        <div className="cand__id">
          <div className="cand__name">
            {cand.full_name || "Unknown"}
            <span className={"fit " + b}>{bandLabel(b)}</span>
          </div>
          <div className="cand__meta">
            {cand.experience_years != null ? cand.experience_years + " yrs" : "—"} ·{" "}
            {skills.length} skills
            {gap && reqTotal ? (
              <>
                {" "}
                · <span className="cover">{gap.matched.length}/{reqTotal}</span> required skills
              </>
            ) : null}
            {cand.email ? " · " + cand.email : ""}
          </div>
          <div className="meter">
            <div className="meter__track">
              <div className="meter__seg sim" style={{ width: simContrib.toFixed(1) + "%" }} />
              <div className="meter__seg llm" style={{ width: llmContrib.toFixed(1) + "%" }} />
            </div>
            <div className="meter__legend">
              <span>
                <span className="swatch sim" />
                Similarity ×{fmtW(weights.sim)} · <b>{(sim * 100).toFixed(1)}</b>
              </span>
              <span>
                <span className="swatch llm" />
                Model judgement ×{fmtW(weights.llm)} · <b>{llm.toFixed(1)}</b>
              </span>
            </div>
          </div>
        </div>
        <div className="cand__final">
          <div className="n" style={{ color: `var(--${b})` }}>
            {final.toFixed(1)}
          </div>
          <div className="l">Fit score</div>
        </div>
      </div>

      <div className="cand__why">
        <p>{sc.llm_reasoning ? `“${sc.llm_reasoning}”` : "No reasoning provided."}</p>
        <div className="cand__actions">
          <StageSelect
            candidateId={cand.id}
            fullName={cand.full_name}
            status={cand.status}
            onChanged={onStatus}
          />
          <button className="cand__toggle" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide details" : "Details"}
          </button>
        </div>
      </div>

      <div className={"cand__detail" + (open ? " open" : "")}>
        {gap && reqTotal ? (
          <DetailRow
            k="Skill match"
            v={
              <div className="miniskills">
                {gap.matched.map((s) => (
                  <span className="miniskill have" key={s}>
                    {s}
                  </span>
                ))}
                {gap.missing.map((s) => (
                  <span className="miniskill miss" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            }
          />
        ) : null}
        <DetailRow
          k="Contact"
          v={[cand.email, cand.phone].filter(Boolean).join(" · ") || "—"}
        />
        <DetailRow
          k="Skills"
          v={
            skills.length ? (
              <div className="miniskills">
                {skills.map((s) => (
                  <span className="miniskill" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              "—"
            )
          }
        />
        <DetailRow
          k="Education"
          v={
            (cand.education || []).length
              ? cand.education
                  .map((ed) => [ed.degree, ed.institution, ed.year].filter(Boolean).join(", "))
                  .join(" · ")
              : "—"
          }
        />
        <DetailRow
          k="Résumé"
          v={
            <>
              <button className="cand__toggle" onClick={toggleDoc} disabled={docLoading}>
                {docLoading ? "Loading…" : doc ? "Hide stored résumé" : "View stored résumé"}
              </button>
              <span className="docsrc"> · from MongoDB</span>
              {doc && <pre className="docraw">{doc.raw_text}</pre>}
            </>
          }
        />
      </div>
    </div>
  );
}

function DetailRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="detailrow">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function download(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
