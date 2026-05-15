import React, { useEffect, useMemo, useState } from "react";

const API_KEY = "1294937e46c8e67982b2448c40ef9a31";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

const categories = [
  [28, "Action"], [12, "Aventure"], [16, "Animation"], [35, "Comédie"],
  [80, "Crime"], [18, "Drame"], [10751, "Famille"], [36, "Histoire"],
  [27, "Horreur"], [9648, "Mystère"], [10749, "Romance"], [878, "Science-fiction"],
  [53, "Thriller"], [10752, "Guerre"]
];

const decades = [
  ["1980s", "1980 à 1989", "1980-01-01", "1989-12-31"],
  ["1990s", "1990 à 1999", "1990-01-01", "1999-12-31"],
  ["2000s", "2000 à 2009", "2000-01-01", "2009-12-31"],
  ["2010s", "2010 à 2019", "2010-01-01", "2019-12-31"]
];

const demoMovies = [
  { id: 27205, title: "Inception", vote_average: 8.8, popularity: 100, release_date: "2010-07-16", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", overview: "Un voleur expérimenté infiltre les rêves pour voler des secrets." },
  { id: 155, title: "The Dark Knight", vote_average: 9.0, popularity: 95, release_date: "2008-07-18", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", overview: "Batman affronte le Joker dans Gotham City." },
  { id: 157336, title: "Interstellar", vote_average: 8.7, popularity: 90, release_date: "2014-11-07", poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", overview: "Des explorateurs voyagent à travers un trou de ver pour sauver l’humanité." }
];

const demoCredits = {
  directors: [{ id: 525, name: "Christopher Nolan", profile_path: null }],
  cast: [
    { id: 6193, name: "Leonardo DiCaprio", character: "Dom Cobb", profile_path: null },
    { id: 24045, name: "Joseph Gordon-Levitt", character: "Arthur", profile_path: null }
  ]
};

const poster = (path) => path ? `${IMG}${path}` : "https://placehold.co/500x750?text=No+Poster";
const profile = (path) => path ? `${IMG}${path}` : "https://placehold.co/300x450?text=No+Photo";
const unique = (items) => Array.from(new Map(items.filter(Boolean).map((item) => [item.id, item])).values());
const decadeRange = (value) => decades.find((d) => d[0] === value) || null;

function runSmallTests() {
  console.assert(unique([{ id: 1 }, { id: 1 }, { id: 2 }]).length === 2, "unique removes duplicates");
  console.assert(poster("/x.jpg").includes("/x.jpg"), "poster uses image path");
  console.assert(decadeRange("1980s")?.[2] === "1980-01-01", "decade range works");
  console.assert(decadeRange("bad") === null, "bad decade returns null");
  console.assert(categories.length > 0, "categories exist");
  console.assert(demoCredits.directors.length > 0, "demo credits include a director");
}

function MovieCard({ movie, onClick, variant = "normal" }) {
  const style = variant === "netflix"
    ? "from-red-950 to-slate-950 border-red-900"
    : variant === "ai"
      ? "from-slate-800 to-slate-950 border-slate-700"
      : "from-slate-900 to-slate-950 border-slate-800";

  return (
    <button
      type="button"
      onClick={() => onClick(movie)}
      className={`text-left rounded-2xl border bg-gradient-to-b ${style} overflow-hidden hover:scale-105 transition-transform`}
    >
      <img src={poster(movie.poster_path)} alt={movie.title || "Affiche"} className="w-full h-64 object-cover" />
      <div className="p-3">
        <p className="font-semibold text-sm line-clamp-1">{movie.title || "Sans titre"}</p>
        <p className="text-xs text-slate-400 mt-1">
          {movie.release_date?.slice(0, 4) || "—"} • ⭐ {movie.vote_average?.toFixed(1) || "N/A"}
        </p>
      </div>
    </button>
  );
}

function Pagination({ page, total, loading, previous, next }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 my-6">
      <button
        type="button"
        disabled={page <= 1 || loading}
        onClick={previous}
        className="px-2 py-1.5 text-xs rounded-lg bg-slate-800 disabled:opacity-40"
      >
        Page précédente
      </button>
      <span className="text-xs text-slate-300">Page {page} / {total}</span>
      <button
        type="button"
        disabled={page >= total || loading}
        onClick={next}
        className="px-2 py-1.5 text-xs rounded-lg bg-white text-black disabled:opacity-40"
      >
        Page suivante
      </button>
    </div>
  );
}

function Section({ id, title, subtitle, loading, empty, children }) {
  return (
    <section id={id} className="mb-14 mt-14 scroll-mt-24">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400 mb-4">{subtitle}</p>}
      {loading ? <p className="text-slate-400">Chargement...</p> : children || <p className="text-slate-400">{empty}</p>}
    </section>
  );
}

export default function MovieDashboard() {
  const [movies, setMovies] = useState(demoMovies);
  const [actors, setActors] = useState([]);
  const [year, setYear] = useState("");
  const [decade, setDecade] = useState("");
  const [genre, setGenre] = useState(null);
  const [actor, setActor] = useState("");
  const [actorName, setActorName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [personSearch, setPersonSearch] = useState("");
  const [personResults, setPersonResults] = useState([]);
  const [personLoading, setPersonLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(demoMovies.length);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [credits, setCredits] = useState(demoCredits);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [trailer, setTrailer] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [movieTab, setMovieTab] = useState("trailer");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [ai, setAi] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [best, setBest] = useState([]);
  const [bestPage, setBestPage] = useState(1);
  const [bestTotal, setBestTotal] = useState(1);
  const [bestLoading, setBestLoading] = useState(false);
  const [netflix, setNetflix] = useState([]);
  const [netflixLoading, setNetflixLoading] = useState(false);
  const [french, setFrench] = useState([]);
  const [frenchPage, setFrenchPage] = useState(1);
  const [frenchTotal, setFrenchTotal] = useState(1);
  const [frenchLoading, setFrenchLoading] = useState(false);

  const years = useMemo(() => Array.from({ length: new Date().getFullYear() - 1979 }, (_, i) => new Date().getFullYear() - i), []);
  const range = decadeRange(decade);
  const aiPicks = useMemo(() => [...ai]
    .filter((m) => m.poster_path)
    .sort((a, b) => ((b.vote_average || 0) + Math.log10((b.popularity || 1) + 1)) - ((a.vote_average || 0) + Math.log10((a.popularity || 1) + 1)))
    .slice(0, 20), [ai]);

  async function json(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`TMDb ${response.status}`);
    return response.json();
  }

  function resetAndTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function sectionTop(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setControlsOpen(false);
  }

  function resetAllFilters() {
    setYear("");
    setDecade("");
    setGenre(null);
    setActor("");
    setActorName("");
    setPersonRole("");
    setPersonSearch("");
    setPersonResults([]);
    setPage(1);
    sectionTop("all-movies-section");
  }

  async function loadMovies(targetPage = 1) {
    try {
      setLoading(true);
      const makeUrl = (p) => {
        let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=popularity.desc&page=${p}`;
        if (range) url += `&primary_release_date.gte=${range[2]}&primary_release_date.lte=${range[3]}`;
        else if (year) url += `&primary_release_year=${year}`;
        else url += "&primary_release_date.gte=1980-01-01";
        if (genre) url += `&with_genres=${genre}`;
        if (actor && personRole === "Directing") url += `&with_crew=${actor}`;
        else if (actor) url += `&with_cast=${actor}`;
        return url;
      };
      const pages = await Promise.all([json(makeUrl(targetPage)), json(makeUrl(targetPage + 1)), json(makeUrl(targetPage + 2))]);
      const list = unique(pages.flatMap((p) => p.results || [])).slice(0, 60);
      setMovies(list);
      setTotalPages(Math.min(pages[0]?.total_pages || 1, 500));
      setTotalResults(pages[0]?.total_results || 0);
      loadActors(list);
    } catch {
      setMovies(demoMovies);
      setTotalPages(1);
      setTotalResults(demoMovies.length);
    } finally {
      setLoading(false);
    }
  }

  async function loadActors(list) {
    try {
      const ids = list.slice(0, 10).map((m) => m.id);
      const data = await Promise.all(ids.map((id) => json(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`).catch(() => null)));
      setActors(unique(data.flatMap((c) => c?.cast?.slice(0, 8) || [])).map((p) => ({ id: p.id, name: p.name })));
    } catch {
      setActors([]);
    }
  }

  async function loadAi() {
    try {
      setAiLoading(true);
      const data = await Promise.all([1, 2].map((p) => json(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=fr-FR&page=${p}`)));
      setAi(unique(data.flatMap((p) => p.results || [])).filter((m) => m.poster_path));
    } catch {
      setAi(demoMovies);
    } finally {
      setAiLoading(false);
    }
  }

  async function loadBest(targetPage = 1) {
    try {
      setBestLoading(true);
      const data = await Promise.all([0, 1, 2].map((i) => json(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=fr-FR&page=${targetPage + i}`)));
      setBest(unique(data.flatMap((p) => p.results || [])).filter((m) => m.poster_path).slice(0, 60));
      setBestTotal(Math.min(data[0]?.total_pages || 1, 500));
    } catch {
      setBest(demoMovies);
      setBestTotal(1);
    } finally {
      setBestLoading(false);
    }
  }

  async function loadNetflix() {
    try {
      setNetflixLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      const startDate = start.toISOString().slice(0, 10);
      const url = (p) => `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=fr-FR&with_watch_providers=8&watch_region=BE&primary_release_date.gte=${startDate}&primary_release_date.lte=${today}&sort_by=primary_release_date.desc&without_genres=99,10770&page=${p}`;
      const data = await Promise.all([1, 2, 3].map((p) => json(url(p))));
      setNetflix(unique(data.flatMap((p) => p.results || [])).filter((m) => m.poster_path).slice(0, 60));
    } catch {
      setNetflix([]);
    } finally {
      setNetflixLoading(false);
    }
  }

  async function loadFrench(targetPage = 1) {
    try {
      setFrenchLoading(true);
      const url = (p) => `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=fr-FR&with_original_language=fr&sort_by=vote_average.desc&vote_count.gte=500&without_genres=99,10770&page=${p}`;
      const data = await Promise.all([0, 1, 2].map((i) => json(url(targetPage + i))));
      setFrench(unique(data.flatMap((p) => p.results || [])).filter((m) => m.poster_path && (m.vote_average || 0) >= 7).slice(0, 60));
      setFrenchTotal(Math.min(data[0]?.total_pages || 1, 500));
    } catch {
      setFrench([]);
      setFrenchTotal(1);
    } finally {
      setFrenchLoading(false);
    }
  }

  async function searchPeople(query) {
    setPersonSearch(query);
    if (query.trim().length < 2) {
      setPersonResults([]);
      return;
    }
    try {
      setPersonLoading(true);
      const data = await json(`${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`);
      setPersonResults((data.results || []).filter((p) => p.known_for_department === "Acting" || p.known_for_department === "Directing").slice(0, 8));
    } catch {
      setPersonResults([]);
    } finally {
      setPersonLoading(false);
    }
  }

  function choosePerson(person) {
    setActor(String(person.id));
    setActorName(person.name);
    setPersonRole(person.known_for_department || "Acting");
    setPersonSearch(person.name);
    setPersonResults([]);
    setGenre(null);
    setPage(1);
    sectionTop("all-movies-section");
  }

  async function openMovie(movie) {
    try {
      const detailsFr = await json(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&language=fr-FR`);
      movie = {
        ...movie,
        overview: detailsFr.overview || movie.overview,
        title: detailsFr.title || movie.title
      };
    } catch {}

    setSelectedMovie(movie);
    setCreditsLoading(true);
    setTrailerLoading(true);
    setSimilarLoading(true);
    setTrailer(null);
    setSimilarMovies([]);
    setMovieTab("trailer");

    try {
      const data = await json(`${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}`);
      setCredits({ directors: data.crew?.filter((p) => p.job === "Director") || [], cast: data.cast?.slice(0, 50) || [] });
    } catch {
      setCredits(demoCredits);
    } finally {
      setCreditsLoading(false);
    }

    try {
      const fr = await json(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}&language=fr-FR`);
      const en = fr.results?.length ? null : await json(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}&language=en-US`);
      const videos = fr.results?.length ? fr.results : en?.results || [];
      setTrailer(videos.find((v) => v.site === "YouTube" && v.type === "Trailer") || videos.find((v) => v.site === "YouTube") || null);
    } catch {
      setTrailer(null);
    } finally {
      setTrailerLoading(false);
    }

    try {
      const [similarData, recommendedData] = await Promise.all([
        json(`${BASE_URL}/movie/${movie.id}/similar?api_key=${API_KEY}&language=fr-FR&page=1`).catch(() => ({ results: [] })),
        json(`${BASE_URL}/movie/${movie.id}/recommendations?api_key=${API_KEY}&language=fr-FR&page=1`).catch(() => ({ results: [] }))
      ]);
      const merged = unique([...(similarData.results || []), ...(recommendedData.results || [])])
        .filter((item) => item.poster_path && item.id !== movie.id && (item.vote_average || 0) >= 7)
        .slice(0, 12);
      setSimilarMovies(merged);
    } catch {
      setSimilarMovies([]);
    } finally {
      setSimilarLoading(false);
    }
  }

  function selectPerson(person) {
    setActor(String(person.id));
    setActorName(person.name);
    setPersonRole(person.job === "Director" ? "Directing" : "Acting");
    setPersonSearch(person.name);
    setGenre(null);
    setPage(1);
    setSelectedMovie(null);
  }

  useEffect(() => {
    runSmallTests();
    loadAi();
    loadBest(1);
    loadNetflix();
    loadFrench(1);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [year, decade, genre, actor]);

  useEffect(() => {
    loadMovies(page);
  }, [year, decade, genre, actor, page]);

  const title = actorName
    ? (personRole === "Directing" ? `Films réalisés par ${actorName}` : `Films avec ${actorName}`)
    : range
      ? `Films de ${range[1]}`
      : year
        ? `Films de ${year}`
        : "Tous les Films";

  const goPage = (delta) => {
    resetAndTop();
    setPage((p) => Math.max(1, Math.min(totalPages, p + delta)));
  };

  const goBest = (delta) => {
    const next = Math.max(1, Math.min(bestTotal, bestPage + delta));
    setBestPage(next);
    loadBest(next);
    sectionTop("best-movies-section");
  };

  const goFrench = (delta) => {
    const next = Math.max(1, Math.min(frenchTotal, frenchPage + delta));
    setFrenchPage(next);
    loadFrench(next);
    sectionTop("french-movies-section");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black mb-2">🎬 Films de Ketard</h1>
        <p className="text-slate-400 mb-8">Base de données complète de films de 1980 à aujourd’hui avec recommandations intelligentes.</p>

        <button
          type="button"
          onClick={() => setControlsOpen(true)}
          className="fixed right-0 top-28 z-50 rounded-l-lg bg-white text-slate-950 px-2 py-1.5 text-xs font-semibold shadow-lg"
        >
          ☰ Menu & Filtres
        </button>

        {controlsOpen && (
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setControlsOpen(false)}>
            <aside
              className="ml-auto h-screen bg-slate-950 border-l border-slate-700 p-5 overflow-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ width: 420, minWidth: 280, maxWidth: "90vw", resize: "horizontal", direction: "rtl" }}
            >
              <div style={{ direction: "ltr" }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-black">Menu & Filtres</h2>
                  <button type="button" onClick={() => setControlsOpen(false)} className="w-10 h-10 rounded-full bg-slate-800 text-2xl">×</button>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {[["all-movies-section", "Tous les Films"], ["ai-recommendations-section", "Recommandations IA"], ["best-movies-section", "Meilleurs Films"], ["netflix-section", "Netflix"], ["french-movies-section", "Films Français"]].map(([id, label]) => (
                    <button key={id} type="button" onClick={() => sectionTop(id)} className="px-2 py-1 rounded-md bg-slate-800 font-medium text-xs">
                      {label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 mb-6">
                  <div className="relative">
                    <input
                      value={personSearch}
                      onChange={(e) => searchPeople(e.target.value)}
                      placeholder="Rechercher acteur ou réalisateur"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                    />
                    {personSearch && (
                      <button
                        type="button"
                        onClick={() => { setPersonSearch(""); setPersonResults([]); setActor(""); setActorName(""); setPersonRole(""); }}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xl"
                      >
                        ×
                      </button>
                    )}
                    {personLoading && <p className="text-xs text-slate-400 mt-2">Recherche...</p>}
                    {personResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                        {personResults.map((person) => (
                          <button key={person.id} type="button" onClick={() => choosePerson(person)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800">
                            <img src={profile(person.profile_path)} alt={person.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <p className="font-semibold">{person.name}</p>
                              <p className="text-xs text-slate-400">{person.known_for_department === "Directing" ? "Réalisateur" : "Acteur"}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <select value={year} onChange={(e) => { setYear(e.target.value); if (e.target.value) setDecade(""); }} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                    <option value="">Toutes les années</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>

                  <select value={decade} onChange={(e) => { setDecade(e.target.value); if (e.target.value) setYear(""); }} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                    <option value="">Décennies</option>
                    {decades.map((d) => <option key={d[0]} value={d[0]}>{d[1]}</option>)}
                  </select>

                  <select value={actor} onChange={(e) => { setActor(e.target.value); setActorName(actors.find((a) => String(a.id) === e.target.value)?.name || ""); setPersonRole("Acting"); }} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                    <option value="">Acteurs des films affichés</option>
                    {actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setGenre(null)} className={`rounded-lg px-2 py-1 text-xs font-medium ${!genre ? "bg-white text-slate-950" : "bg-slate-800"}`}>
                    Toutes catégories
                  </button>
                  {categories.map(([id, name]) => (
                    <button key={id} type="button" onClick={() => setGenre(id)} className={`rounded-lg px-2 py-1 text-xs font-medium ${genre === id ? "bg-white text-slate-950" : "bg-slate-800"}`}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        <section id="all-movies-section" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-2 py-1 rounded-md bg-white text-slate-950 text-xs font-medium hover:scale-105 transition-transform"
            >
              Réinitialiser les filtres
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">{totalResults.toLocaleString()} films trouvés dans TMDb • Page {page} / {totalPages}</p>
          {actorName && (
            <button type="button" onClick={() => { setActor(""); setActorName(""); setPersonRole(""); }} className="mb-4 px-2 py-1 bg-slate-800 rounded-md text-xs">
              Effacer le filtre personne
            </button>
          )}
          <Pagination page={page} total={totalPages} loading={loading} previous={() => goPage(-1)} next={() => goPage(1)} />
          {loading ? (
            <p className="text-center text-slate-400 my-8">Chargement des films...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies.map((m) => <MovieCard key={m.id} movie={m} onClick={openMovie} />)}
            </div>
          )}
          <Pagination page={page} total={totalPages} loading={loading} previous={() => goPage(-1)} next={() => goPage(1)} />
        </section>

        <Section id="ai-recommendations-section" title="🤖 Recommandations IA" subtitle="Suggestions basées sur les tendances TMDb de la semaine." loading={aiLoading} empty="Aucune recommandation IA.">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-4">
            {aiPicks.map((m) => <MovieCard key={m.id} movie={m} onClick={openMovie} variant="ai" />)}
          </div>
        </Section>

        <Section id="best-movies-section" title="🏆 Meilleurs Films" subtitle={`Classement de tous les temps TMDb • Page ${bestPage} / ${bestTotal}`} loading={bestLoading} empty="Aucun meilleur film trouvé.">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-4">
            {best.map((m) => <MovieCard key={m.id} movie={m} onClick={openMovie} />)}
          </div>
          <Pagination page={bestPage} total={bestTotal} loading={bestLoading} previous={() => goBest(-3)} next={() => goBest(3)} />
        </Section>

        <Section id="netflix-section" title="🍿 Nouveautés Films NETFLIX" subtitle="Nouveautés films Netflix récentes disponibles en Belgique." loading={netflixLoading} empty="Aucun film Netflix trouvé.">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-4">
            {netflix.map((m) => <MovieCard key={m.id} movie={m} onClick={openMovie} variant="netflix" />)}
          </div>
        </Section>

        <Section id="french-movies-section" title="🇫🇷 Films Français" subtitle={`Meilleurs films francophones TMDb • Page ${frenchPage} / ${frenchTotal}`} loading={frenchLoading} empty="Aucun film français trouvé.">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-4">
            {french.map((m) => <MovieCard key={m.id} movie={m} onClick={openMovie} />)}
          </div>
          <Pagination page={frenchPage} total={frenchTotal} loading={frenchLoading} previous={() => goFrench(-3)} next={() => goFrench(3)} />
        </Section>

        {selectedMovie && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMovie(null)}>
            <div className="bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setSelectedMovie(null)} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 text-2xl">
                ×
              </button>
              <img src={poster(selectedMovie.poster_path)} alt={selectedMovie.title} className="w-full h-96 object-cover" />
              <div className="p-6">
                <h2 className="text-3xl font-bold mb-2">{selectedMovie.title}</h2>
                <p className="text-slate-400 mb-4">Sortie : {selectedMovie.release_date || "Inconnue"}</p>
                <p className="mb-4">⭐ Note : {selectedMovie.vote_average?.toFixed(1) || "N/A"}</p>
                <p className="text-slate-300 mb-6 leading-relaxed">
                  {selectedMovie.overview || "Aucun synopsis disponible en français."}
                </p>

                <div className="mb-6">
                  <div className="flex gap-2 mb-4">
                    <button type="button" onClick={() => setMovieTab("trailer")} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${movieTab === "trailer" ? "bg-white text-slate-950" : "bg-slate-800 text-white"}`}>
                      🎬 Bande-annonce
                    </button>
                    <button type="button" onClick={() => setMovieTab("similar")} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${movieTab === "similar" ? "bg-white text-slate-950" : "bg-slate-800 text-white"}`}>
                      🍿 Films similaires
                    </button>
                  </div>

                  {movieTab === "trailer" && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Bande-annonce VF</h3>
                      {trailerLoading ? (
                        <p className="text-slate-400">Chargement de la bande-annonce...</p>
                      ) : trailer?.key ? (
                        <div className="rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-video">
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${trailer.key}`}
                            title={trailer.name || "Bande-annonce du film"}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <p className="text-slate-400">Aucune bande-annonce VF trouvée pour ce film.</p>
                      )}
                    </div>
                  )}

                  {movieTab === "similar" && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Films similaires</h3>
                      {similarLoading ? (
                        <p className="text-slate-400">Chargement des films similaires...</p>
                      ) : similarMovies.length ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {similarMovies.map((movie) => <MovieCard key={movie.id} movie={movie} onClick={openMovie} />)}
                        </div>
                      ) : (
                        <p className="text-slate-400">Aucun film similaire trouvé.</p>
                      )}
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-3">Réalisateur</h3>
                {creditsLoading ? (
                  <p>Chargement...</p>
                ) : (
                  <div className="flex flex-wrap gap-4 mb-6">
                    {credits.directors.map((d) => (
                      <button key={d.id} type="button" onClick={() => selectPerson(d)} className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                        <img src={profile(d.profile_path)} alt={d.name} className="w-14 h-14 rounded-full object-cover" />
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}

                <h3 className="text-xl font-semibold mb-3">Casting</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-h-96 overflow-y-auto pr-2">
                  {credits.cast.map((a) => (
                    <button key={a.credit_id || a.id} type="button" onClick={() => selectPerson(a)} className="bg-slate-800 rounded-xl overflow-hidden text-left">
                      <img src={profile(a.profile_path)} alt={a.name} className="w-full h-40 object-cover" />
                      <div className="p-3">
                        <p className="text-sm font-semibold line-clamp-1">{a.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{a.character || "Rôle inconnu"}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => setSelectedMovie(null)} className="mt-6 px-2.5 py-1.5 bg-white text-black rounded-lg text-xs font-medium">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
