import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { LinkedInIcon, TwitterIcon, FileIcon, MailIcon, BrainIcon } from "@/components/icons";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

type CommandType = "linkedin" | "twitter" | "blog" | "email" | "newsletter" | "thread";

interface Command {
  id: CommandType;
  label: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  placeholder: string;
}

const commands: Command[] = [
  {
    id: "linkedin",
    label: "LinkedIn Post",
    icon: LinkedInIcon,
    description: "Professional post",
    placeholder: "Share your thoughts for a LinkedIn post...\n\nExample: Hey I was thinking about how we hit 5B monthly API requests and most teams are still juggling 3 different providers..."
  },
  {
    id: "twitter",
    label: "Twitter Post",
    icon: TwitterIcon,
    description: "Single tweet",
    placeholder: "What's on your mind for Twitter?\n\nExample: Wild that we normalize infrastructure that makes you refresh 5 times to see if the number's real..."
  },
  {
    id: "thread",
    label: "Twitter Thread",
    icon: TwitterIcon,
    description: "Multi-tweet thread",
    placeholder: "Share your thoughts for a Twitter thread...\n\nExample: Everyone normalizes refreshing dashboards 5 times. Here's what's actually happening..."
  },
  {
    id: "blog",
    label: "Blog Post",
    icon: FileIcon,
    description: "Long-form content",
    placeholder: "What topic should we write about?\n\nExample: Numia is evolving into a Data Blockchain Cloud. Write about why data cloud is important for blockchains..."
  },
  {
    id: "email",
    label: "Email",
    icon: MailIcon,
    description: "Marketing email",
    placeholder: "What's the email about?\n\nExample: Announce our new product launch to existing customers..."
  },
  {
    id: "newsletter",
    label: "Newsletter",
    icon: MailIcon,
    description: "Email newsletter",
    placeholder: "What should the newsletter cover?\n\nExample: Monthly update about our latest features and company milestones..."
  },
];

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IndustrialLoader() {
  return (
    <div className="relative">
      {/* Grid of dots that light up in sequence */}
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 25 }).map((_, i) => {
          const delay = i * 0.08;
          return (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-zinc-700 animate-pulse"
              style={{
                animationDelay: `${delay}s`,
                animationDuration: '2s'
              }}
            />
          );
        })}
      </div>

      {/* Corner brackets for industrial feel */}
      <div className="absolute -inset-4 pointer-events-none">
        {/* Top left */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-zinc-600" />
        {/* Top right */}
        <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-zinc-600" />
        {/* Bottom left */}
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-zinc-600" />
        {/* Bottom right */}
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-zinc-600" />
      </div>
    </div>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn(className, "animate-spin")}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// Aggressively clean content by removing ALL AI meta-commentary
