import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
    PlusIcon, SearchIcon, PencilIcon, Trash2Icon, CheckIcon, XIcon,
    StarIcon, GraduationCapIcon, SparklesIcon,
} from 'lucide-react';

interface Career { id: string; name: string }

interface Professor {
    id: string;
    full_name: string;
    email: string | null;
    department: string | null;
    career_id: string | null;
    avg_rating: number | null;
    total_reviews: number | null;
    is_approved: boolean;
    nickname: string | null;
    career?: Career | null;
}

interface NicknameSuggestion {
    id: string;
    professor_id: string;
    nickname: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    professor?: { id: string; full_name: string; nickname: string | null } | null;
    suggester?: { id: string; full_name: string } | null;
}

interface ProfessorsResponse {
    professors: Professor[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

const EMPTY_FORM = { full_name: '', email: '', department: '', career_id: '', is_approved: true, nickname: '' };

export function ProfessorsPage() {
    const { session } = useAuth();
    const toast = useToast();
    const [professors, setProfessors] = useState<Professor[]>([]);
    const [careers, setCareers] = useState<Career[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [showNew, setShowNew] = useState(false);
    const [newForm, setNewForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);

    const [suggestions, setSuggestions] = useState<NicknameSuggestion[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);

    const fetchSuggestions = useCallback(async () => {
        if (!session?.access_token) return;
        setSuggestionsLoading(true);
        try {
            const data = await api<{ suggestions: NicknameSuggestion[] }>('/admin/nickname-suggestions?status=pending', { token: session.access_token });
            setSuggestions(data.suggestions);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No se pudieron cargar sugerencias');
        } finally { setSuggestionsLoading(false); }
    }, [session?.access_token, toast]);

    useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

    const handleSuggestionAction = async (id: string, action: 'approve' | 'reject') => {
        if (!session?.access_token) return;
        setProcessingSuggestionId(id);
        try {
            await api('/admin/nickname-suggestions', {
                method: 'PATCH', token: session.access_token,
                body: JSON.stringify({ id, action }),
            });
            setSuggestions(prev => prev.filter(s => s.id !== id));
            toast.success(action === 'approve' ? 'Apodo aprobado' : 'Sugerencia rechazada');
            if (action === 'approve') fetchProfessors();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al procesar sugerencia');
        } finally { setProcessingSuggestionId(null); }
    };

    const fetchProfessors = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (search.trim()) params.set('search', search.trim());
            const data = await api<ProfessorsResponse>(`/admin/professors?${params}`, { token: session.access_token });
            setProfessors(data.professors);
            setTotalPages(data.pagination.totalPages);
            setTotal(data.pagination.total);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No se pudieron cargar los profesores');
        } finally { setLoading(false); }
    }, [session?.access_token, page, search, toast]);

    useEffect(() => { fetchProfessors(); }, [fetchProfessors]);

    useEffect(() => {
        if (!session?.access_token) return;
        api<{ careers: Career[] }>('/careers', { token: session.access_token })
            .then(d => setCareers(d.careers))
            .catch(() => {});
    }, [session?.access_token]);

    const handleCreate = async () => {
        if (!session?.access_token || !newForm.full_name.trim()) return;
        setSaving(true);
        try {
            await api('/admin/professors', {
                method: 'POST',
                token: session.access_token,
                body: JSON.stringify(newForm),
            });
            setNewForm(EMPTY_FORM);
            setShowNew(false);
            toast.success('Profesor agregado');
            fetchProfessors();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al agregar');
        } finally { setSaving(false); }
    };

