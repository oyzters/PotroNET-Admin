import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertTriangleIcon, UserIcon, FileTextIcon, StarIcon,
    CheckCircleIcon, XCircleIcon, EyeIcon,
} from 'lucide-react';

interface Reporter { id: string; full_name: string; email: string; }
interface Report {
    id: string; report_type: string; target_id: string; reason: string;
    description: string; status: string; created_at: string; reporter: Reporter;
    resolution_note?: string; resolved_content_deleted?: boolean;
}
interface ReportsResponse {
    reports: Report[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
    reviewed: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    resolved: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    dismissed: 'bg-muted text-muted-foreground',
};
const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', reviewed: 'Revisado', resolved: 'Resuelto', dismissed: 'Descartado' };
const TYPE_ICONS: Record<string, typeof AlertTriangleIcon> = { publication: FileTextIcon, user: UserIcon, review: StarIcon };

export function ReportsPage() {
    const { session } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [resolvingReport, setResolvingReport] = useState<Report | null>(null);
    const [resolveStatus, setResolveStatus] = useState('');
    const [resolutionNote, setResolutionNote] = useState('');
    const [deleteContent, setDeleteContent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchReports = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (statusFilter) params.set('status', statusFilter);
            const data = await api<ReportsResponse>(`/admin/reports?${params}`, { token: session.access_token });
            setReports(data.reports);
            setTotalPages(data.pagination.totalPages);
        } catch { /* silent */ } finally { setLoading(false); }
    }, [session?.access_token, page, statusFilter]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const handleAction = async (reportId: string, status: string) => {
        if (!session?.access_token) return;
        if (status === 'resolved' || status === 'dismissed') {
            setResolveStatus(status);
            setResolvingReport(reports.find(r => r.id === reportId) || null);
            setResolutionNote('');
            setDeleteContent(false);
            return;
        }
        try {
            await api('/admin/reports', { method: 'PATCH', token: session.access_token, body: JSON.stringify({ report_id: reportId, status }) });
            fetchReports();
        } catch { /* silent */ }
    };

    const submitResolution = async () => {
        if (!session?.access_token || !resolvingReport) return;
        setSubmitting(true);
        try {
            const body: any = { report_id: resolvingReport.id, status: resolveStatus };
            if (resolutionNote.trim()) body.resolution_note = resolutionNote.trim();
            if (deleteContent) body.resolved_content_deleted = true;

            await api('/admin/reports', { method: 'PATCH', token: session.access_token, body: JSON.stringify(body) });
            
            // Si el admin pide borrar el contenido aquí mismo:
            if (deleteContent && resolvingReport.report_type === 'publication') {
                try {
                    await api(`/moderation/publications/${resolvingReport.target_id}/remove`, {
                        method: 'POST',
                        token: session.access_token,
                        body: JSON.stringify({ category: 'otro', reason: resolutionNote }),
                    });
                } catch { /* ignora si ya fue borrado antes */ }
            }

            setResolvingReport(null);
            fetchReports();
        } catch { /* silent */ } finally { setSubmitting(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Reportes</h1>
                <p className="text-sm text-muted-foreground">Gestiona los reportes de usuarios y resuelve conflictos</p>
            </div>

            <div className="flex gap-2">
                {['pending', 'reviewed', 'resolved', 'dismissed'].map(s => (
                    <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(s); setPage(1); }}>
                        {STATUS_LABELS[s]}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
            ) : reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                    <AlertTriangleIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">No hay reportes {STATUS_LABELS[statusFilter]?.toLowerCase()}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map(r => {
                        const Icon = TYPE_ICONS[r.report_type] || AlertTriangleIcon;
                        return (
                            <Card key={r.id}>
                                <CardContent className="py-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                                            <Icon className="h-5 w-5 text-destructive" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="secondary">{r.report_type}</Badge>
                                                <Badge className={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                                            </div>
                                            <p className="mt-2 text-sm font-medium">{r.reason}</p>
                                            {r.description && <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>}
                                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>Por: {r.reporter?.full_name}</span>
                                                <span className="font-mono">ID Target: {r.target_id.slice(0, 16)}...</span>
                                                <span>{new Date(r.created_at).toLocaleDateString('es-MX')}</span>
                                            </div>
                                            
                                            {r.resolution_note && (
                                                <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs border border-border/50">
                                                    <p className="font-semibold text-muted-foreground mb-1">Nota de Resolución:</p>
                                                    <p>{r.resolution_note}</p>
                                                    {r.resolved_content_deleted && (
                                                        <Badge variant="destructive" className="mt-2 text-[10px]">Contenido removido</Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {r.status === 'pending' || r.status === 'reviewed' ? (
                                            <div className="flex gap-1 flex-col sm:flex-row">
                                                {r.status === 'pending' && (
                                                    <Button variant="outline" size="sm" onClick={() => handleAction(r.id, 'reviewed')}><EyeIcon className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Revisar</span></Button>
                                                )}
                                                <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm" onClick={() => handleAction(r.id, 'resolved')}><CheckCircleIcon className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Resolver</span></Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleAction(r.id, 'dismissed')}><XCircleIcon className="h-4 w-4 text-red-500" /></Button>
                                            </div>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                    <span className="flex items-center text-sm text-muted-foreground">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
                </div>
            )}

            <Dialog open={!!resolvingReport} onOpenChange={(open: boolean) => !open && setResolvingReport(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{resolveStatus === 'resolved' ? 'Resolver Reporte' : 'Descartar Reporte'}</DialogTitle>
                        <DialogDescription>
                            Añade una nota interna explicando por qué tomaste esta decisión.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nota de resolución (opcional)</Label>
                            <Textarea 
                                placeholder="El contenido violaba las normas..." 
                                value={resolutionNote} 
                                onChange={e => setResolutionNote(e.target.value)}
                            />
                        </div>

                        {resolveStatus === 'resolved' && (resolvingReport?.report_type === 'publication' || resolvingReport?.report_type === 'comment') && (
                            <div className="flex items-center space-x-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                                <Checkbox 
                                    id="deleteContent" 
                                    checked={deleteContent} 
                                    onCheckedChange={(c: boolean | 'indeterminate') => setDeleteContent(!!c)} 
                                />
                                <Label htmlFor="deleteContent" className="text-destructive font-medium cursor-pointer">
                                    Eliminar automáticamente el contenido reportado
                                </Label>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setResolvingReport(null)} disabled={submitting}>Cancelar</Button>
                        <Button onClick={submitResolution} disabled={submitting} className={resolveStatus === 'resolved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}>
                            {submitting ? 'Guardando...' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
