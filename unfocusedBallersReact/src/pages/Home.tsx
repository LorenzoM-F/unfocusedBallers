import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type Winner = {
  headline: string;
  heroImageUrl: string | null;
  wonOn: string;
  teamName: string;
  tournamentName: string;
} | null;

type Tournament = {
  id: string;
  name: string;
  location: string | null;
  startTime: string | null;
  formatSnippet: string;
  status: string;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const Home = () => {
  const [winner, setWinner] = useState<Winner>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [winnerResponse, tournamentsResponse] = await Promise.all([
          api.get<{ winner: Winner }>("/public/home"),
          api.get<{ tournaments: Tournament[] }>("/public/tournaments")
        ]);
        if (!active) return;
        setWinner(winnerResponse.winner);
        setTournaments(tournamentsResponse.tournaments ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load home data");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const nextTournament = useMemo(() => {
    if (tournaments.length === 0) return null;
    const sorted = [...tournaments].sort((a, b) => {
      const aTime = a.startTime ? new Date(a.startTime).getTime() : Infinity;
      const bTime = b.startTime ? new Date(b.startTime).getTime() : Infinity;
      return aTime - bTime;
    });
    return sorted[0];
  }, [tournaments]);

  return (
    <section className="space-y-12">
      <div className="relative overflow-hidden border border-black/10 bg-white shadow-card">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(77,127,97,0.15),transparent_45%)]" />
        <div className="absolute right-[-10%] top-8 h-40 w-40 rounded-full border border-black/10 opacity-70" />
        <div className="absolute left-8 top-10 h-16 w-16 rounded-full border border-black/20" />
        <div className="relative flex flex-col gap-10 p-6 md:flex-row md:p-10">
          <div className="flex-1 space-y-5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-black/50">
                Matchday Recap
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {winner?.headline ?? "Unfocused Ballers Tourney Winners"}
              </h1>
              <p className="text-sm text-black/60">
                {winner?.wonOn ? formatDate(winner.wonOn) : "No winners announced yet"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-none border border-black/10 bg-white/70 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Champions
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {winner?.teamName ?? "TBD"}
                </p>
                <p className="text-sm text-black/60">
                  {winner?.tournamentName ?? "Awaiting next final"}
                </p>
              </div>
              <div className="rounded-none border border-black/10 bg-white/70 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Atmosphere
                </p>
                <p className="mt-2 text-sm text-black/70">
                  Tight sidelines, loud finishes, and zero wasted minutes.
                </p>
              </div>
            </div>

            {loading && (
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                Loading results...
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex-1">
            {winner?.heroImageUrl ? (
              <img
                src={winner.heroImageUrl}
                alt={winner.headline}
                className="h-72 w-full object-cover shadow-soft transition duration-500 hover:scale-[1.01]"
              />
            ) : (
              <div className="relative flex h-72 w-full items-center justify-center border border-dashed border-black/20 text-xs uppercase tracking-[0.3em] text-black/40">
                <div className="absolute inset-6 border border-black/10" />
                <div className="absolute left-1/2 top-6 h-[calc(100%-3rem)] w-px bg-black/10" />
                Hero image coming soon
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <div className="space-y-4 border border-black/10 bg-white p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">
            Next Tournament
          </p>
          {nextTournament ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                {nextTournament.name}
              </h2>
              <div className="text-sm text-black/60">
                <p>{nextTournament.location ?? "Location TBD"}</p>
                <p>
                  {formatDate(nextTournament.startTime)} · {formatTime(nextTournament.startTime)}
                </p>
              </div>
              <div className="border border-black/10 bg-white px-4 py-3 text-sm text-black/70">
                {nextTournament.formatSnippet ??
                  "5-a-side, 4 teams of 5, 30 minute games, single elim + 3rd/4th playoff"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-black/60">
              No tournaments are scheduled yet.
            </p>
          )}
        </div>
        <div className="relative overflow-hidden border border-black/10 bg-black p-6 text-white shadow-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative flex h-full flex-col justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                On the Pitch
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                Clean lines, quick turns, ruthless finishes.
              </h3>
            </div>
            <p className="text-sm text-white/70">
              Track brackets, roster teams, and celebrate winners in one clean
              space. Designed to feel like matchday: focused, loud, and fast.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.3em]">
                4 Teams
              </div>
              <div className="border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.3em]">
                Single Elim
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
