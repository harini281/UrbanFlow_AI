import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPinned,
  TrendingUp,
  GitBranch,
  BrainCircuit,
  CarFront,
  BarChart3,
  Activity,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const navigation = [
  {
    path: "/",
    label: "Overview",
    description: "Mobility overview",
    icon: LayoutDashboard,
  },
  {
    path: "/zones",
    label: "Zones",
    description: "Zone intelligence",
    icon: MapPinned,
  },
  {
    path: "/demand",
    label: "Demand",
    description: "Demand forecasting",
    icon: TrendingUp,
  },
  {
    path: "/flows",
    label: "OD Flows",
    description: "Mobility corridors",
    icon: GitBranch,
  },
  {
    path: "/predictions",
    label: "Predictions",
    description: "AI predictions",
    icon: BrainCircuit,
  },
  {
    path: "/operations",
    label: "Fleet Operations",
    description: "Fleet optimization",
    icon: CarFront,
  },
  {
    path: "/models",
    label: "Models",
    description: "Model performance",
    icon: BarChart3,
  },
];

function getPageName(pathname: string) {
  const item = navigation.find((item) =>
    item.path === "/"
      ? pathname === "/"
      : pathname.startsWith(item.path)
  );

  return item?.label ?? "Urban Mobility Intelligence";
}

export default function AppShell() {
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("urbanflow-theme");

    if (saved === "light") return false;
    if (saved === "dark") return true;

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );

    localStorage.setItem(
      "urbanflow-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Activity size={18} strokeWidth={2.2} />
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              UrbanFlow <span>AI</span>
            </div>

            <div className="brand-team">
              TEAM NOESIS · CODEFEST 2026
            </div>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* SYSTEM STATUS */}
        <div className="system-status">
          <span className="status-dot" />
          <span>ALL SYSTEMS OPERATIONAL</span>
        </div>

        {/* NAVIGATION */}
        <div className="nav-section-label">INTELLIGENCE</div>

        <nav className="sidebar-nav">
          {navigation.map(
            ({ path, label, description, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">
                  <Icon size={17} strokeWidth={1.9} />
                </span>

                <span className="nav-copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>

                <ChevronRight
                  className="nav-arrow"
                  size={14}
                  strokeWidth={1.8}
                />
              </NavLink>
            )
          )}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="sidebar-footer">
          <div className="footer-card">
            <div className="footer-icon">
              <Activity size={14} />
            </div>

            <div>
              <div className="footer-label">DATA ENGINE</div>
              <div className="footer-value">Connected</div>
            </div>

            <span className="footer-online" />
          </div>

          <div className="footer-meta">
            <span>UrbanFlow AI</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* MAIN APPLICATION */}
      <main className="app-main">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <div className="breadcrumb">
              <span>UrbanFlow AI</span>
              <ChevronRight size={13} />
              <strong>{getPageName(location.pathname)}</strong>
            </div>
          </div>

          <div className="topbar-right">
            {/* DATA STATUS */}
            <div className="data-status">
              <span className="status-dot" />
              <span>LIVE DATA</span>
            </div>

            {/* THEME SWITCH */}
            <button
              className="theme-toggle"
              onClick={() => setDarkMode((value) => !value)}
              aria-label={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {darkMode ? (
                <Sun size={17} strokeWidth={1.9} />
              ) : (
                <Moon size={17} strokeWidth={1.9} />
              )}
            </button>

            {/* API STATUS */}
            <div className="api-status">
              <Activity size={14} />
              <span>API CONNECTED</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}