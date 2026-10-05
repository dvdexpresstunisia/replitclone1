import React, { useState } from "react";
import {
  Search,
  Plus,
  ArrowDownToLine,
  BookOpen,
  Clock,
  Layers,
  Shield,
  FileCode,
  Sparkles,
  HelpCircle,
  Settings,
  Lock,
  ChevronDown,
  RotateCw,
  Mic,
  ArrowUp,
  Cpu,
  Check,
  FolderPlus,
  Terminal,
  Code2,
  ExternalLink,
  Laptop
} from "lucide-react";
import { AIProvider, ProjectTemplate } from "../types";
import { TEMPLATES } from "../utils/templates";

interface ProjectItem {
  id: string;
  name: string;
  updatedAt: string;
  isPrivate: boolean;
  language: string;
  description: string;
  files: { name: string; content: string }[];
}

interface ReplitHomeProps {
  userName: string;
  recentProjects: ProjectItem[];
  onOpenProject: (project: ProjectItem) => void;
  onCreateNewProject: (name: string, templateId?: string) => void;
  onPromptSubmit: (prompt: string, provider: AIProvider) => void;
  aiProvider: AIProvider;
  onChangeAIProvider: (provider: AIProvider) => void;
  hasGeminiKey: boolean;
}

export const ReplitHome: React.FC<ReplitHomeProps> = ({
  userName = "maestro",
  recentProjects,
  onOpenProject,
  onCreateNewProject,
  onPromptSubmit,
  aiProvider,
  onChangeAIProvider,
  hasGeminiKey,
}) => {
  const [promptText, setPromptText] = useState("");
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);

  const suggestions = [
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
      text: "Help me get things done",
      prompt: "Aide-moi à organiser mon code et propose un plan pour concevoir une application moderne.",
    },
    {
      icon: (
        <span className="w-3.5 h-3.5 flex items-center justify-center font-bold text-red-500 text-[10px]">
          M
        </span>
      ),
      text: "Find emails needing my reply",
      prompt: "Écris un script Python qui simule le tri et la détection d'emails prioritaires nécessitant une réponse urgente.",
    },
    {
      icon: <span className="text-xs">🐍</span>,
      text: "Python data analyzer & stats",
      prompt: "Crée un projet Python 3 complet d'analyse de données avec calculs statistiques, graphiques ASCII et export.",
    },
    {
      icon: <span className="text-xs">🌐</span>,
      text: "Mini-jeu Canvas interactif",
      prompt: "Crée une application Web complète en HTML/CSS/JS avec un mini-jeu Canvas interactif.",
    },
  ];

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = promptText.trim();
    if (!trimmed) return;
    onPromptSubmit(trimmed, aiProvider);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProjectName.trim() || `repl-${Date.now().toString().slice(-4)}`;
    onCreateNewProject(name, selectedTemplateId);
    setShowNewModal(false);
    setNewProjectName("");
  };

  return (
    <div className="flex h-screen w-screen bg-[#fafbfc] text-[#1c1e21] overflow-hidden font-sans select-none">
      {/* Left Sidebar (Matching exact layout from screenshot) */}
      <aside className="w-60 bg-white border-r border-[#e5e7eb] flex flex-col justify-between h-full shrink-0 select-none">
        <div className="flex flex-col overflow-y-auto">
          {/* Top Logo & Search Bar */}
          <div className="p-3.5 flex items-center justify-between">
            {/* Replit Official Icon Style (Orange block glyph) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <div className="w-3.5 h-5 bg-[#f26207] rounded-xs" />
                <div className="flex flex-col gap-0.5">
                  <div className="w-3.5 h-2.5 bg-[#f26207] rounded-xs" />
                  <div className="w-3.5 h-2.5 bg-[#f26207] rounded-xs" />
                </div>
              </div>
            </div>

            <button
              title="Search"
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace dropdown selector */}
          <div className="px-3 pb-2 relative">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition text-xs font-medium text-gray-800"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {userName[0]?.toUpperCase() || "M"}
                </div>
                <span className="truncate">Personal workspace</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>

            {showWorkspaceMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowWorkspaceMenu(false)}
                />
                <div className="absolute left-3 right-3 top-10 bg-white border border-gray-200 rounded-lg shadow-xl p-1 z-40 text-xs">
                  <div className="px-2.5 py-1.5 font-semibold text-gray-900 border-b border-gray-100 flex items-center justify-between">
                    <span>Personal workspace</span>
                    <Check className="w-3 h-3 text-[#f26207]" />
                  </div>
                  <div className="px-2.5 py-1 text-[11px] text-gray-500">
                    Plan gratuit • Crédits IA actifs
                  </div>
                </div>
              </>
            )}
          </div>

          {/* + New Button */}
          <div className="px-3 pb-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 shadow-2xs transition"
            >
              <Plus className="w-4 h-4 text-gray-700" />
              <span>New</span>
            </button>
          </div>

          {/* Main Navigation Links */}
          <nav className="px-2 space-y-0.5 text-xs text-gray-600">
            <button
              onClick={() => setShowNewModal(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition text-left"
            >
              <ArrowDownToLine className="w-4 h-4 text-gray-500" />
              <span>Import</span>
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition text-left"
            >
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span>Library</span>
            </button>

            <button
              onClick={() => {}}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition text-left"
            >
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Routines</span>
            </button>

            <button
              onClick={() => {}}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition text-left"
            >
              <Layers className="w-4 h-4 text-gray-500" />
              <span>Integrations</span>
            </button>

            <button
              onClick={() => {}}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition text-left"
            >
              <Shield className="w-4 h-4 text-gray-500" />
              <span>Security</span>
            </button>
          </nav>

          {/* Section "Recent" list of repls */}
          <div className="px-3 pt-5 pb-2">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
              Recent
            </div>
            <div className="space-y-0.5">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 hover:text-gray-900 transition text-left text-xs text-gray-700 truncate group"
                >
                  <FileCode className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#f26207] shrink-0" />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar: Upgrade card & user profile */}
        <div className="p-3 border-t border-gray-100 space-y-2 shrink-0">
          {/* Upgrade your plan banner */}
          <div className="bg-gray-50 hover:bg-gray-100/80 border border-gray-200/80 rounded-xl p-3 flex items-center justify-between transition cursor-pointer">
            <div>
              <div className="font-semibold text-xs text-gray-900">
                Upgrade your plan
              </div>
              <div className="text-[11px] text-gray-500">
                Unlock more credits
              </div>
            </div>
            <button className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          <button
            onClick={() => {}}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition text-xs text-left"
          >
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <span>Learn more</span>
          </button>

          {/* User profile row */}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                {userName[0]?.toUpperCase() || "M"}
              </div>
              <span className="text-xs font-semibold text-gray-800 truncate">
                {userName}
              </span>
            </div>
            <button
              title="Settings"
              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Center Area with Warm Sunset Gradient Glow at the bottom */}
      <main className="flex-1 flex flex-col justify-between relative overflow-hidden bg-white">
        {/* Radiant Sunset Peach Gradient Overlay at the bottom (matching screenshot) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-96 pointer-events-none opacity-85 z-0"
          style={{
            background:
              "radial-gradient(ellipse 130% 90% at 50% 115%, #ff7a3d 0%, #ffaa7d 35%, #ffd2b8 65%, rgba(255,255,255,0) 100%)",
          }}
        />

        {/* Top: Recent projects horizontal cards */}
        <div className="px-10 pt-8 z-10">
          <div className="text-xs font-medium text-gray-600 mb-3">
            Recent projects
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {recentProjects.slice(0, 3).map((proj) => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj)}
                className="w-56 bg-white/90 hover:bg-white border border-gray-200/90 hover:border-gray-300 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-20 group"
              >
                <div className="font-medium text-xs text-gray-900 group-hover:text-[#f26207] truncate">
                  {proj.name}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>•</span>
                  <span>{proj.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle & Bottom: "maestro, what are we working on today?" & Prompt box */}
        <div className="px-6 pb-12 w-full max-w-3xl mx-auto flex flex-col items-center z-10">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 text-center mb-6">
            {userName}, what are we working on today?
          </h1>

          {/* Suggested for you row */}
          <div className="w-full mb-4">
            <div className="flex items-center gap-1 text-[11px] text-gray-600 mb-2 px-1">
              <span>Suggested for you</span>
              <RotateCw className="w-3 h-3 text-gray-400" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptText(item.prompt);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-gray-200/90 hover:border-gray-300 text-xs text-gray-700 shadow-2xs transition hover:scale-[1.01] active:scale-95 backdrop-blur-xs"
                >
                  {item.icon}
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* The Large Replit AI Agent Input Container */}
          <form
            onSubmit={handleSendPrompt}
            className="w-full bg-[#f6f6f6]/90 border border-gray-200/80 rounded-2xl p-3 shadow-lg shadow-orange-950/5 backdrop-blur-md transition-all focus-within:bg-white focus-within:border-gray-300 focus-within:shadow-xl"
          >
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
              rows={2}
              placeholder="Start chatting or describe a task..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none px-1 py-1"
            />

            {/* Bottom action bar inside the input box */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 mt-1 select-none">
              {/* Left Attachment / Plus Button */}
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                title="Add files or select template"
                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Right Model Selector, Mic and Send Button */}
              <div className="flex items-center gap-2">
                {/* Model selector dropdown (Free / Gemini 3.8 / Hugging Face) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowModelMenu(!showModelMenu)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-200/60 transition"
                  >
                    <div className="grid grid-cols-2 gap-0.5 opacity-60">
                      <div className="w-1 h-1 bg-gray-600 rounded-full" />
                      <div className="w-1 h-1 bg-gray-600 rounded-full" />
                      <div className="w-1 h-1 bg-gray-600 rounded-full" />
                      <div className="w-1 h-1 bg-gray-600 rounded-full" />
                    </div>
                    <span className="font-medium">
                      {aiProvider === "gemini"
                        ? "Free (Gemini)"
                        : aiProvider === "ollama"
                        ? "Ollama (Local)"
                        : aiProvider === "opencode"
                        ? "OpenCode"
                        : aiProvider === "freellm"
                        ? "FreeLLM"
                        : "Hugging Face"}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>

                  {showModelMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowModelMenu(false)}
                      />
                      <div className="absolute right-0 bottom-8 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-1 z-40 text-xs">
                        {/* Gemini */}
                        <button
                          type="button"
                          onClick={() => {
                            onChangeAIProvider("gemini");
                            setShowModelMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between ${
                            aiProvider === "gemini"
                              ? "bg-gray-100 font-semibold text-gray-900"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>Free (Google Gemini)</span>
                              <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.2 rounded font-bold">Auto</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-normal">
                              Inclus avec crédits gratuits
                            </div>
                          </div>
                          {aiProvider === "gemini" && (
                            <Check className="w-3.5 h-3.5 text-[#f26207]" />
                          )}
                        </button>

                        {/* Ollama */}
                        <button
                          type="button"
                          onClick={() => {
                            onChangeAIProvider("ollama");
                            setShowModelMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between mt-0.5 ${
                            aiProvider === "ollama"
                              ? "bg-gray-100 font-semibold text-gray-900"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>🦙 Ollama (IA Locale)</span>
                              <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-bold">Local</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-normal">
                              localhost:11434 • qwen2.5-coder / llama3
                            </div>
                          </div>
                          {aiProvider === "ollama" && (
                            <Check className="w-3.5 h-3.5 text-[#f26207]" />
                          )}
                        </button>

                        {/* OpenCode / LM Studio */}
                        <button
                          type="button"
                          onClick={() => {
                            onChangeAIProvider("opencode");
                            setShowModelMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between mt-0.5 ${
                            aiProvider === "opencode"
                              ? "bg-gray-100 font-semibold text-gray-900"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>💻 OpenCode / LM Studio</span>
                              <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-bold">Local</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-normal">
                              localhost:1234/v1 • OpenAI API local
                            </div>
                          </div>
                          {aiProvider === "opencode" && (
                            <Check className="w-3.5 h-3.5 text-[#f26207]" />
                          )}
                        </button>

                        {/* FreeLLM */}
                        <button
                          type="button"
                          onClick={() => {
                            onChangeAIProvider("freellm");
                            setShowModelMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between mt-0.5 ${
                            aiProvider === "freellm"
                              ? "bg-gray-100 font-semibold text-gray-900"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>🌐 FreeLLM API</span>
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded font-bold">100% Free</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-normal">
                              Sans clé API • Modèles code libres
                            </div>
                          </div>
                          {aiProvider === "freellm" && (
                            <Check className="w-3.5 h-3.5 text-[#f26207]" />
                          )}
                        </button>

                        {/* Hugging Face */}
                        <button
                          type="button"
                          onClick={() => {
                            onChangeAIProvider("huggingface");
                            setShowModelMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg flex items-center justify-between mt-0.5 ${
                            aiProvider === "huggingface"
                              ? "bg-gray-100 font-semibold text-gray-900"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>🤗 Hugging Face</span>
                              <span className="text-[9px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-bold">API</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-normal">
                              Qwen 2.5 Coder / Llama
                            </div>
                          </div>
                          {aiProvider === "huggingface" && (
                            <Check className="w-3.5 h-3.5 text-[#f26207]" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Voice / Mic Icon */}
                <button
                  type="button"
                  title="Voice dictation"
                  className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Submit Round Button with Up Arrow */}
                <button
                  type="submit"
                  disabled={!promptText.trim()}
                  className="w-7 h-7 rounded-full bg-gray-900 hover:bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition shadow-xs"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* "+ New Repl / Project" Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-xs text-gray-800">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Create a new Repl
            </h2>
            <p className="text-gray-500 text-xs mb-4">
              Choisissez un modèle de départ ou nommez votre espace de travail.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Nom du Repl :
                </label>
                <input
                  type="text"
                  placeholder="ex: my-python-project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#f26207] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Modèle de langage & environnement :
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                        selectedTemplateId === tmpl.id
                          ? "bg-orange-50/50 border-[#f26207] text-gray-900"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base">{tmpl.icon}</span>
                        <div className="truncate">
                          <div className="font-semibold text-xs text-gray-900">
                            {tmpl.name}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {tmpl.description}
                          </div>
                        </div>
                      </div>
                      {selectedTemplateId === tmpl.id && (
                        <Check className="w-4 h-4 text-[#f26207] shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#f26207] hover:bg-[#ff771f] text-white font-semibold shadow-xs transition"
                >
                  Créer le Repl
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
