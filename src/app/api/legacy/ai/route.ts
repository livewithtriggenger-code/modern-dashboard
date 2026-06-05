import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { prompt, conversationId, leadName, context } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('legacy_settings')
      .eq('user_id', user.id)
      .single();

    const legacySettings = preferences?.legacy_settings || {};
    
    // Try to get API keys from DB settings or environment variables
    const grokKey = legacySettings.grok_key || process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
    const openaiKey = legacySettings.openai_key || process.env.OPENAI_API_KEY || '';

    if (!grokKey && !openaiKey) {
      return NextResponse.json({ error: 'No AI API keys configured.' }, { status: 400 });
    }

    const systemPrompt = `You are an AI sales analyst for a CRM system. ${leadName ? `You are analyzing ${leadName}.` : ''} 
    Keep responses concise and data-driven.
    Context: ${context || 'None provided.'}`;

    let aiResponse = "";

    // Prefer Grok (xAI) if key is present
    if (grokKey) {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${grokKey}`,
        },
        body: JSON.stringify({
          model: "grok-beta", // Standard model name for grok via API
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || "";
      } else {
        console.error("Grok API failed:", await response.text());
      }
    }

    // Fallback to OpenAI if Grok fails or isn't configured
    if (!aiResponse && openaiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]
        });
        aiResponse = completion.choices?.[0]?.message?.content || "";
      } catch (err) {
        console.error("OpenAI fallback failed:", err);
      }
    }

    if (!aiResponse) {
       return NextResponse.json({ error: 'Both AI providers failed to generate a response.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      response: aiResponse 
    });
  } catch (error: any) {
    console.error('Legacy AI Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
