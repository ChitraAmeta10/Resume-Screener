import { useState } from "react";
import { api, errorDetail } from "../api";
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
      setMsg(login ? "Email or password doesn't match. Try again." : errorDetail(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth">
      <div className="auth__brand">
        <div className="mark">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <rect x="4" y="6" width="22" height="4.4" rx="2.2" fill="#8FE3BE" />
            <rect x="4" y="13" width="16" height="4.4" rx="2.2" fill="#4FBF8B" />
            <rect x="4" y="20" width="9" height="4.4" rx="2.2" fill="#2C9C6A" />
          </svg>
          <span className="word">Resume Screener</span>
        </div>

        <div className="brand__mid">
          <h2 className="brand__thesis">Rank every applicant against the role.</h2>
          <p className="brand__sub">
            Parse resumes, extract structured profiles, and score candidates on real fit
            — in one pass.
          </p>

          <div className="brand__card" aria-hidden="true">
            <div className="ch">Ranked shortlist · preview</div>
            <PreviewRow rank="01" name="Jane Doe" sub="Senior Backend Engineer" score={74} width="74%" />
            <PreviewRow rank="02" name="Arjun Mehta" sub="Backend Developer" score={52} width="52%" />
            <PreviewRow rank="03" name="Maria Santos" sub="Software Engineer" score={31} width="31%" />
          </div>
        </div>

        <p className="brand__foot">PDF · DOCX · TXT → ranked shortlist</p>
      </div>

      <div className="auth__panel">
        <div className="authcard">
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
              Sign in
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
              Create account
            </button>
          </div>

          <h1>{login ? "Welcome back" : "Create your account"}</h1>
          <p className="lede">
            {login
              ? "Sign in to screen resumes and rank candidates."
              : "Start screening resumes in under a minute."}
          </p>

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
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
                <label>Role</label>
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

            <button className="btn btn--block" type="submit" disabled={busy}>
              {busy ? <span className="spinner" /> : login ? "Sign in" : "Create account"}
            </button>
            {msg && <div className="formmsg show err">{msg}</div>}
          </form>

          {login && (
            <div className="authhint">
              Just reviewing?{" "}
              <button
                type="button"
                onClick={() => {
                  setEmail("recruiter@email.com");
                  setPassword("password1");
                  setMsg("");
                }}
              >
                Use the demo account
              </button>
            </div>
          )}
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
}: {
  rank: string;
  name: string;
  sub: string;
  score: number;
  width: string;
}) {
  return (
    <div>
      <div className="pcrow">
        <span className="rk">{rank}</span>
        <div>
          <div className="nm">{name}</div>
          <div className="sub">{sub}</div>
        </div>
        <span className="sc">{score}</span>
      </div>
      <div className="pcmeter">
        <span style={{ width }} />
      </div>
    </div>
  );
}
