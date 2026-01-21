import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

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

const Tournaments = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    api
      .get<{ tournaments: Tournament[] }>("/public/tournaments")
      .then((data) => {
        if (!active) return;
        setTournaments(data.tournaments ?? []);
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

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">
          Tournaments
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          All Tournaments
        </h1>
      </div>
      {loading && (
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">
          Loading tournaments...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            to={`/tournaments/${tournament.id}`}
            className="group relative overflow-hidden border border-black/10 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-black/40"
          >
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.04),transparent_60%)] opacity-0 transition group-hover:opacity-100" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                {tournament.name}
              </h2>
              <span className="text-xs uppercase tracking-[0.2em] text-black/50">
                {tournament.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-black/60">
              {tournament.location ?? "Location TBD"}
            </p>
            <p className="text-sm text-black/60">
              {formatDate(tournament.startTime)}
            </p>
            <p className="mt-3 text-sm text-black/70 line-clamp-2">
              {tournament.formatSnippet}
            </p>
          </Link>
        ))}
        {!loading && tournaments.length === 0 && (
          <div className="border border-dashed border-black/20 p-6 text-sm text-black/60">
            No tournaments available yet.
          </div>
        )}
      </div>
    </section>
  );
};

export default Tournaments;
