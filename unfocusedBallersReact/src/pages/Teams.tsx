import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import TeamColorBadge from "../components/TeamColorBadge";

type Tournament = {
  id: string;
  name: string;
};

type TeamMember = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type TeamColor = "BLUE" | "BLACK" | "WHITE" | "RED";

type Team = {
  id: string;
  name: string;
  tournamentId: string | null;
  color?: TeamColor | null;
  members: TeamMember[];
};

const Teams = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    api
      .get<{ tournaments: Tournament[] }>("/public/tournaments")
      .then((data) => {
        if (!active) return;
        const loaded = data.tournaments ?? [];
        setTournaments(loaded);
        if (loaded[0]) {
          setSelectedTournament(loaded[0].id);
        }
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
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

    setTeamsLoading(true);
    api
      .get<{ teams: Team[] }>(`/public/teams?tournamentId=${selectedTournament}`)
      .then((data) => {
        if (!active) return;
        setTeams(data.teams ?? []);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setTeamsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTournament]);

  const selectedName = useMemo(() => {
    return tournaments.find((tournament) => tournament.id === selectedTournament)?.name;
  }, [tournaments, selectedTournament]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Teams</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {selectedName ?? "Teams"}
          </h1>
        </div>
        <div className="w-full max-w-xs">
          <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
            Tournament
          </label>
          <select
            value={selectedTournament}
            onChange={(event) => setSelectedTournament(event.target.value)}
            className="mt-2 w-full border border-black/10 bg-white px-3 py-2 text-sm shadow-card focus:border-black"
          >
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
          Loading tournaments...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <div key={team.id} className="border border-black/10 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{team.name}</h2>
                <TeamColorBadge color={team.color} />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-black/50">
                {team.members.length} players
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="border border-black/10 bg-white px-3 py-2 text-sm"
                >
                  {member.fullName}
                </div>
              ))}
              {!teamsLoading && team.members.length === 0 && (
                <div className="border border-dashed border-black/20 px-3 py-2 text-sm text-black/50">
                  No players assigned yet.
                </div>
              )}
            </div>
          </div>
        ))}
        {!teamsLoading && teams.length === 0 && selectedTournament && (
          <div className="border border-dashed border-black/20 p-6 text-sm text-black/60">
            No teams yet for this tournament.
          </div>
        )}
      </div>
    </section>
  );
};

export default Teams;
