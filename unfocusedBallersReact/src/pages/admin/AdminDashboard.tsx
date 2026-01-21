import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

type Tournament = {
  id: string;
  name: string;
  status: string;
};

type StatCard = {
  label: string;
  value: string;
};

const STORAGE_KEY = "adminSelectedTournamentId";

const AdminDashboard = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      try {
        const tournamentsRes = await api.get<{ tournaments: Tournament[] }>(
          "/admin/tournaments"
        );
        if (!active) return;
        const list = tournamentsRes.tournaments ?? [];
        setTournaments(list);

        const storedId = localStorage.getItem(STORAGE_KEY);
        const fallback = list[0] ?? null;
        const selected = storedId
          ? list.find((tournament) => tournament.id === storedId) ?? fallback
          : fallback;

        setSelectedTournament(selected ?? null);

        if (selected) {
          const [tournamentDetail, teamsRes, bracketRes] = await Promise.all([
            api.get<{ waitingPool: Array<{ id: string }> }>(
              `/public/tournaments/${selected.id}`
            ),
            api.get<{ teams: Array<{ id: string }> }>(
              `/public/teams?tournamentId=${selected.id}`
            ),
            api.get<{ matches: Array<{ id: string }> }>(
              `/public/bracket?tournamentId=${selected.id}`
            )
          ]);

          if (!active) return;
          setWaitingCount(tournamentDetail.waitingPool?.length ?? 0);
          setTeamsCount(teamsRes.teams?.length ?? 0);
          setMatchesCount(bracketRes.matches?.length ?? 0);
        } else {
          setWaitingCount(0);
          setTeamsCount(0);
          setMatchesCount(0);
        }
      } catch {
        if (!active) return;
        setError("We couldn't load the admin overview right now.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, []);

  const stats: StatCard[] = useMemo(() => {
    return [
      { label: "Tournaments", value: String(tournaments.length) },
      {
        label: "Selected",
        value: selectedTournament
          ? `${selectedTournament.name} (${selectedTournament.status})`
          : "None"
      },
      { label: "Waiting Players", value: String(waitingCount) },
      { label: "Teams Created", value: String(teamsCount) },
      { label: "Bracket Ready", value: matchesCount > 0 ? "Yes" : "No" }
    ];
  }, [tournaments.length, selectedTournament, waitingCount, teamsCount, matchesCount]);

  const nextStep = useMemo(() => {
    if (!selectedTournament) return "Create a tournament";
    if (selectedTournament.status !== "REGISTRATION_OPEN") {
      return "Open registration";
    }
    if (waitingCount < 20) return "Players need to register";
    if (matchesCount === 0) return "Generate teams + bracket";
    return "All set. Manage matches.";
  }, [selectedTournament, waitingCount, matchesCount]);

  return (
    <section className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Admin</h1>
      </div>

      {loading && (
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">
          Loading overview...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-black/10 bg-white p-5 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-black/50">
              {stat.label}
            </p>
            <p className="mt-3 text-lg font-semibold text-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="border border-black/10 bg-white p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Next Step</p>
        <p className="mt-3 text-sm text-black/70">{nextStep}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col justify-between gap-6 border border-black/10 bg-white p-6 shadow-card">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Players</h2>
            <p className="text-sm text-black/70">
              Create new player accounts and manage the roster list.
            </p>
          </div>
          <Link
            to="/admin/players"
            className="inline-flex w-fit items-center justify-center border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
          >
            Manage
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-6 border border-black/10 bg-white p-6 shadow-card">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Teams</h2>
            <p className="text-sm text-black/70">
              Rename teams, assign players, and review squad composition.
            </p>
          </div>
          <Link
            to="/admin/teams"
            className="inline-flex w-fit items-center justify-center border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
          >
            Manage
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-6 border border-black/10 bg-white p-6 shadow-card">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Tournaments</h2>
            <p className="text-sm text-black/70">
              Create tournaments, update statuses, and edit details.
            </p>
          </div>
          <Link
            to="/admin/tournaments"
            className="inline-flex w-fit items-center justify-center border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
          >
            Manage
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-6 border border-black/10 bg-white p-6 shadow-card">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Bracket</h2>
            <p className="text-sm text-black/70">
              Generate brackets, lock teams, and control match flow.
            </p>
          </div>
          <Link
            to="/admin/bracket"
            className="inline-flex w-fit items-center justify-center border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
          >
            Manage
          </Link>
        </div>
      </div>

      <div className="border border-black/10 bg-white p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">Quick Actions</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/admin/tournaments#create"
            className="border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black"
          >
            Create Tournament
          </Link>
          <Link
            to="/admin/players#create"
            className="border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black"
          >
            Create Player
          </Link>
          <Link
            to="/admin/bracket"
            className="border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black"
          >
            Generate Bracket
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;
