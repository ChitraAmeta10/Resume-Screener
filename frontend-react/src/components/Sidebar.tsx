import {
  Logo,
  IconGrid,
  IconPeople,
  IconKanban,
  IconLogout,
  IconTrash,
  IconChevronLeft,
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
      <div className="sidebar__brand">
        <Logo size={26} />
      </div>

      <div className="sidebar__scroll">
        <nav className="sidenav">
          <NavItem active={view === "dashboard"} onClick={() => onNav("dashboard")} icon={<IconGrid />} label="Overview" />
          <NavItem active={view === "pool"} onClick={() => onNav("pool")} icon={<IconPeople />} label="All candidates" />
          <NavItem active={view === "pipeline"} onClick={() => onNav("pipeline")} icon={<IconKanban />} label="Pipeline" />
        </nav>

        <div className="sidebar__head">
          <span className="lbl">
            Jobs <span className="count">{jobs.length}</span>
          </span>
          <button className="btn btn--sm" onClick={onNewJob} title="New job">
            New job
          </button>
        </div>

        <div className="joblist">
          {jobs.length === 0 ? (
            <p className="joblist__empty">No jobs yet.</p>
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
                  <span className="jobitem__body">
                    <span className="t">{j.title}</span>
                  </span>
                  <button
                    className="jobitem__del"
                    title="Delete job"
                    aria-label="Delete job"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteJob(j.id, j.title);
                    }}
                  >
                    <IconTrash />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <button
        className="sidebar__collapse"
        onClick={onToggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <IconChevronLeft />
      </button>

      <div className="sidebar__user">
        <span className="avatar">{(user.email[0] || "?").toUpperCase()}</span>
        <div className="uinfo">
          <span className="uname">{user.email}</span>
          <span className="urole">{user.role}</span>
        </div>
        <button className="iconbtn" title="Sign out" aria-label="Sign out" onClick={onLogout}>
          <IconLogout />
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
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className={"navitem" + (active ? " active" : "")} onClick={onClick} title={label}>
      <span className="ni">{icon}</span>
      <span className="nl">{label}</span>
    </button>
  );
}
