import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
    UsersIcon,
    FileTextIcon,
    GraduationCapIcon,
    ShieldAlertIcon,
    TrendingUpIcon,
    UserCheckIcon,
    UserXIcon,
    UserIcon,
    AlertTriangleIcon,
    ShieldIcon,
} from 'lucide-react';

interface Stats {
    totalUsers: number;
    totalPublications: number;
    totalCareers: number;
    bannedUsers: number;
    newUsersThisWeek: number;
    pendingReports: number;
    activeWarnings: number;
    usersByRole: {
        user: number;
        admin: number;
        sudo: number;
    };
}

export function DashboardPage() {
    const { session } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!session?.access_token) return;
            try {
                const data = await api<{ stats: Stats }>('/admin/stats', {
                    token: session.access_token,
                });
                setStats(data.stats);
            } catch {
                // Error handled silently
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [session?.access_token]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const mainCards = [
        {
            title: 'Usuarios Totales',
            value: stats?.totalUsers || 0,
            icon: UsersIcon,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
        },
        {
            title: 'Publicaciones',
            value: stats?.totalPublications || 0,
            icon: FileTextIcon,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
        },
        {
            title: 'Carreras',
            value: stats?.totalCareers || 0,
            icon: GraduationCapIcon,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
        },
        {
            title: 'Usuarios Baneados',
            value: stats?.bannedUsers || 0,
            icon: ShieldAlertIcon,
            color: 'text-red-400',
            bg: 'bg-red-400/10',
        },
        {
            title: 'Nuevos (esta semana)',
            value: stats?.newUsersThisWeek || 0,
            icon: TrendingUpIcon,
            color: 'text-violet-400',
            bg: 'bg-violet-400/10',
        },
        {
            title: 'Reportes Pdt.',
            value: stats?.pendingReports || 0,
            icon: AlertTriangleIcon,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        },
        {
            title: 'Advertencias Activas',
            value: stats?.activeWarnings || 0,
            icon: ShieldIcon,
            color: 'text-orange-400',
            bg: 'bg-orange-400/10',
        },
    ];

    const roleCards = [
        { label: 'Usuarios', value: stats?.usersByRole.user || 0, icon: UserIcon, color: 'text-sky-400' },
        { label: 'Admins', value: stats?.usersByRole.admin || 0, icon: UserCheckIcon, color: 'text-amber-400' },
        { label: 'Sudo', value: stats?.usersByRole.sudo || 0, icon: UserXIcon, color: 'text-red-400' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Resumen general de PotroNET
                </p>
            </div>

            {/* Main stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {mainCards.map((card) => (
                    <div
                        key={card.title}
                        className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">
                                {card.title}
                            </p>
                            <div className={`rounded-lg p-2 ${card.bg}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </div>
                        <p className="mt-3 text-3xl font-bold">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Roles breakdown */}
            <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">Distribución por Roles</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    {roleCards.map((role) => (
                        <div
                            key={role.label}
                            className="flex items-center gap-4 rounded-lg border border-border bg-background p-4"
                        >
                            <role.icon className={`h-8 w-8 ${role.color}`} />
                            <div>
                                <p className="text-2xl font-bold">{role.value}</p>
                                <p className="text-xs text-muted-foreground">{role.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
