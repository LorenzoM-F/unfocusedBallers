import { useEffect, useMemo, useState } from "react";
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

const STORAGE_KEY = "adminSelectedTournamentId";

const toIsoWithOffset = (value: string) => {
  if (!value) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const AdminTournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, Partial<Tournament>>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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
        const loaded = data.tournaments ?? [];
        setTournaments(loaded);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && loaded.some((t) => t.id === stored)) {
          setSelectedTournamentId(stored);
        } else if (loaded[0]) {
          setSelectedTournamentId(loaded[0].id);
        }
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
    setFormError(null);
    if (!name.trim()) {
      setFormError("Tournament name is required.");
      return;
    }
    try {
      await api.post("/admin/tournaments", {
        name: name.trim(),
        location: location || undefined,
        startTime: startTime ? toIsoWithOffset(startTime) : undefined
      });
      setName("");
      setLocation("");
      setStartTime("");
      await loadTournaments();
    } catch {
      setError("We couldn't create the tournament. Please try again.");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setError(null);
    try {
      await api.patch(`/admin/tournaments/${id}`, { status });
      await loadTournaments();
    } catch {
      setError("We couldn't update the tournament status. Please try again.");
    }
  };

  const handleEditToggle = (tournament: Tournament) => {
    setEditingId(tournament.id);
    setEditValues((prev) => ({
      ...prev,
      [tournament.id]: {
        name: tournament.name,
        location: tournament.location,
        startTime: tournament.startTime
      }
    }));
  };

  const handleSaveEdit = async (id: string) => {
    const payload = editValues[id];
    if (!payload) return;
    setError(null);
    try {
      await api.patch(`/admin/tournaments/${id}`, {
        ...payload,
        startTime: payload.startTime ? toIsoWithOffset(payload.startTime) : payload.startTime
      });
      setEditingId(null);
      await loadTournaments();
    } catch {
      setError("We couldn't update the tournament. Please try again.");
    }
  };

  const handleSelectTournament = (value: string) => {
    setSelectedTournamentId(value);
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const selectedTournament = useMemo(() => {
    return tournaments.find((tournament) => tournament.id === selectedTournamentId);
  }, [tournaments, selectedTournamentId]);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tournaments</h1>
      </div>

      <div className="border border-black/10 bg-white p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">
          Selected Tournament
        </p>
        <div className="mt-4 max-w-sm">
          <select
            value={selectedTournamentId}
            onChange={(event) => handleSelectTournament(event.target.value)}
            className="w-full border border-black/10 bg-white px-3 py-2 text-sm shadow-card"
          >
            <option value="">Select tournament</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
          {selectedTournament && (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black/50">
              Active: {selectedTournament.name}
            </p>
          )}
        </div>
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
            {formError && <p className="text-sm text-red-600">{formError}</p>}
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
              {tournaments.map((tournament) => {
                const editing = editingId === tournament.id;
                const edit = editValues[tournament.id] ?? {};
                return (
                  <div key={tournament.id} className="border border-black/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-black">
                          {tournament.name}
                        </p>
                        <p className="text-sm text-black/60">
                          {tournament.location ?? "Location TBD"}
                        </p>
                        <p className="text-sm text-black/60">
                          {formatDate(tournament.startTime)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-[0.65rem] uppercase tracking-[0.2em] text-black/50">
                          Status
                          <select
                            value={tournament.status}
                            onChange={(event) =>
                              handleStatusChange(tournament.id, event.target.value)
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
                          onClick={() => handleEditToggle(tournament)}
                          className="border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black"
                        >
                          {editing ? "Editing" : "Edit"}
                        </button>
                      </div>
                    </div>

                    {editing && (
                      <div className="mt-4 space-y-3 border-t border-black/10 pt-4">
                        <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                          Name
                          <input
                            type="text"
                            value={edit.name ?? ""}
                            onChange={(event) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [tournament.id]: { ...prev[tournament.id], name: event.target.value }
                              }))
                            }
                            className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                          Location
                          <input
                            type="text"
                            value={edit.location ?? ""}
                            onChange={(event) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [tournament.id]: { ...prev[tournament.id], location: event.target.value }
                              }))
                            }
                            className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                          />
                        </label>
                        <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                          Start Time
                          <input
                            type="datetime-local"
                            value={edit.startTime ?? ""}
                            onChange={(event) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [tournament.id]: { ...prev[tournament.id], startTime: event.target.value }
                              }))
                            }
                            className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                          />
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(tournament.id)}
                            className="border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  );
};

export default AdminTournaments;
