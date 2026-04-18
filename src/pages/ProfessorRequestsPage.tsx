import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    GraduationCapIcon, CheckCircleIcon, XCircleIcon, UserIcon,
} from 'lucide-react';

interface Requester { id: string; full_name: string; email: string }
interface Career { id: string; name: string }
interface ProfessorRequest {
    id: string; professor_name: string; department: string;
    reason: string; status: string; created_at: string;
    nickname: string | null;
    requester: Requester; career: Career | null;
}
interface RequestsResponse {
    requests: ProfessorRequest[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function ProfessorRequestsPage() {
    const { session } = useAuth();
    const [requests, setRequests] = useState<ProfessorRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchRequests = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20', status: statusFilter });
            const data = await api<RequestsResponse>(`/admin/professor-requests?${params}`, { token: session.access_token });
            setRequests(data.requests);
            setTotalPages(data.pagination.totalPages);
        } catch { /* silent */ } finally { setLoading(false); }
    }, [session?.access_token, page, statusFilter]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleAction = async (requestId: string, status: 'approved' | 'rejected') => {
        if (!session?.access_token) return;
        try {
            await api('/admin/professor-requests', {
                method: 'PATCH', token: session.access_token,
                body: JSON.stringify({ request_id: requestId, status }),
            });
            fetchRequests();
        } catch { /* silent */ }
    };

    const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };
    const STATUS_COLORS: Record<string, string> = {
        pending: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
        approved: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
        rejected: 'bg-red-500/20 text-red-700 dark:text-red-400',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Solicitudes de Profesores</h1>
                <p className="text-sm text-muted-foreground">Aprobar o rechazar solicitudes para agregar profesores</p>
            </div>

            <div className="flex gap-2">
                {['pending', 'approved', 'rejected'].map(s => (
                    <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }}>
                        {STATUS_LABELS[s]}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
            ) : requests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                    <GraduationCapIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">No hay solicitudes {STATUS_LABELS[statusFilter]?.toLowerCase()}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(r => (
                        <Card key={r.id}>
                            <CardContent className="py-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                        <GraduationCapIcon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold">{r.professor_name}</h3>
                                            {r.nickname && (
                                                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                    {r.nickname}
                                                </span>
                                            )}
                                            <Badge className={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                                        </div>
                                        {r.department && <p className="text-sm text-muted-foreground">{r.department}</p>}
                                        {r.career && <Badge variant="secondary" className="mt-1">{r.career.name}</Badge>}
                                        {r.reason && <p className="mt-2 text-sm"><span className="font-medium">Razón:</span> {r.reason}</p>}
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                            <UserIcon className="h-3 w-3" /> {r.requester?.full_name} • {new Date(r.created_at).toLocaleDateString('es-MX')}
                                        </div>
                                    </div>
                                    {r.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleAction(r.id, 'approved')}>
                                                <CheckCircleIcon className="mr-1 h-4 w-4" /> Aprobar
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleAction(r.id, 'rejected')}>
                                                <XCircleIcon className="mr-1 h-4 w-4 text-red-400" /> Rechazar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                    <span className="flex items-center text-sm text-muted-foreground">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
                </div>
            )}
        </div>
    );
}
