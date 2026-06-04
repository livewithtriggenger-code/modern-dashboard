import { AIResponse } from "./types";

// Generic OpenAI-compatible fetcher (Works for OpenAI, Grok, open-source via Together/Groq)
export async function fetchOpenAICompatible(
  endpoint: string,
  apiKey: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  model: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  messages: any[]
): Promise<Partial<AIResponse>> {
  // Simulating an actual network call for the sake of the architecture.
  // In production, this would use native fetch.
  
  if (!apiKey) throw new Error("API Key missing");
  
  // SIMULATION ONLY
  return {
    content: "This is a simulated AI response indicating successful routing and fallback execution.",
    confidence: Math.floor(Math.random() * (99 - 85 + 1) + 85), // 85-99 confidence
    tokens: { prompt: 120, completion: 45 },
  };
}

export async function fetchAnthropic(
  apiKey: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  model: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  messages: any[]
): Promise<Partial<AIResponse>> {
  if (!apiKey) throw new Error("API Key missing");
  
  return {
    content: "This is a simulated Anthropic Claude response.",
    confidence: 95,
    tokens: { prompt: 100, completion: 50 },
  };
}
