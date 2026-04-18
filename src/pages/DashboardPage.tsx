import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import {
    UsersIcon, FileTextIcon, GraduationCapIcon, ShieldAlertIcon,
    TrendingUpIcon, UserCheckIcon, UserIcon,
    AlertTriangleIcon, ShieldIcon, MessageCircleIcon, BookOpenIcon,
    SendIcon, LayersIcon, ActivityIcon, ArrowRightIcon,
} from 'lucide-react';

interface Stats {
    totalUsers: number;
    totalPublications: number;
    totalCareers: number;
    totalProfessors: number;
    totalTutoring: number;
    totalResources: number;
    totalComments: number;
    totalMessages: number;
    totalSubjects: number;
    pendingReports: number;
    pendingProfessorRequests: number;
    bannedUsers: number;
    activeWarnings: number;
    newUsersThisWeek: number;
    newPublicationsThisWeek: number;
    newCommentsThisWeek: number;
    newMessagesThisWeek: number;
    usersByRole: { user: number; admin: number; sudo: number };
}

export function DashboardPage() {
    const { session } = useAuth();
    const toast = useToast();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!session?.access_token) return;
            try {
                const data = await api<{ stats: Stats }>('/admin/stats', { token: session.access_token });
                setStats(data.stats);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'No se pudieron cargar las estadísticas');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [session?.access_token, toast]);

    if (loading || !stats) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Resumen general de PotroNET</p>
            </div>

            {/* Alertas / Acciones pendientes */}
            {(stats.pendingReports > 0 || stats.pendingProfessorRequests > 0 || stats.activeWarnings > 0) && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
                        <h2 className="text-sm font-semibold">Requieren tu atención</h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {stats.pendingReports > 0 && (
                            <ActionCard
                                label="Reportes pendientes"
                                value={stats.pendingReports}
                                to="/reports"
                                color="text-amber-500"
                            />
                        )}
                        {stats.pendingProfessorRequests > 0 && (
                            <ActionCard
                                label="Solicitudes de profesor"
                                value={stats.pendingProfessorRequests}
                                to="/professor-requests"
                                color="text-blue-500"
                            />
                        )}
                        {stats.activeWarnings > 0 && (
                            <ActionCard
                                label="Advertencias activas"
                                value={stats.activeWarnings}
                                to="/users"
                                color="text-orange-500"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Comunidad */}
            <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Comunidad</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Usuarios" value={stats.totalUsers} icon={UsersIcon} accent="blue" delta={stats.newUsersThisWeek} deltaLabel="nuevos" />
                    <StatCard title="Baneados" value={stats.bannedUsers} icon={ShieldAlertIcon} accent="red" subtitle={`${pct(stats.bannedUsers, stats.totalUsers).toFixed(1)}% del total`} />
                    <StatCard title="Mensajes" value={stats.totalMessages} icon={MessageCircleIcon} accent="cyan" delta={stats.newMessagesThisWeek} deltaLabel="esta semana" />
                    <StatCard title="Comentarios" value={stats.totalComments} icon={MessageCircleIcon} accent="violet" delta={stats.newCommentsThisWeek} deltaLabel="esta semana" />
                </div>
            </section>

            {/* Contenido */}
            <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contenido</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Publicaciones" value={stats.totalPublications} icon={FileTextIcon} accent="emerald" delta={stats.newPublicationsThisWeek} deltaLabel="esta semana" />
                    <StatCard title="Tutorías activas" value={stats.totalTutoring} icon={ActivityIcon} accent="pink" />
                    <StatCard title="Recursos" value={stats.totalResources} icon={LayersIcon} accent="orange" />
                    <StatCard title="Profesores" value={stats.totalProfessors} icon={GraduationCapIcon} accent="amber" />
                </div>
            </section>

            {/* Académico */}
            <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Académico</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard title="Carreras" value={stats.totalCareers} icon={GraduationCapIcon} accent="amber" />
                    <StatCard title="Materias (oferta total)" value={stats.totalSubjects} icon={BookOpenIcon} accent="emerald" />
                    <StatCard title="Crecimiento" value={stats.newUsersThisWeek} icon={TrendingUpIcon} accent="violet" subtitle="nuevos usuarios esta semana" />
                </div>
            </section>

            {/* Distribución por rol */}
            <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Distribución por rol</h2>
                <div className="rounded-xl border border-border bg-card p-5">
                    <div className="space-y-4">
                        <RoleBar label="Usuarios" value={stats.usersByRole.user} total={stats.totalUsers} color="bg-sky-500" icon={UserIcon} />
                        <RoleBar label="Admins" value={stats.usersByRole.admin} total={stats.totalUsers} color="bg-amber-500" icon={UserCheckIcon} />
                        <RoleBar label="Sudo" value={stats.usersByRole.sudo} total={stats.totalUsers} color="bg-red-500" icon={ShieldIcon} />
                    </div>
                </div>
            </section>

            {/* Accesos rápidos */}
            <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Accesos rápidos</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <QuickLink to="/notifications" icon={SendIcon} label="Enviar notificación" description="Global, por carrera o a un usuario" />
                    <QuickLink to="/users" icon={UsersIcon} label="Gestionar usuarios" description="Banear, roles, permisos" />
                    <QuickLink to="/subjects" icon={BookOpenIcon} label="Materias" description="Editar oferta académica" />
                </div>
            </section>
        </div>
    );
}

const ACCENT_BG: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500',
    red: 'bg-red-500/10 text-red-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    violet: 'bg-violet-500/10 text-violet-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
    pink: 'bg-pink-500/10 text-pink-500',
    orange: 'bg-orange-500/10 text-orange-500',
};

interface StatCardProps {
    title: string;
    value: number;
    icon: typeof UsersIcon;
    accent: keyof typeof ACCENT_BG;
    delta?: number;
    deltaLabel?: string;
    subtitle?: string;
}

function StatCard({ title, value, icon: Icon, accent, delta, deltaLabel, subtitle }: StatCardProps) {
    return (
        <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30">
            <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
                </div>
                <div className={`shrink-0 rounded-lg p-2 ${ACCENT_BG[accent]}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            {(delta !== undefined && delta > 0) && (
                <p className="mt-2 flex items-center gap-1 text-xs text-emerald-500">
                    <TrendingUpIcon className="h-3 w-3" /> +{delta} {deltaLabel}
                </p>
            )}
            {subtitle && <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
    );
}

function ActionCard({ label, value, to, color }: { label: string; value: number; to: string; color: string }) {
    return (
        <Link
            to={to}
            className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-primary/40 hover:bg-card/80"
        >
            <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
    );
}

function RoleBar({ label, value, total, color, icon: Icon }: { label: string; value: number; total: number; color: string; icon: typeof UserIcon }) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function QuickLink({ to, icon: Icon, label, description }: { to: string; icon: typeof UsersIcon; label: string; description: string }) {
    return (
        <Link
            to={to}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-card/80"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{label}</p>
                <p className="truncate text-xs text-muted-foreground">{description}</p>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
    );
}
