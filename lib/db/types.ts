export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      patient: {
        Row: { id: string; name: string; internal_code: string; created_at: string };
        Insert: { id?: string; name: string; internal_code: string; created_at?: string };
        Update: Partial<{ id: string; name: string; internal_code: string; created_at: string }>;
      };
      episode_of_care: {
        Row: {
          id: string; patient_id: string; title: string; episode_label: string | null; profession: string; area: string;
          start_date: string; end_date: string | null; status: "ativo" | "alta" | "administrativo";
          outcome_status: "ongoing" | "recovered" | "dropout" | "referred_out" | "administrative_close" | "unknown";
          outcome_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string; patient_id: string; title?: string; episode_label?: string | null; profession: string; area: string;
          start_date: string; end_date?: string | null; status?: "ativo" | "alta" | "administrativo";
          outcome_status?: "ongoing" | "recovered" | "dropout" | "referred_out" | "administrative_close" | "unknown";
          outcome_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["episode_of_care"]["Row"]>;
      };
      session: {
        Row: {
          id: string; episode_id: string; date: string; clinician: string | null; clinician_id: string | null; type: "avaliacao" | "tratamento" | "reavaliacao" | "alta";
          subjective: string; objective: string; clinical_analysis: string; intervention: string; response: string; plan: string;
          subjective_transcript: string; objective_transcript: string; clinical_analysis_transcript: string;
          intervention_transcript: string; response_transcript: string; plan_transcript: string; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["session"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["session"]["Row"]>;
      };
      scale_result: {
        Row: {
          id: string; episode_id: string; session_id: string | null; type: "END" | "DASH" | "KOOS" | "RolandMorris" | "NDI";
          value: number; applied_at: string; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["scale_result"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["scale_result"]["Row"]>;
      };
      alert_log: {
        Row: {
          id: string; episode_id: string; session_id: string | null; rule_code: string; message: string; created_at: string;
          dismissed: boolean; dismissed_by: string | null; dismissed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["alert_log"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["alert_log"]["Row"]>;
      };
      discharge_report_version: {
        Row: {
          id: string; episode_id: string; generated_at: string; generated_by: string; content: string;
          source_snapshot: Json; is_final: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["discharge_report_version"]["Row"], "id" | "generated_at"> & { id?: string; generated_at?: string };
        Update: Partial<Database["public"]["Tables"]["discharge_report_version"]["Row"]>;
      };
      profile: {
        Row: { id: string; display_name: string; role: "admin" | "clinician"; created_at: string };
        Insert: { id: string; display_name: string; role?: "admin" | "clinician"; created_at?: string };
        Update: Partial<{ id: string; display_name: string; role: "admin" | "clinician"; created_at: string }>;
      };
    };
    Views: {
      admin_episode_metrics_v1: { Row: Record<string, unknown> };
      admin_data_quality_v1: { Row: Record<string, unknown> };
    };
  };
};
