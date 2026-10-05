import React, { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Bug,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Code2,
  Wrench
} from "lucide-react";
import { TerminalLine, ProjectFile } from "../types";
import { LintProblem } from "../utils/linter";
import { FileLanguageIcon } from "./FileLanguageIcon";

export interface TerminalProps {
  lines: TerminalLine[];
  onClear: () => void;
  onExecuteCommand: (command: string) => void;
  onDebugErrorWithAI: (lastError: string) => void;
  isRunning: boolean;
  statusMessage?: string;
  problems?: LintProblem[];
  onNavigateToProblem?: (fileId: string, line: number, column: number) => void;
  activeTab?: "console" | "problems";
  onTabChange?: (tab: "console" | "problems") => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  lines,
  onClear,
  onExecuteCommand,
  onDebugErrorWithAI,
  isRunning,
  statusMessage,
  problems = [],
  onNavigateToProblem,
  activeTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<"console" | "problems">("console");
  const currentTab = activeTab ?? internalTab;

  const handleSetTab = (newTab: "console" | "problems") => {
    setInternalTab(newTab);
    onTabChange?.(newTab);
  };

  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new lines arrive (in console tab)
  useEffect(() => {
    if (currentTab === "console") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines, statusMessage, currentTab]);

  // Find if there is an error in the last lines
  const lastErrorLine = [...lines].reverse().find((l) => l.type === "stderr");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setInputVal("");
    onExecuteCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInputVal("");
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx] || "");
      }
    }
  };

  const handleCopy = () => {
    const text = lines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c1017] border-t border-[#262c36] font-mono text-xs overflow-hidden select-text">
      {/* Terminal Toolbar with Tabs */}
      <div className="h-8.5 bg-[#111622] border-b border-[#222938] px-2 flex items-center justify-between select-none shrink-0">
        {/* Left: Tab Switcher (Console / Problèmes) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSetTab("console")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
              currentTab === "console"
                ? "bg-[#1f283a] text-white shadow-xs border border-[#33425b]"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#161c28] border border-transparent"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Console</span>
            {isRunning && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            onClick={() => handleSetTab("problems")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
              currentTab === "problems"
                ? "bg-[#1f283a] text-white shadow-xs border border-[#33425b]"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#161c28] border border-transparent"
            }`}
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                problems.length > 0 ? "text-red-400 animate-pulse" : "text-gray-400"
              }`}
            />
            <span>Problèmes</span>
            {problems.length > 0 ? (
              <span className="px-1.5 py-0.2 text-[9.5px] font-bold font-mono rounded-full bg-red-950/80 text-red-300 border border-red-700/60 ml-0.5">
                {problems.length}
              </span>
            ) : (
              <span className="text-[9.5px] text-gray-500 font-mono ml-0.5">0</span>
            )}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Debug with AI button if an error occurred */}
          {lastErrorLine && currentTab === "console" && (
            <button
              onClick={() => onDebugErrorWithAI(lastErrorLine.text)}
              title="Analyser et réparer l'erreur avec l'IA"
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-red-950/70 hover:bg-red-900/90 text-red-200 border border-red-700/60 rounded shadow transition active:scale-95 cursor-pointer"
            >
              <Bug className="w-3 h-3 text-red-400" />
              <span className="hidden sm:inline">Corriger avec l'IA</span>
            </button>
          )}

          {currentTab === "console" && (
            <>
              <button
                onClick={handleCopy}
                title="Copier la sortie de la console"
                className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#1c2434] rounded transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onClear}
                title="Effacer la console (clear)"
                className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#1c2434] rounded transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* View 1: Problems Tab */}
      {currentTab === "problems" ? (
        <div className="flex-1 p-3 overflow-y-auto space-y-2 select-text">
          {/* Problems Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#202736]">
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-medium text-[11.5px]">
                Erreurs de syntaxe & avertissements en temps réel
              </span>
              <span className="text-[10px] text-gray-500">
                (Linter instantané Python, JS, HTML, JSON)
              </span>
            </div>
            <div className="text-[11px]">
              {problems.length === 0 ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  0 problème détecté
                </span>
              ) : (
                <span className="text-red-400 font-semibold font-mono">
                  {problems.length} {problems.length > 1 ? "problèmes détectés" : "problème détecté"}
                </span>
              )}
            </div>
          </div>

          {/* Empty state */}
          {problems.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center text-center text-gray-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mb-2" />
              <p className="text-gray-300 text-xs font-semibold">Aucun problème de syntaxe détecté !</p>
              <p className="text-gray-500 text-[11px] mt-1 max-w-sm">
                Votre code s'exécute correctement et respecte la grammaire du langage. Les erreurs détectées en temps réel apparaîtront ici.
              </p>
            </div>
          )}

          {/* List of detected problems */}
          {problems.map((prob) => (
            <div
              key={prob.id}
              onClick={() => onNavigateToProblem?.(prob.fileId, prob.line, prob.column)}
              className="group p-2.5 rounded-lg bg-[#141924] hover:bg-[#1a2130] border border-[#263042] hover:border-red-500/50 transition cursor-pointer shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex items-center gap-1.5 font-sans">
                    <FileLanguageIcon fileName={prob.fileName} className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold text-gray-200 text-xs">{prob.fileName}</span>
                    <span className="text-gray-500 text-xs">:</span>
                    <span className="font-mono text-red-300 font-bold text-xs">
                      Ligne {prob.line}, Col {prob.column}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-red-950/70 text-red-300 border border-red-800/40">
                    {prob.severity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDebugErrorWithAI(prob.message);
                    }}
                    title="Demander à l'IA de réparer"
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/80 px-2 py-0.5 rounded border border-purple-800/50 transition cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                    <span>Réparer</span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <div className="mt-1.5 ml-6 text-red-200 text-[11.5px] leading-relaxed font-mono">
                {prob.message}
              </div>

              {/* Code Snippet Preview with Caret Pointer */}
              {prob.codeSnippet && (
                <div className="mt-2 ml-6 bg-[#0a0d13] p-2 rounded border border-[#1e2535] font-mono text-[11px] text-gray-300 overflow-x-auto">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 select-none">{prob.line} |</span>
                    <span className="whitespace-pre">{prob.codeSnippet}</span>
                  </div>
                  {/* Caret pointing to error column */}
                  <div className="flex items-start gap-2 text-red-500 select-none">
                    <span className="invisible">{prob.line} |</span>
                    <span className="whitespace-pre font-bold">
                      {" ".repeat(Math.max(0, prob.column - 1)) + "^"}
                    </span>
                  </div>
                </div>
              )}

              {/* Suggestion */}
              {prob.suggestion && (
                <div className="mt-1.5 ml-6 text-[11px] text-amber-300/90 flex items-center gap-1">
                  <span className="text-amber-400">💡</span>
                  <span>{prob.suggestion}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* View 2: Console Tab */
        <>
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex-1 p-3 overflow-y-auto space-y-1 cursor-text"
          >
            {lines.length === 0 && (
              <div className="text-gray-500 text-[11px] leading-relaxed select-none">
                RepliLite Shell v1.0 [WebAssembly Python 3 & JS Engine]
                <br />
                Tapez <span className="text-gray-300 font-semibold">run</span> ou cliquez sur le bouton vert en haut pour démarrer.
                <br />
                Tapez <span className="text-gray-300 font-semibold">lint</span> pour lancer l'analyse de syntaxe manuelle.
                <br />
                Tapez <span className="text-gray-300 font-semibold">help</span> pour afficher la liste des commandes.
              </div>
            )}

            {lines.map((line) => {
              let colorClass = "text-gray-200";
              let prefix = "";

              switch (line.type) {
                case "stdin":
                  colorClass = "text-emerald-400 font-semibold";
                  prefix = "";
                  break;
                case "stderr":
                  colorClass = "text-red-400 bg-red-950/20 px-1 py-0.5 rounded";
                  break;
                case "info":
                  colorClass = "text-blue-400";
                  break;
                case "system":
                  colorClass = "text-amber-400";
                  break;
                case "ai":
                  colorClass = "text-purple-300 bg-purple-950/20 p-1.5 rounded border border-purple-800/40";
                  break;
                case "stdout":
                default:
                  colorClass = "text-gray-200";
                  break;
              }

              return (
                <div key={line.id} className={`${colorClass} break-words whitespace-pre-wrap leading-relaxed`}>
                  {prefix}
                  {line.text}
                </div>
              );
            })}

            {/* Temporary status message (e.g. Loading Pyodide...) */}
            {statusMessage && (
              <div className="text-yellow-400 animate-pulse text-[11px] py-0.5">
                ⚙ {statusMessage}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Interactive Command Input Line */}
          <form
            onSubmit={handleSubmit}
            className="px-3 py-2 bg-[#0e1219] border-t border-[#1d2432] flex items-center gap-2 shrink-0"
          >
            <span className="text-emerald-400 font-semibold select-none flex items-center gap-1">
              <span>repl@replilite</span>
              <span className="text-gray-500">:</span>
              <span className="text-blue-400">~</span>
              <span className="text-gray-500">$</span>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ex: run, lint, python main.py, ls, help, ai 'comment réparer ?'"
              className="flex-1 bg-transparent text-gray-100 placeholder-gray-600 focus:outline-none text-xs"
            />
            <span className="terminal-cursor" />
          </form>
        </>
      )}
    </div>
  );
};
