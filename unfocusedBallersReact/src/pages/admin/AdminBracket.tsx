import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import TeamColorBadge from "../../components/TeamColorBadge";

type Tournament = {
  id: string;
  name: string;
  status: string;
};

type MatchTeam = {
  id: string;
  name: string | null;
};

type Match = {
  id: string;
  matchType: "SEMI_1" | "SEMI_2" | "FINAL" | "THIRD_PLACE";
  status: "SCHEDULED" | "IN_PROGRESS" | "FINAL";
  scoreA: number;
  scoreB: number;
  teamA: MatchTeam | null;
  teamB: MatchTeam | null;
};

type TeamMember = {
  id: string;
  fullName: string;
  email?: string;
};

type TeamColor = "BLUE" | "BLACK" | "WHITE" | "RED";

type Team = {
  id: string;
  name: string;
  color?: TeamColor | null;
  members: TeamMember[];
};

type Goal = {
  id: string;
  matchId: string;
  scoringTeamId: string;
  scoringPlayerId: string;
  scoringPlayerName?: string;
  minute: number | null;
  createdAt?: string;
};

type Assist = {
  id: string;
  matchId: string;
  assistingTeamId: string;
  assistingPlayerId: string;
  assistingPlayerName?: string;
  minute: number | null;
  createdAt?: string;
};

type MatchForm = {
  scoreA: string;
  scoreB: string;
  status: Match["status"];
};

type GoalForm = {
  scoringTeamId: string;
  scoringPlayerId: string;
  minute: string;
};

type AssistForm = {
  assistingTeamId: string;
  assistingPlayerId: string;
  minute: string;
};

const STORAGE_KEY = "adminSelectedTournamentId";

