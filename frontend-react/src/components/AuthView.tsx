import { useState } from "react";
import { api, errorDetail } from "../api";
import { IconSparkle, IconUpload, IconGauge } from "../icons";
import type { Role } from "../types";

interface Props {
  onAuthed: (token: string) => void;
}

interface TokenResp {
  access_token: string;
}

export default function AuthView({ onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("recruiter");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const login = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!email || !password) {
      setMsg("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      if (!login) {
        await api("/v1/auth/register", {
          method: "POST",
          json: { email, password, role },
          auth: false,
        });
      }
      const tok = await api<TokenResp>("/v1/auth/login", {
        method: "POST",
        form: new URLSearchParams({ username: email, password }),
        auth: false,
      });
      onAuthed(tok.access_token);
    } catch (err) {
      setMsg(login ? "Invalid email or password. Please try again." : errorDetail(err));
    } finally {
      setBusy(false);
    }
  }

  const fillDemo = () => {
    setEmail("demo.recruiter@example.com");
    setPassword("password1");
    setMsg("");
  };

  return (
    <section className="auth">
      {/* Left Brand Showcase Panel */}
      <div className="auth__brand">
        <div className="auth__brand-header">
          <div className="lnav__brand">
            <span className="lnav__logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="lnav__title">
              Resume Screener <span className="lnav__dot">AI</span>
            </span>
          </div>

          <h2 className="brand__thesis">
            Screen & Rank Candidates with <span className="gradient-text">3D Precision</span>.
          </h2>
          <p className="brand__sub">
            Sub-second XML parsing, dual-engine semantic scoring, and bias-free candidate leaderboards.
          </p>
        </div>

        {/* Live Shortlist Preview Card */}
        <div className="brand__card">
          <div className="brand__card-head">
            <span className="ch">Live Ranked Shortlist</span>
            <span className="status-dot">● Engine Ready</span>
          </div>

          <div className="brand__card-list">
            <PreviewRow
              rank="01"
              name="Chitra Ameta"
              sub="Senior AI Backend Lead"
              score="96.4"
              width="96%"
              tag="strong"
            />
            <PreviewRow
              rank="02"
              name="Alex Rivera"
              sub="Full-Stack Web Architect"
              score="91.0"
              width="91%"
              tag="strong"
            />
            <PreviewRow
              rank="03"
              name="Elena Rostova"
              sub="ML Platform Engineer"
              score="88.5"
              width="88%"
              tag="moderate"
            />
          </div>
        </div>

        {/* Architectural Highlights */}
        <div className="auth__brand-chips">
          <span className="chip">⚡ 0.002s XML Parser</span>
          <span className="chip">🎯 Dual-Engine Score</span>
          <span className="chip">🔒 Zero Data Leakage</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth__panel">
        <div className="authcard">
          {/* Mode Switcher */}
          <div className="tabs" role="tablist">
            <button
              className={login ? "active" : ""}
              role="tab"
              type="button"
              onClick={() => {
                setMode("login");
                setMsg("");
              }}
            >
              Sign In
            </button>
            <button
              className={!login ? "active" : ""}
              role="tab"
              type="button"
              onClick={() => {
                setMode("register");
                setMsg("");
              }}
            >
              Create Account
            </button>
          </div>

          <h1>{login ? "Welcome back" : "Create your account"}</h1>
          <p className="lede">
            {login
              ? "Sign in to access your jobs and candidate pipelines."
              : "Set up your free workspace in under 30 seconds."}
          </p>

          {/* Quick Demo Access Button */}
          {login && (
            <button type="button" className="auth__demo-btn" onClick={fillDemo}>
              <IconSparkle size={14} /> Auto-Fill Demo Recruiter Credentials
            </button>
          )}

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="pwwrap">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete={login ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="pwtoggle"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {!login && (
              <div className="field">
                <label>Account Role</label>
                <div className="roletoggle">
                  <button
                    type="button"
                    className={role === "recruiter" ? "active" : ""}
                    onClick={() => setRole("recruiter")}
                  >
                    Recruiter
                  </button>
                  <button
                    type="button"
                    className={role === "admin" ? "active" : ""}
                    onClick={() => setRole("admin")}
                  >
                    Admin
                  </button>
                </div>
              </div>
            )}

            {msg && <div className="msg">{msg}</div>}

            <button className="btn btn--block" type="submit" disabled={busy} style={{ width: "100%", padding: "12px", marginTop: "10px" }}>
              {busy ? <span className="spinner" /> : <><IconSparkle size={15} /> {login ? "Sign In to Workspace" : "Create Free Account"}</>}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function PreviewRow({
  rank,
  name,
  sub,
  score,
  width,
  tag,
}: {
  rank: string;
  name: string;
  sub: string;
  score: string;
  width: string;
  tag: "strong" | "moderate";
}) {
  return (
    <div className="auth-prow">
      <div className="auth-prow__top">
        <span className="auth-prow__rank">{rank}</span>
        <div className="auth-prow__info">
          <div className="auth-prow__name">{name}</div>
          <div className="auth-prow__sub">{sub}</div>
        </div>
        <span className={`fit ${tag}`}>{score} Fit</span>
      </div>
      <div className="auth-prow__meter">
        <div className="auth-prow__fill" style={{ width }} />
      </div>
    </div>
  );
}
