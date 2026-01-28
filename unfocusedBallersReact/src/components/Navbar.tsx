import { NavLink } from "react-router-dom";
import logo from "../assets/IMG_4836.png";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-[0.68rem] uppercase tracking-[0.3em] transition ${
    isActive
      ? "text-black"
      : "text-black/60 hover:text-black hover:translate-y-[-1px]"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isLoggedIn = Boolean(user);

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <NavLink to="/" className="group flex items-center gap-3">
          <img
            src={logo}
            alt="Unfocused Ballers"
            className="h-11 w-11 rounded-full object-cover ring-1 ring-black/10 transition group-hover:ring-black/30"
          />
          <div>
            <span className="text-xs uppercase tracking-[0.35em] text-black/40">
              Unfocused
            </span>
            <span className="block text-lg font-semibold tracking-tight">
            Unfocused Ballers
            </span>
          </div>
        </NavLink>
        <nav className="flex flex-wrap items-center gap-5 text-xs">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/tournaments" className={navLinkClass}>
            Tournaments
          </NavLink>
          <NavLink to="/bracket" className={navLinkClass}>
            Bracket
          </NavLink>
          <NavLink to="/stats" className={navLinkClass}>
            Stats
          </NavLink>
          <NavLink to="/teams" className={navLinkClass}>
            Teams
          </NavLink>
          <NavLink to="/gallery" className={navLinkClass}>
            Gallery
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            Profile
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-black/20 px-4 py-2 text-[0.68rem] uppercase tracking-[0.3em] text-black/70 transition hover:border-black hover:text-black"
            >
              Logout
            </button>
          ) : (
            <NavLink
              to="/login"
              className="rounded-full border border-black/20 px-4 py-2 text-[0.68rem] uppercase tracking-[0.3em] text-black/70 transition hover:border-black hover:text-black"
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
