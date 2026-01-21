import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Tournament = {
  id: string;
  name: string;
  location: string | null;
  startTime: string | null;
  formatSnippet: string;
  status: string;
};

const statusOptions = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "TEAMS_LOCKED",
  "IN_PROGRESS",
  "COMPLETED"
];

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTournaments = async () => {
    const data = await api.get<{ tournaments: Tournament[] }>("/admin/tournaments");
    setTournaments(data.tournaments ?? []);
  };

  useEffect(() => {
    let active = true;
    api
      .get<{ tournaments: Tournament[] }>("/admin/tournaments")
      .then((data) => {
        if (!active) return;
        setTournaments(data.tournaments ?? []);
      })
      .catch(() => {
        if (!active) return;
        setError("We couldn't load tournaments right now. Please try again.");
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
    try {
      await api.post("/admin/tournaments", {
        name,
        location: location || undefined,
        startTime: startTime || undefined
      });
      setName("");
      setLocation("");
      setStartTime("");
      await loadTournaments();
    } catch {
      setError("We couldn't create the tournament. Please try again.");
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setError(null);
    try {
      await api.patch(`/admin/tournaments/${selected.id}`, {
        name: selected.name,
        location: selected.location,
        startTime: selected.startTime,
        status: selected.status
      });
      await loadTournaments();
    } catch {
      setError("We couldn't update the tournament. Please try again.");
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tournaments</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <div className="border border-black/10 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Create</p>
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
              Location
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
              Start Time
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
            >
              Create Tournament
            </button>
          </form>
        </div>

        <div className="border border-black/10 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Manage</p>
          {loading ? (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/50">
              Loading tournaments...
            </p>
          ) : tournaments.length === 0 ? (
            <div className="mt-4 border border-dashed border-black/20 p-4 text-sm text-black/60">
              No tournaments available yet.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <select
                value={selected?.id ?? ""}
                onChange={(event) => {
                  const next = tournaments.find((t) => t.id === event.target.value) ?? null;
                  setSelected(next ? { ...next } : null);
                }}
                className="w-full border border-black/10 px-3 py-2 text-sm"
              >
                <option value="">Select tournament</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>

              {selected && (
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                    Name
                    <input
                      type="text"
                      value={selected.name}
                      onChange={(event) =>
                        setSelected((prev) =>
                          prev ? { ...prev, name: event.target.value } : prev
                        )
                      }
                      className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                    Location
                    <input
                      type="text"
                      value={selected.location ?? ""}
                      onChange={(event) =>
                        setSelected((prev) =>
                          prev ? { ...prev, location: event.target.value } : prev
                        )
                      }
                      className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                    Start Time
                    <input
                      type="datetime-local"
                      value={selected.startTime ?? ""}
                      onChange={(event) =>
                        setSelected((prev) =>
                          prev ? { ...prev, startTime: event.target.value } : prev
                        )
                      }
                      className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                    Status
                    <select
                      value={selected.status}
                      onChange={(event) =>
                        setSelected((prev) =>
                          prev ? { ...prev, status: event.target.value } : prev
                        )
                      }
                      className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    className="w-full border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {!selected && (
                <p className="text-sm text-black/60">
                  Select a tournament to update details.
                </p>
              )}
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  );
};

export default AdminTournaments;
