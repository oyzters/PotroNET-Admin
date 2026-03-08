import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { TrashIcon, AlertTriangleIcon } from 'lucide-react';

interface Author {
    id: string;
    full_name: string;
    avatar_url: string;
    email: string;
}

interface Publication {
    id: string;
    content: string;
    tags: string[];
    likes_count: number;
    created_at: string;
    author: Author;
}

interface PublicationsResponse {
    publications: Publication[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function PublicationsPage() {
    const { session } = useAuth();
    const [publications, setPublications] = useState<Publication[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchPublications = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const data = await api<PublicationsResponse>(
                `/admin/publications?page=${page}&limit=15`,
                { token: session.access_token }
            );
            setPublications(data.publications);
            setTotalPages(data.pagination.totalPages);
            setTotal(data.pagination.total);
        } catch {
            //
        } finally {
            setLoading(false);
        }
    }, [session?.access_token, page]);

    useEffect(() => {
        fetchPublications();
    }, [fetchPublications]);

    const handleDelete = async (id: string) => {
        if (!session?.access_token) return;
        setDeleting(id);
        try {
            await api('/admin/publications', {
                method: 'DELETE',
                token: session.access_token,
                body: JSON.stringify({ publication_id: id }),
            });
            setPublications(publications.filter((p) => p.id !== id));
            setTotal((t) => t - 1);
        } catch {
            //
        } finally {
            setDeleting(null);
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return 'hace un momento';
        if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
        return `hace ${Math.floor(diff / 86400)}d`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Publicaciones</h1>
                <p className="text-sm text-muted-foreground">
                    {total} publicaciones en total
                </p>
            </div>

            {/* Publications list */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : publications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center">
                        <p className="text-muted-foreground">No hay publicaciones</p>
                    </div>
                ) : (
                    publications.map((pub) => (
                        <div
                            key={pub.id}
                            className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">
                                            {pub.author?.full_name || 'Anónimo'}
                                        </span>
                                        <span className="text-muted-foreground">·</span>
                                        <span className="text-xs text-muted-foreground">
                                            {pub.author?.email}
                                        </span>
                                        <span className="text-muted-foreground">·</span>
                                        <span className="text-xs text-muted-foreground">
                                            {timeAgo(pub.created_at)}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed">{pub.content}</p>
                                    {pub.tags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {pub.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>❤️ {pub.likes_count}</span>
                                        <span>ID: {pub.id.slice(0, 8)}...</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(pub.id)}
                                    disabled={deleting === pub.id}
                                    className="flex shrink-0 items-center gap-1 rounded-lg bg-red-400/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-400/20 disabled:opacity-50"
                                >
                                    {deleting === pub.id ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                                    ) : (
                                        <TrashIcon className="h-3 w-3" />
                                    )}
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
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
    );
}
