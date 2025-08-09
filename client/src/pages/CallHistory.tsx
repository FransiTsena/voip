import React, { useEffect, useRef, useState } from 'react';
import { Search, RotateCcw, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Play, Pause, SkipBack, SkipForward, Download, Copy, Headphones } from 'lucide-react';
import axios from 'axios';
import baseUrl from '../util/baseUrl';

type RecordItem = {
    id: string;
    linkedId: string;
    callerId?: string;
    callerName?: string;
    callee?: string;
    calleeName?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status?: string;
    hasRecording: boolean;
};

const statusBadgeClasses: Record<string, string> = {
    answered: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    missed: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    ended: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200',
    ringing: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
    busy: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
    unanswered: 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200',
    failed: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    on_hold: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
};

type Filters = { from: string; to: string; callerId: string; callee: string; onlyWithRecordings: '' | 'true' | 'false' };
type AudioState = { current: number; duration: number; playing: boolean; error: string };

const CallHistory: React.FC = () => {
    const [items, setItems] = useState<RecordItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState('');
    const [sortBy, setSortBy] = useState<'startTime' | 'duration' | 'status' | 'callerId' | 'callee'>('startTime');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedAudioId, setExpandedAudioId] = useState<string | null>(null);
    const [listenItem, setListenItem] = useState<RecordItem | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioState, setAudioState] = useState<AudioState>({ current: 0, duration: 0, playing: false, error: '' });
    const [filters, setFilters] = useState<Filters>({ from: '', to: '', callerId: '', callee: '', onlyWithRecordings: '' });

    // Persist pageSize preference
    useEffect(() => {
        const saved = localStorage.getItem('callHistory.pageSize');
        if (saved) {
            const n = parseInt(saved, 10);
            if (!isNaN(n)) setPageSize(n);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        localStorage.setItem('callHistory.pageSize', String(pageSize));
    }, [pageSize]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, sortBy, sortOrder]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            fetchData();
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: Record<string, string | number> = { page, pageSize, sortBy, sortOrder };
            if (filters.from) params.from = filters.from;
            if (filters.to) params.to = filters.to;
            if (filters.callerId) params.callerId = filters.callerId;
            if (filters.callee) params.callee = filters.callee;
            if (filters.onlyWithRecordings === 'true' || filters.onlyWithRecordings === 'false') params.hasRecording = filters.onlyWithRecordings;
            if (q) params.q = q;
            const res = await axios.get(`${baseUrl}/api/report/recordings`, { params });
            setItems(res.data.items || []);
            setTotal(res.data.total || 0);
        } catch (e) {
            setError('Failed to fetch call recordings');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target as { name: keyof Filters; value: string };
        setFilters((prev: Filters) => ({ ...prev, [name]: value as Filters[keyof Filters] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchData();
    };

    const resetFilters = () => {
        setFilters({ from: '', to: '', callerId: '', callee: '', onlyWithRecordings: '' });
        setQ('');
        setSortBy('startTime');
        setSortOrder('desc');
        setPage(1);
        fetchData();
    };

    const formatDateTime = (d?: string) => (d ? new Date(d).toLocaleString() : '-');
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    const formatDuration = (s?: number) => {
        if (typeof s !== 'number') return '-';
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = Math.floor(s % 60);
        return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
    };
    const timeAgo = (iso?: string) => {
        if (!iso) return '-';
        const now = Date.now();
        const then = new Date(iso).getTime();
        const diff = Math.max(0, Math.floor((now - then) / 1000));
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };
    const statusToBadge = (status?: string) => (status ? statusBadgeClasses[status] || 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200' : 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200');

    const streamUrl = (id: string) => `${baseUrl}/api/report/recordings/${id}/stream`;

    // Listening modal controls
    const openListen = (item: RecordItem) => {
        setListenItem(item);
        setAudioState({ current: 0, duration: 0, playing: false, error: '' });
        setTimeout(() => audioRef.current?.load(), 0);
    };

    const closeListen = () => {
        audioRef.current?.pause();
        setListenItem(null);
    };

    const togglePlay = () => {
        const el = audioRef.current;
        if (!el) return;
        if (el.paused) el.play().catch(() => setAudioState((s: AudioState) => ({ ...s, error: 'Playback failed' })));
        else el.pause();
    };

    const onTimeUpdate = () => {
        const el = audioRef.current;
        if (!el) return;
        setAudioState((s: AudioState) => ({ ...s, current: el.currentTime }));
    };
    const onLoaded = () => {
        const el = audioRef.current;
        if (!el) return;
        setAudioState((s: AudioState) => ({ ...s, duration: el.duration || 0 }));
    };
    const onPlay = () => setAudioState((s: AudioState) => ({ ...s, playing: true }));
    const onPause = () => setAudioState((s: AudioState) => ({ ...s, playing: false }));
    const onError = () => setAudioState((s: AudioState) => ({ ...s, error: 'Unable to load recording' }));

    const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = parseFloat(e.target.value);
        if (audioRef.current) audioRef.current.currentTime = t;
        setAudioState((s: AudioState) => ({ ...s, current: t }));
    };
    const skip = (delta: number) => {
        const el = audioRef.current; if (!el) return;
        el.currentTime = Math.min(Math.max(0, el.currentTime + delta), audioState.duration || el.duration || 0);
    };
    const handleDownload = async (item: RecordItem) => {
        try {
            const res = await axios.get(streamUrl(item.id), { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const nameSafe = `${item.linkedId || item.id}_${item.startTime?.slice(0, 19).replace(/[:T]/g, '-')}.wav`;
            a.href = url; a.download = nameSafe; document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setError('Failed to download recording');
        }
    };
    const copyLink = async (item: RecordItem) => {
        try { await navigator.clipboard.writeText(streamUrl(item.id)); }
        catch { setError('Failed to copy link'); }
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <header className="mb-3 sm:mb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Call History</h1>
                        <p className="text-sm text-gray-600 mt-1">Browse and listen to call recordings. Use filters, sort, and pagination.</p>
                    </div>
                </div>
            </header>

            {/* Filters Bar */}
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur border border-gray-200 p-4 sm:p-5 rounded-xl shadow-sm mb-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-1">
                        <div>
                            <label className="block text-sm font-medium">From</label>
                            <input className="border rounded px-2 py-1" type="date" name="from" value={filters.from} onChange={handleFilterChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">To</label>
                            <input className="border rounded px-2 py-1" type="date" name="to" value={filters.to} onChange={handleFilterChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Caller ID</label>
                            <input className="border rounded px-2 py-1" type="text" name="callerId" value={filters.callerId} onChange={handleFilterChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Callee</label>
                            <input className="border rounded px-2 py-1" type="text" name="callee" value={filters.callee} onChange={handleFilterChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Has Recording</label>
                            <select className="border rounded px-2 py-1" name="onlyWithRecordings" value={filters.onlyWithRecordings} onChange={handleFilterChange}>
                                <option value="">All</option>
                                <option value="true">Only with recordings</option>
                                <option value="false">Without recordings</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                                <input className="border rounded pl-7 pr-2 py-1 w-full" type="text" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search caller/callee/name/id" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3.5 py-2 rounded-lg shadow hover:bg-indigo-700 transition">
                            <Search className="w-4 h-4" /> <span>Apply</span>
                        </button>
                        <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 bg-white text-gray-700 px-3.5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                        <div className="hidden sm:flex items-center gap-1 ml-2">
                            <span className="text-xs text-gray-500">Quick range:</span>
                            <button type="button" onClick={() => { const d = new Date(); const iso = d.toISOString().slice(0, 10); setFilters((f: Filters) => ({ ...f, from: iso, to: iso })); setPage(1); fetchData(); }} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50">Today</button>
                            <button type="button" onClick={() => { const to = new Date(); const from = new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000); setFilters((f: Filters) => ({ ...f, from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) })); setPage(1); fetchData(); }} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50">7d</button>
                            <button type="button" onClick={() => { const to = new Date(); const from = new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000); setFilters((f: Filters) => ({ ...f, from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) })); setPage(1); fetchData(); }} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50">30d</button>
                            <button type="button" onClick={() => { setFilters((f: Filters) => ({ ...f, from: '', to: '' })); setPage(1); fetchData(); }} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50">Clear</button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Summary Bar */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <div>Matches: <span className="font-medium">{total}</span></div>
                <div className="hidden sm:block">Sorted by <span className="font-medium">{sortBy}</span> <span className="uppercase">{sortOrder}</span></div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                {loading ? (
                    <div className="p-8">
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-slate-100 rounded w-1/3" />
                            <div className="h-4 bg-slate-100 rounded w-1/2" />
                            <div className="h-4 bg-slate-100 rounded w-2/3" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-rose-600">{error}</div>
                ) : (
                    <table className="min-w-full">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                {[{ k: 'callerId', t: 'Caller ID' }, { k: 'callerName', t: 'Caller Name' }, { k: 'callee', t: 'Callee' }, { k: 'status', t: 'Status' }, { k: 'startTime', t: 'Start' }, { k: 'endTime', t: 'End' }, { k: 'duration', t: 'Duration' }, { k: 'rec', t: 'Recording' }].map((col) => (
                                    <th key={col.k} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 tracking-wider">
                                        <button
                                            type="button"
                                            className="flex items-center gap-1 hover:text-gray-900"
                                            onClick={() => {
                                                if (col.k === 'rec' || col.k === 'callerName' || col.k === 'endTime') return;
                                                const nextOrder = (sortBy === (col.k as any) ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
                                                if (col.k === 'callerId' || col.k === 'callee' || col.k === 'status' || col.k === 'duration' || col.k === 'startTime') {
                                                    setSortBy(col.k as any);
                                                    setSortOrder(nextOrder as any);
                                                    setPage(1);
                                                }
                                            }}
                                        >
                                            <span>{col.t}</span>
                                            {(col.k === sortBy) && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div>No calls found.</div>
                                            {filters.onlyWithRecordings !== '' && (
                                                <button type="button" onClick={() => { setFilters((f: Filters) => ({ ...f, onlyWithRecordings: '' })); setPage(1); fetchData(); }} className="px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50">Show all calls</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((r, idx) => (
                                    <tr key={r.id} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100'}>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <span title={r.callerId || ''}>{r.callerId || '-'}</span>
                                                {r.callerId && (
                                                    <button title="Copy caller ID" onClick={async () => { try { await navigator.clipboard.writeText(r.callerId!); } catch { } }} className="p-1 rounded hover:bg-gray-100">
                                                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{r.callerName || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{r.callee || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusToBadge(r.status)}`}>{r.status || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            <div className="flex flex-col leading-tight">
                                                <span>{formatDateTime(r.startTime)}</span>
                                                <span className="text-[11px] text-gray-500">{timeAgo(r.startTime)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(r.endTime)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{formatDuration(r.duration)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {r.hasRecording ? (
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => setExpandedAudioId(expandedAudioId === r.id ? null : r.id)} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-1">
                                                        {expandedAudioId === r.id ? <Headphones className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                        {expandedAudioId === r.id ? 'Hide' : 'Play'}
                                                    </button>
                                                    <button type="button" onClick={() => openListen(r)} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-1">
                                                        <Headphones className="w-3.5 h-3.5" /> Listen
                                                    </button>
                                                    {expandedAudioId === r.id && (
                                                        <audio controls preload="none" className="h-8">
                                                            <source src={streamUrl(r.id)} />
                                                            Your browser does not support the audio element.
                                                        </audio>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500">No recording</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
                {!loading && !error && items.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-white flex flex-wrap items-center gap-3">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span>–
                            <span className="font-medium">{Math.min(page * pageSize, total)}</span> of <span className="font-medium">{total}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <select className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white" value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}>
                                {[25, 50, 100].map((n) => (
                                    <option key={n} value={n}>{n} / page</option>
                                ))}
                            </select>
                            <div className="flex items-center gap-1">
                                <button type="button" className="px-2 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-50 inline-flex items-center gap-1" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                                    <ChevronLeft className="w-4 h-4" /> Prev
                                </button>
                                <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
                                <button type="button" className="px-2 py-1 text-sm rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-50 inline-flex items-center gap-1" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-1 ml-2">
                                    <span className="text-xs text-gray-500">Go to:</span>
                                    <input type="number" min={1} max={totalPages} className="w-16 text-sm border border-gray-300 rounded-md px-2 py-1" onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const v = parseInt((e.target as HTMLInputElement).value, 10);
                                            if (!isNaN(v)) setPage(Math.min(Math.max(1, v), totalPages));
                                        }
                                    }} placeholder={String(page)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Listening Modal */}
            {listenItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={closeListen} />
                    <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-[92vw] max-w-2xl mx-auto p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Listening to recording</h3>
                                <p className="text-xs text-gray-600 mt-0.5">Caller {listenItem.callerId || '-'} → {listenItem.callee || '-'} · {formatDateTime(listenItem.startTime)}</p>
                            </div>
                            <button onClick={closeListen} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50">Close</button>
                        </div>
                        <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoaded} onPlay={onPlay} onPause={onPause} onError={onError}>
                            <source src={streamUrl(listenItem.id)} />
                        </audio>
                        {audioState.error && <div className="text-sm text-rose-600 mb-2">{audioState.error}</div>}
                        <div className="flex items-center gap-2 mb-3">
                            <button onClick={() => skip(-10)} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-1"><SkipBack className="w-4 h-4" /> 10s</button>
                            <button onClick={togglePlay} className="px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-1">{audioState.playing ? (<><Pause className="w-4 h-4" /> Pause</>) : (<><Play className="w-4 h-4" /> Play</>)}</button>
                            <button onClick={() => skip(10)} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-1">10s <SkipForward className="w-4 h-4" /></button>
                            <div className="ml-auto flex items-center gap-2">
                                <button onClick={() => handleDownload(listenItem)} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-1"><Download className="w-4 h-4" /> Download</button>
                                <button onClick={() => copyLink(listenItem)} className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-1"><Copy className="w-4 h-4" /> Copy link</button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs tabular-nums w-12 text-right">{formatDuration(audioState.current)}</span>
                            <input type="range" min={0} max={audioState.duration || 0} step={0.1} value={Math.min(audioState.current, audioState.duration || 0)} onChange={seek} className="flex-1" />
                            <span className="text-xs tabular-nums w-12">{formatDuration(audioState.duration || 0)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallHistory;
