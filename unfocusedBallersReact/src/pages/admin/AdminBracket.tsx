import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Tournament = {
  id: string;
  name: string;
};

const AdminBracket = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<{ tournaments: Tournament[] }>("/admin/tournaments")
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

  const handleGenerate = async (regenerate: boolean) => {
    if (!selectedTournament) return;
    setError(null);
    setResult(null);
    try {
      await api.post(
        `/admin/tournaments/${selectedTournament}/${
          regenerate ? "regenerate-teams" : "generate-teams"
        }`
      );
      setResult(regenerate ? "Teams + bracket regenerated." : "Teams + bracket generated.");
    } catch {
      setError("We couldn't generate the bracket. Please try again.");
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
            value={selectedTournament}
            onChange={(event) => setSelectedTournament(event.target.value)}
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

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={loading || !selectedTournament}
            className="border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-white disabled:opacity-50"
          >
            Generate Teams + Bracket
          </button>
          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={loading || !selectedTournament}
            className="border border-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-black disabled:opacity-50"
          >
            Regenerate
          </button>
        </div>

        {tournaments.length === 0 && !loading && (
          <p className="text-sm text-black/60">
            No tournaments available yet. Create one before generating brackets.
          </p>
        )}
        {result && <p className="text-sm text-black/70">{result}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
};

export default AdminBracket;
