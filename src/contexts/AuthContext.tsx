import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: 'user' | 'admin' | 'sudo';
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    /** true while the initial session + profile fetch is in flight */
    loading: boolean;
    /** true while fetchProfile is running after a sign-in event */
    profileLoading: boolean;
    /** set when a user logs in but lacks admin/sudo role */
    authError: string | null;
    clearAuthError: () => void;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const clearAuthError = useCallback(() => setAuthError(null), []);

    const fetchProfile = useCallback(async (accessToken: string) => {
        setProfileLoading(true);
        try {
            const data = await api<{ user: Profile }>('/auth/me', { token: accessToken });
            const role = data.user.role;

            if (role !== 'admin' && role !== 'sudo') {
                // Valid Supabase user but not an admin — sign out and report
                await supabase.auth.signOut();
                setProfile(null);
                setAuthError(
                    `Tu cuenta (${data.user.email}) no tiene permisos de administrador. ` +
                    `Rol actual: "${role}". Contacta a un administrador Sudo para solicitar acceso.`
                );
                return;
            }

            setProfile(data.user);
            setAuthError(null);
        } catch {
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.access_token) {
                fetchProfile(session.access_token).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.access_token) {
                    fetchProfile(session.access_token);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const signIn = async (email: string, password: string) => {
        setAuthError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // fetchProfile will be triggered by onAuthStateChange — don't navigate here
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setAuthError(null);
    };

    const isAdmin = profile?.role === 'sudo';

    return (
        <AuthContext.Provider value={{
            user, profile, session,
            loading, profileLoading,
            authError, clearAuthError,
            signIn, signOut, isAdmin,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
