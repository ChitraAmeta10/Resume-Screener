import { useCallback, useEffect, useState } from "react";
import { api, errorDetail, setUnauthorizedHandler, tokenStore } from "./api";
import { useToast } from "./toast";
import LandingPage from "./components/landing/LandingPage";
import AuthView from "./components/AuthView";
import Sidebar, { type View } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TalentPool from "./components/TalentPool";
import PipelineBoard from "./components/PipelineBoard";
import JobDetail from "./components/JobDetail";
import type { Job, User } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(tokenStore.get());
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }
    let alive = true;
    api<User>("/v1/auth/me")
      .then((u) => alive && setUser(u))
      .catch(() => alive && logout())
      .finally(() => alive && setBooting(false));
    return () => {
      alive = false;
    };
  }, [token, logout]);

  if (booting) return null;
  if (!user)
    return (
      <LandingPage
        onAuthed={(tok) => {
          tokenStore.set(tok);
          setBooting(true);
          setToken(tok);
        }}
      />
    );

  return <AppShell user={user} onLogout={logout} />;
}

function AppShell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sift_sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("sift_sidebar_collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const loadJobs = useCallback(async () => {
    try {
      setJobs(await api<Job[]>("/v1/jobs"));
    } catch (e) {
      toast(errorDetail(e), true);
    }
  }, [toast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function selectJob(id: string) {
    setSelectedJobId(id);
    setView("job");
  }

  async function deleteJob(id: string, title: string) {
    if (!window.confirm(`Delete “${title}” and all its candidates? This can't be undone.`)) return;
    try {
      await api(`/v1/jobs/${id}`, { method: "DELETE" });
      if (selectedJobId === id) {
        setSelectedJobId(null);
        setView("dashboard");
      }
      await loadJobs();
      toast("Job deleted.");
    } catch (e) {
      toast(errorDetail(e), true);
    }
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  return (
    <div className={"layout" + (collapsed ? " collapsed" : "")}>
      <Sidebar
        user={user}
        view={view}
        jobs={jobs}
        selectedJobId={selectedJobId}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        onNav={(v) => {
          if (v !== "job") setSelectedJobId(null);
          setView(v);
        }}
        onSelectJob={selectJob}
        onNewJob={() => setModalOpen(true)}
        onDeleteJob={deleteJob}
        onLogout={onLogout}
      />

      <main className="content">
        {view === "dashboard" && (
          <Dashboard user={user} onOpenJob={selectJob} onNewJob={() => setModalOpen(true)} />
        )}
        {view === "pool" && <TalentPool onOpenJob={selectJob} />}
        {view === "pipeline" && <PipelineBoard onOpenJob={selectJob} />}
        {view === "job" && selectedJob && <JobDetail key={selectedJob.id} job={selectedJob} />}
        {view === "job" && !selectedJob && (
          <div className="empty">
            <h3>Pick a job to begin</h3>
          </div>
        )}
      </main>

      {modalOpen && (
        <NewJobModal
          onClose={() => setModalOpen(false)}
          onCreated={async (id) => {
            setModalOpen(false);
            await loadJobs();
            selectJob(id);
          }}
        />
      )}
    </div>
  );
}

function NewJobModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (jobId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!title.trim() || !description.trim()) {
      setMsg("Add a title and a description.");
      return;
    }
    setBusy(true);
    try {
      const job = await api<Job>("/v1/jobs", {
        method: "POST",
        json: { title: title.trim(), description: description.trim() },
      });
      onCreated(job.id);
    } catch (e) {
      setMsg(errorDetail(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__box">
        <h3>New job</h3>
        <p className="lede">
          Paste the job description — Resume Screener extracts the required skills
          automatically.
        </p>
        <div className="field">
          <label htmlFor="jobTitle">Job title</label>
          <input
            id="jobTitle"
            type="text"
            placeholder="Senior Backend Engineer"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="jobDesc">Description</label>
          <textarea
            id="jobDesc"
            placeholder="Describe the role, responsibilities, and required skills…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {msg && <div className="formmsg show err">{msg}</div>}
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn" onClick={create} disabled={busy}>
            {busy ? <span className="spinner" /> : "Create job"}
          </button>
        </div>
      </div>
    </div>
  );
}
