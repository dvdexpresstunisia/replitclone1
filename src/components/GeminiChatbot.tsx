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
  Bot,
  Settings,
  Shield,
  Layers,
  GraduationCap,
  Terminal,
  Mic,
  RefreshCw
} from "lucide-react";
import { ProjectFile } from "../types";

export type GeminiModelType =
  | "gemini-3.5-flash"
  | "gemini-3.1-flash-lite"
  | "gemini-3.1-pro-preview";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  model?: string;
  roleTitle?: string;
}

interface GeminiChatbotProps {
  activeFile: ProjectFile | null;
  files: ProjectFile[];
  onApplyCodeToFile?: (code: string) => void;
  onAppendCodeToFile?: (code: string) => void;
  onOpenVoiceModal?: () => void;
}

export const SYSTEM_ROLES = [
  {
    id: "architect",
    title: "Architecte Logiciel",
    icon: Layers,
    description: "Design patterns, architecture propre & scalabilité",
    instruction:
      "Tu es un architecte logiciel senior expert. Tu apportes des conseils de haut niveau sur les structures de données, l'architecture logicielle, les design patterns (SOLID, clean architecture), la modularité et la robustesse.",
  },
  {
    id: "debugger",
    title: "Débogueur & Optimiseur",
    icon: Bug,
    description: "Correction de bugs, gestion de mémoire & performance",
    instruction:
      "Tu es un spécialiste mondial du débogage et de l'optimisation. Tu analyses chirurgicalement le code à la recherche de failles, de fuites mémoire, d'erreurs de bornes ou de lenteurs, et tu donnes le code corrigé.",
  },
  {
    id: "tutor",
    title: "Tuteur Informatique",
    icon: GraduationCap,
    description: "Pédagogie pas-à-pas & explications didactiques",
    instruction:
      "Tu es un tuteur de programmation bienveillant et pédagogue. Tu décomposes les notions complexes en étapes simples, avec des commentaires didactiques et des analogies intuitives pour apprendre rapidement.",
  },
  {
    id: "devops",
    title: "DevOps & Shell Linux",
    icon: Terminal,
    description: "Commandes terminal, Git, CI/CD & environnement",
    instruction:
      "Tu es un expert DevOps et administrateur système Linux chevronné. Tu maîtrises le terminal bash, Git, les flux de déploiement, les scripts shell et la configuration d'environnements.",
  },
  {
    id: "general",
    title: "Assistant Généraliste",
    icon: Bot,
    description: "Aide polyvalente, code rapide & réponses concises",
    instruction:
      "Tu es l'assistant de programmation officiel de RepliLite. Sois concis, pragmatique et donne directement le code le plus propre et fonctionnel possible.",
  },
];

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  activeFile,
  files,
  onApplyCodeToFile,
  onAppendCodeToFile,
  onOpenVoiceModal,
}) => {
  // Selected Model: gemini-3.5-flash (general), gemini-3.1-flash-lite (fast), gemini-3.1-pro-preview (complex)
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>("gemini-3.5-flash");

  // Selected Role & System Instruction
  const [selectedRoleId, setSelectedRoleId] = useState<string>("general");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [showRoleConfig, setShowRoleConfig] = useState<boolean>(false);

  // Conversation history (Multi-turn)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "model",
      content:
        "👋 Bonjour ! Je suis votre chatbot Gemini multi-tours. Comment puis-je vous aider aujourd'hui ? Vous pouvez choisir mon rôle et le modèle adapté à votre besoin (rapide, général ou complexe).",
      timestamp: new Date().toLocaleTimeString(),
      model: "gemini-3.5-flash",
      roleTitle: "Assistant Généraliste",
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeRole =
    SYSTEM_ROLES.find((r) => r.id === selectedRoleId) || SYSTEM_ROLES[4];
  const effectiveSystemInstruction = customInstruction.trim() || activeRole.instruction;

  // Auto-scroll when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || inputVal;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!userPrompt) setInputVal("");
    setIsLoading(true);

    try {
      // Build multi-turn history payload for server
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          model: selectedModel,
          systemInstruction: effectiveSystemInstruction,
          activeFile,
          files,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Erreur serveur (${res.status})`);
      }

      const modelReply: ChatMessage = {
        id: `gem-${Date.now()}`,
        role: "model",
        content: data.reply || "Aucune réponse retournée.",
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel,
        roleTitle: activeRole.title,
      };

      setMessages((prev) => [...prev, modelReply]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        content: `⚠️ Erreur : ${err.message || "Une erreur est survenue lors de la communication avec Gemini."}`,
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "model",
        content: "Historique réinitialisé. Comment puis-je vous assister ?",
        timestamp: new Date().toLocaleTimeString(),
        model: selectedModel,
        roleTitle: activeRole.title,
      },
    ]);
  };

  const extractCodeBlocks = (markdown: string): string[] => {
    const regex = /```(?:[a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
    const blocks: string[] = [];
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      blocks.push(match[1].trim());
    }
    return blocks;
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#10141d] border-l border-[#242b38] select-none text-xs">
      {/* Top Header Bar */}
      <div className="px-3 py-2.5 bg-[#141924] border-b border-[#242d3d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-gray-200 flex items-center gap-1.5 text-xs">
              <span>Chatbot Gemini</span>
              <span className="text-[10px] text-gray-400 font-normal">
                ({messages.filter((m) => m.role === "user").length} échanges)
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Buttons: Voice Live, Roles Config, Clear */}
        <div className="flex items-center gap-1.5">
          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              title="Démarrer une conversation vocale en direct avec gemini-3.8-live"
              className="px-2 py-1 rounded-lg bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-700/50 flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer shadow-xs"
            >
              <Mic className="w-3 h-3 text-purple-300" />
              <span>Vocal Live</span>
            </button>
          )}

          <button
            onClick={() => setShowRoleConfig(!showRoleConfig)}
            title="Configurer les rôles et consignes système"
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showRoleConfig
                ? "bg-[#253046] text-[#f26207] border-[#364560]"
                : "text-gray-400 hover:text-white hover:bg-[#1f2838] border-transparent"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClearHistory}
            title="Effacer la conversation"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#1f2838] transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Model Selector Bar */}
      <div className="px-3 py-1.5 bg-[#0e1219] border-b border-[#1f2735] flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-1 text-gray-400 font-medium">
          <Cpu className="w-3 h-3 text-blue-400" />
          <span>Modèle :</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedModel("gemini-3.5-flash")}
            title="gemini-3.5-flash : Parfait pour les tâches générales (recommandé)"
            className={`px-2 py-0.8 rounded text-[10px] font-semibold transition cursor-pointer ${
              selectedModel === "gemini-3.5-flash"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-[#161c27] text-gray-400 hover:text-gray-200 border border-[#232b3b]"
            }`}
          >
            ⚡ 3.5 Flash
          </button>

          <button
            onClick={() => setSelectedModel("gemini-3.1-flash-lite")}
            title="gemini-3.1-flash-lite : Conçu pour les tâches qui doivent s'exécuter très rapidement"
            className={`px-2 py-0.8 rounded text-[10px] font-semibold transition cursor-pointer ${
              selectedModel === "gemini-3.1-flash-lite"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-[#161c27] text-gray-400 hover:text-gray-200 border border-[#232b3b]"
            }`}
          >
            🚀 3.1 Flash-Lite
          </button>

          <button
            onClick={() => setSelectedModel("gemini-3.1-pro-preview")}
            title="gemini-3.1-pro-preview : Pour les tâches particulièrement complexes et le raisonnement avancé"
            className={`px-2 py-0.8 rounded text-[10px] font-semibold transition cursor-pointer ${
              selectedModel === "gemini-3.1-pro-preview"
                ? "bg-purple-600 text-white shadow-2xs"
                : "bg-[#161c27] text-gray-400 hover:text-gray-200 border border-[#232b3b]"
            }`}
          >
            🧠 3.1 Pro
          </button>
        </div>
      </div>

      {/* Role / System Instruction Configuration Panel (Collapsible) */}
      {showRoleConfig && (
        <div className="p-3 bg-[#131924] border-b border-[#252f42] space-y-2.5 animate-in fade-in duration-100 shrink-0">
          <div className="flex items-center justify-between text-gray-300 font-bold text-[11px]">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#f26207]" />
              <span>Rôle du chatbot (System Instruction)</span>
            </span>
            <span className="text-[10px] text-gray-500 font-normal">Définit sa personnalité</span>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {SYSTEM_ROLES.map((role) => {
              const IconComp = role.icon;
              const isSelected = selectedRoleId === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#1d2738] border-[#f26207] text-white shadow-xs"
                      : "bg-[#0e131b] border-[#222b3b] text-gray-400 hover:bg-[#161e2c] hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-200">
                    <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-[#f26207]" : "text-gray-400"}`} />
                    <span className="truncate">{role.title}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 line-clamp-1 mt-1">
                    {role.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Instruction input */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">
              Consigne système personnalisée (optionnel) :
            </label>
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Ex: Réponds toujours avec des exemples en Python 3 et des tests doctest..."
              rows={2}
              className="w-full bg-[#0d1117] text-gray-200 text-xs p-2 rounded-lg border border-[#263144] focus:outline-none focus:border-[#f26207] resize-none"
            />
          </div>
        </div>
      )}

      {/* Active Role Mini-Badge */}
      <div className="px-3 py-1 bg-[#0c1017] border-b border-[#1b2230] flex items-center justify-between text-[10px] text-gray-500 shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Rôle actif : <strong className="text-gray-300">{activeRole.title}</strong></span>
        </span>
        <span className="font-mono text-gray-500">{selectedModel}</span>
      </div>

      {/* Scrollable Message Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3.5 bg-[#0b0e14]">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const codeBlocks = !isUser ? extractCodeBlocks(msg.content) : [];

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[92%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs ${
                  isUser
                    ? "bg-[#f26207] text-white"
                    : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                }`}
              >
                {isUser ? "U" : <Sparkles className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 rounded-xl p-3 leading-relaxed shadow-xs text-xs ${
                  isUser
                    ? "bg-[#192230] text-gray-100 rounded-tr-none border border-[#2b394f]"
                    : "bg-[#141924] text-gray-200 rounded-tl-none border border-[#242e3e]"
                }`}
              >
                {/* Bubble Header */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1 pb-1 border-b border-white/5">
                  <span className="font-semibold text-gray-300">
                    {isUser ? "Vous" : `Gemini (${msg.model || selectedModel})`}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Content */}
                <div className="whitespace-pre-wrap font-sans text-xs break-words space-y-2">
                  {msg.content}
                </div>

                {/* Extracted Code Blocks Action Bar */}
                {codeBlocks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#232c3d] space-y-2">
                    {codeBlocks.map((block, bIdx) => (
                      <div
                        key={bIdx}
                        className="bg-[#090c12] rounded-lg p-2 border border-[#1e2637] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Code2 className="w-3 h-3 text-[#f26207]" />
                            <span>Bloc de code {bIdx + 1}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(block, `${msg.id}-${bIdx}`)}
                              className="px-1.5 py-0.5 rounded hover:bg-[#1a2334] text-gray-300 hover:text-white flex items-center gap-1 transition"
                            >
                              {copiedId === `${msg.id}-${bIdx}` ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === `${msg.id}-${bIdx}` ? "Copié !" : "Copier"}</span>
                            </button>

                            {onApplyCodeToFile && (
                              <button
                                onClick={() => onApplyCodeToFile(block)}
                                title="Remplacer le code du fichier actif par ce bloc"
                                className="px-1.5 py-0.5 rounded bg-blue-900/40 hover:bg-blue-800 text-blue-300 hover:text-white border border-blue-700/40 flex items-center gap-1 transition"
                              >
                                <ArrowDownToLine className="w-3 h-3" />
                                <span>Appliquer</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <pre className="font-mono text-[11px] text-emerald-400 bg-black/40 p-2 rounded max-h-36 overflow-x-auto whitespace-pre">
                          {block}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 mr-auto max-w-[85%] animate-pulse">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#141924] border border-[#242e3e] rounded-xl p-3 text-xs text-gray-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Gemini ({selectedModel}) génère la réponse...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-1.5 bg-[#0e1219] border-t border-[#1d2533] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => handleSendMessage("Explique le fonctionnement du fichier actif")}
          disabled={isLoading || !activeFile}
          className="whitespace-nowrap px-2 py-0.8 rounded-full bg-[#18202d] hover:bg-[#222d40] text-[10px] text-gray-300 border border-[#263347] transition disabled:opacity-40"
        >
          💡 Expliquer le fichier actif
        </button>
        <button
          onClick={() => handleSendMessage("Trouve les bugs potentiels et propose des optimisations")}
          disabled={isLoading || !activeFile}
          className="whitespace-nowrap px-2 py-0.8 rounded-full bg-[#18202d] hover:bg-[#222d40] text-[10px] text-gray-300 border border-[#263347] transition disabled:opacity-40"
        >
          🐞 Détecter les bugs
        </button>
        <button
          onClick={() => handleSendMessage("Écris les tests unitaires pour ces fonctions")}
          disabled={isLoading || !activeFile}
          className="whitespace-nowrap px-2 py-0.8 rounded-full bg-[#18202d] hover:bg-[#222d40] text-[10px] text-gray-300 border border-[#263347] transition disabled:opacity-40"
        >
          🧪 Générer des tests
        </button>
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-[#131822] border-t border-[#232c3d] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`Posez votre question à Gemini (${activeRole.title})...`}
          disabled={isLoading}
          className="flex-1 bg-[#0c1017] text-gray-200 placeholder-gray-500 text-xs px-3 py-2 rounded-xl border border-[#263144] focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputVal.trim() || isLoading}
          className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
