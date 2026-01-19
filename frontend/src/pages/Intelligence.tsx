import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { cn } from "@/lib/utils";

interface IntelligenceFile {
  name: string;
  path: string;
  folder: string;
}

interface IntelligenceStructure {
  [folder: string]: IntelligenceFile[];
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-8l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}

interface BraindumpSuggestion {
  file: string;
  section: string;
  content: string;
  reasoning: string;
}

export default function Intelligence() {
  const [structure, setStructure] = useState<IntelligenceStructure | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<IntelligenceFile | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Braindump state
  const [showBraindump, setShowBraindump] = useState(false);
  const [braindumpInput, setBraindumpInput] = useState("");
  const [processingBraindump, setProcessingBraindump] = useState(false);
  const [braindumpSuggestions, setBraindumpSuggestions] = useState<BraindumpSuggestion[]>([]);
  const [showApproval, setShowApproval] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sync intelligence state
  const [syncSuggestions, setSyncSuggestions] = useState<BraindumpSuggestion[]>([]);
  const [showSyncApproval, setShowSyncApproval] = useState(false);

  const IS_LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';
  const API_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3001';

  useEffect(() => {
    loadStructure();
  }, []);

  const loadStructure = async () => {
    if (!IS_LOCAL_MODE) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/intelligence`);
      const data = await response.json();
      setStructure(data);

      // Auto-select first folder
      const folders = Object.keys(data);
      if (folders.length > 0) {
        setSelectedFolder(folders[0]);
      }
    } catch (error) {
      console.error("Failed to load intelligence:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (file: IntelligenceFile) => {
    setLoadingFile(true);
    setSelectedFile(file);
    setIsEditing(false);

    try {
      const response = await fetch(`${API_URL}/api/intelligence/file?path=${encodeURIComponent(file.path)}`);
      const data = await response.json();
      setFileContent(data.content);
      setEditedContent(data.content);
    } catch (error) {
      console.error("Failed to load file:", error);
      setFileContent("Failed to load file content");
      setEditedContent("");
    } finally {
      setLoadingFile(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/intelligence/file`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedFile.path,
          content: editedContent,
        }),
      });

      if (response.ok) {
        setFileContent(editedContent);
        setIsEditing(false);
        // Refresh structure in case file was renamed or moved
        loadStructure();
      } else {
        console.error("Failed to save file");
      }
    } catch (error) {
      console.error("Error saving file:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedContent(fileContent);
    setIsEditing(false);
  };

  const processBraindump = async () => {
    if (!braindumpInput.trim()) return;

    setProcessingBraindump(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch(`${API_URL}/api/braindump`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          braindump: braindumpInput,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(100);
        setTimeout(() => {
          setBraindumpSuggestions(data.suggestions);
          setShowApproval(true);
          setProgress(0);
        }, 300);
      } else {
        console.error("Failed to process braindump");
      }
    } catch (error) {
      console.error("Error processing braindump:", error);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setProcessingBraindump(false);
      }, 300);
    }
  };

  const approveBraindump = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/braindump/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestions: braindumpSuggestions,
        }),
      });

      if (response.ok) {
        // Reset braindump state
        setBraindumpInput("");
        setBraindumpSuggestions([]);
        setShowApproval(false);
        setShowBraindump(false);
        // Refresh structure
        loadStructure();
      } else {
        console.error("Failed to save braindump");
      }
    } catch (error) {
      console.error("Error saving braindump:", error);
    } finally {
      setSaving(false);
    }
  };

  const rejectBraindump = () => {
    setBraindumpSuggestions([]);
    setShowApproval(false);
  };

  const approveSyncSuggestions = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/braindump/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestions: syncSuggestions,
        }),
      });

      if (response.ok) {
        // Reset sync state
        setSyncSuggestions([]);
        setShowSyncApproval(false);
        // Refresh structure
        loadStructure();
      } else {
        console.error("Failed to save sync suggestions");
      }
    } catch (error) {
      console.error("Error saving sync suggestions:", error);
    } finally {
      setSaving(false);
    }
  };

  const rejectSyncSuggestions = () => {
    setSyncSuggestions([]);
    setShowSyncApproval(false);
  };

  const syncIntelligence = async () => {
    setSyncing(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 600);

    try {
      const response = await fetch(`${API_URL}/api/intelligence/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(100);
        setTimeout(() => {
          setSyncSuggestions(data.suggestions);
          setShowSyncApproval(true);
          setProgress(0);
        }, 300);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 408 || errorData.timeout) {
          console.error("Intelligence sync timed out");
          alert("Intelligence sync timed out. Web searches can take a while - try again in a moment.");
        } else {
          console.error("Failed to sync intelligence:", errorData.error || "Unknown error");
          alert("Failed to sync intelligence: " + (errorData.error || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Error syncing intelligence:", error);
      alert("Network error during intelligence sync. Please check your connection.");
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setSyncing(false);
      }, 300);
    }
  };

  const formatFolderName = (folder: string) => {
    return folder
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatFileName = (name: string) => {
    return name
      .replace('.md', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!IS_LOCAL_MODE) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <main className="pt-14">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            <div className="flex flex-col items-center justify-center py-24">
              <p className="font-mono text-sm text-zinc-500 uppercase tracking-wider">
                Intelligence only available in local mode
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <main className="pt-14">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            <div className="flex flex-col items-center justify-center py-24">
              <p className="font-mono text-sm text-zinc-500 uppercase tracking-wider">
                Loading...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const folders = structure ? Object.keys(structure).sort() : [];
  const currentFiles = selectedFolder && structure ? structure[selectedFolder] : [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="pt-14">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                Intelligence
              </span>
              <div className="h-3 w-px bg-zinc-800" />
              <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                {folders.length} folders
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={syncIntelligence}
                disabled={syncing}
                className={cn(
                  "px-4 py-2 font-mono text-[10px] uppercase tracking-wider border transition-colors",
                  syncing
                    ? "text-zinc-700 border-zinc-900"
                    : "text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
                )}
              >
                {syncing ? (
                  <span className="flex items-center gap-2">
                    <span>Syncing</span>
                    <span className="tabular-nums">{Math.floor(progress)}%</span>
                  </span>
                ) : (
                  "Sync Intelligence"
                )}
              </button>
              <button
                onClick={() => {
                  setShowBraindump(!showBraindump);
                  setShowApproval(false);
                  setBraindumpSuggestions([]);
                  // Also hide sync results when opening braindump
                  if (!showBraindump) {
                    setShowSyncApproval(false);
                  }
                }}
                className={cn(
                  "px-4 py-2 font-mono text-[10px] uppercase tracking-wider border transition-colors",
                  showBraindump
                    ? "bg-zinc-900 text-zinc-300 border-zinc-700"
                    : "text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
                )}
              >
                {showBraindump ? "Close Braindump" : "Braindump"}
              </button>
            </div>
          </div>

          {/* Sync Intelligence Results */}
          {showSyncApproval && !showBraindump ? (
            <div className="space-y-6 mb-6">
              <div className="border border-zinc-900">
                <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                    Intelligence Sync Updates
                  </span>
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                    {syncSuggestions.length} updates found
                  </span>
                </div>
                <div className="divide-y divide-zinc-900">
                  {syncSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 border border-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-600">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                              File
                            </div>
                            <div className="font-mono text-xs text-zinc-300">
                              {suggestion.file}
                            </div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                              Section
                            </div>
                            <div className="font-mono text-xs text-zinc-300">
                              {suggestion.section}
                            </div>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                              Content
                            </div>
                            <pre className="font-mono text-xs text-zinc-400 whitespace-pre-wrap bg-zinc-950 border border-zinc-900 p-3">
                              {suggestion.content}
                            </pre>
                          </div>
                          <div>
                            <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                              Reasoning
                            </div>
                            <div className="font-mono text-xs text-zinc-500">
                              {suggestion.reasoning}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={rejectSyncSuggestions}
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={approveSyncSuggestions}
                  disabled={saving}
                  className={cn(
                    "px-4 py-2 font-mono text-[10px] uppercase tracking-wider border transition-colors",
                    saving
                      ? "text-zinc-600 border-zinc-800"
                      : "text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-600"
                  )}
                >
                  {saving ? "Saving..." : "Approve & Save"}
                </button>
              </div>
            </div>
          ) : null}

          {/* Braindump Interface */}
          {showBraindump && !showSyncApproval ? (
            <div className="space-y-6">
              {!showApproval ? (
                <div className="border border-zinc-900">
                  <div className="px-4 py-3 border-b border-zinc-900">
                    <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                      Braindump
                    </span>
                  </div>
                  <div className="p-6">
                    {processingBraindump ? (
                      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <div className="flex items-center gap-0.5 font-mono text-xs">
                          <span className="text-zinc-700">[</span>
                          {Array.from({ length: 20 }).map((_, i) => {
                            const blockProgress = (progress / 100) * 20;
                            const isActive = i < blockProgress;
                            return (
                              <span key={i} className={isActive ? "text-zinc-500" : "text-zinc-800"}>
                                {isActive ? "█" : "░"}
                              </span>
                            );
                          })}
                          <span className="text-zinc-700">]</span>
                          <span className="text-zinc-600 ml-3 tabular-nums">{Math.floor(progress)}%</span>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                          Analyzing and organizing braindump...
                        </span>
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={braindumpInput}
                          onChange={(e) => setBraindumpInput(e.target.value)}
                          placeholder="Dump your thoughts, ideas, updates, or any information... AI will organize it into the right intelligence folders."
                          className="w-full h-[400px] bg-transparent border border-zinc-900 p-4 font-mono text-xs text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-zinc-700 transition-colors resize-none"
                          spellCheck={false}
                        />
                        <div className="flex items-center justify-end gap-3 mt-4">
                          <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                            {braindumpInput.length} characters
                          </span>
                          <button
                            onClick={processBraindump}
                            disabled={processingBraindump || !braindumpInput.trim()}
                            className={cn(
                              "px-4 py-2 font-mono text-[10px] uppercase tracking-wider border transition-colors",
                              processingBraindump || !braindumpInput.trim()
                                ? "text-zinc-700 border-zinc-900"
                                : "text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-600"
                            )}
                          >
                            {processingBraindump ? "Processing..." : "Process"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border border-zinc-900">
                    <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                        Suggested Changes
                      </span>
                      <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                        {braindumpSuggestions.length} updates
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-900">
                      {braindumpSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 border border-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-600">
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                                  File
                                </div>
                                <div className="font-mono text-xs text-zinc-300">
                                  {suggestion.file}
                                </div>
                              </div>
                              <div>
                                <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                                  Section
                                </div>
                                <div className="font-mono text-xs text-zinc-300">
                                  {suggestion.section}
                                </div>
                              </div>
                              <div>
                                <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                                  Content
                                </div>
                                <pre className="font-mono text-xs text-zinc-400 whitespace-pre-wrap bg-zinc-950 border border-zinc-900 p-3">
                                  {suggestion.content}
                                </pre>
                              </div>
                              <div>
                                <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                                  Reasoning
                                </div>
                                <div className="font-mono text-xs text-zinc-500">
                                  {suggestion.reasoning}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={rejectBraindump}
                      className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={approveBraindump}
                      disabled={saving}
                      className={cn(
                        "px-4 py-2 font-mono text-[10px] uppercase tracking-wider border transition-colors",
                        saving
                          ? "text-zinc-600 border-zinc-800"
                          : "text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-600"
                      )}
                    >
                      {saving ? "Saving..." : "Approve & Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !showSyncApproval ? (
            /* Main Layout */
            <div className="grid grid-cols-12 gap-6">
            {/* Sidebar - Folders */}
            <div className="col-span-3 border border-zinc-900">
              <div className="px-4 py-3 border-b border-zinc-900">
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                  Folders
                </span>
              </div>
              <div className="p-2">
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => {
                      setSelectedFolder(folder);
                      setSelectedFile(null);
                      setFileContent("");
                    }}
                    className={cn(
                      "w-full px-3 py-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider transition-colors",
                      selectedFolder === folder
                        ? "bg-zinc-900 text-zinc-300"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                    )}
                  >
                    <FolderIcon className="w-3.5 h-3.5" />
                    {formatFolderName(folder)}
                  </button>
                ))}
              </div>
            </div>

            {/* Middle - Files List */}
            <div className="col-span-3 border border-zinc-900">
              <div className="px-4 py-3 border-b border-zinc-900">
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                  {selectedFolder ? formatFolderName(selectedFolder) : "Files"}
                </span>
              </div>
              <div className="p-2">
                {currentFiles.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                      No files
                    </p>
                  </div>
                ) : (
                  currentFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => loadFile(file)}
                      className={cn(
                        "w-full px-3 py-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider transition-colors text-left",
                        selectedFile?.path === file.path
                          ? "bg-zinc-900 text-zinc-300"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                      )}
                    >
                      <FileIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{formatFileName(file.name)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right - File Content */}
            <div className="col-span-6 border border-zinc-900">
              <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                  {selectedFile ? formatFileName(selectedFile.name) : "Content"}
                </span>
                {selectedFile && !loadingFile && (
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveFile}
                          disabled={saving}
                          className={cn(
                            "px-3 py-1 font-mono text-[10px] uppercase tracking-wider border transition-colors",
                            saving
                              ? "text-zinc-600 border-zinc-800"
                              : "text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-600"
                          )}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEdit}
                        className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="p-6 h-[600px] overflow-y-auto">
                {loadingFile ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                      Loading...
                    </p>
                  </div>
                ) : fileContent ? (
                  isEditing ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-full bg-transparent border-none outline-none font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed resize-none"
                      spellCheck={false}
                    />
                  ) : (
                    <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {fileContent}
                    </pre>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                      Select a file to view
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
