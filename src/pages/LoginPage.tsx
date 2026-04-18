import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldIcon, LogInIcon, ShieldAlertIcon } from 'lucide-react';

const ALLOWED_DOMAIN = '@potros.itson.edu.mx';

export function LoginPage() {
    const { signIn, isAdmin, profileLoading, authError, clearAuthError } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const email = username.trim().toLowerCase() + ALLOWED_DOMAIN;

    // ✅ Navigate as soon as isAdmin becomes true after a sign-in attempt
    useEffect(() => {
        if (isAdmin && !profileLoading) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAdmin, profileLoading, navigate]);

    // Show auth errors from the context (e.g. insufficient role)
    const displayError = authError || formError;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError('');
        clearAuthError();
        setSubmitting(true);

        try {
            await signIn(email, password);
            // Don't navigate here — the useEffect above handles it
            // once onAuthStateChange + fetchProfile resolve
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Credenciales incorrectas');
            setSubmitting(false);
        }
        // Note: setSubmitting(false) is NOT called on success path intentionally;
        // the spinner stays while profileLoading is true, then navigate fires.
    };

    // While Supabase has authenticated but profile is still being fetched, keep showing spinner
    const isLoading = submitting || profileLoading;

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/10">
                        <ShieldIcon className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">PotroNET Admin</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Panel de administración
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 rounded-2xl border border-border bg-card p-6"
                >
                    {/* Error display */}
                    {displayError && (
                        <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                            <ShieldAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                            <p className="text-sm text-destructive">{displayError}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Correo</label>
                        <div className="flex items-center overflow-hidden rounded-lg border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                                required
                                disabled={isLoading}
                                className="min-w-0 flex-1 bg-background px-4 py-2.5 text-sm text-foreground outline-none disabled:opacity-60"
                                placeholder="tu.nombreID"
                            />
                            <span className="shrink-0 select-none border-l border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                                {ALLOWED_DOMAIN}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !username.trim()}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                Verificando acceso...
                            </>
                        ) : (
                            <>
                                <LogInIcon className="h-4 w-4" />
                                Iniciar Sesión
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-muted-foreground">
                        Solo cuentas con rol <strong>Sudo</strong> tienen acceso
                    </p>
                </form>
            </div>
        </div>
    );
}
