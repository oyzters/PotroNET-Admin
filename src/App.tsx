import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { PublicationsPage } from '@/pages/PublicationsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ProfessorRequestsPage } from '@/pages/ProfessorRequestsPage';
import { AdminNotificationsPage } from '@/pages/AdminNotificationsPage';
import { ModerationLogPage } from '@/pages/ModerationLogPage';
import { SystemSettingsPage } from '@/pages/SystemSettingsPage';
import type { ReactNode } from 'react';
import {
    LayoutDashboardIcon,
    UsersIcon,
    FileTextIcon,
    LogOutIcon,
    ShieldIcon,
    AlertTriangleIcon,
    GraduationCapIcon,
    BellIcon,
    ClipboardListIcon,
    SettingsIcon,
} from 'lucide-react';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { profile, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!profile || !isAdmin) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function AdminLayout({ children }: { children: ReactNode }) {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboardIcon, label: 'Dashboard' },
        { to: '/users', icon: UsersIcon, label: 'Usuarios' },
        { to: '/publications', icon: FileTextIcon, label: 'Publicaciones' },
        { to: '/reports', icon: AlertTriangleIcon, label: 'Reportes' },
        { to: '/professor-requests', icon: GraduationCapIcon, label: 'Profesores' },
        { to: '/notifications', icon: BellIcon, label: 'Notificaciones' },
        { to: '/moderation-log', icon: ClipboardListIcon, label: 'Log de Moderación' },
        { to: '/system-settings', icon: SettingsIcon, label: 'Ajustes del Sistema' },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-border bg-card">
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 border-b border-border px-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <ShieldIcon className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                        <span className="text-sm font-bold">PotroNET</span>
                        <span className="ml-1 text-xs text-muted-foreground">Admin</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div className="border-t border-border p-4">
                    <div className="mb-3 rounded-lg bg-accent/50 p-3">
                        <p className="text-sm font-medium">{profile?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email?.split('@')[0]}</p>
                        <span className="mt-1 inline-block rounded bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                            {profile?.role?.toUpperCase()}
                        </span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOutIcon className="h-4 w-4" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="ml-64 flex-1 p-6">
                {children}
            </main>
        </div>
    );
}

export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <AdminLayout><DashboardPage /></AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/users"
                        element={
                            <ProtectedRoute>
                                <AdminLayout><UsersPage /></AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/publications"
                        element={
                            <ProtectedRoute>
                                <AdminLayout><PublicationsPage /></AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports"
                        element={
                            <ProtectedRoute>
                                <AdminLayout><ReportsPage /></AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/professor-requests"
                        element={
                            <ProtectedRoute>
                                <AdminLayout><ProfessorRequestsPage /></AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/notifications"
                        element={
                            <ProtectedRoute>
                                <AdminLayout><AdminNotificationsPage /></AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/moderation-log"
                        element={
                            <ProtectedRoute>
                                <AdminLayout><ModerationLogPage /></AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/system-settings"
                        element={
                            <ProtectedRoute>
                                <AdminLayout><SystemSettingsPage /></AdminLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