function cleanGeneratedContent(rawContent: string): string {
  let cleaned = rawContent.trim();

  // Remove leading meta paragraphs (entire paragraphs before actual content)
  cleaned = cleaned.replace(/^(?:Got it|Okay|Alright|Perfect|Great|Understood)[!.]?[^]*?(?=\n\n[A-Z]|$)/i, '').trim();
  cleaned = cleaned.replace(/^Now I (?:have|understand)[^]*?(?=\n\n[A-Z]|$)/i, '').trim();
  cleaned = cleaned.replace(/^(?:I need more context|Could you provide|What's the|Give me|Can you|Would you)[^]*?(?=\n\n|$)/i, '').trim();

  // NUCLEAR: Remove ALL leading meta-commentary sentences line by line
  const leadingMetaPatterns = [
    /^Done\.?\s*/i,
    /^Here'?s?\s+(?:a|an|your|the)\s+.+?(?:post|thread|blog|article|email|newsletter|content).*?[:.]\s*/i,
    /^I'?ve\s+(?:created|crafted|written|made).*?[:.]\s*/i,
    /^I\s+(?:need|want|should|can|cannot|can't|could)\s+.*?[:.]\s*/i,
    /^However,?\s+I\s+can.*?[:.]\s*/i,
    /^Let\s+me\s+(?:craft|create|write|deliver|make|provide).*?[:.]\s*/i,
    /^I'm\s+going\s+to.*?[:.]\s*/i,
    /^I'll.*?[:.]\s*/i,
    /^Sure,?.*?[:.]\s*/i,
    /^Certainly,?.*?[:.]\s*/i,
    /^Of\s+course,?.*?[:.]\s*/i,
    /^This\s+is.*?[:.]\s*/i,
    /^Below\s+is.*?[:.]\s*/i,
    /^Based\s+on.*?[:.]\s*/i,
    /^(?:Post|Thread|Tweet|Email|Blog\s+Post|Newsletter|Article)\s+\d+.*?[:.]\s*/i,
    /^(?:LinkedIn|Twitter|X|Blog)\s+(?:Post|Thread).*?[:.]\s*/i,
    /^Title:.*$/im,
    /^Topic:.*$/im,
    /^Thread\s+Length:.*$/im,
    /^🧵.*$/im,
  ];

  // Apply ALL leading meta patterns multiple times
  for (let iteration = 0; iteration < 5; iteration++) {
    const before = cleaned;
    for (const pattern of leadingMetaPatterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
    if (before === cleaned) break; // Early exit if nothing changed
  }

  // Remove separators
  cleaned = cleaned.replace(/^(?:---+|===+|___+)\s*$/gm, '');

  // Remove markdown (but keep headers for blog posts)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold**
                   .replace(/__([^_]+)__/g, '$1')      // __bold__
                   .replace(/\*([^*]+)\*/g, '$1')      // *italic*
                   .replace(/_([^_]+)_/g, '$1')        // _italic_
                   .replace(/```[\s\S]*?```/g, '')     // code blocks
                   .replace(/`([^`]+)`/g, '$1');       // inline code

  // NUCLEAR: Remove ALL trailing meta-analysis (everything after the actual content)
  const trailingMetaPatterns = [
    // Blog-specific meta-commentary (MUST BE FIRST - most specific)
    /\n\n[!?]?\s*I'?ve\s+created\s+a\s+blog\s+post.*$/is,
    /\n\nUnique\s+aspects?:.*$/is,
    /\n\nHuman\s+touches?\s+(?:added|included)?:.*$/is,
    /\n\nNo\s+Numia\s+pitch.*$/is,
    /\n\nThe\s+focus\s+is.*$/is,
    /\n\nLength:.*$/is,
    /\n\n~?\d+[,\d]*\s+words?.*$/is,  // "~1,300 words"

    // Analysis headers - catch ANY variation
    /\n\n(?:What makes this work|Why this works|What works here|Why this lands|What I did|How this works|The strategy|The approach).*$/is,
    /\n\n(?:Key\s+elements?\s+(?:I\s+)?(?:baked\s+in|used|included|added)).*$/is,
    /\n\n(?:The\s+Hook|FOMO\s+Elements|Product\s+Integration|Humanized\s+Writing|Call\s+to\s+Action|Analysis|Breakdown|Structure|Key\s+Elements|Strategy|Approach):.*$/is,

    // "This [thing]..." analysis
    /\n\nThis\s+(?:post|thread|content|approach|blog|article|email|newsletter|strategy|should).*$/is,

    // "I [verb]..." explanations
    /\n\nI\s+(?:used|included|incorporated|added|baked\s+in|made|created|wrote|structured|designed|crafted|'ve\s+created).*$/is,

    // "The tone is..." analysis
    /\n\nThe\s+(?:tone|voice|style|approach|structure|blog|article|post)\s+(?:is|uses|focuses).*$/is,

    // Metadata
    /\n\nWord\s+count:.*$/is,
    /\n\nCharacter\s+count:.*$/is,
    /\n\nNote:.*$/is,

    // Numbered lists of analysis (like the example user showed)
    /\n\n-\s+(?:Structure|Hook|Tone|Length|Human\s+touches?|Opinion|Code\s+example|Sentence|Rule-breaking|Specific|Real\s+developer|Conversational):.*$/is,
    /\n\n\d+\.\s+(?:Opens|Uses|Contrasts|Breaks|Quantifies|Ends|Shows|Creates|Builds|Focuses).*$/is,

    // Trailing formatting
    /\n\n\*\*.*?\*\*\s*$/,  // Trailing bold sections
    /\n\n---+\s*$/,  // Trailing separators
  ];

  for (const pattern of trailingMetaPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

export default function Notes() {
  const [selectedCommand, setSelectedCommand] = useState<CommandType>("linkedin");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const outputContainerRef = useRef<HTMLDivElement>(null);

  const currentCommand = commands.find(c => c.id === selectedCommand)!;

  // Scroll to top when output changes during generation
  useEffect(() => {
    if (isGenerating && outputContainerRef.current) {
      outputContainerRef.current.scrollTop = 0;
    }
  }, [output, isGenerating]);

  const handleGenerate = async () => {
    if (!input.trim()) {
      return;
    }

    setIsGenerating(true);
    setOutput("");
    setProgress(0);

    // Reset scroll position at the start
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = 0;
    }

    // Simulated progress - moves very slowly and consistently
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) return prev; // Stop at 85%, wait for real content
        // Very slow, consistent increment - takes ~85 seconds to reach 85%
        return Math.min(85, prev + 1);
      });
    }, 1000); // Update every 1 second for slow, steady progress

    try {
      // Target word counts for progress calculation (aligned with slash command guidelines)
      const targetWordCounts: Record<CommandType, number> = {
        linkedin: 120,      // LinkedIn: 100-150 words (guideline says 100-120 ideal)
        twitter: 30,        // Single tweet: ~25-35 words
        thread: 150,        // Twitter thread: 7-9 tweets × ~20 words = 140-180 words
        blog: 1500,         // Blog: 1200-2000 words (guideline says 1200-2000 ideal)
        email: 250,         // Email: ~200-300 words
        newsletter: 400,    // Newsletter: ~350-450 words
      };
      const targetWords = targetWordCounts[selectedCommand];

      // Map command types to platform names that the backend expects
      const platformMap: Record<CommandType, string> = {
        linkedin: "linkedin",
        twitter: "twitter",
        thread: "twitter",
        blog: "blog",
        email: "email",
        newsletter: "newsletter",
      };

      const platform = platformMap[selectedCommand];

      // Use local API or Supabase depending on mode
      const IS_LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';
      let apiUrl: string;
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (IS_LOCAL_MODE) {
        // Local mode - use local API server
        const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3001';
        apiUrl = `${localApiUrl}/api/generate-content`;
      } else {
        // Cloud mode - use Supabase edge function
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error("Supabase configuration missing");
        }

        apiUrl = `${supabaseUrl}/functions/v1/generate-content`;
        headers["Authorization"] = `Bearer ${supabaseAnonKey}`;
      }

      // Call API with streaming
      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: input,
          platform: platform,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate content";
        try {
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Use default error message if parsing fails
          errorMessage = `Failed to generate content (${response.status})`;
        }
        console.error("Edge function error:", response.status, errorMessage);
        throw new Error(errorMessage);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body received from server");
      }

      const decoder = new TextDecoder();
      let accumulatedRawContent = "";
      let hasReceivedContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // Check for error in stream
              if (parsed.error) {
                throw new Error(parsed.error);
              }

              const content = parsed.choices?.[0]?.delta?.content || "";

              if (content) {
                // Stop simulated progress once we start receiving real content
                if (!hasReceivedContent) {
                  clearInterval(progressInterval);
                  hasReceivedContent = true;
                }

                accumulatedRawContent += content;

                // Clean the content before displaying it
                const cleanedContent = cleanGeneratedContent(accumulatedRawContent);
                setOutput(cleanedContent);

                // Once content starts streaming, move from current position to 95%
                const wordCount = cleanedContent.trim().split(/\s+/).filter(w => w.length > 0).length;
                const wordProgress = Math.min(100, (wordCount / targetWords) * 100);
                // Map word progress to 85-95% range
                const calculatedProgress = Math.floor(85 + (wordProgress * 0.10));
                // Only update if progress increases (never go backwards)
                setProgress(prev => Math.max(prev, calculatedProgress));
              }
            } catch (e) {
              // If it's an error object, throw it
              if (e instanceof Error) {
                throw e;
              }
              // Otherwise skip invalid JSON
            }
          }
        }
      }

      // Validate we received some content
      if (!accumulatedRawContent.trim()) {
        throw new Error("No content was generated. Please try again.");
      }

      clearInterval(progressInterval);

      // Move to 95% → 98% → 100% smoothly during final processing
      setProgress(95);
      await new Promise(resolve => setTimeout(resolve, 150));

      setProgress(98);

      // Final cleaning pass
      const finalCleanedContent = cleanGeneratedContent(accumulatedRawContent);
      setOutput(finalCleanedContent);

      await new Promise(resolve => setTimeout(resolve, 150));

      // Show 100% completion
      setProgress(100);

      // Brief delay so user sees 100%
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate content";
      toast.error(errorMessage);
      console.error("Generation error:", error);
      setOutput(""); // Clear any partial output on error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!output) {
      toast.error("No content to save");
      return;
    }

    try {
      const IS_LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';

      // Map command types to platform names
      const platformMap: Record<CommandType, string> = {
        linkedin: "linkedin",
        twitter: "twitter",
        thread: "twitter",
        blog: "blog",
        email: "email",
        newsletter: "newsletter",
      };

      const platform = platformMap[selectedCommand];

      if (IS_LOCAL_MODE) {
        // Save to localStorage in local mode
        const existingItems = JSON.parse(localStorage.getItem('library_items') || '[]');
        const newItem = {
          id: Date.now().toString(),
          type: "text",
          content: output,
          platform: platform,
          title: null,
          created_at: new Date().toISOString(),
        };
        existingItems.unshift(newItem);
        localStorage.setItem('library_items', JSON.stringify(existingItems));
        toast.success("Saved to local library");
        return;
      }

      // Save to Supabase in cloud mode
      const { error } = await supabase.from("library_items").insert({
        type: "text",
        content: output,
        platform: platform,
        title: null,
      });

      if (error) {
        console.error("Error saving to library:", error);
        throw error;
      }

      toast.success("Saved to library");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save");
    }
  };


  return (
    <div className="h-screen bg-zinc-950 overflow-hidden">
      <Header />
      <main className="h-full pt-14 overflow-hidden">
        <div className="h-full container mx-auto px-6 py-8 max-w-7xl overflow-hidden">

          {/* Command Selector */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-4 h-4 text-zinc-500" />
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                Content Generator
              </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {commands.map((command) => {
                const Icon = command.icon;
                const isActive = selectedCommand === command.id;

                return (
                  <button
                    key={command.id}
                    onClick={() => {
                      setSelectedCommand(command.id);
                      setOutput("");
                    }}
                    className={cn(
                      "p-4 border transition-all duration-100 text-left",
                      isActive
                        ? "bg-zinc-900 border-zinc-700"
                        : "border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/50"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 mb-2",
                      isActive ? "text-zinc-300" : "text-zinc-600"
                    )} />
                    <div className={cn(
                      "font-mono text-[10px] uppercase tracking-wider mb-0.5",
                      isActive ? "text-zinc-300" : "text-zinc-500"
                    )}>
                      {command.label}
                    </div>
                    <div className={cn(
                      "font-mono text-[9px] uppercase tracking-wider",
                      isActive ? "text-zinc-600" : "text-zinc-700"
                    )}>
                      {command.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input/Output Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Input Panel */}
            <div className="border border-zinc-900">
              <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                  Input
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !input.trim()}
                  className={cn(
                    "px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-100 flex items-center gap-2",
                    isGenerating || !input.trim()
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <LoaderIcon className="w-3.5 h-3.5" />
                      Generating
                    </>
                  ) : (
                    <>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                      Generate
                    </>
                  )}
                </button>
              </div>

              <div className="p-6">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentCommand.placeholder}
                  className="w-full h-[350px] bg-transparent text-zinc-300 placeholder:text-zinc-700 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Output Panel */}
            <div className="border border-zinc-900">
              <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                  Output
                </span>
                {output && (
                  <button
                    onClick={handleSaveToLibrary}
                    className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Save to Library
                  </button>
                )}
              </div>

              <div className="p-6">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-[350px] gap-6">
                    <div className="w-full max-w-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
                          Generating {currentCommand.label}
                        </span>
                        <span className="font-mono text-xs text-zinc-500 tabular-nums">{progress}%</span>
                      </div>
                      <Progress
                        value={progress}
                        className="h-1 bg-zinc-900"
                      />
                    </div>
                  </div>
                ) : output ? (
                  <div ref={outputContainerRef} className="h-[350px] overflow-y-auto">
                    <pre className="text-zinc-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {output}
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[350px]">
                    <div className="w-12 h-12 border border-zinc-800 flex items-center justify-center mb-4">
                      <SparklesIcon className="w-6 h-6 text-zinc-700" />
                    </div>
                    <p className="font-mono text-sm text-zinc-600 uppercase tracking-wider">
                      Output will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Info Footer */}
          <div className="mt-6 p-4 border border-zinc-900 bg-zinc-950/50">
            <div className="flex items-start gap-3">
              <SparklesIcon className="w-4 h-4 text-zinc-600 mt-0.5" />
              <div>
                <p className="font-mono text-xs text-zinc-500 mb-1">
                  <span className="text-zinc-400">How it works:</span> Dump your content ideas and hit generate to watch them come to life.
                </p>
                <p className="font-mono text-[10px] text-zinc-600">
                  The AI will transform your stream of consciousness into polished content following platform-specific guidelines.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
