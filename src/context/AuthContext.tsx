import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Export to window for debugging
if (typeof window !== 'undefined') {
    (window as any).supabase = supabase;
}

export type UserPlan = 'free' | 'pro' | 'advanced' | 'business';
export type UserRole = 'admin' | 'marketing' | 'designer' | 'user';

export interface User {
    id: string;
    authId: string;
    name: string;
    email: string;
    phone?: string;
    plan: UserPlan;
    role: UserRole;
    role_id?: string;
    discount_rate?: number;
    discount_plan?: string;
    discount_deadline?: string;
    subscription_end_date?: string;
    photo_url?: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<{ error: string | null }>;
    register: () => Promise<{ error: string | null }>;
    logout: () => Promise<void>;
    upgradePlan: (plan: UserPlan) => Promise<{ error: string | null }>;
    updateProfile: (name: string, email: string, phone?: string) => Promise<{ error: string | null }>;
    updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
    adminLogin: (email: string, pass: string) => Promise<{ error: string | null }>;
    needs2FA: boolean;
    sendOtp: (identifier: string, options?: { metadata?: { name?: string, phone?: string }, shouldCreateUser?: boolean }) => Promise<{ error: string | null }>;
    verifyOtp: (identifier: string, token: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // Initialize from LocalStorage for instant load
    const [user, setUser] = useState<User | null>(() => {
        try {
            const cached = localStorage.getItem('app_user');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });

    // If we have a user, we are not loading initially
    const [isLoading, setIsLoading] = useState(() => {
        return !localStorage.getItem('app_user');
    });

    const [session, setSession] = useState<Session | null>(null);
    const [needs2FA] = useState(false);

    // Sync user to LocalStorage
    useEffect(() => {
        if (user) {
            localStorage.setItem('app_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('app_user');
        }
    }, [user]);

    // Use refs to track current state without triggering effects or loops
    const lastSessionId = useRef<string | null>(null);
    const lastUserId = useRef<string | null>(null);
    const isProcessing = useRef(false);

    // Fetch user profile from app_users table
    const fetchUserProfile = useCallback(async (authUser: SupabaseUser, retries = 2): Promise<User | null> => {
        try {
            // Try to fetch profile. We use auth_id as it is the most reliable link.
            const { data: profile, error: profileError } = await supabase
                .from('app_users')
                .select('*')
                .eq('auth_id', authUser.id)
                .maybeSingle();

            if (profileError) {
                if (profileError.message?.includes('aborted') && retries > 0) {
                    console.warn('[Auth] Profile fetch aborted, retrying...');
                    await new Promise(resolve => setTimeout(resolve, 800));
                    return fetchUserProfile(authUser, retries - 1);
                }
                console.error('[Auth] Profile fetch error:', {
                    code: profileError.code,
                    message: profileError.message,
                    details: profileError.details,
                    hint: profileError.hint
                });
            }

            if (profile) {
                // Return full profile
                return {
                    id: profile.id,
                    authId: authUser.id,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone || '',
                    plan: profile.plan || 'pro',
                    role: profile.role as UserRole,
                    role_id: profile.role_id,
                    discount_rate: profile.discount_rate || 0,
                    discount_plan: profile.discount_plan || undefined,
                    discount_deadline: profile.discount_deadline || undefined,
                    photo_url: profile.photo_url
                };
            }

            // If profile doesn't exist, we MUST create one or at least resolve the internal ID
            const trimmedEmail = authUser.email?.trim().toLowerCase();
            const isAdmin = trimmedEmail === 'stepofstep@mail.com';
            const defaultRole = isAdmin ? 'admin' : 'user';

            // Create new profile record
            const generateUUID = () => {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    return crypto.randomUUID();
                }
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            };

            const newId = generateUUID();
            const { data: newProfile, error: insertError } = await supabase
                .from('app_users')
                .insert({
                    id: newId,
                    auth_id: authUser.id,
                    email: trimmedEmail,
                    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                    role: defaultRole,
                    plan: 'pro'
                })
                .select()
                .single();

            if (insertError) {
                if (insertError.message?.includes('aborted') && retries > 0) {
                    console.warn('[Auth] Profile creation aborted, retrying...');
                    await new Promise(resolve => setTimeout(resolve, 800));
                    return fetchUserProfile(authUser, retries - 1);
                }
                console.error('[Auth] Profile creation failed:', insertError);
                // Last ditch fallback - use auth ID but this might cause FK issues if record isn't in DB
                return {
                    id: authUser.id, 
                    authId: authUser.id,
                    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                    email: authUser.email || '',
                    plan: 'pro',
                    role: defaultRole as UserRole,
                    discount_rate: 0
                };
            }

            return {
                id: newProfile.id,
                authId: authUser.id,
                name: newProfile.name,
                email: newProfile.email,
                plan: newProfile.plan,
                role: newProfile.role as UserRole,
                role_id: newProfile.role_id
            };
        } catch (err) {
            console.error('[Auth] Profile fetch exception:', err);
            return null;
        }
    }, []);

    // Initialize auth state
    useEffect(() => {
        let isMounted = true;

        const handleAuthStateChange = async (newSession: Session | null) => {
            if (!isMounted) return;

            const currentUserId = newSession?.user?.id || null;
            const currentToken = newSession?.access_token || null;

            // Strict check: If same user and same token, do nothing
            if (currentUserId === lastUserId.current && currentToken === lastSessionId.current) {
                if (!isLoading) return;
            }

            // Lock processing
            if (isProcessing.current) return;
            isProcessing.current = true;

            try {
                console.log('[Auth] Processing state change for:', currentUserId || 'Guest');
                setSession(newSession);
                lastUserId.current = currentUserId;
                lastSessionId.current = currentToken;

                if (newSession?.user) {
                    const profile = await fetchUserProfile(newSession.user);
                    if (isMounted) setUser(profile);
                } else {
                    if (isMounted) {
                        setUser(null);
                        localStorage.removeItem('app_user');
                    }
                }
            } catch (err) {
                console.error('[Auth] State change error:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    isProcessing.current = false;
                }
            }
        };

        const isInitCalled = { current: false };

        const initSession = async (retries = 3) => {
            if (isInitCalled.current && retries === 3) return;
            isInitCalled.current = true;

            // Failsafe watchdog to prevent permanent loading
            const watchdog = setTimeout(() => {
                if (isMounted && isLoading) {
                    console.warn('[Auth] Init taking too long, forcing ready state');
                    setIsLoading(false);
                }
            }, 6000);

            try {
                if (!supabase) throw new Error('Supabase client not initialized');
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();
                
                if (error) {
                    if (error.message?.includes('aborted') && retries > 0) {
                        console.warn(`[Auth] Session fetch aborted, retrying in 1.5s... (${retries} left)`);
                        setTimeout(() => initSession(retries - 1), 1500);
                        clearTimeout(watchdog);
                        return;
                    }
                    throw error;
                }

                if (isMounted) {
                    await handleAuthStateChange(currentSession);
                }
            } catch (err: any) {
                if (err.message?.includes('aborted') && retries > 0) {
                    console.warn(`[Auth] Session fetch failed with AbortError, retrying in 1.5s... (${retries} left)`);
                    setTimeout(() => initSession(retries - 1), 1500);
                    clearTimeout(watchdog);
                    return;
                }
                console.error('[Auth] Init error:', err);
                if (isMounted) setIsLoading(false);
            } finally {
                clearTimeout(watchdog);
            }
        };

        const initTimer = setTimeout(() => {
            if (isMounted && isLoading) {
                console.warn('[Auth] Initialization taking too long, finalizing loading state');
                if (isMounted) setIsLoading(false);
            }
        }, 12000);

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, newSession: Session | null) => {
            if (event === 'INITIAL_SESSION') return; // Handled by initSession
            
            console.log('[Auth] Auth event:', event);
            if (isMounted) {
                // If token refreshed, just update session, don't re-fetch profile if user ID is same
                if (event === 'TOKEN_REFRESHED' && newSession?.user?.id === lastUserId.current) {
                    setSession(newSession);
                    lastSessionId.current = newSession?.access_token || null;
                    return;
                }
                await handleAuthStateChange(newSession);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(initTimer);
        };
    }, [fetchUserProfile]);

    // Login with password removed preference for OTP - BUT KEEP FOR ADMIN LOGIN
    const adminLogin = useCallback(async (email: string, pass: string, retries = 1) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: pass
            });

            if (error) {
                if (error.message?.includes('aborted') && retries > 0) {
                    console.warn('[Auth] Login aborted, retrying...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return adminLogin(email, pass, retries - 1);
                }
                throw error;
            }
            
            // Fetch profile immediately to check if user is actually an admin
            if (data.user) {
                const profile = await fetchUserProfile(data.user);
                if (profile?.role !== 'admin') {
                    await supabase.auth.signOut();
                    return { error: 'Bu alana giriş yetkiniz bulunmuyor.' };
                }
                setUser(profile);
                setSession(data.session);
            }
            
            return { error: null };
        } catch (err: any) {
            if (err.message?.includes('aborted') && retries > 0) {
                console.warn('[Auth] Login failed with AbortError, retrying...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return adminLogin(email, pass, retries - 1);
            }
            console.error('[Auth] Admin Login Error:', err);
            return { error: err.message || 'Giriş başarısız.' };
        }
    }, [fetchUserProfile]);

