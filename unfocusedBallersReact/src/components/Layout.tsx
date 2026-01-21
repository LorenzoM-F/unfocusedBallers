import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = () => {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-black">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-pitch-100/70 blur-3xl" />
        <div className="absolute right-0 top-56 h-80 w-80 rounded-full bg-black/5 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-64 w-[120%] -translate-x-1/2 bg-gradient-to-b from-black/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-12 h-48 w-48 rounded-full border border-black/10 opacity-60" />
      </div>
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
