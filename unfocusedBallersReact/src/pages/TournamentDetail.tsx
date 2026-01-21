import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Tournament = {
  id: string;
  name: string;
  location: string | null;
  startTime: string | null;
  formatSnippet: string;
  status: string;
};

type WaitingPlayer = {
  id: string;
  fullName: string;
};

type TournamentDetailResponse = {
  tournament: Tournament;
  waitingPool: WaitingPlayer[];
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

const TournamentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [waitingPool, setWaitingPool] = useState<WaitingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isRegistered = useMemo(() => {
    if (!user) return false;
    return waitingPool.some((player) => player.id === user.id);
  }, [user, waitingPool]);

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<TournamentDetailResponse>(`/public/tournaments/${id}`);
      setTournament(data.tournament);
      setWaitingPool(data.waitingPool ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!id) return;

    const fetchData = async () => {
      try {
        const data = await api.get<TournamentDetailResponse>(`/public/tournaments/${id}`);
        if (!active) return;
        setTournament(data.tournament);
        setWaitingPool(data.waitingPool ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load tournament");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [id]);

  const handleRegister = async () => {
    if (!id) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await api.post(`/player/tournaments/${id}/register`);
      await loadDetail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!id) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await api.post(`/player/tournaments/${id}/unregister`);
      await loadDetail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unregister failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <Link
          to="/tournaments"
          className="text-xs uppercase tracking-[0.2em] text-black/50"
        >
          Back to tournaments
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {tournament?.name ?? "Tournament"}
        </h1>
      </div>

      {loading && (
        <p className="text-xs uppercase tracking-[0.2em] text-black/50">
          Loading details...
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {tournament && (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4 border border-black/10 bg-white p-6 shadow-card">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-black/50">Details</p>
              <p className="text-sm text-black/70">
                {tournament.location ?? "Location TBD"}
              </p>
              <p className="text-sm text-black/70">
                {formatDate(tournament.startTime)} · {formatTime(tournament.startTime)}
              </p>
            </div>
            <p className="text-sm text-black/70">{tournament.formatSnippet}</p>
            <div className="text-xs uppercase tracking-[0.2em] text-black/50">
              Status: {tournament.status}
            </div>
          </div>

          <div className="space-y-4 border border-black/10 bg-white p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.2em] text-black/50">Registration</p>
            {user ? (
              <div className="space-y-3">
                <p className="text-sm text-black/70">
                  Signed in as {user.fullName}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={actionLoading || isRegistered}
                    className="border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:translate-y-[-1px] disabled:opacity-40"
                  >
                    {isRegistered ? "Registered" : "Register"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUnregister}
                    disabled={actionLoading || !isRegistered}
                    className="border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black transition hover:border-black disabled:opacity-40"
                  >
                    Unregister
                  </button>
                  {actionError && (
                    <p className="text-sm text-red-600">{actionError}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-black/70">
                <Link to="/login" className="underline">
                  Log in
                </Link>{" "}
                to register for this tournament.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Waiting to play</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-black/50">
            {waitingPool.length} players
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {waitingPool.map((player) => (
            <div
              key={player.id}
              className="border border-black/10 bg-white px-4 py-3 text-sm shadow-card"
            >
              {player.fullName}
            </div>
          ))}
          {!loading && waitingPool.length === 0 && (
            <div className="border border-dashed border-black/20 p-6 text-sm text-black/60">
              No players waiting yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TournamentDetail;
