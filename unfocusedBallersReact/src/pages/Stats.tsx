import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type Tournament = {
  id: string;
  name: string;
  status: string;
};

type Summary = {
  matchesPlayed: number;
  totalGoals: number;
  goalsPerMatch: number;
};

type LeaderboardEntry = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
  matchesPlayed: number;
  goalsPerGame: number;
};

type MatchTeam = {
  id: string;
  name: string | null;
};

type MatchGoal = {
  id: string;
  scoringTeamId: string;
  scoringTeamName: string;
  scoringPlayerId: string;
  scoringPlayerName: string;
  assistPlayerId?: string | null;
  assistPlayerName?: string | null;
  minute: number | null;
  createdAt: string;
};

type MatchStats = {
  id: string;
  matchType: "SEMI_1" | "SEMI_2" | "FINAL" | "THIRD_PLACE";
  status: "SCHEDULED" | "IN_PROGRESS" | "FINAL";
  scoreA: number;
  scoreB: number;
  teamA: MatchTeam | null;
  teamB: MatchTeam | null;
  goals: MatchGoal[];
};

type StatsResponse = {
  tournament: Tournament;
  summary: Summary;
  leaderboard: LeaderboardEntry[];
  matches: MatchStats[];
};

const matchTypeLabel: Record<MatchStats["matchType"], string> = {
  SEMI_1: "Semi Final 1",
  SEMI_2: "Semi Final 2",
  FINAL: "Final",
  THIRD_PLACE: "Third Place"
};

const formatGoalsPerGame = (value: number) => {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(2);
};

const statusBadge = (status: MatchStats["status"]) => {
  switch (status) {
    case "FINAL":
      return "border-green-600/40 bg-green-50 text-green-700";
    case "IN_PROGRESS":
      return "border-amber-500/40 bg-amber-50 text-amber-700";
    default:
      return "border-black/10 bg-white text-black/60";
  }
};