const AdminBracket = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assists, setAssists] = useState<Assist[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchForms, setMatchForms] = useState<Record<string, MatchForm>>({});
  const [goalForm, setGoalForm] = useState<GoalForm>({
    scoringTeamId: "",
    scoringPlayerId: "",
    minute: ""
  });
  const [assistForm, setAssistForm] = useState<AssistForm>({
    assistingTeamId: "",
    assistingPlayerId: "",
    minute: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const loadTournaments = async () => {
    const data = await api.get<{ tournaments: Tournament[] }>("/admin/tournaments");
    return data.tournaments ?? [];
  };

  const refreshBracket = async (tournamentId: string) => {
    const data = await api.get<{ matches: Match[] }>(
      `/public/bracket?tournamentId=${tournamentId}`
    );
    const nextMatches = data.matches ?? [];
    setMatches(nextMatches);
    setMatchForms((prev) => {
      const next = { ...prev };
      nextMatches.forEach((match) => {
        next[match.id] = {
          scoreA: prev[match.id]?.scoreA ?? String(match.scoreA ?? 0),
          scoreB: prev[match.id]?.scoreB ?? String(match.scoreB ?? 0),
          status: prev[match.id]?.status ?? match.status
        };
      });
      return next;
    });
  };

  const refreshTeams = async (tournamentId: string) => {
    const data = await api.get<{ teams: Team[] }>(
      `/public/teams?tournamentId=${tournamentId}`
    );
    setTeams(data.teams ?? []);
  };

  const refreshWaitingCount = async (tournamentId: string) => {
    const data = await api.get<{ waitingPool: TeamMember[] }>(
      `/public/tournaments/${tournamentId}`
    );
    setWaitingCount(data.waitingPool?.length ?? 0);
  };

  const refreshGoals = async (matchId: string) => {
    const data = await api.get<{ goals: Goal[] }>(`/admin/matches/${matchId}/goals`);
    setGoals(data.goals ?? []);
  };

  const refreshAssists = async (matchId: string) => {
    const data = await api.get<{ assists: Assist[] }>(`/admin/matches/${matchId}/assists`);
    setAssists(data.assists ?? []);
  };

  useEffect(() => {
    let active = true;
    loadTournaments()
      .then((loaded) => {
        if (!active) return;
        setTournaments(loaded);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && loaded.some((tournament) => tournament.id === stored)) {
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

  useEffect(() => {
    if (!selectedTournamentId) return;
    localStorage.setItem(STORAGE_KEY, selectedTournamentId);
  }, [selectedTournamentId]);

  useEffect(() => {
    let active = true;
    if (!selectedTournamentId) return;

    setError(null);
    setResult(null);

    Promise.all([
      refreshBracket(selectedTournamentId),
      refreshTeams(selectedTournamentId),
      refreshWaitingCount(selectedTournamentId)
    ])
      .catch(() => {
        if (!active) return;
        setError("We couldn't load bracket data right now. Please try again.");
      });

    setSelectedMatchId(null);
    setGoals([]);
    setAssists([]);

    return () => {
      active = false;
    };
  }, [selectedTournamentId]);

  useEffect(() => {
    if (!selectedMatchId) return;
    refreshGoals(selectedMatchId).catch(() => {
      setActionError("We couldn't load goals right now. Please try again.");
    });
    refreshAssists(selectedMatchId).catch(() => {
      setActionError("We couldn't load assists right now. Please try again.");
    });
  }, [selectedMatchId]);

  const selectedTournament = useMemo(() => {
    return tournaments.find((tournament) => tournament.id === selectedTournamentId);
  }, [tournaments, selectedTournamentId]);

  const selectedMatch = useMemo(() => {
    if (!selectedMatchId) return null;
    return matches.find((match) => match.id === selectedMatchId) ?? null;
  }, [matches, selectedMatchId]);

  const teamById = useMemo(() => {
    return teams.reduce<Record<string, Team>>((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {});
  }, [teams]);

  const teamColorsById = useMemo(() => {
    return teams.reduce<Record<string, TeamColor | null>>((acc, team) => {
      acc[team.id] = team.color ?? null;
      return acc;
    }, {});
  }, [teams]);

  const matchesByType = useMemo(() => {
    return matches.reduce<Record<Match["matchType"], Match | undefined>>(
      (acc, match) => {
        acc[match.matchType] = match;
        return acc;
      },
      {
        SEMI_1: undefined,
        SEMI_2: undefined,
        FINAL: undefined,
        THIRD_PLACE: undefined
      }
    );
  }, [matches]);

  const matchOrder: Array<Match["matchType"]> = [
    "SEMI_1",
    "SEMI_2",
    "FINAL",
    "THIRD_PLACE"
  ];

  const matchLabel = (matchType: Match["matchType"]) => {
    switch (matchType) {
      case "SEMI_1":
        return "Semi 1";
      case "SEMI_2":
        return "Semi 2";
      case "FINAL":
        return "Final";
      case "THIRD_PLACE":
        return "Third Place";
      default:
        return matchType;
    }
  };

  const handleGenerate = async (regenerate: boolean) => {
    if (!selectedTournamentId) return;
    setActionError(null);
    setResult(null);
    try {
      await api.post(
        `/admin/tournaments/${selectedTournamentId}/${
          regenerate ? "regenerate-teams" : "generate-teams"
        }`
      );
      setResult(regenerate ? "Teams + bracket regenerated." : "Teams + bracket generated.");
      await Promise.all([
        refreshBracket(selectedTournamentId),
        refreshTeams(selectedTournamentId),
        refreshWaitingCount(selectedTournamentId)
      ]);
    } catch {
      setActionError("We couldn't generate the bracket. Please try again.");
    }
  };

  const handleSaveMatch = async (match: Match) => {
    const form = matchForms[match.id];
    if (!form) return;
    setActionError(null);
    try {
      await api.patch(`/admin/matches/${match.id}`, {
        scoreA: Number(form.scoreA),
        scoreB: Number(form.scoreB),
        status: form.status
      });
      await refreshBracket(selectedTournamentId);
    } catch {
      setActionError("We couldn't update the match. Please try again.");
    }
  };

  const handleAddGoal = async () => {
    if (!selectedMatchId) return;
    if (!goalForm.scoringTeamId || !goalForm.scoringPlayerId) {
      setActionError("Select a team and player first.");
      return;
    }
    setActionError(null);
    try {
      await api.post(`/admin/matches/${selectedMatchId}/goals`, {
        scoringTeamId: goalForm.scoringTeamId,
        scoringPlayerId: goalForm.scoringPlayerId,
        minute: goalForm.minute ? Number(goalForm.minute) : undefined
      });
      setGoalForm({
        scoringTeamId: goalForm.scoringTeamId,
        scoringPlayerId: "",
        minute: ""
      });
      await Promise.all([
        refreshGoals(selectedMatchId),
        refreshBracket(selectedTournamentId)
      ]);
    } catch {
      setActionError("We couldn't add the goal. Please try again.");
    }
  };

  const handleAddAssist = async () => {
    if (!selectedMatchId) return;
    if (!assistForm.assistingTeamId || !assistForm.assistingPlayerId) {
      setActionError("Select a team and player first.");
      return;
    }
    setActionError(null);
    try {
      await api.post(`/admin/matches/${selectedMatchId}/assists`, {
        assistingTeamId: assistForm.assistingTeamId,
        assistingPlayerId: assistForm.assistingPlayerId,
        minute: assistForm.minute ? Number(assistForm.minute) : undefined
      });
      setAssistForm({
        assistingTeamId: assistForm.assistingTeamId,
        assistingPlayerId: "",
        minute: ""
      });
      await refreshAssists(selectedMatchId);
    } catch {
      setActionError("We couldn't add the assist. Please try again.");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!selectedMatchId) return;
    setActionError(null);
    try {
      await api.delete(`/admin/goals/${goalId}`);
      await Promise.all([
        refreshGoals(selectedMatchId),
        refreshBracket(selectedTournamentId)
      ]);
    } catch {
      setActionError("We couldn't delete the goal. Please try again.");
    }
  };

  const handleDeleteAssist = async (assistId: string) => {
    if (!selectedMatchId) return;
    setActionError(null);
    try {
      await api.delete(`/admin/assists/${assistId}`);
      await refreshAssists(selectedMatchId);
    } catch {
      setActionError("We couldn't delete the assist. Please try again.");
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Bracket Tools</h1>
      </div>

      <div className="border border-black/10 bg-white p-6 shadow-card space-y-4">
        <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
          Tournament
          <select
            value={selectedTournamentId}
            onChange={(event) => setSelectedTournamentId(event.target.value)}
            disabled={tournaments.length === 0}
            className="mt-2 w-full border border-black/10 bg-white px-3 py-2 text-sm disabled:opacity-60"
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
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="border border-black/10 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-black/50">Status</p>
            <p className="mt-1 text-black">
              {selectedTournament?.status ?? "-"}
            </p>
          </div>
          <div className="border border-black/10 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-black/50">Waiting Pool</p>
            <p className="mt-1 text-black">{waitingCount}</p>
          </div>
          <div className="border border-black/10 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-black/50">Matches</p>
            <p className="mt-1 text-black">{matches.length}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={loading || !selectedTournamentId}
            className="border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white disabled:opacity-50"
          >
            Generate Teams + Bracket
          </button>
          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={loading || !selectedTournamentId}
            className="border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black disabled:opacity-50"
          >
            Regenerate Teams
          </button>
        </div>

        {tournaments.length === 0 && !loading && (
          <p className="text-sm text-black/60">
            No tournaments available yet. Create one before generating brackets.
          </p>
        )}
        {result && <p className="text-sm text-black/70">{result}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      </div>

      {selectedTournamentId && (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            {matchOrder.map((matchType) => {
              const match = matchesByType[matchType];
              const form = match ? matchForms[match.id] : null;
              return (
                <div key={matchType} className="border border-black/10 bg-white p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                        {matchLabel(matchType)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/70">
                        <div className="flex items-center gap-2">
                          <span>{match?.teamA?.name ?? "TBD"}</span>
                          {match?.teamA?.id && (
                            <TeamColorBadge
                              color={teamColorsById[match.teamA.id] ?? null}
                            />
                          )}
                        </div>
                        <span className="text-black/40">vs</span>
                        <div className="flex items-center gap-2">
                          <span>{match?.teamB?.name ?? "TBD"}</span>
                          {match?.teamB?.id && (
                            <TeamColorBadge
                              color={teamColorsById[match.teamB.id] ?? null}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-black/50">
                      {match?.status ?? "SCHEDULED"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                      Score A
                      <input
                        type="number"
                        min={0}
                        value={form?.scoreA ?? ""}
                        onChange={(event) =>
                          match &&
                          setMatchForms((prev) => ({
                            ...prev,
                            [match.id]: {
                              ...prev[match.id],
                              scoreA: event.target.value
                            }
                          }))
                        }
                        disabled={!match}
                        className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                      Score B
                      <input
                        type="number"
                        min={0}
                        value={form?.scoreB ?? ""}
                        onChange={(event) =>
                          match &&
                          setMatchForms((prev) => ({
                            ...prev,
                            [match.id]: {
                              ...prev[match.id],
                              scoreB: event.target.value
                            }
                          }))
                        }
                        disabled={!match}
                        className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                      Status
                      <select
                        value={form?.status ?? "SCHEDULED"}
                        onChange={(event) =>
                          match &&
                          setMatchForms((prev) => ({
                            ...prev,
                            [match.id]: {
                              ...prev[match.id],
                              status: event.target.value as Match["status"]
                            }
                          }))
                        }
                        disabled={!match}
                        className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                      >
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="FINAL">Final</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => match && handleSaveMatch(match)}
                      disabled={!match}
                      className="border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMatchId(match?.id ?? null)}
                      disabled={!match}
                      className="border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black disabled:opacity-50"
                    >
                      Manage Goals & Assists
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border border-black/10 bg-white p-5 shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">
              Goals & Assists
            </p>
            {selectedMatchId ? (
              <div className="mt-4 space-y-4">
                <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                  Scoring Team
                  <select
                    value={goalForm.scoringTeamId}
                    onChange={(event) =>
                      setGoalForm((prev) => ({
                        ...prev,
                        scoringTeamId: event.target.value,
                        scoringPlayerId: ""
                      }))
                    }
                    className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                  >
                    <option value="">Select team</option>
                    {selectedMatch?.teamA?.id && (
                      <option value={selectedMatch.teamA.id}>
                        {selectedMatch.teamA.name}
                      </option>
                    )}
                    {selectedMatch?.teamB?.id && (
                      <option value={selectedMatch.teamB.id}>
                        {selectedMatch.teamB.name}
                      </option>
                    )}
                  </select>
                </label>

                <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                  Scoring Player
                  <select
                    value={goalForm.scoringPlayerId}
                    onChange={(event) =>
                      setGoalForm((prev) => ({
                        ...prev,
                        scoringPlayerId: event.target.value
                      }))
                    }
                    className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                  >
                    <option value="">Select player</option>
                    {(goalForm.scoringTeamId
                      ? teamById[goalForm.scoringTeamId]?.members ?? []
                      : []).map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.fullName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                  Minute
                  <input
                    type="number"
                    min={0}
                    value={goalForm.minute}
                    onChange={(event) =>
                      setGoalForm((prev) => ({
                        ...prev,
                        minute: event.target.value
                      }))
                    }
                    className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAddGoal}
                  className="w-full border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
                >
                  Add Goal
                </button>

                <div className="space-y-3 border-t border-black/10 pt-4">
                  {goals.length === 0 ? (
                    <p className="text-sm text-black/60">No goals logged yet.</p>
                  ) : (
                    goals.map((goal) => (
                      <div key={goal.id} className="flex items-center justify-between gap-3">
                        <div className="text-sm">
                          <p className="font-semibold text-black">
                            {goal.scoringPlayerName ?? "Player"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-black/60">
                            <span>{teamById[goal.scoringTeamId]?.name ?? "Team"}</span>
                            <TeamColorBadge
                              color={teamColorsById[goal.scoringTeamId] ?? null}
                            />
                            {goal.minute !== null && <span>• {goal.minute}'</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="border border-black/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-black"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-4 border-t border-black/10 pt-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-black/50">Assists</p>

                  <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                    Assisting Team
                    <select
                      value={assistForm.assistingTeamId}
                      onChange={(event) =>
                        setAssistForm((prev) => ({
                          ...prev,
                          assistingTeamId: event.target.value,
                          assistingPlayerId: ""
                        }))
                      }
                      className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                    >
                      <option value="">Select team</option>
                      {selectedMatch?.teamA?.id && (
                        <option value={selectedMatch.teamA.id}>
                          {selectedMatch.teamA.name}
                        </option>
                      )}
                      {selectedMatch?.teamB?.id && (
                        <option value={selectedMatch.teamB.id}>
                          {selectedMatch.teamB.name}
                        </option>
                      )}
                    </select>
                  </label>

                  <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                    Assisting Player
                    <select
                      value={assistForm.assistingPlayerId}
                      onChange={(event) =>
                        setAssistForm((prev) => ({
                          ...prev,
                          assistingPlayerId: event.target.value
                        }))
                      }
                      className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                    >
                      <option value="">Select player</option>
                      {(assistForm.assistingTeamId
                        ? teamById[assistForm.assistingTeamId]?.members ?? []
                        : []).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.fullName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs uppercase tracking-[0.2em] text-black/50">
                    Minute
                    <input
                      type="number"
                      min={0}
                      value={assistForm.minute}
                      onChange={(event) =>
                        setAssistForm((prev) => ({
                          ...prev,
                          minute: event.target.value
                        }))
                      }
                      className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddAssist}
                    className="w-full border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
                  >
                    Add Assist
                  </button>

                  <div className="space-y-3 border-t border-black/10 pt-4">
                    {assists.length === 0 ? (
                      <p className="text-sm text-black/60">No assists logged yet.</p>
                    ) : (
                      assists.map((assist) => (
                        <div key={assist.id} className="flex items-center justify-between gap-3">
                          <div className="text-sm">
                            <p className="font-semibold text-black">
                              {assist.assistingPlayerName ?? "Player"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-black/60">
                              <span>
                                {teamById[assist.assistingTeamId]?.name ?? "Team"}
                              </span>
                              <TeamColorBadge
                                color={teamColorsById[assist.assistingTeamId] ?? null}
                              />
                              {assist.minute !== null && <span>• {assist.minute}'</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAssist(assist.id)}
                            className="border border-black/30 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-black"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-black/60">
                Select a match to manage goals.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminBracket;