    const login = useCallback(async () => {
        return { error: 'Giriş işlemi artık sadece kod ile yapılmaktadır.' };
    }, []);

    // Register with password removed preference for OTP
    const register = useCallback(async () => {
        return { error: 'Kayıt işlemi artık sadece kod ile yapılmaktadır.' };
    }, []);

    const sendOtp = useCallback(async (identifier: string, options: { metadata?: { name?: string, phone?: string }, shouldCreateUser?: boolean } = {}): Promise<{ error: string | null }> => {
        try {
            const isEmail = identifier.includes('@');
            let error;
            const shouldCreateUser = options.shouldCreateUser ?? true;

            if (isEmail) {
                const email = identifier.toLowerCase().trim();
                console.log('[Auth] Sending OTP to email:', email, 'shouldCreateUser:', shouldCreateUser);
                const result = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        shouldCreateUser: shouldCreateUser,
                        data: options.metadata
                    }
                });
                error = result.error;
            } else {
                const phone = identifier.replace(/[^0-9+]/g, '');
                console.log('[Auth] Sending OTP to phone:', phone, 'shouldCreateUser:', shouldCreateUser);
                const result = await supabase.auth.signInWithOtp({
                    phone,
                    options: {
                        shouldCreateUser: shouldCreateUser,
                        data: options.metadata
                    }
                });
                error = result.error;
            }

