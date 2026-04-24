export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type MeetingType = 'online' | 'phone' | 'office';

export interface Appointment {
    id: string;
    created_at: string;
    start_time: string; // ISO string
    end_time: string;   // ISO string
    user_name: string;
    user_email: string;
    user_phone?: string;
    status: AppointmentStatus;
    meeting_type: MeetingType;
    notes?: string;
    google_event_id?: string;
    meeting_link?: string;
    meeting_confirmed?: boolean;
}

export interface DragEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
}
