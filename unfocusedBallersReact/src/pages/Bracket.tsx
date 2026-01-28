import { useEffect, useMemo, useState } from "react";
import {
  Bracket as BracketView,
  IRoundProps,
  IRenderSeedProps,
  Seed,
  SeedItem,
  SeedTeam
} from "react-brackets";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import TeamColorBadge from "../components/TeamColorBadge";

type Tournament = {
  id: string;
  name: string;
};

type TeamMember = {
  id: string;
  fullName: string;
};

type TeamColor = "BLUE" | "BLACK" | "WHITE" | "RED";

type Team = {
  id: string;
  name: string;
  color?: TeamColor | null;
  members: TeamMember[];
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

type MatchUpdateForm = {
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

type SeedData = {
  id: string;
  teams: { name: string }[];
  match?: Match;
};

const Bracket = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");

  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [forms, setForms] = useState<Record<string, MatchUpdateForm>>({});
  const [goalForms, setGoalForms] = useState<Record<string, GoalForm>>({});
  const [assistForms, setAssistForms] = useState<Record<string, AssistForm>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

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
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const fetchBracket = async (tournamentId: string) => {
    const data = await api.get<{ matches: Match[] }>(`/public/bracket?tournamentId=${tournamentId}`);
    const nextMatches = data.matches ?? [];
    setMatches(nextMatches);

    setForms((prev) => {
      const next = { ...prev };
      nextMatches.forEach((m) => {
        if (!next[m.id]) {
          next[m.id] = {
            scoreA: String(m.scoreA ?? 0),
            scoreB: String(m.scoreB ?? 0),
            status: m.status,
          };
        } else {
          // keep form in sync if server changes
          next[m.id] = {
            scoreA: prev[m.id]?.scoreA ?? String(m.scoreA ?? 0),
            scoreB: prev[m.id]?.scoreB ?? String(m.scoreB ?? 0),
            status: prev[m.id]?.status ?? m.status,
          };
        }
      });
      return next;
    });
  };

  const fetchTeams = async (tournamentId: string) => {
    const data = await api.get<{ teams: Team[] }>(`/public/teams?tournamentId=${tournamentId}`);
    setTeams(data.teams ?? []);
  };

  useEffect(() => {
    let active = true;
    if (!selectedTournament) return;

    setError(null);

    (async () => {
      try {
        await Promise.all([fetchBracket(selectedTournament), fetchTeams(selectedTournament)]);
      } catch {
        if (!active) return;
        setError("We couldn't load the bracket right now. Please try again.");
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedTournament]);

  const teamMembersById = useMemo(() => {
    return teams.reduce<Record<string, TeamMember[]>>((acc, team) => {
      acc[team.id] = team.members;
      return acc;
    }, {});
  }, [teams]);

  const teamColorsById = useMemo(() => {
    return teams.reduce<Record<string, TeamColor | null>>((acc, team) => {
      acc[team.id] = team.color ?? null;
      return acc;
    }, {});
  }, [teams]);

  const matchByType = useMemo(() => {
    return matches.reduce<Record<Match["matchType"], Match | undefined>>(
      (acc, match) => {
        acc[match.matchType] = match;
        return acc;
      },
      { SEMI_1: undefined, SEMI_2: undefined, FINAL: undefined, THIRD_PLACE: undefined }
    );
  }, [matches]);

  const mainRounds: IRoundProps[] = useMemo(() => {
    const semi1 = matchByType.SEMI_1;
    const semi2 = matchByType.SEMI_2;
    const final = matchByType.FINAL;

    const semiSeeds: SeedData[] = [
      {
        id: semi1?.id ?? "semi-1",
        match: semi1,
        teams: [
          { name: semi1?.teamA?.name ?? "TBD" },
          { name: semi1?.teamB?.name ?? "TBD" },
        ],
      },
      {
        id: semi2?.id ?? "semi-2",
        match: semi2,
        teams: [
          { name: semi2?.teamA?.name ?? "TBD" },
          { name: semi2?.teamB?.name ?? "TBD" },
        ],
      },
    ];

    const finalSeeds: SeedData[] = [
      {
        id: final?.id ?? "final",
        match: final,
        teams: [
          { name: final?.teamA?.name ?? "TBD" },
          { name: final?.teamB?.name ?? "TBD" },
        ],
      },
    ];

    return [
      { title: "Semifinals", seeds: semiSeeds as any },
      { title: "Final", seeds: finalSeeds as any },
    ];
  }, [matchByType]);

  const thirdPlaceRounds: IRoundProps[] = useMemo(() => {
    const m = matchByType.THIRD_PLACE;
    const seeds: SeedData[] = [
      {
        id: m?.id ?? "third",
        match: m,
        teams: [{ name: m?.teamA?.name ?? "TBD" }, { name: m?.teamB?.name ?? "TBD" }],
      },
    ];
    return [{ title: "Third Place", seeds: seeds as any }];
  }, [matchByType]);

  const handleMatchChange = (id: string, field: keyof MatchUpdateForm, value: string) => {
    setForms((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleGoalChange = (id: string, field: keyof GoalForm, value: string) => {
    setGoalForms((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleAssistChange = (id: string, field: keyof AssistForm, value: string) => {
    setAssistForms((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleUpdateMatch = async (match: Match) => {
    setActionError(null);
    const form = forms[match.id];
    if (!form) return;

    try {
      await api.patch(`/admin/matches/${match.id}`, {
        scoreA: Number(form.scoreA),
        scoreB: Number(form.scoreB),
        status: form.status,
      });
      await fetchBracket(selectedTournament);
    } catch {
      setActionError("We couldn't update the match. Please try again.");
    }
  };

  const handleAddGoal = async (match: Match) => {
    setActionError(null);
    const form = goalForms[match.id];
    if (!form?.scoringTeamId || !form?.scoringPlayerId) {
      setActionError("Select a scoring team and player.");
      return;
    }

    try {
      await api.post(`/admin/matches/${match.id}/goals`, {
        scoringTeamId: form.scoringTeamId,
        scoringPlayerId: form.scoringPlayerId,
        minute: form.minute ? Number(form.minute) : undefined,
      });

      setGoalForms((prev) => ({
        ...prev,
        [match.id]: { scoringTeamId: form.scoringTeamId, scoringPlayerId: "", minute: "" },
      }));
    } catch {
      setActionError("We couldn't add the goal. Please try again.");
    }
  };

  const handleAddAssist = async (match: Match) => {
    setActionError(null);
    const form = assistForms[match.id];
    if (!form?.assistingTeamId || !form?.assistingPlayerId) {
      setActionError("Select an assisting team and player.");
      return;
    }

    try {
      await api.post(`/admin/matches/${match.id}/assists`, {
        assistingTeamId: form.assistingTeamId,
        assistingPlayerId: form.assistingPlayerId,
        minute: form.minute ? Number(form.minute) : undefined,
      });

      setAssistForms((prev) => ({
        ...prev,
        [match.id]: { assistingTeamId: form.assistingTeamId, assistingPlayerId: "", minute: "" },
      }));
    } catch {
      setActionError("We couldn't add the assist. Please try again.");
    }
  };

  const selectedMatch = useMemo(() => {
    if (!selectedMatchId) return null;
    return matches.find((m) => m.id === selectedMatchId) ?? null;
  }, [matches, selectedMatchId]);

  const CustomSeed = ({ seed, breakpoint }: IRenderSeedProps) => {
    const s = seed as unknown as SeedData;
    const match = s.match;

    const aScore = match ? match.scoreA : null;
    const bScore = match ? match.scoreB : null;
    const teamAId = match?.teamA?.id ?? null;
    const teamBId = match?.teamB?.id ?? null;
    const teamAColor = teamAId ? teamColorsById[teamAId] ?? null : null;
    const teamBColor = teamBId ? teamColorsById[teamBId] ?? null : null;

    return (
      <Seed mobileBreakpoint={breakpoint} className="p-2">
        <SeedItem className="!p-0">
          <div className="mx-auto w-[260px] border border-black/10 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-black/50">
                {match?.status ?? "SCHEDULED"}
              </span>
              {match?.id && (
                <button
                  type="button"
                  onClick={() => setSelectedMatchId(match.id)}
                  className="text-[0.65rem] uppercase tracking-[0.2em] text-black/60 hover:text-black"
                >
                  {isAdmin ? "Edit" : "Details"}
                </button>
              )}
            </div>

            <div className="px-3 py-2">
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2">
                  <SeedTeam className="!m-0 !p-0 !text-sm !text-black/90">
                    {match?.teamA?.name ?? s.teams[0]?.name ?? "TBD"}
                  </SeedTeam>
                  {teamAId && <TeamColorBadge color={teamAColor} />}
                </div>
                <span className="text-sm tabular-nums text-black/70">
                  {aScore === null ? "-" : aScore}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2">
                  <SeedTeam className="!m-0 !p-0 !text-sm !text-black/90">
                    {match?.teamB?.name ?? s.teams[1]?.name ?? "TBD"}
                  </SeedTeam>
                  {teamBId && <TeamColorBadge color={teamBColor} />}
                </div>
                <span className="text-sm tabular-nums text-black/70">
                  {bScore === null ? "-" : bScore}
                </span>
              </div>
            </div>
          </div>
        </SeedItem>
      </Seed>
    );
  };



  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">Bracket</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Match Bracket</h1>
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
          Loading tournaments...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {tournaments.length === 0 && !loading ? (
        <div className="border border-dashed border-black/20 bg-white p-6 text-sm text-black/60">
          No tournaments available yet. Create one to generate a bracket.
        </div>
      ) : (
      <div className="grid gap-10 xl:grid-cols-[2fr,1fr]">
        {/* BRACKET */}
        <div className="space-y-6">
          {/* MAIN BRACKET */}
          <div className="-mx-4 px-4 pb-2 sm:mx-0 sm:px-0">
            {/* Make THIS the scroll box + the bordered card */}
            <div className="max-w-[100vw] overflow-x-auto overflow-y-visible overscroll-x-contain border border-black/10 bg-white shadow-card">
              {/* inner padding lives here so content doesn't stick to the border */}
              <div className="p-4">
                {/* w-max is the scrollable content width */}
                <div className="w-max px-6 sm:mx-auto sm:px-0">
              <BracketView
                rounds={mainRounds}
                renderSeedComponent={CustomSeed}
                mobileBreakpoint={0}
              />
                </div>
              </div>
            </div>
          </div>



          {/* THIRD PLACE */}
          <div className="-mx-4 px-4 pb-2 sm:mx-0 sm:px-0">
            <div className="max-w-[100vw] overflow-x-auto overflow-y-visible overscroll-x-contain border border-black/10 bg-white shadow-card">
              <div className="p-4">
                <div className="w-max px-6 sm:mx-auto sm:px-0">
              <BracketView
                rounds={thirdPlaceRounds}
                renderSeedComponent={CustomSeed}
                mobileBreakpoint={0}
              />
                </div>
              </div>
            </div>
          </div>



          <p className="text-xs uppercase tracking-[0.2em] text-black/50">
            Scroll horizontally on small screens.
          </p>
        </div>


        {/* ADMIN / DETAILS PANEL */}
        <div className="space-y-4">
          <div className="border border-black/10 bg-black p-5 text-white shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Format</p>
            <p className="mt-3 text-sm text-white/70">
              Single elimination with a third-place playoff.
            </p>
          </div>

          <div className="border border-black/10 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                {isAdmin ? "Admin Panel" : "Match Details"}
              </p>
              {selectedMatchId && (
                <button
                  type="button"
                  onClick={() => setSelectedMatchId(null)}
                  className="text-xs uppercase tracking-[0.2em] text-black/50 hover:text-black"
                >
                  Close
                </button>
              )}
            </div>

            {!selectedMatch && (
              <p className="mt-3 text-sm text-black/70">
                Select a match in the bracket.
              </p>
            )}

            {selectedMatch && (
              <div className="mt-4 space-y-4">
                <div className="border border-black/10 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                    {selectedMatch.matchType.replace("_", " ")} • {selectedMatch.status}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/80">
                    <div className="flex items-center gap-2">
                      <span>{selectedMatch.teamA?.name ?? "TBD"}</span>
                      {selectedMatch.teamA?.id && (
                        <TeamColorBadge
                          color={teamColorsById[selectedMatch.teamA.id] ?? null}
                        />
                      )}
                    </div>
                    <span className="text-black/40">vs</span>
                    <div className="flex items-center gap-2">
                      <span>{selectedMatch.teamB?.name ?? "TBD"}</span>
                      {selectedMatch.teamB?.id && (
                        <TeamColorBadge
                          color={teamColorsById[selectedMatch.teamB.id] ?? null}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && forms[selectedMatch.id] && (
                  <div className="space-y-3 border-t border-black/10 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                        Score A
                        <input
                          type="number"
                          min={0}
                          value={forms[selectedMatch.id].scoreA}
                          onChange={(e) => handleMatchChange(selectedMatch.id, "scoreA", e.target.value)}
                          className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                        Score B
                        <input
                          type="number"
                          min={0}
                          value={forms[selectedMatch.id].scoreB}
                          onChange={(e) => handleMatchChange(selectedMatch.id, "scoreB", e.target.value)}
                          className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                        />
                      </label>
                    </div>

                    <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                      Status
                      <select
                        value={forms[selectedMatch.id].status}
                        onChange={(e) => handleMatchChange(selectedMatch.id, "status", e.target.value)}
                        className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                      >
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="FINAL">Final</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleUpdateMatch(selectedMatch)}
                      className="w-full border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
                    >
                      Save Match
                    </button>
                  </div>
                )}

                {isAdmin && (
                  <div className="space-y-3 border-t border-black/10 pt-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-black/50">Add Goal</p>

                    <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                      Scoring Team
                      <select
                        value={goalForms[selectedMatch.id]?.scoringTeamId ?? ""}
                        onChange={(e) =>
                          setGoalForms((prev) => ({
                            ...prev,
                            [selectedMatch.id]: {
                              ...prev[selectedMatch.id],
                              scoringTeamId: e.target.value,
                              scoringPlayerId: ""
                            }
                          }))
                        }
                        className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                      >
                        <option value="">Select team</option>
                        {selectedMatch.teamA?.id && (
                          <option value={selectedMatch.teamA.id}>{selectedMatch.teamA.name}</option>
                        )}
                        {selectedMatch.teamB?.id && (
                          <option value={selectedMatch.teamB.id}>{selectedMatch.teamB.name}</option>
                        )}
                      </select>
                    </label>

                    <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                      Scoring Player
                      <select
                        value={goalForms[selectedMatch.id]?.scoringPlayerId ?? ""}
                        onChange={(e) => handleGoalChange(selectedMatch.id, "scoringPlayerId", e.target.value)}
                        className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                      >
                        <option value="">Select player</option>
                        {(
                          goalForms[selectedMatch.id]?.scoringTeamId
                            ? teamMembersById[goalForms[selectedMatch.id].scoringTeamId] || []
                            : []
                        ).map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.fullName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                      Minute
                      <input
                        type="number"
                        min={0}
                        value={goalForms[selectedMatch.id]?.minute ?? ""}
                        onChange={(e) => handleGoalChange(selectedMatch.id, "minute", e.target.value)}
                        className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleAddGoal(selectedMatch)}
                      className="w-full border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black"
                    >
                      Add Goal
                    </button>

                    <div className="space-y-3 border-t border-black/10 pt-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-black/50">Add Assist</p>

                      <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                        Assisting Team
                        <select
                          value={assistForms[selectedMatch.id]?.assistingTeamId ?? ""}
                          onChange={(e) =>
                            setAssistForms((prev) => ({
                              ...prev,
                              [selectedMatch.id]: {
                                ...prev[selectedMatch.id],
                                assistingTeamId: e.target.value,
                                assistingPlayerId: ""
                              }
                            }))
                          }
                          className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                        >
                          <option value="">Select team</option>
                          {selectedMatch.teamA?.id && (
                            <option value={selectedMatch.teamA.id}>
                              {selectedMatch.teamA.name}
                            </option>
                          )}
                          {selectedMatch.teamB?.id && (
                            <option value={selectedMatch.teamB.id}>
                              {selectedMatch.teamB.name}
                            </option>
                          )}
                        </select>
                      </label>

                      <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                        Assisting Player
                        <select
                          value={assistForms[selectedMatch.id]?.assistingPlayerId ?? ""}
                          onChange={(e) =>
                            handleAssistChange(
                              selectedMatch.id,
                              "assistingPlayerId",
                              e.target.value
                            )
                          }
                          className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                        >
                          <option value="">Select player</option>
                          {(
                            assistForms[selectedMatch.id]?.assistingTeamId
                              ? teamMembersById[
                                  assistForms[selectedMatch.id].assistingTeamId
                                ] || []
                              : []
                          ).map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.fullName}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs uppercase tracking-[0.2em] text-black/50">
                        Minute
                        <input
                          type="number"
                          min={0}
                          value={assistForms[selectedMatch.id]?.minute ?? ""}
                          onChange={(e) =>
                            handleAssistChange(selectedMatch.id, "minute", e.target.value)
                          }
                          className="mt-2 w-full border border-black/10 px-3 py-2 text-sm"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleAddAssist(selectedMatch)}
                        className="w-full border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black"
                      >
                        Add Assist
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border border-black/10 bg-white p-5 shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-black/50">Notes</p>
            <p className="mt-3 text-sm text-black/70">
              The bracket renders Liquipedia-style rounds horizontally with connectors.
              Click a match to view/edit it on the right.
            </p>
          </div>
        </div>
      </div>
      )}
    </section>
  );
};

export default Bracket;
