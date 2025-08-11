import React, { useEffect, useRef, useState } from 'react';
import { Search, RotateCcw, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Play, Pause, SkipBack, SkipForward, Download, Copy, Headphones, Calendar, X, SlidersHorizontal } from 'lucide-react';
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
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [compact, setCompact] = useState(false);
    const [relativeRange, setRelativeRange] = useState<string>('');
    const [rangeError, setRangeError] = useState<string>('');

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

    // Persist filters & advanced state
    useEffect(() => {
        const saved = localStorage.getItem('callHistory.filters');
        const savedAdv = localStorage.getItem('callHistory.showAdvanced');
        const savedRel = localStorage.getItem('callHistory.relativeRange');
        const savedCompact = localStorage.getItem('callHistory.compact');
        if (saved) {
            try { const parsed = JSON.parse(saved); setFilters((f: Filters) => ({ ...f, ...parsed })); } catch { /* ignore */ }
        }
        if (savedAdv) setShowAdvanced(savedAdv === 'true');
        if (savedRel) setRelativeRange(savedRel);
        if (savedCompact) setCompact(savedCompact === 'true');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { localStorage.setItem('callHistory.filters', JSON.stringify(filters)); }, [filters]);
    useEffect(() => { localStorage.setItem('callHistory.showAdvanced', String(showAdvanced)); }, [showAdvanced]);
    useEffect(() => { localStorage.setItem('callHistory.relativeRange', relativeRange); }, [relativeRange]);
    useEffect(() => { localStorage.setItem('callHistory.compact', String(compact)); }, [compact]);

    // Date range validation
    useEffect(() => {
        if (filters.from && filters.to && filters.from > filters.to) setRangeError('Start date must be before end date');
        else setRangeError('');
    }, [filters.from, filters.to]);

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
        setRelativeRange('');
        setSortBy('startTime');
        setSortOrder('desc');
        setPage(1);
        setShowAdvanced(false);
        fetchData();
    };

    const applyRelativeRange = (val: string) => {
        setRelativeRange(val);
        const now = new Date();
        let from = '', to = '';
        if (val === 'today') {
            const iso = now.toISOString().slice(0, 10); from = iso; to = iso;
        } else if (val === '7d') {
            const end = now; const start = new Date(end.getTime() - 6 * 86400000); from = start.toISOString().slice(0, 10); to = end.toISOString().slice(0, 10);
        } else if (val === '30d') {
            const end = now; const start = new Date(end.getTime() - 29 * 86400000); from = start.toISOString().slice(0, 10); to = end.toISOString().slice(0, 10);
        } else if (val === 'thisMonth') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1); const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); from = start.toISOString().slice(0, 10); to = end.toISOString().slice(0, 10);
        } else if (val === 'prevMonth') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1); const end = new Date(now.getFullYear(), now.getMonth(), 0); from = start.toISOString().slice(0, 10); to = end.toISOString().slice(0, 10);
        }
        setFilters((f: Filters) => ({ ...f, from, to }));
        setPage(1);
        fetchData();
    };

    const activeFilterChips = () => {
        const chips: { key: string; label: string; clear: () => void }[] = [];
        if (filters.from || filters.to) chips.push({ key: 'range', label: `Date: ${filters.from || '…'} → ${filters.to || '…'}`, clear: () => setFilters((f: Filters) => ({ ...f, from: '', to: '' })) });
        if (filters.callerId) chips.push({ key: 'callerId', label: `Caller: ${filters.callerId}`, clear: () => setFilters((f: Filters) => ({ ...f, callerId: '' })) });
        if (filters.callee) chips.push({ key: 'callee', label: `Callee: ${filters.callee}`, clear: () => setFilters((f: Filters) => ({ ...f, callee: '' })) });
        if (filters.onlyWithRecordings === 'true') chips.push({ key: 'recY', label: 'With recording', clear: () => setFilters((f: Filters) => ({ ...f, onlyWithRecordings: '' })) });
        if (filters.onlyWithRecordings === 'false') chips.push({ key: 'recN', label: 'Without recording', clear: () => setFilters((f: Filters) => ({ ...f, onlyWithRecordings: '' })) });
        if (q) chips.push({ key: 'q', label: `Search: ${q}`, clear: () => setQ('') });
        return chips;
    };

    const exportCsv = () => {
        if (!items.length) return;
        const headers = ['Caller ID', 'Caller Name', 'Callee', 'Status', 'Start Time', 'End Time', 'Duration (s)', 'Has Recording'];
        const rows = items.map(r => [r.callerId || '', r.callerName || '', r.callee || '', r.status || '', r.startTime, r.endTime || '', r.duration ?? '', r.hasRecording ? 'yes' : 'no']);
        const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `call_history_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
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

            {/* Filters Bar (Enhanced) */}
            <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border border-gray-200 p-4 sm:p-5 rounded-xl shadow-sm mb-5 space-y-4 sticky top-0 z-30" aria-label="Call history filters">
                <div className="flex flex-wrap gap-3 items-start">
                    {/* Date Range */}
                    <div className="w-full md:w-auto md:flex-1 min-w-[260px]">
                        <label className="block text-xs font-semibold tracking-wide text-gray-700 mb-1 uppercase">Date Range</label>
                        <div className="flex items-stretch gap-2">
                            <div className="relative flex-1">
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input aria-label="From date" className={`border rounded-lg pl-7 pr-2 py-1.5 w-full text-sm ${rangeError ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400' : ''}`} type="date" name="from" value={filters.from} onChange={(e) => { handleFilterChange(e); setRelativeRange(''); }} />
                            </div>
                            <div className="flex items-center text-[11px] font-medium text-gray-500">to</div>
                            <div className="relative flex-1">
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input aria-label="To date" className={`border rounded-lg pl-7 pr-2 py-1.5 w-full text-sm ${rangeError ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400' : ''}`} type="date" name="to" value={filters.to} onChange={(e) => { handleFilterChange(e); setRelativeRange(''); }} />
                            </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1 items-center">
                            <select value={relativeRange} onChange={(e) => applyRelativeRange(e.target.value)} className="px-2.5 py-1 text-[11px] rounded-md border border-gray-300 bg-white hover:bg-gray-50 font-medium tracking-wide">
                                <option value="">Custom range</option>
                                <option value="today">Today</option>
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="thisMonth">This month</option>
                                <option value="prevMonth">Previous month</option>
                            </select>
                            {(filters.from || filters.to) && (
                                <button type="button" onClick={() => { setFilters(f => ({ ...f, from: '', to: '' })); setRelativeRange(''); setPage(1); fetchData(); }} className="px-2.5 py-1 text-[11px] rounded-md border border-gray-300 bg-white hover:bg-gray-50 font-medium tracking-wide">Clear</button>
                            )}
                            {rangeError && <span className="text-[11px] text-rose-600 font-medium ml-1">{rangeError}</span>}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="w-full sm:w-64">
                        <label className="block text-xs font-semibold tracking-wide text-gray-700 mb-1 uppercase">Search</label>
                        <div className="relative group">
                            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                            {q && (
                                <button type="button" onClick={() => { setQ(''); setPage(1); fetchData(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                    <span className="sr-only">Clear search</span>
                                </button>
                            )}
                            <input type="text" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Caller / Callee / Name / ID" className="border rounded-lg pl-7 pr-8 py-1.5 w-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-500">Live search (debounced)</p>
                    </div>

                    {/* Recording filter */}
                    <div className="w-full sm:w-60">
                        <label className="block text-xs font-semibold tracking-wide text-gray-700 mb-1 uppercase">Recording</label>
                        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs">
                            {[
                                { v: '', l: 'All' },
                                { v: 'true', l: 'With' },
                                { v: 'false', l: 'Without' },
                            ].map(opt => (
                                <button key={opt.v || 'all'} type="button" onClick={() => { setFilters(f => ({ ...f, onlyWithRecordings: opt.v as Filters['onlyWithRecordings'] })); setPage(1); fetchData(); }} className={`flex-1 py-1.5 font-medium tracking-wide ${filters.onlyWithRecordings === opt.v ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition`}>{opt.l}</button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced toggle */}
                    <div className="flex items-end gap-2 ml-auto">
                        <button type="button" onClick={() => setShowAdvanced(s => !s)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium">
                            <SlidersHorizontal className="w-4 h-4" /> {showAdvanced ? 'Hide Advanced' : 'Advanced'}
                        </button>
                        <button type="button" onClick={() => setCompact(c => !c)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium" title="Toggle compact rows">
                            {compact ? 'Comfort' : 'Compact'}
                        </button>
                        <button type="submit" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 text-sm font-medium">
                            <Search className="w-4 h-4" /> Apply
                        </button>
                        <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium">
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                        <button type="button" onClick={exportCsv} disabled={!items.length} className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium" title="Export current page to CSV">
                            <Download className="w-4 h-4" /> CSV
                        </button>
                    </div>
                </div>

                {showAdvanced && (
                    <div className="pt-3 border-t border-gray-200 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        <div>
                            <label className="block text-xs font-semibold tracking-wide text-gray-700 mb-1 uppercase">Caller ID</label>
                            <input className="border rounded-lg px-3 py-1.5 w-full text-sm" type="text" name="callerId" value={filters.callerId} onChange={handleFilterChange} placeholder="Exact or partial" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold tracking-wide text-gray-700 mb-1 uppercase">Callee</label>
                            <input className="border rounded-lg px-3 py-1.5 w-full text-sm" type="text" name="callee" value={filters.callee} onChange={handleFilterChange} placeholder="Destination" />
                        </div>
                        <div className="flex items-end">
                            <div className="text-[11px] text-gray-500 leading-tight">Sort: <span className="font-medium">{sortBy}</span> <span className="uppercase">{sortOrder}</span></div>
                        </div>
                    </div>
                )}
                {/* Active filter chips */}
                {activeFilterChips().length > 0 && (() => {
                    const chips = activeFilterChips(); return (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                            {chips.map(chip => (
                                <span key={chip.key} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                                    {chip.label}
                                    <button type="button" onClick={() => { chip.clear(); setPage(1); fetchData(); }} className="hover:text-indigo-900 p-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400">
                                        <X className="w-3 h-3" />
                                        <span className="sr-only">Remove {chip.label}</span>
                                    </button>
                                </span>
                            ))}
                            {chips.length > 1 && (
                                <button type="button" onClick={() => { resetFilters(); }} className="text-[11px] font-medium text-gray-500 hover:text-gray-700 underline decoration-dotted">Clear all</button>
                            )}
                            <span className="text-[11px] text-gray-400 ml-auto pr-1">{chips.length} active filter{chips.length > 1 ? 's' : ''}</span>
                        </div>
                    );
                })()}
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
                                        <td className={`px-4 ${compact ? 'py-2' : 'py-3'} text-sm text-gray-900`}>
                                            <div className="flex items-center gap-2">
                                                <span title={r.callerId || ''}>{r.callerId || '-'}</span>
                                                {r.callerId && (
                                                    <button title="Copy caller ID" onClick={async () => { try { await navigator.clipboard.writeText(r.callerId!); } catch { } }} className="p-1 rounded hover:bg-gray-100">
                                                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-4 ${compact ? 'py-2' : 'py-3'} text-sm text-gray-700`}>{r.callerName || '-'}</td>
                                        <td className={`px-4 ${compact ? 'py-2' : 'py-3'} text-sm text-gray-700`}>{r.callee || '-'}</td>
                                        <td className={`px-4 ${compact ? 'py-2' : 'py-3'}`}>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusToBadge(r.status)}`}>{r.status || '-'}</span>
                                        </td>
                                        <td className={`px-4 ${compact ? 'py-2' : 'py-3'} text-sm text-gray-700`}>
                                            <div className="flex flex-col leading-tight">
                                                <span>{formatDateTime(r.startTime)}</span>
                                                <span className="text-[11px] text-gray-500">{timeAgo(r.startTime)}</span>
                                            </div>
                                        </td>
                                        <td className={`px-4 ${compact ? 'py-2' : 'py-3'} text-sm text-gray-700`}>{formatDateTime(r.endTime)}</td>
                                        <td className={`px-4 ${compact ? 'py-2' : 'py-3'} text-sm text-gray-700`}>{formatDuration(r.duration)}</td>
                                        <td className={`px-4 ${compact ? 'py-2' : 'py-3'} text-sm text-gray-700`}>
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
