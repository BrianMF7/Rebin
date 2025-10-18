export interface ItemDetection {
  label: string;
  confidence: number;
}

export interface InferResponse {
  items: ItemDetection[];
  zip?: string;
}

export interface ItemDecision {
  label: string;
  bin: "recycling" | "compost" | "trash";
  explanation: string;
  eco_tip: string;
}

export interface ExplainResponse {
  decisions: ItemDecision[];
}

export interface SortEvent {
  id: number;
  user_id?: string;
  zip?: string;
  items_json: string[];
  decision: string;
  co2e_saved: number;
  created_at: string;
}

export interface ChatbotRequest {
  decisions: ItemDecision[];
  voice_personality?: "friendly" | "enthusiastic" | "educational";
  include_eco_tips?: boolean;
}

export interface ChatbotResponse {
  audio_url?: string;
  conversational_text: string;
  fallback_text: string;
  voice_personality: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
}
