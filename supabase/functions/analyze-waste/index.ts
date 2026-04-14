import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langInstruction = language === "hi"
      ? "IMPORTANT: Write the description field ENTIRELY in Hindi (Devanagari script). Example: 'यह एक प्लास्टिक की बोतल है। इसे रीसाइकल बिन में डालें।'"
      : language === "ta"
      ? "IMPORTANT: Write the description field ENTIRELY in Tamil (Tamil script). Example: 'இது ஒரு பிளாஸ்டிக் பாட்டில். இதை மறுசுழற்சி தொட்டியில் போடவும்.'"
      : "Write the description in English.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert waste classification AI. Analyze the image and classify the PRIMARY waste type visible.

CLASSIFICATION RULES:
1. Focus on the MAIN waste item, not background objects
2. Categories: PLASTIC, PAPER, METAL, ORGANIC, GLASS, E-WASTE, HAZARDOUS, MIXED
3. Key distinctions:
   - Phone/tablet/laptop → E-WASTE
   - Cardboard → Paper
   - Aluminum cans → Metal
   - Batteries → Hazardous
   - Clothes/textiles → Mixed
4. If NO waste item is visible, return "No Waste"

${langInstruction}

Respond ONLY by calling the classify_waste function.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Classify the waste in this image. Focus on the primary waste item." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_waste",
              description: "Classify waste from image",
              parameters: {
                type: "object",
                properties: {
                  wasteType: {
                    type: "string",
                    enum: ["Plastic", "Paper", "Metal", "Organic", "Glass", "E-Waste", "Hazardous", "Mixed", "No Waste"],
                  },
                  confidence: { type: "number", description: "0-100" },
                  description: { type: "string", description: "1-2 sentence description with recycling advice in the specified language" },
                },
                required: ["wasteType", "confidence", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_waste" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({ wasteType: "No Waste", confidence: 0, description: "No waste could be detected in the image." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-waste error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
