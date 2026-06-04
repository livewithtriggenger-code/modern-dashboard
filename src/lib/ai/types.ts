export type AIProvider = "grok" | "openai" | "gemini" | "claude";
export type ModelSize = "small" | "medium" | "large";
export type MessageRole = "system" | "user" | "assistant";

export interface AIResponse {
  content: string;
  confidence: number; // 0-100
  provider: AIProvider;
  tokens: { prompt: number; completion: number };
  latencyMs: number;
  escalate: boolean;
  error?: string;
}

export interface WorkspaceKeys {
  openai_key?: string;
  grok_key?: string;
  claude_key?: string;
  gemini_key?: string;
}
