import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Player = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

type CreatePlayerResponse = {
  user: Player;
  generatedPassword: string;
};

const AdminPlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.post<CreatePlayerResponse>("/admin/players", {
        email,
        fullName
      });
      setGeneratedPassword(data.generatedPassword);
      setEmail("");
      setFullName("");
      await loadPlayers();
    } catch {
      setError("We couldn't create the player. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Players</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
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
            <button
              type="submit"
              disabled={submitting}
              className="w-full border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Player"}
            </button>
          </form>
          {generatedPassword && (
            <div className="mt-4 border border-black/10 bg-white p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                Generated Password
              </p>
              <p className="mt-2 font-semibold text-black">{generatedPassword}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black/50">
                Copy this now. It will not be shown again.
              </p>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="border border-black/10 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Players List</p>
          {loading ? (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/50">
              Loading players...
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {players.map((player) => (
                <div key={player.id} className="border border-black/10 px-4 py-3 text-sm">
                  <p className="font-semibold text-black">{player.fullName}</p>
                  <p className="text-black/60">{player.email}</p>
                </div>
              ))}
              {players.length === 0 && (
                <div className="border border-dashed border-black/20 p-4 text-sm text-black/60">
                  No players yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminPlayers;
