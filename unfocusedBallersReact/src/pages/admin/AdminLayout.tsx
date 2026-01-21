import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs uppercase tracking-[0.3em] ${
    isActive ? "font-semibold text-black underline" : "text-black/60 hover:text-black"
  }`;

const AdminLayout = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
      <aside className="border border-black/10 bg-white p-4 shadow-card">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Admin</p>
          <nav className="flex flex-wrap gap-4 lg:flex-col">
            <NavLink to="/admin" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/players" className={linkClass}>
              Players
            </NavLink>
            <NavLink to="/admin/teams" className={linkClass}>
              Teams
            </NavLink>
            <NavLink to="/admin/tournaments" className={linkClass}>
              Tournaments
            </NavLink>
            <NavLink to="/admin/bracket" className={linkClass}>
              Bracket
            </NavLink>
          </nav>
        </div>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
