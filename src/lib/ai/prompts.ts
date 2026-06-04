// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildSystemPrompt(businessKnowledge: any[], leadName: string, aiMemories: any[] = []): Promise<string> {
  const coreIdentity = `You are a helpful, professional AI assistant for a business. 
Your goal is to assist the lead (${leadName}) accurately and concisely. 
Do not hallucinate. If the answer is not in your Business Knowledge, state you do not know and offer to connect them to a human.`;

  const knowledgeContext = businessKnowledge.length > 0 
    ? `\n\nBUSINESS KNOWLEDGE:\n${businessKnowledge.map(k => `${k.key}: ${JSON.stringify(k.value)}`).join("\n")}`
    : "";

  const memoryContext = aiMemories.length > 0
    ? `\n\nLEAD CONTEXT (AI MEMORIES):\n${aiMemories.map(m => `- ${m.memory_type}: ${m.memory_value}`).join("\n")}`
    : "";

  return `${coreIdentity}${knowledgeContext}${memoryContext}`;
}
