import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const redirect = (location.state as { from?: Location })?.from?.pathname;
      navigate(redirect ?? "/profile", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Login</h1>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-xs uppercase tracking-[0.2em] text-black/60">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-none border border-black/10 px-3 py-2 text-sm"
            required
          />
        </label>
        <label className="block text-xs uppercase tracking-[0.2em] text-black/60">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-none border border-black/10 px-3 py-2 text-sm"
            required
          />
        </label>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
};

export default Login;
