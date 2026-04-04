// supabase/functions/getedil-ai-brain/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { message, userId, currentContext } = await req.json()

    // 1. SYSTEM PROMPT: Defining "GETE AI"
    const systemPrompt = `
      You are GETE AI, the native intelligence of GETEDIL-OS (Ethiopia).
      User Context: ${JSON.stringify(currentContext)}
      
      Your goal is to help users navigate the 6 Pillars:
      P1: GetSkill (Courses), P2: GetPaid (Wallet), P3: GetJob (Gigs), 
      P4: GetMarket (Shopping), P5: GetEase (Services), P6: GetFlow (Automation).

      If the user wants to learn, return ACTION: navigate, payload: getskill.
      If the user wants to check money, return ACTION: navigate, payload: getpaid.
      Always be professional, helpful, and aware of the Ethiopian landscape (ETB, local regions).
    `;

    // 2. CALL LLM (Example using a generic fetch to an AI provider)
    // Replace API_KEY with your Vercel/Supabase Secret
    const aiResponse = await fetch('https://api.your-ai-provider.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${Deno.env.get('AI_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or gemini-1.5-flash
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    }).then(res => res.json());

    const content = aiResponse.choices[0].message.content;

    // 3. LOGIC PARSER: Turn AI text into OS Actions
    let action = null;
    let payload = {};

    if (content.includes("navigate") && content.includes("getpaid")) {
      action = "navigate";
      payload = { pillar: "getpaid" };
    } else if (content.includes("navigate") && content.includes("getskill")) {
      action = "navigate";
      payload = { pillar: "getskill" };
    }

    return new Response(
      JSON.stringify({
        message: content,
        actions: action ? [{ type: action, payload }] : [],
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
