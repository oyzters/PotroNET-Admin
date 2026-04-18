import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
    SearchIcon,
    ShieldIcon,
    ShieldAlertIcon,
    ShieldCheckIcon,
    BanIcon,
    CheckCircleIcon,
    Trash2Icon,
} from 'lucide-react';

interface Career {
    id: string;
    name: string;
}

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_banned: boolean;
    reputation: number;
    semester: number;
    career: Career | null;
    created_at: string;
    warnings?: [{ count: number }];
}

interface UsersResponse {
    users: UserProfile[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function UsersPage() {
    const { session, profile } = useAuth();
    const toast = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);

    const isSudo = profile?.role === 'sudo';

    const fetchUsers = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '15' });
            if (search) params.set('search', search);
            const data = await api<UsersResponse>(`/admin/users?${params}`, {
                token: session.access_token,
            });
            setUsers(data.users);
            setTotalPages(data.pagination.totalPages);
            setTotal(data.pagination.total);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios');
        } finally {
            setLoading(false);
        }
    }, [session?.access_token, page, search, toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = async (userId: string, role: string) => {
        if (!session?.access_token || !isSudo) return;
        try {
            await api('/admin/users', {
                method: 'PATCH',
                token: session.access_token,
                body: JSON.stringify({ user_id: userId, role }),
            });
            fetchUsers();
            toast.success('Rol actualizado');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al cambiar el rol');
        }
    };

    const handleBanToggle = async (userId: string, isBanned: boolean) => {
        if (!session?.access_token || !isSudo) return;
        try {
            await api('/admin/users', {
                method: 'PATCH',
                token: session.access_token,
                body: JSON.stringify({ user_id: userId, is_banned: !isBanned }),
            });
            fetchUsers();
            toast.success(isBanned ? 'Usuario desbaneado' : 'Usuario baneado');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al actualizar');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!session?.access_token || !isSudo) return;
        if (pendingDelete !== userId) {
            setPendingDelete(userId);
            window.setTimeout(() => setPendingDelete((cur) => cur === userId ? null : cur), 4000);
            return;
        }
        try {
            await api(`/admin/users?user_id=${userId}`, {
                method: 'DELETE',
                token: session.access_token,
            });
            setUsers(prev => prev.filter(u => u.id !== userId));
            setTotal(t => t - 1);
            setPendingDelete(null);
            toast.success('Usuario eliminado');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al eliminar usuario');
        }
    };

    const roleIcon = (role: string) => {
        switch (role) {
            case 'sudo': return <ShieldAlertIcon className="h-4 w-4 text-red-400" />;
            case 'admin': return <ShieldCheckIcon className="h-4 w-4 text-amber-400" />;
            default: return <ShieldIcon className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Usuarios</h1>
                    <p className="text-sm text-muted-foreground">{total} usuarios registrados</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-accent/30">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Usuario</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Carrera</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Rol</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Rep.</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Adv.</th>
                                {isSudo && (
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="border-b border-border last:border-0 transition-colors hover:bg-accent/20">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium">{u.full_name || 'Sin nombre'}</p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {u.career?.name || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5 text-sm">
                                                {roleIcon(u.role)}
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {u.is_banned ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-400">
                                                    <BanIcon className="h-3 w-3" /> Baneado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                                    <CheckCircleIcon className="h-3 w-3" /> Activo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="text-amber-400">★</span> {u.reputation}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {u.warnings?.[0]?.count ? (
                                                <span className="inline-flex items-center justify-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-500">
                                                    {u.warnings[0].count}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">0</span>
                                            )}
                                        </td>
                                        {isSudo && (
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                        className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                                                    >
                                                        <option value="user">user</option>
                                                        <option value="admin">admin</option>
                                                        <option value="sudo">sudo</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleBanToggle(u.id, u.is_banned)}
                                                        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${u.is_banned
                                                                ? 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                                                                : 'bg-red-400/10 text-red-400 hover:bg-red-400/20'
                                                            }`}
                                                    >
                                                        {u.is_banned ? 'Desbanear' : 'Banear'}
                                                    </button>
                                                    {u.id !== profile?.id && (
                                                        pendingDelete === u.id ? (
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                                                            >
                                                                Confirmar
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                                                                title="Eliminar usuario (auth + datos)"
                                                            >
                                                                <Trash2Icon className="h-3.5 w-3.5" />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Página {page} de {totalPages}
                        </p>
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
