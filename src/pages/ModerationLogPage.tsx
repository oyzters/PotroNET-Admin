import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClockIcon, FilterIcon, UsersIcon } from 'lucide-react';

interface Action {
    id: string;
    action_type: string;
    category: string;
    reason: string;
    created_at: string;
    meta: Record<string, unknown>;
    moderator: { id: string; full_name: string; avatar_url: string } | null;
    target_user: { id: string; full_name: string; email: string } | null;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
    delete_publication: 'Pub. eliminada',
    delete_comment: 'Com. eliminado',
    warn_user: 'Advertencia',
    ban_user: 'Ban',
    unban_user: 'Desban',
    role_change: 'Cambio de rol',
    resolve_report: 'Reporte resuelto',
    dismiss_report: 'Reporte descartado',
};

const ACTION_TYPE_COLORS: Record<string, string> = {
    delete_publication: 'bg-red-500/20 text-red-700 dark:text-red-400',
    delete_comment: 'bg-red-500/20 text-red-700 dark:text-red-400',
    warn_user: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
    ban_user: 'bg-red-900/30 text-red-800 dark:text-red-300',
    unban_user: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    role_change: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    resolve_report: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    dismiss_report: 'bg-muted text-muted-foreground',
};

const CATEGORY_LABELS: Record<string, string> = {
    spam: 'Spam',
    acoso: 'Acoso',
    contenido_sexual: 'Contenido sexual',
    violencia: 'Violencia',
    informacion_falsa: 'Info. falsa',
    odio: 'Odio',
    otro: 'Otro',
};

export function ModerationLogPage() {
    const { session } = useAuth();
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterType, setFilterType] = useState('');

    const fetchLog = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '25' });
            if (filterType) params.set('action_type', filterType);
            const data = await api<{ actions: Action[]; pagination: { totalPages: number; total: number } }>(
                `/moderation/log?${params}`,
                { token: session.access_token }
            );
            setActions(data.actions || []);
            setTotalPages(data.pagination.totalPages);
            setTotal(data.pagination.total);
        } catch { /* silent */ } finally { setLoading(false); }
    }, [session?.access_token, page, filterType]);

    useEffect(() => { fetchLog(); }, [fetchLog]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Log de Moderación</h1>
                    <p className="text-sm text-muted-foreground">{total} acciones registradas en total</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <select
                    value={filterType}
                    onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                    <option value="">Todos los tipos</option>
                    {Object.entries(ACTION_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : actions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                    <ClockIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">Sin acciones registradas</p>
                </div>
            ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/30">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Acción</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Objetivo</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Moderador</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Categoría</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Nota</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {actions.map(action => (
                                <tr key={action.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-4 py-3">
                                        <Badge className={ACTION_TYPE_COLORS[action.action_type] || 'bg-muted text-muted-foreground'}>
                                            {ACTION_TYPE_LABELS[action.action_type] || action.action_type}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {action.target_user ? (
                                            <div>
                                                <p className="font-medium">{action.target_user.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{action.target_user.email}</p>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {action.moderator?.avatar_url && (
                                                <img src={action.moderator.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                                            )}
                                            <span>{action.moderator?.full_name || 'Sistema'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {CATEGORY_LABELS[action.category] || action.category}
                                    </td>
                                    <td className="px-4 py-3 max-w-[200px]">
                                        <p className="text-xs text-muted-foreground line-clamp-2">{action.reason || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(action.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UsersIcon className="h-3.5 w-3.5" />
                        <span>Página {page} de {totalPages} · {total} registros</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
