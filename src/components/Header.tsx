import React, { useState } from "react";
import {
  Play,
  Square,
  Sparkles,
  FolderTree,
  Terminal as TerminalIcon,
  Globe,
  Download,
  Plus,
  HelpCircle,
  Cpu,
  Layers,
  Check,
  ChevronDown,
  Mic
} from "lucide-react";
import { AIProvider, ProjectTemplate } from "../types";
import { TEMPLATES } from "../utils/templates";

interface HeaderProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  showTerminal: boolean;
  onToggleTerminal: () => void;
  showWebview: boolean;
  onToggleWebview: () => void;
  showAIPanel: boolean;
  onToggleAIPanel: () => void;
  isWebProject: boolean;
  aiProvider: AIProvider;
  onChangeAIProvider: (provider: AIProvider) => void;
  onLoadTemplate: (template: ProjectTemplate) => void;
  onExportProject: () => void;
  onOpenShortcuts: () => void;
  hasGeminiKey: boolean;
  onGoHome?: () => void;
  onOpenVoiceModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onUpdateProjectName,
  isRunning,
  onRun,
  onStop,
  showSidebar,
  onToggleSidebar,
  showTerminal,
  onToggleTerminal,
  showWebview,
  onToggleWebview,
  showAIPanel,
  onToggleAIPanel,
  isWebProject,
  aiProvider,
  onChangeAIProvider,
  onLoadTemplate,
  onExportProject,
  onOpenShortcuts,
  hasGeminiKey,
  onGoHome,
  onOpenVoiceModal,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectName);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onUpdateProjectName(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-13 bg-[#13171f] border-b border-[#262c36] flex items-center justify-between px-3 select-none z-30 shrink-0">
      {/* Left side: Logo & Project Name & Templates */}
      <div className="flex items-center gap-3">
        {/* Replit-style logo icon with Home navigation */}
        <button
          onClick={onGoHome}
          title="Retourner à l'accueil Replit (Home)"
          className="flex items-center gap-2 pr-2 border-r border-[#262c36] hover:opacity-85 transition cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f26207] to-[#ff8c42] flex items-center justify-center shadow-lg shadow-orange-950/40 text-white font-black text-sm tracking-tighter">
            <span className="font-mono text-base font-bold">R/</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1">
              RepliLite
              <span className="text-[9px] bg-[#f26207]/20 text-[#f26207] px-1.5 py-0.2 rounded font-semibold uppercase">
                IDE
              </span>
            </span>
            <span className="text-[10px] text-gray-400">← Retour à l'accueil</span>
          </div>
        </button>

        {/* Project Name editable */}
        <div className="flex items-center gap-1.5">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              autoFocus
              className="bg-[#1c212c] text-white text-xs px-2 py-1 rounded border border-[#3b4354] focus:outline-none focus:border-[#f26207] w-40"
            />
          ) : (
            <button
              onClick={() => {
                setTempTitle(projectName);
                setIsEditingTitle(true);
              }}
              title="Cliquer pour renommer le projet"
              className="text-xs font-semibold text-gray-200 hover:text-white px-2 py-1 rounded hover:bg-[#1e2430] transition flex items-center gap-1"
            >
              <span>{projectName}</span>
              <span className="text-[10px] text-gray-500">✎</span>
            </button>
          )}

          {/* Templates Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
              className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white bg-[#1a202c] hover:bg-[#222a3a] px-2 py-1 rounded border border-[#2c3545] transition"
            >
              <Layers className="w-3 h-3 text-[#f26207]" />
              <span className="hidden md:inline">Modèles</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showTemplatesMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTemplatesMenu(false)}
                />
                <div className="absolute left-0 mt-1 w-64 bg-[#181d27] border border-[#2b3342] rounded-lg shadow-2xl py-1 z-50 overflow-hidden text-xs">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-[#2b3342]">
                    Charger un modèle de départ
                  </div>
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        onLoadTemplate(tmpl);
                        setShowTemplatesMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#242b3a] transition flex items-start gap-2.5 text-gray-200 hover:text-white"
                    >
                      <span className="text-base shrink-0 mt-0.5">{tmpl.icon}</span>
                      <div>
                        <div className="font-semibold text-xs text-white">{tmpl.name}</div>
                        <div className="text-[11px] text-gray-400 leading-snug line-clamp-2">
                          {tmpl.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: Big Replit-style "Run" Button */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md font-semibold text-xs bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-950/40 transition active:scale-95 animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Arrêter</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            title="Exécuter le code (Ctrl + Entrée)"
            className="flex items-center gap-2 px-5 py-1.5 rounded-md font-bold text-xs bg-gradient-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-white shadow-lg shadow-green-950/30 transition hover:shadow-green-900/50 active:scale-95 border border-green-500/30 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Exécuter</span>
            <span className="hidden lg:inline text-[10px] text-green-200/70 font-normal ml-0.5 bg-black/20 px-1 py-0.5 rounded">
              Ctrl+↵
            </span>
          </button>
        )}
      </div>

      {/* Right side: View toggles & AI provider & Actions */}
      <div className="flex items-center gap-1.5">
        {/* Toggle File Sidebar */}
        <button
          onClick={onToggleSidebar}
          title={showSidebar ? "Masquer les fichiers" : "Afficher les fichiers"}
          className={`p-1.5 rounded text-xs transition flex items-center gap-1 border ${
            showSidebar
              ? "bg-[#1f2737] text-white border-[#384357]"
              : "text-gray-400 hover:text-gray-200 hover:bg-[#1a202c] border-transparent"
          }`}
        >
          <FolderTree className="w-4 h-4" />
        </button>

        {/* Toggle Terminal */}
        <button
          onClick={onToggleTerminal}
          title={showTerminal ? "Masquer le terminal" : "Afficher le terminal"}
          className={`p-1.5 rounded text-xs transition flex items-center gap-1 border ${
            showTerminal
              ? "bg-[#1f2737] text-white border-[#384357]"
              : "text-gray-400 hover:text-gray-200 hover:bg-[#1a202c] border-transparent"
          }`}
        >
          <TerminalIcon className="w-4 h-4" />
          <span className="hidden xl:inline text-[11px]">Terminal</span>
        </button>

        {/* Toggle Webview (active especially if web app) */}
        {isWebProject && (
          <button
            onClick={onToggleWebview}
            title={showWebview ? "Masquer la Webview" : "Afficher la Webview"}
            className={`p-1.5 rounded text-xs transition flex items-center gap-1 border ${
              showWebview
                ? "bg-blue-900/40 text-blue-300 border-blue-600/50"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#1a202c] border-transparent"
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="hidden xl:inline text-[11px]">Webview</span>
          </button>
        )}

          {/* AI Provider Switcher / Status */}
        <div className="relative">
          <button
            onClick={() => setShowAiMenu(!showAiMenu)}
            className={`px-2 py-1 rounded text-xs transition flex items-center gap-1.5 border ${
              aiProvider === "gemini"
                ? "bg-purple-950/40 border-purple-700/50 text-purple-300"
                : aiProvider === "ollama"
                ? "bg-blue-950/40 border-blue-700/50 text-blue-300"
                : aiProvider === "opencode"
                ? "bg-indigo-950/40 border-indigo-700/50 text-indigo-300"
                : aiProvider === "freellm"
                ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
                : "bg-amber-950/40 border-amber-700/50 text-amber-300"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">
              {aiProvider === "gemini"
                ? "Gemini (Auto)"
                : aiProvider === "ollama"
                ? "Ollama (Local)"
                : aiProvider === "opencode"
                ? "OpenCode (Local)"
                : aiProvider === "freellm"
                ? "FreeLLM"
                : "Hugging Face"}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showAiMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAiMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-64 bg-[#181d27] border border-[#2b3342] rounded-lg shadow-2xl p-2 z-50 text-xs">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Moteur d'Intelligence Artificielle
                </div>

                {/* Gemini Option */}
                <button
                  onClick={() => {
                    onChangeAIProvider("gemini");
                    setShowAiMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded flex items-start gap-2 transition ${
                    aiProvider === "gemini" ? "bg-[#252a38] text-white" : "hover:bg-[#202533] text-gray-300"
                  }`}
                >
                  <div className="w-4 h-4 mt-0.5 text-purple-400">
                    {aiProvider === "gemini" ? <Check className="w-4 h-4" /> : null}
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span>Google Gemini 3.8 Flash</span>
                      <span className="text-[9px] bg-green-900/50 text-green-300 px-1 rounded">Gratuit</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Recommandé. Rapide pour générer, déboguer et expliquer.
                    </div>
                  </div>
                </button>

                {/* Ollama Option */}
                <button
                  onClick={() => {
                    onChangeAIProvider("ollama");
                    setShowAiMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded flex items-start gap-2 transition mt-1 ${
                    aiProvider === "ollama" ? "bg-[#252a38] text-white" : "hover:bg-[#202533] text-gray-300"
                  }`}
                >
                  <div className="w-4 h-4 mt-0.5 text-blue-400">
                    {aiProvider === "ollama" ? <Check className="w-4 h-4" /> : null}
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span>🦙 Ollama (Local)</span>
                      <span className="text-[9px] bg-blue-900/50 text-blue-300 px-1 rounded">IA Locale</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      localhost:11434 • qwen2.5-coder ou llama3.2 sur votre machine.
                    </div>
                  </div>
                </button>

                {/* OpenCode Option */}
                <button
                  onClick={() => {
                    onChangeAIProvider("opencode");
                    setShowAiMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded flex items-start gap-2 transition mt-1 ${
                    aiProvider === "opencode" ? "bg-[#252a38] text-white" : "hover:bg-[#202533] text-gray-300"
                  }`}
                >
                  <div className="w-4 h-4 mt-0.5 text-indigo-400">
                    {aiProvider === "opencode" ? <Check className="w-4 h-4" /> : null}
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span>💻 OpenCode / LM Studio</span>
                      <span className="text-[9px] bg-indigo-900/50 text-indigo-300 px-1 rounded">Local</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      localhost:1234 • Serveur OpenAI API local compatible.
                    </div>
                  </div>
                </button>

                {/* FreeLLM Option */}
                <button
                  onClick={() => {
                    onChangeAIProvider("freellm");
                    setShowAiMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded flex items-start gap-2 transition mt-1 ${
                    aiProvider === "freellm" ? "bg-[#252a38] text-white" : "hover:bg-[#202533] text-gray-300"
                  }`}
                >
                  <div className="w-4 h-4 mt-0.5 text-emerald-400">
                    {aiProvider === "freellm" ? <Check className="w-4 h-4" /> : null}
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span>🌐 FreeLLM API</span>
                      <span className="text-[9px] bg-emerald-900/50 text-emerald-300 px-1 rounded">100% Free</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Passerelle libre sans clé API requise.
                    </div>
                  </div>
                </button>

                {/* Hugging Face Option */}
                <button
                  onClick={() => {
                    onChangeAIProvider("huggingface");
                    setShowAiMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded flex items-start gap-2 transition mt-1 ${
                    aiProvider === "huggingface" ? "bg-[#252a38] text-white" : "hover:bg-[#202533] text-gray-300"
                  }`}
                >
                  <div className="w-4 h-4 mt-0.5 text-amber-400">
                    {aiProvider === "huggingface" ? <Check className="w-4 h-4" /> : null}
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span>🤗 Hugging Face</span>
                      <span className="text-[9px] bg-amber-900/50 text-amber-300 px-1 rounded">Open Source</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Inference API cloud (Qwen 2.5 Coder, Llama).
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Voice Live Conversation Button */}
        {onOpenVoiceModal && (
          <button
            onClick={onOpenVoiceModal}
            title="Démarrer une conversation vocale en direct avec gemini-3.8-live"
            className="px-2 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 border shadow-sm bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border-purple-700/60 cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span className="hidden lg:inline text-[11px]">Vocal Live</span>
          </button>
        )}

        {/* AI Ghostwriter Side Panel Toggle */}
        <button
          onClick={onToggleAIPanel}
          title="Assistant IA & Ghostwriter"
          className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 border shadow-sm ${
            showAIPanel
              ? "bg-gradient-to-r from-[#f26207] to-[#ff7b25] text-white border-[#f26207]"
              : "bg-[#1d2330] text-gray-200 hover:text-white hover:bg-[#242b3b] border-[#313b4c]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span className="hidden md:inline">Ghostwriter</span>
        </button>

        {/* Export / Download */}
        <button
          onClick={onExportProject}
          title="Télécharger les fichiers du projet"
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#1a202c] rounded transition"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Shortcuts / Help */}
        <button
          onClick={onOpenShortcuts}
          title="Raccourcis clavier & aide"
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#1a202c] rounded transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