    const handleStartEdit = (p: Professor) => {
        setEditingId(p.id);
        setEditForm({
            full_name: p.full_name,
            email: p.email || '',
            department: p.department || '',
            career_id: p.career_id || '',
            is_approved: p.is_approved,
            nickname: p.nickname || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!session?.access_token || !editingId) return;
        setSaving(true);
        try {
            await api('/admin/professors', {
                method: 'PATCH',
                token: session.access_token,
                body: JSON.stringify({ id: editingId, ...editForm }),
            });
            setEditingId(null);
            toast.success('Profesor actualizado');
            fetchProfessors();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al guardar');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!session?.access_token) return;
        if (pendingDelete !== id) {
            setPendingDelete(id);
            window.setTimeout(() => setPendingDelete((c) => c === id ? null : c), 4000);
            return;
        }
        try {
            await api(`/admin/professors?id=${id}`, { method: 'DELETE', token: session.access_token });
            setProfessors(prev => prev.filter(p => p.id !== id));
            setTotal(t => t - 1);
            setPendingDelete(null);
            toast.success('Profesor eliminado');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al eliminar');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Profesores</h1>
                    <p className="text-sm text-muted-foreground">{total} profesores registrados</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Buscar por nombre..."
                            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
                        />
                    </div>
                    <button
                        onClick={() => { setShowNew(true); setNewForm(EMPTY_FORM); }}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Nuevo
                    </button>
                </div>
            </div>

            {(suggestionsLoading || suggestions.length > 0) && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <SparklesIcon className="h-4 w-4 text-amber-500" />
                        <h3 className="text-sm font-semibold">Apodos sugeridos ({suggestions.length})</h3>
                    </div>
                    {suggestionsLoading ? (
                        <p className="text-xs text-muted-foreground">Cargando…</p>
                    ) : (
                        <div className="space-y-2">
                            {suggestions.map(s => {
                                const processing = processingSuggestionId === s.id;
                                return (
                                    <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">
                                                <span className="font-semibold">{s.professor?.full_name || '—'}</span>
                                                {s.professor?.nickname && (
                                                    <span className="ml-2 text-xs text-muted-foreground">(actual: {s.professor.nickname})</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Sugerido: <span className="font-semibold text-primary">{s.nickname}</span>
                                                {s.suggester?.full_name && <span className="ml-2">por {s.suggester.full_name}</span>}
                                            </p>
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                            <button
                                                onClick={() => handleSuggestionAction(s.id, 'approve')}
                                                disabled={processing}
                                                className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-40"
                                                title="Aprobar y aplicar"
                                            >
                                                <CheckIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleSuggestionAction(s.id, 'reject')}
                                                disabled={processing}
                                                className="rounded p-1.5 text-red-500 hover:bg-red-500/10 disabled:opacity-40"
                                                title="Rechazar"
                                            >
                                                <XIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {showNew && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Nuevo profesor</h3>
                        <button onClick={() => { setShowNew(false); setNewForm(EMPTY_FORM); }} className="text-muted-foreground hover:text-foreground">
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            autoFocus
                            placeholder="Nombre completo *"
                            value={newForm.full_name}
                            onChange={e => setNewForm(f => ({ ...f, full_name: e.target.value }))}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        <input
                            placeholder="Correo (opcional)"
                            value={newForm.email}
                            onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        <input
                            placeholder="Departamento"
                            value={newForm.department}
                            onChange={e => setNewForm(f => ({ ...f, department: e.target.value }))}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        <select
                            value={newForm.career_id}
                            onChange={e => setNewForm(f => ({ ...f, career_id: e.target.value }))}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        >
                            <option value="">Sin carrera</option>
                            {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input
                            placeholder='Apodo (opcional, ej: "El Terminator")'
                            value={newForm.nickname}
                            maxLength={40}
                            onChange={e => setNewForm(f => ({ ...f, nickname: e.target.value }))}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary sm:col-span-2"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={newForm.is_approved}
                                onChange={e => setNewForm(f => ({ ...f, is_approved: e.target.checked }))}
                            />
                            Aprobado
                        </label>
                        <button
                            onClick={handleCreate}
                            disabled={saving || !newForm.full_name.trim()}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            Crear profesor
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-accent/30">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Profesor</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Carrera / Departamento</th>
                            <th className="w-24 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Rating</th>
                            <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                            <th className="w-32 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="py-12 text-center">
                                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </td></tr>
                        ) : professors.length === 0 ? (
                            <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                                No hay profesores. Agrega el primero.
                            </td></tr>
                        ) : (
                            professors.map(p => {
                                const isEdit = editingId === p.id;
                                const isPending = pendingDelete === p.id;
                                return (
                                    <tr key={p.id} className="group border-b border-border last:border-0 hover:bg-accent/20">
                                        <td className="px-4 py-3">
                                            {isEdit ? (
                                                <div className="space-y-1.5">
                                                    <input
                                                        value={editForm.full_name}
                                                        onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                                                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                                                    />
                                                    <input
                                                        placeholder="Apodo (opcional)"
                                                        value={editForm.nickname}
                                                        maxLength={40}
                                                        onChange={e => setEditForm(f => ({ ...f, nickname: e.target.value }))}
                                                        className="w-full rounded border border-primary/30 bg-primary/5 px-2 py-1 text-xs outline-none focus:border-primary"
                                                    />
                                                    <input
                                                        placeholder="Correo"
                                                        value={editForm.email}
                                                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                                                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                                                        <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
                                                        <span>{p.full_name}</span>
                                                        {p.nickname && (
                                                            <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                                {p.nickname}
                                                            </span>
                                                        )}
                                                    </p>
                                                    {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEdit ? (
                                                <div className="space-y-1.5">
                                                    <select
                                                        value={editForm.career_id}
                                                        onChange={e => setEditForm(f => ({ ...f, career_id: e.target.value }))}
                                                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                                                    >
                                                        <option value="">Sin carrera</option>
                                                        {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                    <input
                                                        placeholder="Departamento"
                                                        value={editForm.department}
                                                        onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                                                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground">
                                                    {p.career?.name && <p>{p.career.name}</p>}
                                                    {p.department && <p>{p.department}</p>}
                                                    {!p.career?.name && !p.department && <p>—</p>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="inline-flex items-center gap-1">
                                                <StarIcon className="h-3 w-3 text-amber-500" />
                                                {p.avg_rating ? Number(p.avg_rating).toFixed(1) : '—'}
                                            </span>
                                            <span className="ml-1 text-xs text-muted-foreground">({p.total_reviews || 0})</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEdit ? (
                                                <label className="flex items-center gap-1.5 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.is_approved}
                                                        onChange={e => setEditForm(f => ({ ...f, is_approved: e.target.checked }))}
                                                    />
                                                    Aprobado
                                                </label>
                                            ) : p.is_approved ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">Aprobado</span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">Pendiente</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEdit ? (
                                                <div className="flex gap-1">
                                                    <button onClick={handleSaveEdit} disabled={saving} className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-40">
                                                        <CheckIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="rounded p-1.5 text-muted-foreground hover:bg-accent">
                                                        <XIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : isPending ? (
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="rounded bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                                                >
                                                    Confirmar
                                                </button>
                                            ) : (
                                                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <button onClick={() => handleStartEdit(p)} className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                                                        <PencilIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)} className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500">
                                                        <Trash2Icon className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-4 py-3">
                        <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="rounded border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
                                className="rounded border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
