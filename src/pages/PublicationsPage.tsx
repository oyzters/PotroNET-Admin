import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { TrashIcon, AlertTriangleIcon, SearchIcon, XIcon, ShieldAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Author {
    id: string; full_name: string; avatar_url: string; email: string;
}

interface Publication {
    id: string; content: string; tags: string[]; likes_count: number;
    created_at: string; author: Author;
    reports?: [{ count: number }];
}

interface PublicationsResponse {
    publications: Publication[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

const CATEGORIES = [
    { value: 'spam', label: 'Spam / Publicidad' },
    { value: 'sexual_content', label: 'Contenido inapropiado / Sexual' },
    { value: 'harassment', label: 'Acoso o Ataques' },
    { value: 'hate_speech', label: 'Discurso de odio' },
    { value: 'other', label: 'Violación de normas / Otro' },
];

export function PublicationsPage() {
    const { session } = useAuth();
    const toast = useToast();
    const [publications, setPublications] = useState<Publication[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    
    // Delete state
    const [deletingPub, setDeletingPub] = useState<Publication | null>(null);
    const [deleteCategory, setDeleteCategory] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchPublications = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '15' });
            if (search.trim()) params.set('search', search.trim());
            const data = await api<PublicationsResponse>(`/admin/publications?${params}`, { token: session.access_token });
            setPublications(data.publications);
            setTotalPages(data.pagination.totalPages);
            setTotal(data.pagination.total);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No se pudieron cargar las publicaciones');
        } finally { setLoading(false); }
    }, [session?.access_token, page, search, toast]);

    useEffect(() => { fetchPublications(); }, [fetchPublications]);

    const handleConfirmDelete = async () => {
        if (!session?.access_token || !deletingPub || !deleteCategory) return;
        setIsDeleting(true);
        try {
            await api(`/moderation/publications/${deletingPub.id}/remove`, {
                method: 'POST',
                token: session.access_token,
                body: JSON.stringify({ category: deleteCategory, reason: deleteReason.trim() }),
            });
            setPublications(publications.filter((p) => p.id !== deletingPub.id));
            setTotal((t) => t - 1);
            setDeletingPub(null);
            setDeleteCategory('');
            setDeleteReason('');
            toast.success('Publicación eliminada');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No se pudo eliminar');
        } finally { setIsDeleting(false); }
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
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Publicaciones</h1>
                    <p className="text-sm text-muted-foreground">{total} publicaciones indexadas</p>
                </div>
                
                <div className="relative w-full sm:max-w-xs">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Buscar contenido..."
                        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    {search && (
                        <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <XIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
                ) : publications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center">
                        <p className="text-muted-foreground">No hay publicaciones encontradas.</p>
                    </div>
                ) : (
                    publications.map((pub) => {
                        const reportCount = pub.reports?.[0]?.count || 0;
                        return (
                            <div key={pub.id} className={`rounded-xl border p-5 transition-all relative overflow-hidden ${reportCount > 0 ? 'border-amber-500/40 bg-card/80' : 'border-border bg-card'}`}>
                                {reportCount > 0 && (
                                    <div className="absolute top-0 right-0 bg-amber-500/20 px-3 py-1 rounded-bl-xl border-b border-l border-amber-500/40 flex items-center gap-1.5 text-xs font-bold text-amber-500">
                                        <AlertTriangleIcon className="h-3.5 w-3.5" />
                                        {reportCount} Reporte{reportCount !== 1 && 's'}
                                    </div>
                                )}
                                
                                <div className="flex items-start justify-between gap-4 mt-1">
                                    <div className="flex-1 min-w-0 pr-12">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium">{pub.author?.full_name || 'Anónimo'}</span>
                                            <span className="text-muted-foreground">·</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">{pub.author?.email}</span>
                                            <span className="text-muted-foreground">·</span>
                                            <span className="text-xs text-muted-foreground">{timeAgo(pub.created_at)}</span>
                                        </div>
                                        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{pub.content}</p>
                                        
                                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>❤️ {pub.likes_count}</span>
                                            <span className="font-mono">ID: {pub.id.slice(0, 16)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setDeletingPub(pub)}
                                        className="flex shrink-0 items-center justify-center h-8 w-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                        title="Eliminar como moderador"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Anterior</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Siguiente</Button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <Dialog open={!!deletingPub} onOpenChange={(open: boolean) => !open && !isDeleting && setDeletingPub(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlertIcon className="h-5 w-5" /> Eliminar Publicación
                        </DialogTitle>
                        <DialogDescription>
                            Estás ordenando la eliminación forzada de la publicación de <strong>{deletingPub?.author?.full_name}</strong>. Esta acción quedará registrada en el Audit Log.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-muted/50 p-3 text-sm italic border border-border/50 max-h-[100px] overflow-y-auto">
                            "{deletingPub?.content}"
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoría de infracción *</label>
                            <select 
                                value={deleteCategory} 
                                onChange={e => setDeleteCategory(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-destructive"
                            >
                                <option value="" disabled>Selecciona una categoría...</option>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota interna (Opcional)</label>
                            <Textarea 
                                placeholder="La publicación incluye enlaces a sitios prohibidos..." 
                                value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeletingPub(null)} disabled={isDeleting}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting || !deleteCategory}>
                            {isDeleting ? 'Eliminando...' : 'Aceptar y Eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
