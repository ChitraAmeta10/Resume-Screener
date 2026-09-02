import {
  IconGrid,
  IconPeople,
  IconKanban,
  IconLogout,
  IconTrash,
  IconChevronLeft,
  IconSparkle,
} from "../icons";
import type { Job, User } from "../types";

export type View = "dashboard" | "pool" | "pipeline" | "job";

interface Props {
  user: User;
  view: View;
  jobs: Job[];
  selectedJobId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onNav: (view: View) => void;
  onSelectJob: (id: string) => void;
  onNewJob: () => void;
  onDeleteJob: (id: string, title: string) => void;
  onLogout: () => void;
}

export default function Sidebar({
  user,
  view,
  jobs,
  selectedJobId,
  collapsed,
  onToggle,
  onNav,
  onSelectJob,
  onNewJob,
  onDeleteJob,
  onLogout,
}: Props) {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar__brand" onClick={() => onNav("dashboard")}>
        <span className="sidebar__brand-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-title">Resume Screener</span>
            <span className="sidebar__brand-badge">AI</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="sidebar__scroll">
        <nav className="sidenav">
          <NavItem
            active={view === "dashboard"}
            onClick={() => onNav("dashboard")}
            icon={<IconGrid size={18} />}
            label="Overview"
            collapsed={collapsed}
          />
          <NavItem
            active={view === "pool"}
            onClick={() => onNav("pool")}
            icon={<IconPeople size={18} />}
            label="All Candidates"
            collapsed={collapsed}
          />
          <NavItem
            active={view === "pipeline"}
            onClick={() => onNav("pipeline")}
            icon={<IconKanban size={18} />}
            label="Pipeline"
            collapsed={collapsed}
          />
        </nav>

        {/* Jobs Section */}
        <div className="sidebar__section">
          {!collapsed && (
            <div className="sidebar__head">
              <span className="lbl">
                Active Jobs <span className="count">{jobs.length}</span>
              </span>
              <button className="sidebar__add-btn" onClick={onNewJob} title="Create New Job">
                New Job
              </button>
            </div>
          )}

          <div className="joblist">
            {jobs.length === 0 ? (
              !collapsed && <p className="joblist__empty">No active jobs yet.</p>
            ) : (
              jobs.map((j) => {
                const active = view === "job" && j.id === selectedJobId;
                const initial = (j.title || "?").trim().charAt(0).toUpperCase() || "?";
                return (
                  <div
                    key={j.id}
                    className={"jobitem" + (active ? " active" : "")}
                    onClick={() => onSelectJob(j.id)}
                    title={j.title}
                  >
                    <span className="jobitem__badge">{initial}</span>
                    {!collapsed && (
                      <>
                        <span className="jobitem__body">
                          <span className="t">{j.title}</span>
                        </span>
                        <button
                          className="jobitem__del"
                          title="Delete Job"
                          aria-label="Delete Job"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteJob(j.id, j.title);
                          }}
                        >
                          <IconTrash size={14} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        className="sidebar__collapse"
        onClick={onToggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <IconChevronLeft size={16} style={{ transform: collapsed ? "rotate(180deg)" : "none" }} />
      </button>

      {/* User Footer */}
      <div className="sidebar__user">
        <div className="avatar">{(user.email[0] || "U").toUpperCase()}</div>
        {!collapsed && (
          <div className="uinfo">
            <span className="uname">{user.email}</span>
            <span className="urole">{user.role}</span>
          </div>
        )}
        <button className="iconbtn" title="Sign Out" aria-label="Sign Out" onClick={onLogout}>
          <IconLogout size={16} />
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
  collapsed,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}) {
  return (
    <button className={"navitem" + (active ? " active" : "")} onClick={onClick} title={label}>
      <span className="ni">{icon}</span>
      {!collapsed && <span className="nl">{label}</span>}
    </button>
  );
}
