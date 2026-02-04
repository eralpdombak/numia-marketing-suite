import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GeneratedPost {
  id: string;
  content: string;
  imageCodename?: string;
}

export function NotesPanel() {
  const [brainDump, setBrainDump] = useState("");
  const [platform, setPlatform] = useState<"linkedin" | "twitter">("linkedin");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);

  const handleGenerate = async () => {
    if (!brainDump.trim()) {
      toast.error("Please enter some thoughts first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-posts", {
        body: { brainDump, platform },
      });

      if (error) {
        // Extract error message from FunctionsHttpError or FunctionsRelayError
        const errorMessage = error.message || "Failed to generate posts";
        throw new Error(errorMessage);
      }

      // Check if data contains an error field
      if (data && data.error) {
        throw new Error(data.error);
      }

      if (!data || !data.posts || data.posts.length === 0) {
        throw new Error("No posts were generated. Please try again.");
      }

      const posts: GeneratedPost[] = data.posts.map((post: any, index: number) => ({
        id: crypto.randomUUID(),
        content: post.content,
        imageCodename: post.imageCodename,
      }));

      setGeneratedPosts(posts);
      toast.success(`Generated ${posts.length} ${platform} post${posts.length > 1 ? 's' : ''}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate posts";
      toast.error(errorMessage);
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Platform Selector */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
          <span className="w-1.5 h-1.5 bg-zinc-600" />
          Platform
          <span className="flex-1 h-px bg-zinc-800" />
        </label>
        <div className="flex gap-px bg-zinc-800 p-px">
          <button
            onClick={() => setPlatform("linkedin")}
            className={`flex-1 py-2 px-4 text-xs font-mono uppercase tracking-wider transition-all duration-100 ${
              platform === "linkedin"
                ? "bg-zinc-300 text-zinc-900"
                : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            LinkedIn
          </button>
          <button
            onClick={() => setPlatform("twitter")}
            className={`flex-1 py-2 px-4 text-xs font-mono uppercase tracking-wider transition-all duration-100 ${
              platform === "twitter"
                ? "bg-zinc-300 text-zinc-900"
                : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            Twitter
          </button>
        </div>
      </div>

      {/* Brain Dump */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
          <span className="w-1.5 h-1.5 bg-zinc-600" />
          Brain Dump
          <span className="flex-1 h-px bg-zinc-800" />
        </label>
        <textarea
          value={brainDump}
          onChange={(e) => setBrainDump(e.target.value)}
          placeholder="Type your thoughts here... No structure needed. Just brain dump."
          className="w-full h-48 bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder:text-zinc-600 font-mono text-xs px-4 py-3 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !brainDump.trim()}
        className="w-full py-3 px-4 bg-zinc-200 text-zinc-900 font-mono text-xs uppercase tracking-wider transition-all duration-100 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Posts"
        )}
      </button>

      {/* Generated Posts */}
      {generatedPosts.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="relative h-px my-1">
            <div className="absolute inset-0 bg-zinc-800" />
            <div className="absolute left-0 top-0 w-3 h-px bg-zinc-600" />
            <div className="absolute right-0 top-0 w-3 h-px bg-zinc-600" />
          </div>

          <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 bg-zinc-600" />
            Generated
            <span className="flex-1 h-px bg-zinc-800" />
          </label>

          {generatedPosts.map((post, index) => (
            <div key={post.id} className="space-y-3 border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Post {index + 1}/{generatedPosts.length}
                </span>
              </div>

              <textarea
                value={post.content}
                onChange={(e) => {
                  const updated = [...generatedPosts];
                  updated[index].content = e.target.value;
                  setGeneratedPosts(updated);
                }}
                className="w-full h-64 bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-xs px-3 py-2 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
              />

              {post.imageCodename && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                  <span className="w-1 h-1 bg-yellow-600" />
                  Image needed: {post.imageCodename}
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex-1 py-2 px-3 border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all duration-100 text-[11px] font-mono uppercase tracking-wider">
                  Create Image
                </button>
                <button className="flex-1 py-2 px-3 border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all duration-100 text-[11px] font-mono uppercase tracking-wider">
                  Send to Typefully
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom decoration */}
      <div className="flex items-center gap-2 pt-4">
        <div className="w-2 h-2 border border-zinc-800" />
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Notes</span>
        <div className="flex-1 h-px bg-zinc-800" />
        <div className="w-2 h-2 border border-zinc-800" />
      </div>
    </div>
  );
}
