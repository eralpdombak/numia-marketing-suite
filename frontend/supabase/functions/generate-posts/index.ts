import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retry helper with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  timeoutMs = 60000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Don't retry on client errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry on 429 (rate limit) or 5xx errors
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, attempt) * 1000;
      console.log(`Attempt ${attempt + 1} failed, retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw new Error(`Failed after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brainDump, platform } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!brainDump || !platform) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: brainDump and platform" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    const response = await fetchWithRetry(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          temperature: 1,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      },
      3,
      60000
    );

    if (!response.ok) {
      let errorMessage = `Failed to generate posts (HTTP ${response.status})`;
      try {
        const errorText = await response.text();
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // Use default error message if parsing fails
      }
      console.error("Anthropic API error:", response.status, errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Validate response structure
    if (!data || !data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error("Invalid response structure:", data);
      return new Response(
        JSON.stringify({ error: "Invalid response from API. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generatedText = data.content[0].text;

    if (!generatedText || typeof generatedText !== "string") {
      console.error("No text content in response:", data);
      return new Response(
        JSON.stringify({ error: "No content generated. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the response into individual posts
    const posts = parsePostsFromResponse(generatedText);

    // Validate we got at least one post
    if (!posts || posts.length === 0) {
      console.error("No posts parsed from response. Raw text:", generatedText.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "Failed to parse generated content. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-posts function:", error);

    let errorMessage = "An unexpected error occurred while generating posts";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Provide more helpful error messages based on error type
      if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. The API is taking too long to respond. Please try again.";
        statusCode = 504;
      } else if (error.message.includes("Failed after")) {
        errorMessage = "Service temporarily unavailable after multiple retries. Please try again in a moment.";
        statusCode = 503;
      } else if (error.message.includes("API key")) {
        errorMessage = "API authentication failed. Please contact support.";
        statusCode = 500;
      } else if (error.message.includes("guidelines")) {
        errorMessage = "Failed to load content guidelines. Using fallback.";
        statusCode = 500;
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: statusCode,
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
