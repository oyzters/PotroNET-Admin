import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SendIcon, UsersIcon, GraduationCapIcon, UserIcon, BellIcon, HistoryIcon } from 'lucide-react';

interface Career { id: string; name: string }
interface SentNotification { id: string; content: string; type: string; created_at: string }

type TargetType = 'global' | 'career' | 'user';

const ALLOWED_DOMAIN = '@potros.itson.edu.mx';

export function AdminNotificationsPage() {
    const { session } = useAuth();
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<TargetType>('global');
    const [careerId, setCareerId] = useState('');
    const [userEmailPrefix, setUserEmailPrefix] = useState('');
    const [careers, setCareers] = useState<Career[]>([]);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ sent?: number; error?: string } | null>(null);
    const [history, setHistory] = useState<SentNotification[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (!session?.access_token) return;
        const fetchCareers = async () => {
            try {
                const data = await api<{ careers: Career[] }>('/careers', { token: session.access_token });
                setCareers(data.careers);
            } catch { /* silent */ }
        };
        fetchCareers();
    }, [session?.access_token]);

    const fetchHistory = async () => {
        if (!session?.access_token) return;
        try {
            const data = await api<{ notifications: SentNotification[] }>('/admin/notifications', { token: session.access_token });
            setHistory(data.notifications);
            setShowHistory(true);
        } catch { /* silent */ }
    };

    const handleSend = async () => {
        if (!session?.access_token || !message.trim()) return;
        if (targetType === 'career' && !careerId) { setResult({ error: 'Selecciona una carrera' }); return; }
        if (targetType === 'user' && !userEmailPrefix.trim()) { setResult({ error: 'Ingresa el correo del usuario' }); return; }
        setSending(true);
        setResult(null);
        try {
            const body: Record<string, string> = { message: message.trim(), target_type: targetType };
            if (targetType === 'career') body.career_id = careerId;
            if (targetType === 'user') body.user_email = userEmailPrefix.trim().toLowerCase() + ALLOWED_DOMAIN;
            const data = await api<{ sent: number }>('/admin/notifications', {
                method: 'POST', token: session.access_token,
                body: JSON.stringify(body),
            });
            setResult({ sent: data.sent });
            setMessage('');
        } catch (e: unknown) {
            setResult({ error: (e as Error).message || 'Error al enviar' });
        } finally { setSending(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Notificaciones Globales</h1>
                <p className="text-sm text-muted-foreground">Envía mensajes a todos los usuarios o grupos específicos</p>
            </div>

            {/* Compose */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <BellIcon className="h-4 w-4" /> Mensaje
                    </label>
                    <Textarea
                        placeholder="Escribe el mensaje para los usuarios..."
                        value={message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                        maxLength={500}
                        className="min-h-[100px] resize-none"
                    />
                    <p className="text-xs text-right text-muted-foreground">{message.length}/500</p>
                </div>

                {/* Target type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Destinatario</label>
                    <div className="flex flex-wrap gap-2">
                        {(['global', 'career', 'user'] as TargetType[]).map(t => (
                            <button key={t} onClick={() => setTargetType(t)}
                                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${targetType === t
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-accent'}`}
                            >
                                {t === 'global' && <UsersIcon className="h-4 w-4" />}
                                {t === 'career' && <GraduationCapIcon className="h-4 w-4" />}
                                {t === 'user' && <UserIcon className="h-4 w-4" />}
                                {t === 'global' ? 'Global' : t === 'career' ? 'Por carrera' : 'Usuario específico'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Career selector */}
                {targetType === 'career' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Carrera</label>
                        <select value={careerId} onChange={e => setCareerId(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
                            <option value="">Seleccionar carrera...</option>
                            {careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}

                {/* User email input */}
                {targetType === 'user' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Correo del usuario</label>
                        <div className="flex items-center overflow-hidden rounded-lg border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                            <input
                                type="text"
                                placeholder="tu.nombreID"
                                value={userEmailPrefix}
                                onChange={e => setUserEmailPrefix(e.target.value.replace(/\s/g, ''))}
                                className="min-w-0 flex-1 bg-background px-3 py-2.5 text-sm outline-none"
                            />
                            <span className="shrink-0 select-none border-l border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                                {ALLOWED_DOMAIN}
                            </span>
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className={`rounded-lg p-3 text-sm ${result.error ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-600'}`}>
                        {result.error ? `Error: ${result.error}` : `✓ Mensaje enviado a ${result.sent} usuario(s)`}
                    </div>
                )}

                <Button className="w-full" onClick={handleSend} disabled={sending || !message.trim()}>
                    {sending
                        ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                        : <SendIcon className="mr-2 h-4 w-4" />
                    }
                    {sending ? 'Enviando...' : 'Enviar Notificación'}
                </Button>
            </div>

            {/* History */}
            <div>
                <button onClick={fetchHistory} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <HistoryIcon className="h-4 w-4" /> Ver historial de notificaciones enviadas
                </button>
                {showHistory && history.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {history.map(n => (
                            <div key={n.id} className="rounded-lg border border-border bg-card/50 p-3 flex items-start justify-between gap-3">
                                <p className="text-sm flex-1">{n.content}</p>
                                <div className="text-right shrink-0">
                                    <Badge variant="secondary">sistema</Badge>
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('es-MX')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {showHistory && history.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">No hay notificaciones enviadas aún.</p>
                )}
            </div>
        </div>
    );
}
