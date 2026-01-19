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
    const { brainDump, platform } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Read guidelines from file
    const guidelinesPath = platform === "linkedin"
      ? "../../../intelligence/post-guidelines/linkedin-guidelines.md"
      : "../../../intelligence/post-guidelines/twitter-guidelines.md";

    let guidelines = "";
    try {
      guidelines = await Deno.readTextFile(guidelinesPath);
    } catch (error) {
      console.error("Error reading guidelines:", error);
      // Fallback to basic guidelines
      guidelines = platform === "linkedin"
        ? "Create a professional LinkedIn post following best practices."
        : "Create an engaging Twitter thread following best practices.";
    }

    const prompt = `${guidelines}\n\nBrain dump: ${brainDump}\n\nGenerate 1-3 high-quality ${platform} posts based on this brain dump. Follow the guidelines exactly. For each post that needs an image, add [IMG:CODENAME] placeholder with specs.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.content[0].text;

    // Parse the response into individual posts
    const posts = parsePostsFromResponse(generatedText);

    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-posts function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parsePostsFromResponse(text: string): Array<{ content: string; imageCodename?: string }> {
  // Split by "---\nPOST" or "---\nTHREAD"
  const postPattern = /---\n(?:POST|THREAD)\s+\d+\/\d+:.*?\n---\n([\s\S]*?)(?=\n---\n(?:POST|THREAD)|\n\[IMG:|$)/g;
  const posts: Array<{ content: string; imageCodename?: string }> = [];

  let match;
  while ((match = postPattern.exec(text)) !== null) {
    const content = match[1].trim();

    // Extract image codename if present
    const imgMatch = /\[IMG:([A-Z0-9-]+)\]/.exec(text.substring(match.index + match[0].length));
    const imageCodename = imgMatch ? imgMatch[1] : undefined;

    posts.push({ content, imageCodename });
  }

  // If no posts found with pattern, try to parse the whole text as a single post
  if (posts.length === 0) {
    const imgMatch = /\[IMG:([A-Z0-9-]+)\]/.exec(text);
    const imageCodename = imgMatch ? imgMatch[1] : undefined;
    const content = text.replace(/\[IMG:[A-Z0-9-]+\][\s\S]*$/, '').trim();

    if (content) {
      posts.push({ content, imageCodename });
    }
  }

  return posts;
}
