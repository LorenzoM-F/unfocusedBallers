import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type Tournament = {
  id: string;
  name: string;
};

type Player = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type Team = {
  id: string;
  name: string;
  members: Player[];
};

const AdminTeams = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [nameEdits, setNameEdits] = useState<Record<string, string>>({});
  const [addPlayer, setAddPlayer] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = async (tournamentId: string) => {
    const data = await api.get<{ teams: Team[] }>(
      `/admin/teams?tournamentId=${tournamentId}`
    );
    setTeams(data.teams ?? []);
  };

  const loadPlayers = async () => {
    const data = await api.get<{ players: Player[] }>("/admin/players");
    setPlayers(data.players ?? []);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<{ tournaments: Tournament[] }>("/public/tournaments"),
      api.get<{ players: Player[] }>("/admin/players")
    ])
      .then(([tournamentRes, playerRes]) => {
        if (!active) return;
        const loaded = tournamentRes.tournaments ?? [];
        setTournaments(loaded);
        setPlayers(playerRes.players ?? []);
        if (loaded[0]) setSelectedTournament(loaded[0].id);
      })
      .catch(() => {
        if (!active) return;
        setError("We couldn't load admin data right now. Please try again.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedTournament) return;
    setError(null);

    loadTeams(selectedTournament).catch(() => {
      if (!active) return;
      setError("We couldn't load teams right now. Please try again.");
    });

    return () => {
      active = false;
    };
  }, [selectedTournament]);

  const availablePlayers = useMemo(() => {
    return players.filter((player) => player.role === "PLAYER");
  }, [players]);

  const handleRename = async (teamId: string) => {
    const name = nameEdits[teamId];
    if (!name) return;
    setError(null);
    try {
      await api.patch(`/admin/teams/${teamId}`, { name });
      await loadTeams(selectedTournament);
    } catch {
      setError("We couldn't rename the team. Please try again.");
    }
  };

  const handleAddPlayer = async (teamId: string) => {
    const userId = addPlayer[teamId];
    if (!userId) return;
    setError(null);
    try {
      await api.post(`/admin/teams/${teamId}/add-player`, { userId });
      setAddPlayer((prev) => ({ ...prev, [teamId]: "" }));
      await loadTeams(selectedTournament);
      await loadPlayers();
    } catch {
      setError("We couldn't add the player. Please try again.");
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Teams</h1>
        </div>
        <div className="w-full max-w-xs">
          <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
            Tournament
          </label>
          <select
            value={selectedTournament}
            onChange={(event) => setSelectedTournament(event.target.value)}
            disabled={tournaments.length === 0}
            className="mt-2 w-full border border-black/10 bg-white px-3 py-2 text-sm shadow-card disabled:opacity-60"
          >
            {tournaments.length === 0 && (
              <option value="">No tournaments available</option>
            )}
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">
          Loading teams...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {tournaments.length === 0 && !loading ? (
        <div className="border border-dashed border-black/20 p-6 text-sm text-black/60">
          No tournaments available yet. Create one before managing teams.
        </div>
      ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        {teams.map((team) => (
          <div key={team.id} className="border border-black/10 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{team.name}</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-black/50">
                {team.members.length} players
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {team.members.map((player) => (
                <div key={player.id} className="border border-black/10 px-3 py-2 text-sm">
                  {player.fullName}
                </div>
              ))}
              {team.members.length === 0 && (
                <div className="border border-dashed border-black/20 px-3 py-2 text-sm text-black/50">
                  No players assigned yet.
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3 border-t border-black/10 pt-4">
              <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                Rename Team
                <input
                  type="text"
                  value={nameEdits[team.id] ?? team.name}
                  onChange={(event) =>
                    setNameEdits((prev) => ({ ...prev, [team.id]: event.target.value }))
                  }
                  className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => handleRename(team.id)}
                className="w-full border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black"
              >
                Save Name
              </button>
            </div>

            <div className="mt-4 space-y-3 border-t border-black/10 pt-4">
              <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                Add Player
                <select
                  value={addPlayer[team.id] ?? ""}
                  onChange={(event) =>
                    setAddPlayer((prev) => ({ ...prev, [team.id]: event.target.value }))
                  }
                  className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                >
                  <option value="">Select player</option>
                  {availablePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => handleAddPlayer(team.id)}
                className="w-full border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
              >
                Add Player
              </button>
            </div>
          </div>
        ))}
        {!loading && teams.length === 0 && (
          <div className="border border-dashed border-black/20 p-6 text-sm text-black/60">
            No teams created yet.
          </div>
        )}
      </div>
      )}
    </section>
  );
};

export default AdminTeams;