            if (error) {
                console.error('Send OTP error:', error);
                // Translate common Supabase errors
                if (error.message.includes('Signups not allowed')) return { error: 'Kayıtlı kullanıcı bulunamadı. Lütfen önce kayıt olun.' };

                // Translate rate limit error
                // Example: "For security purposes, you can only request this after 38 seconds."
                if (error.message.includes('For security purposes, you can only request this after')) {
                    const seconds = error.message.match(/after (\d+) second/)?.[1];
                    if (seconds) {
                        return { error: `Güvenlik nedeniyle, tekrar kod istemeden önce ${seconds} saniye beklemelisiniz.` };
                    }
                    return { error: 'Güvenlik nedeniyle, lütfen bir süre bekleyip tekrar deneyiniz.' };
                }

                return { error: error.message };
            }

            return { error: null };
        } catch (err: any) {
            console.error('Send OTP exception:', err);
            return { error: err.message || 'Kod gönderilirken bir hata oluştu.' };
        }
    }, []);

    const verifyOtp = useCallback(async (identifier: string, token: string): Promise<{ error: string | null }> => {
        try {
            const isEmail = identifier.includes('@');
            let data, error;

            console.log('[Auth] Verifying OTP for:', identifier);

            if (isEmail) {
                const email = identifier.toLowerCase().trim();
                const result = await supabase.auth.verifyOtp({
                    email,
                    token,
                    type: 'email'
                });
                data = result.data;
                error = result.error;
            } else {
                const phone = identifier.replace(/[^0-9+]/g, '');
                const result = await supabase.auth.verifyOtp({
                    phone,
                    token,
                    type: 'sms'
                });
                data = result.data;
                error = result.error;
            }

            if (error) {
                console.error('Verify OTP error:', error);
                if (error.message.includes('Token has expired')) return { error: 'Kodun süresi dolmuş.' };
                if (error.message.includes('Invalid token')) return { error: 'Girdiğiniz kod hatalı.' };
                return { error: 'Geçersiz veya süresi dolmuş kod.' };
            }

            if (data?.user) {
                console.log('[Auth] Verification successful.');

                // If this was a registration (we can't easily know here without extra state),
                // The fetchUserProfile will run. 
                // Ideally, pure registration logic should handle profile updates separately if needed.

                const profile = await fetchUserProfile(data.user);
                setUser(profile);
            }

            return { error: null };
        } catch (err: any) {
            console.error('Verify OTP exception:', err);
            return { error: err.message || 'Kod doğrulanırken bir hata oluştu.' };
        }
    }, [fetchUserProfile]);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    }, []);

    const upgradePlan = useCallback(async (plan: UserPlan): Promise<{ error: string | null }> => {
        if (!user) return { error: 'Kullanıcı oturumu bulunamadı.' };

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30 Days

        try {
            const { error } = await supabase
                .from('app_users')
                .update({
                    plan,
                    subscription_end_date: endDate.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                console.error('Supabase update error:', error);
                return { error: error.message };
            }

            setUser({ ...user, plan, subscription_end_date: endDate.toISOString() });
            return { error: null };
        } catch (err: any) {
            console.error('Error upgrading plan:', err);
            return { error: err.message || 'Plan güncellenirken bir hata oluştu.' };
        }
    }, [user]);

    const updateProfile = useCallback(async (name: string, email: string, phone?: string): Promise<{ error: string | null }> => {
        if (!user) return { error: 'Kullanıcı bulunamadı.' };

        try {
            // Update app_users table
            const { error: dbError } = await supabase
                .from('app_users')
                .update({
                    name,
                    phone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (dbError) {
                return { error: 'Profil güncellenirken bir hata oluştu.' };
            }

            // If email changed, update in Supabase Auth too
            if (email !== user.email) {
                const { error: authError } = await supabase.auth.updateUser({ email });
                if (authError) {
                    return { error: 'E-posta güncellenirken bir hata oluştu.' };
                }

                // Update email in app_users
                await supabase
                    .from('app_users')
                    .update({ email })
                    .eq('id', user.id);
            }

            setUser({ ...user, name, email, phone });
            return { error: null };
        } catch (err) {
            console.error('Error updating profile:', err);
            return { error: 'Profil güncellenirken bir hata oluştu.' };
        }
    }, [user]);

    const updatePassword = useCallback(async (newPassword: string): Promise<{ error: string | null }> => {
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                return { error: 'Şifre güncellenirken bir hata oluştu.' };
            }
            return { error: null };
        } catch (err) {
            console.error('Error updating password:', err);
            return { error: 'Şifre güncellenirken bir hata oluştu.' };
        }
    }, []);



    // Inactivity Timeout (30 minutes)
    useEffect(() => {
        if (!user) return; // Only track when logged in

        let timeoutId: any;
        const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in ms

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                console.log('[Auth] Inactivity timeout - logging out');
                await logout();
                alert('Oturumunuz uzun süre işlem yapılmadığı için sonlandırıldı.');
            }, TIMEOUT_DURATION);
        };

        // Events to track activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Throttle function to prevent excessive calls
        let isThrottled = false;
        const handleActivity = () => {
            if (!isThrottled) {
                resetTimer();
                isThrottled = true;
                setTimeout(() => { isThrottled = false; }, 1000); // Throttle for 1s
            }
        };

        // Initialize timer
        resetTimer();

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [user, logout]);

    const value = useMemo(() => ({
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        upgradePlan,
        updateProfile,
        updatePassword,
        adminLogin,
        needs2FA,
        sendOtp,
        verifyOtp
    }), [user, session, isLoading, login, register, logout, upgradePlan, updateProfile, updatePassword, adminLogin, needs2FA, sendOtp, verifyOtp]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
