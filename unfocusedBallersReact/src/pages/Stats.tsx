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
  totalAssists: number;
  assistsPerMatch: number;
};

type GoalsLeaderboardEntry = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
  matchesPlayed: number;
  goalsPerGame: number;
};

type AssistsLeaderboardEntry = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  assists: number;
  matchesPlayed: number;
  assistsPerGame: number;
};

type OverallLeaderboardEntry = {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  goalsPerGame: number;
  assistsPerGame: number;
  wins: number;
  losses: number;
  rating: number;
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
  leaderboard: GoalsLeaderboardEntry[];
  assistsLeaderboard: AssistsLeaderboardEntry[];
  matches: MatchStats[];
};

type OverallStatsResponse = {
  tournament: Tournament;
  leaderboard: OverallLeaderboardEntry[];
};

const matchTypeLabel: Record<MatchStats["matchType"], string> = {
  SEMI_1: "Semi Final 1",
  SEMI_2: "Semi Final 2",
  FINAL: "Final",
  THIRD_PLACE: "Third Place"
};

const formatRate = (value: number) => {
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
  const [overallLeaderboard, setOverallLeaderboard] = useState<OverallLeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "matches">("leaderboard");
  const [leaderboardMetric, setLeaderboardMetric] = useState<
    "goals" | "assists" | "overall"
  >("goals");
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

    Promise.all([
      api.get<StatsResponse>(`/public/stats?tournamentId=${selectedTournament}`),
      api.get<OverallStatsResponse>(`/public/stats/overall?tournamentId=${selectedTournament}`)
    ])
      .then(([statsData, overallData]) => {
        if (!active) return;
        setStats(statsData);
        setOverallLeaderboard(overallData.leaderboard ?? []);
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
    if (leaderboardMetric === "overall") {
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
          label: "Total Assists",
          value: stats.summary.totalAssists
        }
      ];
    }
    const isGoals = leaderboardMetric === "goals";
    return [
      {
        label: "Matches Played",
        value: stats.summary.matchesPlayed
      },
      {
        label: isGoals ? "Total Goals" : "Total Assists",
        value: isGoals ? stats.summary.totalGoals : stats.summary.totalAssists
      },
      {
        label: isGoals ? "Goals Per Match" : "Assists Per Match",
        value: formatRate(
          isGoals ? stats.summary.goalsPerMatch : stats.summary.assistsPerMatch
        )
      }
    ];
  }, [stats, leaderboardMetric]);

  const leaderboardData = useMemo(() => {
    if (!stats) return [];
    if (leaderboardMetric === "overall") return [];
    return leaderboardMetric === "goals" ? stats.leaderboard : stats.assistsLeaderboard;
  }, [stats, leaderboardMetric]);

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
                {leaderboardMetric === "overall"
                  ? "Overall Performance"
                  : leaderboardMetric === "goals"
                  ? "Goals Leaderboard"
                  : "Assists Leaderboard"}
              </h2>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-black/50">
              {leaderboardMetric === "overall"
                ? overallLeaderboard.length
                : leaderboardData.length}{" "}
              players
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-black/50">
            <button
              type="button"
              onClick={() => setLeaderboardMetric("goals")}
              className={`rounded-full px-3 py-1 transition ${
                leaderboardMetric === "goals"
                  ? "bg-black text-white"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Goals
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardMetric("assists")}
              className={`rounded-full px-3 py-1 transition ${
                leaderboardMetric === "assists"
                  ? "bg-black text-white"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Assists
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardMetric("overall")}
              className={`rounded-full px-3 py-1 transition ${
                leaderboardMetric === "overall"
                  ? "bg-black text-white"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Overall
            </button>
          </div>

          {leaderboardMetric !== "overall" ? (
            <div className="mt-6 space-y-3">
              <div className="hidden text-xs uppercase tracking-[0.2em] text-black/50 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.9fr)] md:gap-3 md:border-b md:border-black/10 md:pb-2">
                <span>Player</span>
                <span>Team</span>
                <span>{leaderboardMetric === "goals" ? "Goals" : "Assists"}</span>
                <span>Matches</span>
                <span>
                  {leaderboardMetric === "goals" ? "Goals/Game" : "Assists/Game"}
                </span>
              </div>
              {leaderboardData.map((player, index) => {
                const primaryValue =
                  leaderboardMetric === "goals"
                    ? (player as GoalsLeaderboardEntry).goals
                    : (player as AssistsLeaderboardEntry).assists;
                const perGameValue =
                  leaderboardMetric === "goals"
                    ? (player as GoalsLeaderboardEntry).goalsPerGame
                    : (player as AssistsLeaderboardEntry).assistsPerGame;
                return (
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
                        {leaderboardMetric === "goals" ? "Goals" : "Assists"}
                      </p>
                      <p className="text-base font-semibold">{primaryValue}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                        Matches
                      </p>
                      <p className="text-base font-semibold">{player.matchesPlayed}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                        {leaderboardMetric === "goals" ? "Goals/Game" : "Assists/Game"}
                      </p>
                      <p className="text-base font-semibold">{formatRate(perGameValue)}</p>
                    </div>
                  </div>
                );
              })}
              {leaderboardData.length === 0 && (
                <div className="border border-dashed border-black/20 px-4 py-4 text-sm text-black/60">
                  {leaderboardMetric === "goals"
                    ? "No players or goals logged for this tournament yet."
                    : "No players or assists logged for this tournament yet."}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="hidden text-xs uppercase tracking-[0.2em] text-black/50 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] md:gap-3 md:border-b md:border-black/10 md:pb-2">
                <span>Player</span>
                <span>Team</span>
                <span>Rating</span>
                <span>Wins</span>
                <span>Losses</span>
                <span>Goals</span>
                <span>Assists</span>
                <span>G/Game</span>
                <span>A/Game</span>
              </div>
              {overallLeaderboard.map((player, index) => (
                <div
                  key={player.playerId}
                  className="grid gap-2 border border-black/10 px-4 py-3 text-sm md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold tracking-tight">
                      {index + 1}. {player.playerName}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                      {player.teamName}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                      Goals: {player.goals} • Assists: {player.assists}
                    </p>
                  </div>
                  <p className="hidden text-xs uppercase tracking-[0.2em] text-black/50 md:block">
                    {player.teamName}
                  </p>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                      Rating
                    </p>
                    <p className="text-base font-semibold">{formatRate(player.rating)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                      Wins
                    </p>
                    <p className="text-base font-semibold">{player.wins}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                      Losses
                    </p>
                    <p className="text-base font-semibold">{player.losses}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                      Goals
                    </p>
                    <p className="text-base font-semibold">{player.goals}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-base font-semibold">{player.assists}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                      G/Game
                    </p>
                    <p className="text-base font-semibold">
                      {formatRate(player.goalsPerGame)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                      A/Game
                    </p>
                    <p className="text-base font-semibold">
                      {formatRate(player.assistsPerGame)}
                    </p>
                  </div>
                </div>
              ))}
              {overallLeaderboard.length === 0 && (
                <div className="border border-dashed border-black/20 px-4 py-4 text-sm text-black/60">
                  No overall stats available for this tournament yet.
                </div>
              )}
            </div>
          )}
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
