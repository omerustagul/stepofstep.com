
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    role: 'admin' | 'marketing' | 'designer' | 'user'
                    plan: 'free' | 'silver' | 'platinum'
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    role?: 'admin' | 'marketing' | 'designer' | 'user'
                    plan?: 'free' | 'silver' | 'platinum'
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    role?: 'admin' | 'marketing' | 'designer' | 'user'
                    plan?: 'free' | 'silver' | 'platinum'
                    created_at?: string
                }
            }
            portfolios: {
                Row: {
                    id: string
                    title: string
                    service_type: string
                    description: string | null
                    image_url: string
                    logo_url: string | null
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    service_type: string
                    description?: string | null
                    image_url: string
                    logo_url?: string | null
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    service_type?: string
                    description?: string | null
                    image_url?: string
                    logo_url?: string | null
                    created_by?: string | null
                    created_at?: string
                }
            }
            site_settings: {
                Row: {
                    id: number
                    site_title: string
                    meta_description: string | null
                    logo_url: string | null
                    updated_at: string
                }
                Insert: {
                    id?: number
                    site_title: string
                    meta_description?: string | null
                    logo_url?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: number
                    site_title?: string
                    meta_description?: string | null
                    logo_url?: string | null
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
