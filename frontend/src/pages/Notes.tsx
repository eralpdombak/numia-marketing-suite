import { useState } from "react";
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

// Clean content by removing AI meta-commentary and markdown formatting
function cleanGeneratedContent(rawContent: string): string {
  let cleaned = rawContent.trim();

  // AGGRESSIVE: Remove everything before the actual content starts
  // Strip any leading meta-commentary sentences one by one until we hit real content
  const metaPrefixes = [
    // Acknowledgments and meta-discussion (KILL FIRST)
    /^Got it[^.!?]*[.!?]\s*/i,
    /^Okay[^.!?]*[.!?]\s*/i,
    /^Alright[^.!?]*[.!?]\s*/i,
    /^Perfect[^.!?]*[.!?]\s*/i,
    /^Great[^.!?]*[.!?]\s*/i,
    /^Understood[^.!?]*[.!?]\s*/i,
    /^Now I have[^.!?]*[.!?]\s*/i,
    /^Now I understand[^.!?]*[.!?]\s*/i,
    // Questions asking for clarification (KILL THESE FIRST)
    /^I need more context[^.!?]*[.!?]\s*/i,
    /^I need additional[^.!?]*[.!?]\s*/i,
    /^Could you provide[^.!?]*[.!?]\s*/i,
    /^Could you[^.!?]*[.!?]\s*/i,
    /^What's the[^.!?]*[.!?]\s*/i,
    /^What is the[^.!?]*[.!?]\s*/i,
    /^Give me[^.!?]*[.!?]\s*/i,
    /^Can you[^.!?]*[.!?]\s*/i,
    /^Would you[^.!?]*[.!?]\s*/i,
    // Regular meta-commentary
    /^I need permission[^.!?]*[.!?]\s*/i,
    /^I need to[^.!?]*[.!?]\s*/i,
    /^I want to[^.!?]*[.!?]\s*/i,
    /^I should[^.!?]*[.!?]\s*/i,
    /^I can deliver[^.!?]*[.!?]\s*/i,
    /^I can provide[^.!?]*[.!?]\s*/i,
    /^I can create[^.!?]*[.!?]\s*/i,
    /^I can't[^.!?]*[.!?]\s*/i,
    /^I cannot[^.!?]*[.!?]\s*/i,
    /^However, I can[^.!?]*[.!?]\s*/i,
    /^Let me craft[^.!?]*[.!?]\s*/i,
    /^Let me create[^.!?]*[.!?]\s*/i,
    /^Let me write[^.!?]*[.!?]\s*/i,
    /^Let me deliver[^.!?]*[.!?]\s*/i,
    /^Let me make[^.!?]*[.!?]\s*/i,
    /^Let me[^.!?]*[.!?]\s*/i,
    /^I'm going to[^.!?]*[.!?]\s*/i,
    /^I'll make[^.!?]*[.!?]\s*/i,
    /^I'll[^.!?]*[.!?]\s*/i,
    /^I've[^.!?]*[.!?]\s*/i,
    /^Sure,?[^.!?]*[.!?]\s*/i,
    /^Certainly,?[^.!?]*[.!?]\s*/i,
    /^Of course,?[^.!?]*[.!?]\s*/i,
    /^Here's[^:]*:\s*/i,
    /^Here are[^:]*:\s*/i,
    /^Here is[^:]*:\s*/i,
    /^This is[^:]*:\s*/i,
    /^Below is[^:]*:\s*/i,
    /^Option \d+:?\s*/i,
    /^Post \d+:?\s*/i,
    /^Thread \d+:?\s*/i,
    /^Tweet \d+:?\s*/i,
    /^Version \d+:?\s*/i,
    /^Draft:?\s*/i,
    /^🧵.*$/im,
  ];

  // NUCLEAR OPTION: Strip ENTIRE paragraphs of meta-commentary
  // This catches multi-sentence AI blabber before the actual content
  const metaParagraphs = [
    /^(?:Got it|Okay|Alright|Perfect|Great|Understood)[!.]?[^]*?(?=\n\n[A-Z]|$)/i,
    /^Now I (?:have|understand)[^]*?(?=\n\n[A-Z]|$)/i,
    /^(?:I need more context|Could you provide|What's the|Give me|Can you|Would you)[^]*?(?=\n\n|$)/i,
  ];

  metaParagraphs.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '').trim();
  });

  // If there are numbered lists of questions, nuke them
  cleaned = cleaned.replace(/^\d+\.\s+What[^]*?(?=\n\n[A-Z]|$)/i, '').trim();

  // Keep stripping until nothing matches (max 20 iterations for safety)
  let iterations = 0;
  let previousContent = '';
  while (cleaned !== previousContent && iterations < 20) {
    previousContent = cleaned;
    for (const pattern of metaPrefixes) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
    iterations++;
  }

  // Remove separator lines
  cleaned = cleaned.replace(/^---+\s*$/gm, '');
  cleaned = cleaned.replace(/^===+\s*$/gm, '');
  cleaned = cleaned.replace(/^___+\s*$/gm, '');

  // Remove ALL markdown formatting
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // **bold**
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');     // *italic*
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');     // __bold__
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');       // _italic_
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');       // # headers

  // Remove code blocks if any
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // NUCLEAR: Remove trailing meta-analysis and commentary
  // These patterns indicate the AI is explaining what it just wrote
  const trailingMetaPatterns = [
    /\n\n(?:The Hook:|FOMO Elements:|Product Integration:|Humanized Writing:|Call to Action:|Analysis:|Breakdown:|Structure:|Key Elements:|Why this works:|The post is|Word count:|Notes?:|This follows?|This creates?)[^]*$/i,
    /\n\nThis (?:post|thread|content|approach)[^]*$/i,
    /\n\nI (?:used|included|incorporated|added|made|created|wrote|structured)[^]*$/i,
    /\n\n\*\*[^*]+\*\*\s*$/,  // Trailing bold text (often used for analysis headers)
    /\n\n---+\s*$/,  // Trailing separators
  ];

  trailingMetaPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Clean up extra blank lines (max 2 consecutive newlines)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Final trim
  cleaned = cleaned.trim();

  return cleaned;
}

