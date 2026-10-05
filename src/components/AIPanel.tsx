import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Code2,
  FileCode,
  ArrowDownToLine,
  HelpCircle,
  Bug,
  Zap,
  Cpu,
  KeyRound,
  ExternalLink,
  Mic,
  Bot
} from "lucide-react";
import { AIMessage, AIProvider, ProjectFile } from "../types";
import { GeminiChatbot } from "./GeminiChatbot";

interface AIPanelProps {
  messages: AIMessage[];
  onSendMessage: (content: string) => Promise<void>;
  onClearMessages: () => void;
  isLoading: boolean;
  activeFile: ProjectFile | null;
  files: ProjectFile[];
  onApplyCodeToFile: (code: string) => void;
  onAppendCodeToFile: (code: string) => void;
  aiProvider: AIProvider;
  onChangeProvider: (provider: AIProvider) => void;
  hfToken: string;
  onChangeHfToken: (token: string) => void;
  localUrl?: string;
  onChangeLocalUrl?: (url: string) => void;
  localModel?: string;
  onChangeLocalModel?: (model: string) => void;
  onOpenVoiceModal?: () => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({
  messages,
  onSendMessage,
  onClearMessages,
  isLoading,
  activeFile,
  files,
  onApplyCodeToFile,
  onAppendCodeToFile,
  aiProvider,
  onChangeProvider,
  hfToken,
  onChangeHfToken,
  localUrl = "http://localhost:11434",
  onChangeLocalUrl,
  localModel = "qwen2.5-coder",
  onChangeLocalModel,
  onOpenVoiceModal,
}) => {
  const [activeTab, setActiveTab] = useState<"gemini" | "ghostwriter">("gemini");
  const [inputVal, setInputVal] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          url: localUrl,
          model: localModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult({ ok: true, message: data.message });
      } else {
        setTestResult({ ok: false, message: data.error || "Échec de connexion" });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || "Erreur réseau" });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed || isLoading) return;

    setInputVal("");
    await onSendMessage(trimmed);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to extract markdown code blocks
  const extractCodeBlocks = (text: string): { code: string; lang: string }[] => {
    const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const blocks: { code: string; lang: string }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        lang: match[1] || "text",
        code: match[2].trim(),
      });
    }
    return blocks;
  };

  return (
    <div className="w-80 lg:w-96 bg-[#10141d] border-l border-[#262c36] flex flex-col h-full select-none shrink-0 text-xs">
      {/* Top Main Mode Switcher Tab Bar */}
      <div className="h-9 bg-[#0b0e14] border-b border-[#212734] px-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("gemini")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "gemini"
                ? "bg-[#1b2333] text-blue-400 border border-[#2c394e] shadow-2xs"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            <span>Chatbot Gemini</span>
          </button>

          <button
            onClick={() => setActiveTab("ghostwriter")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "ghostwriter"
                ? "bg-[#1b2333] text-[#f26207] border border-[#2c394e] shadow-2xs"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f26207]" />
            <span>Ghostwriter</span>
          </button>
        </div>

        {/* Quick Voice Launch Button */}
        {onOpenVoiceModal && (
          <button
            onClick={onOpenVoiceModal}
            title="Ouvrir la conversation vocale en direct avec gemini-3.8-live"
            className="px-2 py-0.8 rounded-md bg-purple-950/70 hover:bg-purple-800 text-purple-300 hover:text-white border border-purple-700/50 flex items-center gap-1 text-[10px] font-semibold transition cursor-pointer shadow-2xs"
          >
            <Mic className="w-3 h-3 text-purple-400" />
            <span>Vocal</span>
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === "gemini" ? (
        <GeminiChatbot
          activeFile={activeFile}
          files={files}
          onApplyCodeToFile={onApplyCodeToFile}
          onAppendCodeToFile={onAppendCodeToFile}
          onOpenVoiceModal={onOpenVoiceModal}
        />
      ) : (
        /* Ghostwriter View */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="h-10 bg-[#141924] border-b border-[#242b38] px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-[#f26207] to-[#ff9248] flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="font-bold text-gray-200 tracking-tight">Ghostwriter AI</span>
              <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.2 rounded border border-purple-800/40 font-semibold">
                {aiProvider === "gemini" ? "Gemini 3.8" : "HF / Local"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Paramètres IA"
                className={`p-1 rounded transition cursor-pointer ${
                  showSettings ? "bg-[#252f42] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClearMessages}
                title="Effacer la conversation"
                className="p-1 text-gray-400 hover:text-red-400 rounded transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Settings Panel if toggled */}
          {showSettings && (
            <div className="p-3 bg-[#18202d] border-b border-[#2b3548] space-y-2.5 overflow-y-auto max-h-72">
              <div className="font-semibold text-gray-200 flex items-center justify-between">
                <span>Configuration de l'IA</span>
                <span className="text-[10px] text-green-400">Prêt</span>
              </div>

              <div>
                <label className="text-gray-400 text-[11px] block mb-1">Moteur d'IA :</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeProvider("gemini")}
                    className={`px-2 py-1.5 rounded border text-left transition cursor-pointer ${
                      aiProvider === "gemini"
                        ? "bg-purple-900/40 border-purple-600 text-white font-medium"
                        : "bg-[#131720] border-[#2c3648] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="font-semibold text-xs">Google Gemini</div>
                    <div className="text-[10px] text-gray-400">Gratuit (Auto)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeProvider("ollama")}
                    className={`px-2 py-1.5 rounded border text-left transition cursor-pointer ${
                      aiProvider === "ollama"
                        ? "bg-blue-900/40 border-blue-600 text-white font-medium"
                        : "bg-[#131720] border-[#2c3648] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="font-semibold text-xs">🦙 Ollama</div>
                    <div className="text-[10px] text-gray-400">Local (11434)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeProvider("huggingface")}
                    className={`px-2 py-1.5 rounded border text-left transition cursor-pointer ${
                      aiProvider === "huggingface"
                        ? "bg-amber-900/40 border-amber-600 text-white font-medium"
                        : "bg-[#131720] border-[#2c3648] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="font-semibold text-xs">🤗 Hugging Face</div>
                    <div className="text-[10px] text-gray-400">Inference API</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeProvider("freellm")}
                    className={`px-2 py-1.5 rounded border text-left transition cursor-pointer ${
                      aiProvider === "freellm"
                        ? "bg-emerald-900/40 border-emerald-600 text-white font-medium"
                        : "bg-[#131720] border-[#2c3648] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="font-semibold text-xs">✨ FreeLLM</div>
                    <div className="text-[10px] text-gray-400">Sans clé requise</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active File Context Pill */}
          <div className="px-3 py-1.5 bg-[#141822] border-b border-[#202735] flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <FileCode className="w-3 h-3 text-[#f26207]" />
              <span className="truncate">
                {activeFile ? activeFile.name : "Aucun fichier ouvert"}
              </span>
            </span>
            <span className="text-[10px] text-gray-500">Contexte injecté</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4 space-y-2">
                <Sparkles className="w-8 h-8 text-[#f26207]/60" />
                <p className="font-medium text-xs text-gray-300">Ghostwriter AI est prêt</p>
                <p className="text-[11px] text-gray-500">
                  Posez une question, demandez du code ou faites analyser votre projet.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                const codeBlocks = !isUser ? extractCodeBlocks(msg.content) : [];

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`p-2.5 rounded-lg max-w-[95%] leading-relaxed ${
                        isUser
                          ? "bg-[#1f293a] text-white"
                          : "bg-[#161c28] border border-[#273244] text-gray-200"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans text-xs">{msg.content}</div>

                      {/* Code block extraction with Action Buttons */}
                      {codeBlocks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#263143] space-y-2">
                          {codeBlocks.map((block, i) => (
                            <div key={i} className="bg-[#0f141d] rounded p-2 border border-[#20293a]">
                              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                                <span className="font-mono text-gray-400 uppercase">{block.lang}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleCopyCode(block.code, `${msg.id}-${i}`)}
                                    className="p-1 hover:text-white rounded hover:bg-[#202838] transition flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedId === `${msg.id}-${i}` ? (
                                      <Check className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>{copiedId === `${msg.id}-${i}` ? "Copié" : "Copier"}</span>
                                  </button>

                                  <button
                                    onClick={() => onApplyCodeToFile(block.code)}
                                    title="Remplacer le fichier actif par ce code"
                                    className="px-1.5 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <ArrowDownToLine className="w-3 h-3" />
                                    <span>Remplacer</span>
                                  </button>
                                </div>
                              </div>
                              <pre className="font-mono text-[11px] text-emerald-400 overflow-x-auto p-1 max-h-32">
                                {block.code}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-gray-400 p-2 text-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#f26207]" />
                <span>Ghostwriter réfléchit...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-[#0e1219] border-t border-[#1d2533] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => onSendMessage("Explique ce code en détail")}
              disabled={isLoading || !activeFile}
              className="whitespace-nowrap px-2 py-0.8 rounded-full bg-[#18202d] hover:bg-[#222d40] text-[10px] text-gray-300 border border-[#263347] transition disabled:opacity-40 cursor-pointer"
            >
              💡 Expliquer
            </button>
            <button
              onClick={() => onSendMessage("Comment optimiser les performances de ce script ?")}
              disabled={isLoading || !activeFile}
              className="whitespace-nowrap px-2 py-0.8 rounded-full bg-[#18202d] hover:bg-[#222d40] text-[10px] text-gray-300 border border-[#263347] transition disabled:opacity-40 cursor-pointer"
            >
              ⚡ Optimiser
            </button>
            <button
              onClick={() => onSendMessage("Écris les tests unitaires pour ces fonctions")}
              disabled={isLoading || !activeFile}
              className="whitespace-nowrap px-2 py-0.8 rounded-full bg-[#18202d] hover:bg-[#222d40] text-[10px] text-gray-300 border border-[#263347] transition disabled:opacity-40 cursor-pointer"
            >
              🧪 Tests
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSubmit}
            className="p-2.5 bg-[#141924] border-t border-[#232c3d] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Posez une question sur votre code..."
              disabled={isLoading}
              className="flex-1 bg-[#0c1017] text-gray-200 placeholder-gray-500 text-xs px-3 py-2 rounded-xl border border-[#273244] focus:outline-none focus:border-[#f26207] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="p-2 rounded-xl bg-gradient-to-r from-[#f26207] to-[#ff7b25] hover:from-[#ff7315] hover:to-[#ff8d3f] text-white disabled:opacity-40 transition cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
