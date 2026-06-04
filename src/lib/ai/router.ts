// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { AIProvider, ModelSize, AIResponse, WorkspaceKeys } from "./types";
import { fetchOpenAICompatible, fetchAnthropic } from "./providers";

// Cost Optimization Layer: Map "Task Size" to actual model names per provider
const MODEL_MAPPING = {
  grok: { small: "grok-2-mini", medium: "grok-2", large: "grok-2" },
  openai: { small: "gpt-4o-mini", medium: "gpt-4o", large: "o1-preview" },
  claude: { small: "claude-3-haiku-20240307", medium: "claude-3-5-sonnet-latest", large: "claude-3-opus-20240229" },
  gemini: { small: "gemini-1.5-flash", medium: "gemini-1.5-pro", large: "gemini-1.5-pro" }
};

export async function routeAIRequest(
  keys: WorkspaceKeys,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[],
  taskSize: ModelSize = "small"
): Promise<AIResponse> {
  const start = Date.now();
  // Multi-Provider Model Routing & Fallback Cascade
  const cascade: AIProvider[] = ["grok", "openai", "claude", "gemini"];

  let lastError = "No keys available";

  for (const provider of cascade) {
    try {
      const keyStr = `${provider}_key` as keyof WorkspaceKeys;
      const apiKey = keys[keyStr];
      if (!apiKey) continue;

      const model = MODEL_MAPPING[provider][taskSize];
      
      let res: Partial<AIResponse>;
      if (provider === "claude") {
        res = await fetchAnthropic(apiKey, model, messages);
      } else {
        const endpoint = provider === "grok" ? "https://api.x.ai/v1/chat/completions" : 
                        provider === "openai" ? "https://api.openai.com/v1/chat/completions" : 
                        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        res = await fetchOpenAICompatible(endpoint, apiKey, model, messages);
      }

      const latencyMs = Date.now() - start;
      const confidence = res.confidence || 90;
      
      // Escalation Framework Trigger: < 75% Confidence
      const escalate = confidence < 75;

      return {
        content: res.content || "",
        confidence,
        provider,
        tokens: res.tokens || { prompt: 0, completion: 0 },
        latencyMs,
        escalate,
      };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.warn(`[AI Router] ${provider} failed, falling back...`, e.message);
      lastError = e.message;
    }
  }

  // All failed -> Auto Escalation
  return {
    content: "I apologize, but I am currently experiencing technical difficulties. Let me escalate this to a human operator who can assist you shortly.",
    confidence: 0,
    provider: "openai", // Dummy fallback
    tokens: { prompt: 0, completion: 0 },
    latencyMs: Date.now() - start,
    escalate: true,
    error: lastError,
  };
}
