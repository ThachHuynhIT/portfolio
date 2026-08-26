"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number;
  audioUrl: string;
  thumbnailUrl: string | null;
  published: boolean;
  playCount: number;
  order: number;
  createdAt: string;
}

function formatDuration(sec: number): string {
  if (isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTotalTime(tracks: Track[]): string {
  const totalSeconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${totalSeconds % 60}s`;
}

export default function AdminMusicClient({ tracks: initial }: { tracks: Track[] }) {
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>(initial);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"order" | "plays" | "title" | "recent">("order");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // In-table Audio Quick Preview
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBatchOperating, setIsBatchOperating] = useState(false);

  // Unique genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      if (t.genre?.trim()) set.add(t.genre.trim());
    });
    return ["all", ...Array.from(set)];
  }, [tracks]);

  // Filtered tracks
  const filtered = useMemo(() => {
    return tracks
      .filter((t) => {
        const matchSearch =
          search === "" ||
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.artist.toLowerCase().includes(search.toLowerCase()) ||
          (t.album && t.album.toLowerCase().includes(search.toLowerCase())) ||
          (t.genre && t.genre.toLowerCase().includes(search.toLowerCase()));

        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "published" && t.published) ||
          (statusFilter === "draft" && !t.published);

        const matchGenre =
          genreFilter === "all" ||
          (t.genre && t.genre.toLowerCase() === genreFilter.toLowerCase());

        return matchSearch && matchStatus && matchGenre;
      })
      .sort((a, b) => {
        if (sortBy === "order") return a.order - b.order;
        if (sortBy === "plays") return b.playCount - a.playCount;
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
      });
  }, [tracks, search, statusFilter, genreFilter, sortBy]);

  // Audio Preview Toggle
  const handleTogglePreview = (track: Track) => {
    if (previewTrackId === track.id) {
      if (isPlayingPreview) {
        previewAudioRef.current?.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current?.play();
        setIsPlayingPreview(true);
      }
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
      }
      previewAudioRef.current.src = track.audioUrl;
      previewAudioRef.current.play().then(() => {
        setPreviewTrackId(track.id);
        setIsPlayingPreview(true);
      }).catch((e) => console.error("Preview error:", e));

      previewAudioRef.current.onended = () => {
        setIsPlayingPreview(false);
      };
    }
  };

  // Toggle publish status
  const handleTogglePublish = async (id: string, current: boolean) => {
    const res = await fetch(`/api/music/tracks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTracks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, published: updated.published } : t))
      );
    }
  };

  // Delete single track
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    if (previewTrackId === id) {
      previewAudioRef.current?.pause();
      setPreviewTrackId(null);
    }
    const res = await fetch(`/api/music/tracks/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setTracks((prev) => prev.filter((t) => t.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      alert("Failed to delete track.");
    }
  };

  // Batch actions
  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchPublish = async (publish: boolean) => {
    if (selectedIds.size === 0) return;
    setIsBatchOperating(true);
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/music/tracks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: publish }),
        })
      )
    );
    setTracks((prev) =>
      prev.map((t) => (selectedIds.has(t.id) ? { ...t, published: publish } : t))
    );
    setIsBatchOperating(false);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected tracks? This cannot be undone.`)) return;
    setIsBatchOperating(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => fetch(`/api/music/tracks/${id}`, { method: "DELETE" })));
    setTracks((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    setIsBatchOperating(false);
  };

  // Summary Metrics
  const totalPlays = tracks.reduce((acc, t) => acc + (t.playCount || 0), 0);
  const publishedCount = tracks.filter((t) => t.published).length;
  const draftCount = tracks.length - publishedCount;

  return (
    <div className="space-y-6">
      {/* ── Top Metric Banner ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase">Total Tracks</span>
            <span className="text-xl">🎵</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{tracks.length}</p>
          <span className="text-xs text-gray-500">{genres.length - 1} genres</span>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase">Published</span>
            <span className="text-xl">🟢</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{publishedCount}</p>
          <span className="text-xs text-gray-500">{draftCount} in drafts</span>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase">Total Plays</span>
            <span className="text-xl">🔥</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400 mt-2">{totalPlays.toLocaleString()}</p>
          <span className="text-xs text-gray-500">Live stream listens</span>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs font-semibold uppercase">Library Time</span>
            <span className="text-xl">⏱️</span>
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-2">{formatTotalTime(tracks)}</p>
          <span className="text-xs text-gray-500">Audio runtime</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border border-purple-500/20 flex flex-col justify-center items-center text-center">
          <Link
            href="/admin/music/new"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all text-center"
          >
            + Add New Track
          </Link>
        </div>
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search tracks, artists, genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-gray-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>

          {/* Genre Filter */}
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Genres</option>
            {genres.filter((g) => g !== "all").map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 focus:outline-none focus:border-purple-500"
          >
            <option value="order">Sort: Custom Order</option>
            <option value="plays">Sort: Most Played</option>
            <option value="title">Sort: Track Title</option>
            <option value="recent">Sort: Recently Added</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-800 rounded-xl border border-gray-700 p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === "table" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
              title="Table View"
            >
              📑
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === "grid" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
              title="Card Grid View"
            >
              🎴
            </button>
          </div>
        </div>
      </div>

      {/* ── Batch Actions Bar ── */}
      {selectedIds.size > 0 && (
        <div className="p-3 px-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-purple-300">
              {selectedIds.size} track{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Deselect all
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchPublish(true)}
              disabled={isBatchOperating}
              className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBatchPublish(false)}
              disabled={isBatchOperating}
              className="px-3 py-1.5 bg-yellow-600/80 hover:bg-yellow-600 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Unpublish Selected
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={isBatchOperating}
              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-gray-900 border border-gray-800 text-gray-400">
          <div className="text-4xl mb-3">🎵</div>
          <h3 className="text-lg font-bold text-white mb-1">No tracks found</h3>
          <p className="text-sm max-w-sm mx-auto mb-4 text-gray-500">
            {tracks.length === 0
              ? "Your music lounge is empty. Add your first track to get started!"
              : "No tracks match the current search or filters."}
          </p>
          {tracks.length === 0 ? (
            <Link
              href="/admin/music/new"
              className="inline-flex px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all"
            >
              Add First Track
            </Link>
          ) : (
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); setGenreFilter("all"); }}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* ── TABLE VIEW ── */
        <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-900/90">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={handleSelectAll}
                    className="accent-purple-600 rounded cursor-pointer"
                  />
                </th>
                <th className="p-4 w-12 text-center">Preview</th>
                <th className="p-4">Track Title</th>
                <th className="p-4">Artist</th>
                <th className="p-4">Album</th>
                <th className="p-4">Genre</th>
                <th className="p-4 text-center">Duration</th>
                <th className="p-4 text-center">Plays</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm">
              {filtered.map((track) => {
                const isSelected = selectedIds.has(track.id);
                const isPreviewing = previewTrackId === track.id && isPlayingPreview;

                return (
                  <tr
                    key={track.id}
                    className={`transition-colors hover:bg-gray-800/40 ${isSelected ? "bg-purple-950/20" : ""}`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(track.id)}
                        className="accent-purple-600 rounded cursor-pointer"
                      />
                    </td>

                    {/* Quick Preview Button */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleTogglePreview(track)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isPreviewing
                            ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 scale-105"
                            : "bg-white/10 text-white hover:bg-purple-600 hover:text-white"
                        }`}
                        title={isPreviewing ? "Pause Preview" : "Play Preview"}
                      >
                        {isPreviewing ? "⏸" : "▶"}
                      </button>
                    </td>

                    {/* Title + Thumb */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 border border-gray-700">
                          {track.thumbnailUrl ? (
                            <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-base">🎵</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate max-w-[200px]">
                            {track.title}
                          </span>
                          <span className="text-xs text-gray-400 block truncate max-w-[200px]">
                            Order: #{track.order}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-gray-300 font-medium">{track.artist}</td>
                    <td className="p-4 text-gray-400">{track.album || "—"}</td>
                    <td className="p-4">
                      {track.genre ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {track.genre}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono text-gray-300 text-xs">
                      {formatDuration(track.duration)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-cyan-300 font-semibold">
                        🔥 {track.playCount.toLocaleString()}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(track.id, track.published)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          track.published
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                        }`}
                        title="Click to toggle publish status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${track.published ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                        {track.published ? "Published" : "Draft"}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/music/${track.id}/edit`}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-gray-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(track.id, track.title)}
                          disabled={deletingId === track.id}
                          className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 rounded-lg text-xs font-semibold transition-colors border border-red-800/40"
                        >
                          {deletingId === track.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── CARD GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((track) => {
            const isSelected = selectedIds.has(track.id);
            const isPreviewing = previewTrackId === track.id && isPlayingPreview;

            return (
              <div
                key={track.id}
                className={`p-4 rounded-2xl bg-gray-900/80 border transition-all relative flex flex-col justify-between ${
                  isSelected ? "border-purple-500 bg-purple-950/20" : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <div>
                  {/* Card Cover & Quick Play */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-800 mb-3 group">
                    {track.thumbnailUrl ? (
                      <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎵</div>
                    )}

                    {/* Quick Preview overlay */}
                    <button
                      onClick={() => handleTogglePreview(track)}
                      className={`absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
                        isPreviewing
                          ? "bg-cyan-500 text-black shadow-xl shadow-cyan-500/50 scale-105"
                          : "bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:scale-110"
                      }`}
                    >
                      {isPreviewing ? "⏸" : "▶"}
                    </button>

                    {/* Top Right Status Badge */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTogglePublish(track.id, track.published); }}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-md ${
                          track.published
                            ? "bg-emerald-500/80 text-white"
                            : "bg-black/70 text-gray-300"
                        }`}
                      >
                        {track.published ? "Published" : "Draft"}
                      </button>
                    </div>

                    {/* Top Left Checkbox */}
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(track.id)}
                        className="accent-purple-600 rounded cursor-pointer w-4 h-4"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <h4 className="font-bold text-white text-base truncate mb-0.5">{track.title}</h4>
                  <p className="text-gray-400 text-xs truncate mb-2">{track.artist}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{track.genre || "No genre"}</span>
                    <span>{formatDuration(track.duration)}</span>
                    <span className="text-cyan-400 font-mono">🔥 {track.playCount}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                  <Link
                    href={`/admin/music/${track.id}/edit`}
                    className="flex-1 text-center py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg transition-all"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(track.id, track.title)}
                    disabled={deletingId === track.id}
                    className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 text-xs font-semibold rounded-lg transition-all"
                  >
                    {deletingId === track.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