const Stats = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "matches">("leaderboard");
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    api
      .get<{ tournaments: Tournament[] }>("/public/tournaments")
      .then((data) => {
        if (!active) return;
        const loaded = data.tournaments ?? [];
        setTournaments(loaded);
        if (loaded[0]) setSelectedTournament(loaded[0].id);
      })
      .catch(() => {
        if (!active) return;
        setError("We couldn't load tournaments right now. Please try again.");
      })
      .finally(() => {
        if (!active) return;
        setLoadingTournaments(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedTournament) {
      setStats(null);
      setExpandedMatches({});
      return;
    }

    setError(null);
    setLoadingStats(true);

    api
      .get<StatsResponse>(`/public/stats?tournamentId=${selectedTournament}`)
      .then((data) => {
        if (!active) return;
        setStats(data);
        setExpandedMatches({});
      })
      .catch(() => {
        if (!active) return;
        setError("We couldn't load stats right now. Please try again.");
      })
      .finally(() => {
        if (!active) return;
        setLoadingStats(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTournament]);

  const summaryCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "Matches Played",
        value: stats.summary.matchesPlayed
      },
      {
        label: "Total Goals",
        value: stats.summary.totalGoals
      },
      {
        label: "Goals Per Match",
        value: formatGoalsPerGame(stats.summary.goalsPerMatch)
      }
    ];
  }, [stats]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Stats</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {stats?.tournament?.name ?? "Tournament Stats"}
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
            disabled={loadingTournaments || tournaments.length === 0}
          >
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingTournaments && (
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">
          Loading tournaments...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="border border-black/10 bg-white p-4 shadow-card">
              <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                {card.label}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="flex flex-wrap items-center gap-2 border border-black/10 bg-white p-2 text-xs uppercase tracking-[0.2em] shadow-card">
          <button
            type="button"
            onClick={() => setActiveTab("leaderboard")}
            className={`rounded-full px-4 py-2 transition ${
              activeTab === "leaderboard"
                ? "bg-black text-white"
                : "text-black/60 hover:text-black"
            }`}
          >
            Leaderboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matches")}
            className={`rounded-full px-4 py-2 transition ${
              activeTab === "matches"
                ? "bg-black text-white"
                : "text-black/60 hover:text-black"
            }`}
          >
            Matches
          </button>
        </div>
      )}

      {loadingStats && (
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">Loading stats...</p>
      )}

      {stats && activeTab === "leaderboard" && (
        <div className="border border-black/10 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/50">Leaderboard</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Goals & Goals Per Game
              </h2>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-black/50">
              {stats.leaderboard.length} players
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="hidden text-xs uppercase tracking-[0.2em] text-black/50 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] md:gap-3 md:border-b md:border-black/10 md:pb-2">
              <span>Player</span>
              <span>Team</span>
              <span>Goals</span>
              <span>Matches</span>
              <span>Goals/Game</span>
            </div>
            {stats.leaderboard.map((player, index) => (
              <div
                key={player.playerId}
                className="grid gap-2 border border-black/10 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] md:items-center"
              >
                <div>
                  <p className="text-sm font-semibold tracking-tight">
                    {index + 1}. {player.playerName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                    {player.teamName}
                  </p>
                </div>
                <p className="hidden text-xs uppercase tracking-[0.2em] text-black/50 md:block">
                  {player.teamName}
                </p>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                    Goals
                  </p>
                  <p className="text-base font-semibold">{player.goals}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                    Matches
                  </p>
                  <p className="text-base font-semibold">{player.matchesPlayed}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                    Goals/Game
                  </p>
                  <p className="text-base font-semibold">
                    {formatGoalsPerGame(player.goalsPerGame)}
                  </p>
                </div>
              </div>
            ))}
            {stats.leaderboard.length === 0 && (
              <div className="border border-dashed border-black/20 px-4 py-4 text-sm text-black/60">
                No players or goals logged for this tournament yet.
              </div>
            )}
          </div>
        </div>
      )}

      {stats && activeTab === "matches" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">Matches</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Per-match stats</h2>
          </div>
          {stats.matches.map((match) => {
            const isExpanded = expandedMatches[match.id] ?? false;
            return (
              <div key={match.id} className="border border-black/10 bg-white p-6 shadow-card">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedMatches((prev) => ({
                      ...prev,
                      [match.id]: !prev[match.id]
                    }))
                  }
                  className="flex w-full flex-col gap-4 text-left md:flex-row md:items-center md:justify-between"
                  aria-expanded={isExpanded}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                      {matchTypeLabel[match.matchType]}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight">
                      {match.teamA?.name ?? "TBD"}{" "}
                      <span className="text-black/40">vs</span>{" "}
                      {match.teamB?.name ?? "TBD"}
                    </h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black/50">
                      {match.goals.length} goals logged
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusBadge(
                        match.status
                      )}`}
                    >
                      {match.status.replace("_", " ")}
                    </span>
                    <span className="text-lg font-semibold tracking-tight">
                      {match.scoreA} - {match.scoreB}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-black/50">
                      {isExpanded ? "Hide" : "Show"}
                    </span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-5 space-y-2">
                    {match.goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex flex-col gap-2 border border-black/10 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold">{goal.scoringPlayerName}</p>
                          <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                            {goal.scoringTeamName}
                          </p>
                          {goal.assistPlayerName && (
                            <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                              Assist: {goal.assistPlayerName}
                            </p>
                          )}
                        </div>
                        <span className="text-xs uppercase tracking-[0.2em] text-black/50">
                          {goal.minute !== null ? `${goal.minute}'` : "Minute N/A"}
                        </span>
                      </div>
                    ))}
                    {match.goals.length === 0 && (
                      <div className="border border-dashed border-black/20 px-4 py-4 text-sm text-black/60">
                        No goals logged for this match yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {stats.matches.length === 0 && (
            <div className="border border-dashed border-black/20 px-4 py-4 text-sm text-black/60">
              No matches scheduled for this tournament yet.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default Stats;
