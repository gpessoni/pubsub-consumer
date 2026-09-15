import { NavLink, Outlet } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import { useHealthQuery } from "../hooks/queries";

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M4 12h16" strokeLinecap="round" />
      <path d="M4 17h10" strokeLinecap="round" />
    </svg>
  );
}

function PlaygroundIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 9l-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6l-2 12" strokeLinecap="round" />
    </svg>
  );
}

function LiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h2l2-6 4 12 2-6h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HealthBadge() {
  const { data, isError, isLoading } = useHealthQuery();

  let tone: "good" | "critical" | undefined;
  let label = "Verificando API...";
  if (!isLoading) {
    if (isError) {
      tone = "critical";
      label = "API offline";
    } else if (data?.status === "ok") {
      tone = "good";
      label = "API online";
    }
  }

  return (
    <span className={`badge${tone ? ` badge--${tone}` : ""}`} title={API_BASE_URL} style={{ width: "100%" }}>
      <span className="badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export function Layout() {
  return (
    <>
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand__mark" aria-hidden="true">
            O
          </span>
          <span className="app-brand__text">
            <span className="app-brand__title">orders-web</span>
            <span className="app-brand__subtitle">Console de pedidos</span>
          </span>
        </div>

        <span className="app-nav__section-label">Menu</span>
        <nav className="app-nav__links">
          <NavLink to="/" end className={({ isActive }) => `app-nav__link${isActive ? " active" : ""}`}>
            <DashboardIcon />
            Dashboard
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `app-nav__link${isActive ? " active" : ""}`}>
            <OrdersIcon />
            Pedidos
          </NavLink>
          <NavLink to="/live" className={({ isActive }) => `app-nav__link${isActive ? " active" : ""}`}>
            <LiveIcon />
            Mensagens ao vivo
          </NavLink>
          <NavLink to="/playground" className={({ isActive }) => `app-nav__link${isActive ? " active" : ""}`}>
            <PlaygroundIcon />
            API Playground
          </NavLink>
        </nav>

        <div className="app-sidebar__spacer" />

        <div className="app-sidebar__footer">
          <HealthBadge />
        </div>
      </aside>

      <div className="app-shell">
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
