import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompts: Record<string, string> = {
      linkedin: `You are a professional LinkedIn content writer. Create engaging, professional LinkedIn posts that:
- Start with a hook to grab attention
- Use short paragraphs and line breaks for readability
- Include relevant insights or stories
- End with a call-to-action or thought-provoking question
- Use appropriate emojis sparingly
- Keep it under 3000 characters
- Do not use hashtags unless specifically requested`,
      
      twitter: `You are a Twitter/X content writer. Create engaging tweets or threads that:
- Are concise and punchy
- Use a conversational tone
- For threads, number each tweet (1/, 2/, etc.) and keep each under 280 characters
- Start with a hook
- Include relevant insights
- End with engagement prompts
- Use emojis naturally but sparingly`,
      
      blog: `You are a professional blog writer. Create well-structured blog posts that:
- Have a compelling headline
- Include an engaging introduction
- Use headers and subheaders for organization
- Include relevant examples and insights
- Have a clear conclusion
- Are optimized for readability
- Use markdown formatting`,
      
      newsletter: `You are a newsletter content writer. Create engaging newsletter content that:
- Has a catchy subject line suggestion
- Starts with a personal greeting
- Uses a conversational, warm tone
- Includes valuable insights or updates
- Has clear sections with headers
- Ends with a call-to-action
- Feels personal and authentic`,
    };

    const systemPrompt = systemPrompts[platform] || systemPrompts.linkedin;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate content" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in generate-content function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