export default function Notes() {
  const [selectedCommand, setSelectedCommand] = useState<CommandType>("linkedin");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSavingIntelligence, setIsSavingIntelligence] = useState(false);

  const currentCommand = commands.find(c => c.id === selectedCommand)!;

  const handleGenerate = async () => {
    if (!input.trim()) {
      return;
    }

    setIsGenerating(true);
    setOutput("");
    setProgress(0);

    // Simulated progress that moves smoothly while waiting for content
    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      simulatedProgress += 1;
      // Logarithmic slowdown as we approach 90% to avoid going too far ahead
      // Starts fast, then slows down smoothly
      const increment = Math.max(0.5, (90 - simulatedProgress) / 20);
      if (simulatedProgress < 90) {
        setProgress(prev => Math.floor(Math.min(90, prev + increment)));
      }
    }, 300); // Update every 300ms

    try {
      // Target word counts for progress calculation
      const targetWordCounts: Record<CommandType, number> = {
        linkedin: 120,
        twitter: 100,
        thread: 200,
        blog: 800,
        email: 300,
        newsletter: 500,
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
        const errorText = await response.text();
        console.error("Edge function error:", response.status, errorText);
        throw new Error(`Failed to generate content: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
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

                // Calculate real progress based on word count of cleaned content
                const wordCount = cleanedContent.trim().split(/\s+/).filter(w => w.length > 0).length;
                const calculatedProgress = Math.floor(Math.min(95, (wordCount / targetWords) * 100));
                // Only update if progress increases (never go backwards)
                setProgress(prev => Math.max(prev, calculatedProgress));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      clearInterval(progressInterval);

      // Final cleaning pass to ensure everything is clean
      const finalCleanedContent = cleanGeneratedContent(accumulatedRawContent);
      setOutput(finalCleanedContent);

      // Ensure progress reaches 100% before hiding loader
      setProgress(100);

      // Small delay to ensure user sees 100% before loading state disappears
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      clearInterval(progressInterval);
      toast.error("Failed to generate content");
      console.error(error);
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

  const handleFeedTheBrain = async () => {
    if (!output) {
      toast.error("No content to save");
      return;
    }

    setIsSavingIntelligence(true);
    console.log('Starting to save intelligence...');

    try {
      const IS_LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';
      console.log('Local mode:', IS_LOCAL_MODE);

      if (!IS_LOCAL_MODE) {
        toast.error("Intelligence only available in local mode");
        setIsSavingIntelligence(false);
        return;
      }

      const platformMap: Record<CommandType, string> = {
        linkedin: "linkedin",
        twitter: "twitter",
        thread: "twitter",
        blog: "blog",
        email: "email",
        newsletter: "newsletter",
      };

      const platform = platformMap[selectedCommand];
      const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3001';

      console.log('Sending request to:', `${localApiUrl}/api/save-output-intelligence`);
      console.log('Platform:', platform);

      const response = await fetch(`${localApiUrl}/api/save-output-intelligence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: output,
          platform: platform,
          input: input,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to save intelligence');
      }

      const data = await response.json();
      console.log('Saved output to:', data.outputFile);
      console.log('Saved learnings to:', data.learningsFile);

      toast.success("Saved to intelligence");
    } catch (error) {
      console.error("Failed to save intelligence:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save intelligence");
    } finally {
      setIsSavingIntelligence(false);
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleFeedTheBrain}
                      disabled={isSavingIntelligence}
                      className={cn(
                        "px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                        isSavingIntelligence
                          ? "text-zinc-600 cursor-not-allowed"
                          : "text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      {isSavingIntelligence ? "Saving..." : "Save to Intelligence"}
                    </button>
                    <button
                      onClick={handleSaveToLibrary}
                      className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Save to Library
                    </button>
                  </div>
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
                  <div className="h-[350px] overflow-y-auto">
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
