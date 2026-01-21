import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type Player = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string | null;
};

type CreatePlayerResponse = {
  user: Player;
  generatedPassword: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const AdminPlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPlayers = async () => {
    const data = await api.get<{ players: Player[] }>("/admin/players");
    setPlayers(data.players ?? []);
  };

  useEffect(() => {
    let active = true;
    api
      .get<{ players: Player[] }>("/admin/players")
      .then((data) => {
        if (!active) return;
        setPlayers(data.players ?? []);
      })
      .catch(() => {
        if (!active) return;
        setError("We couldn't load players right now. Please try again.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [players]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFormError(null);

    if (!email.trim() || !fullName.trim()) {
      setFormError("Email and full name are required.");
      return;
    }

    if (!emailRegex.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post<CreatePlayerResponse>("/admin/players", {
        email,
        fullName
      });
      setGeneratedPassword(data.generatedPassword);
      setShowModal(true);
      setCopied(false);
      setEmail("");
      setFullName("");
      await loadPlayers();
    } catch {
      setError("We couldn't create the player. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Players</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.4fr]">
        <div className="border border-black/10 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Create Player</p>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
              Full Name
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                required
              />
            </label>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Player"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="border border-black/10 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Players List</p>
          {loading ? (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/50">
              Loading players...
            </p>
          ) : sortedPlayers.length === 0 ? (
            <div className="mt-4 border border-dashed border-black/20 p-4 text-sm text-black/60">
              No players yet.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-black/50">
                  <tr className="border-b border-black/10">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player) => (
                    <tr key={player.id} className="border-b border-black/10">
                      <td className="py-3 pr-4 font-semibold text-black">
                        {player.fullName}
                      </td>
                      <td className="py-3 pr-4 text-black/70">{player.email}</td>
                      <td className="py-3 pr-4 text-black/60">
                        {formatDate(player.createdAt)}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          disabled
                          className="border border-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-black/40"
                        >
                          Reset password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && generatedPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md border border-black/10 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Generated Password
                </p>
                <p className="mt-2 text-lg font-semibold text-black">
                  {generatedPassword}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black/50">
                  Copy this now. It will not be shown again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs uppercase tracking-[0.2em] text-black/50 hover:text-black"
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              {!copied && (
                <span className="text-xs uppercase tracking-[0.2em] text-black/50">
                  Click to copy
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminPlayers;
