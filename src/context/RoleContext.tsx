import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Ekran/sayfa listesi
export const ADMIN_SCREENS = [
    { id: 'dashboard', name: 'Kontrol Paneli', path: '/admin', alwaysVisible: true },
    { id: 'jobs', name: 'İş Başvuruları', path: '/admin/jobs', alwaysVisible: false },
    { id: 'appointments', name: 'Randevular', path: '/admin/appointments', alwaysVisible: false },
    { id: 'users', name: 'Personeller', path: '/admin/users', alwaysVisible: false },
    { id: 'members', name: 'Üyeler', path: '/admin/members', alwaysVisible: false },
    { id: 'plans', name: 'Üyelik Paketleri', path: '/admin/plans', alwaysVisible: false },
    { id: 'wheel', name: 'Çark Yönetimi', path: '/admin/wheel', alwaysVisible: false },
    { id: 'policies', name: 'Yasal Politikalar', path: '/admin/policies', alwaysVisible: false },
    { id: 'settings', name: 'Site Ayarları', path: '/admin/settings', alwaysVisible: false },
    { id: 'messages', name: 'Mesajlar', path: '/admin/messages', alwaysVisible: false },
    { id: 'portfolios', name: 'Portfolyolar', path: '/admin/portfolios', alwaysVisible: false },
    { id: 'notifications', name: 'Bildirimler', path: '/admin/notifications', alwaysVisible: false },
] as const;

export type ScreenId = typeof ADMIN_SCREENS[number]['id'];
export type PermissionResource = 'settings' | 'policies' | 'appointments' | 'wheel' | 'dashboard' | 'jobs' | 'users' | 'members' | 'messages' | 'portfolios' | 'plans' | 'notifications';
export type PermissionLevel = 'none' | 'view' | 'edit';

export interface Role {
    id: string;
    name: string;
    permissions: Record<ScreenId, PermissionLevel>;
    is_default?: boolean;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    start_date?: string;
    end_date?: string;
    position?: string;
    role_id: string;
    created_at: string;
}

interface RoleContextType {
    roles: Role[];
    teamMembers: TeamMember[];
    loading: boolean;
    createRole: (name: string, permissions: Record<ScreenId, PermissionLevel>) => Promise<void>;
    updateRole: (id: string, name: string, permissions: Record<ScreenId, PermissionLevel>) => Promise<void>;
    deleteRole: (id: string) => Promise<void>;
    createTeamMember: (member: Omit<TeamMember, 'id' | 'created_at'>) => Promise<{ error: string | null }>;
    updateTeamMember: (id: string, member: Partial<TeamMember>) => Promise<void>;
    deleteTeamMember: (id: string) => Promise<void>;
    getRoleById: (id: string) => Role | undefined;
    getPermission: (roleId: string, screenId: ScreenId) => PermissionLevel;
    canView: (roleId: string, screenId: ScreenId) => boolean;
    canEdit: (roleId: string, screenId: ScreenId) => boolean;
    refreshData: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Rolleri çek
            const { data: rolesData, error: rolesError } = await supabase
                .from('roles')
                .select('*')
                .order('created_at');

            if (rolesError) throw rolesError;
            setRoles(rolesData || []);

            // Ekip üyelerini çek
            const { data: membersData, error: membersError } = await supabase
                .from('team_members')
                .select('*')
                .order('created_at');

            if (membersError) throw membersError;
            setTeamMembers(membersData || []);
        } catch (error) {
            console.error('Veri çekme hatası:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refreshData = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    const createRole = useCallback(async (name: string, permissions: Record<ScreenId, PermissionLevel>) => {
        try {
            const { error } = await supabase
                .from('roles')
                .insert({
                    name,
                    permissions: { ...permissions, dashboard: 'view' }
                });

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Rol oluşturma hatası:', error);
        }
    }, [fetchData]);

    const updateRole = useCallback(async (id: string, name: string, permissions: Record<ScreenId, PermissionLevel>) => {
        try {
            const { error } = await supabase
                .from('roles')
                .update({ name, permissions: { ...permissions, dashboard: 'view' } })
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Rol güncelleme hatası:', error);
        }
    }, [fetchData]);

    const deleteRole = useCallback(async (id: string) => {
        try {
            const role = roles.find(r => r.id === id);
            if (role?.is_default) {
                alert('Varsayılan roller silinemez.');
                return;
            }

            const hasMembers = teamMembers.some(m => m.role_id === id);
            if (hasMembers) {
                alert('Bu role atanmış üyeler var. Önce üyelerin rollerini değiştirin.');
                return;
            }

            const { error } = await supabase
                .from('roles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Rol silme hatası:', error);
        }
    }, [fetchData, roles, teamMembers]);

    const createTeamMember = useCallback(async (member: Omit<TeamMember, 'id' | 'created_at'>): Promise<{ error: string | null }> => {
        if (!member.role_id) {
            return { error: 'Lütfen bir rol seçin!' };
        }

        try {
            const { error } = await supabase
                .from('team_members')
                .insert(member);

            if (error) throw error;
            await fetchData();
            return { error: null };
        } catch (error: any) {
            console.error('Üye oluşturma hatası:', error);
            return { error: error.message || 'Üye oluşturulurken bir hata oluştu.' };
        }
    }, [fetchData]);

    const updateTeamMember = useCallback(async (id: string, updates: Partial<TeamMember>) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Üye güncelleme hatası:', error);
        }
    }, [fetchData]);

    const deleteTeamMember = useCallback(async (id: string) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Üye silme hatası:', error);
        }
    }, [fetchData]);

    const getRoleById = useCallback((id: string) => roles.find(r => r.id === id), [roles]);

    const getPermission = useCallback((roleId: string, screenId: ScreenId): PermissionLevel => {
        const role = getRoleById(roleId);
        if (!role) return 'none';
        return role.permissions[screenId] || 'none';
    }, [getRoleById]);

    const canView = useCallback((roleId: string, screenId: ScreenId): boolean => {
        const permission = getPermission(roleId, screenId);
        return permission === 'view' || permission === 'edit';
    }, [getPermission]);

    const canEdit = useCallback((roleId: string, screenId: ScreenId): boolean => {
        return getPermission(roleId, screenId) === 'edit';
    }, [getPermission]);

    const value = useMemo(() => ({
        roles,
        teamMembers,
        loading,
        createRole,
        updateRole,
        deleteRole,
        createTeamMember,
        updateTeamMember,
        deleteTeamMember,
        getRoleById,
        getPermission,
        canView,
        canEdit,
        refreshData
    }), [roles, teamMembers, loading, createRole, updateRole, deleteRole, createTeamMember, updateTeamMember, deleteTeamMember, getRoleById, getPermission, canView, canEdit, refreshData]);

    return (
        <RoleContext.Provider value={value}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRoles = () => {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRoles must be used within a RoleProvider');
    }
    return context;
};
