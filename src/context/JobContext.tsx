import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface JobApplication {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    cv_url?: string;
    status: 'new' | 'reviewed' | 'interview' | 'rejected' | 'hired';
    created_at: string;
    meeting_link?: string;
    meeting_confirmed?: boolean;
}

interface JobContextType {
    applications: JobApplication[];
    loading: boolean;
    addApplication: (app: Omit<JobApplication, 'id' | 'created_at' | 'status'>) => Promise<void>;
    updateStatus: (id: string, status: JobApplication['status'], additionalData?: object) => Promise<void>;
    deleteApplication: (id: string) => Promise<void>;
    refreshData: () => Promise<void>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider = ({ children }: { children: ReactNode }) => {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('job_applications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error) {
            console.error('İş başvuruları çekme hatası:', error);
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

    const addApplication = useCallback(async (app: Omit<JobApplication, 'id' | 'created_at' | 'status'>) => {
        try {
            const { error } = await supabase
                .from('job_applications')
                .insert({
                    ...app,
                    status: 'new'
                });

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Başvuru ekleme hatası:', error);
            throw error;
        }
    }, [fetchData]);

    const updateStatus = useCallback(async (id: string, status: JobApplication['status'], additionalData: object = {}) => {
        try {
            const { error } = await supabase
                .from('job_applications')
                .update({ status, ...additionalData })
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Durum güncelleme hatası:', error);
        }
    }, [fetchData]);

    const deleteApplication = useCallback(async (id: string) => {
        try {
            const { error } = await supabase
                .from('job_applications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Başvuru silme hatası:', error);
        }
    }, [fetchData]);

    const value = useMemo(() => ({
        applications,
        loading,
        addApplication,
        updateStatus,
        deleteApplication,
        refreshData
    }), [applications, loading, addApplication, updateStatus, deleteApplication, refreshData]);

    return (
        <JobContext.Provider value={value}>
            {children}
        </JobContext.Provider>
    );
};

export const useJobs = () => {
    const context = useContext(JobContext);
    if (context === undefined) {
        throw new Error('useJobs must be used within a JobProvider');
    }
    return context;
};
