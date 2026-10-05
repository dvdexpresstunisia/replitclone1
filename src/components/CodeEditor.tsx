import React, { useState, useRef, useEffect, useMemo } from "react";
import Prism from "prismjs";
// Import common Prism components
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-css";

import {
  X,
  Plus,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Minimize2,
  Code2,
  Wand2,
  Bug,
  HelpCircle,
  Zap,
  GitCommit,
  AlertCircle,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { ProjectFile } from "../types";
import { getLanguageInfo } from "../utils/language";
import { GitCommit as GitCommitType } from "./GitPanel";
import { FileLanguageIcon } from "./FileLanguageIcon";
import { lintFile, LintProblem } from "../utils/linter";

interface CodeEditorProps {
  files: ProjectFile[];
  activeFile: ProjectFile | null;
  openFileIds: string[];
  onSelectFile: (id: string) => void;
  onCloseTab: (id: string) => void;
  onUpdateContent: (id: string, content: string) => void;
  onRun: () => void;
  onTriggerGhostwriter: (action: "explain" | "fix" | "optimize" | "tests") => void;
  commits?: GitCommitType[];
  showBlame?: boolean;
  onToggleBlame?: () => void;
  onCursorChange?: (pos: { line: number; col: number }) => void;
  onShowProblemsTab?: () => void;
  targetLineToFocus?: number | null;
}

export interface BlameLineInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
  isUncommitted: boolean;
}

export function computeFileBlame(
  file: ProjectFile | null,
  commits: GitCommitType[]
): BlameLineInfo[] {
  if (!file) return [];
  const lines = file.content.split("\n");
  const lastCommit = commits[0];
  const lastCommitFile = lastCommit?.files.find((f) => f.name === file.name);
  const lastCommitLines = lastCommitFile ? lastCommitFile.content.split("\n") : [];

  return lines.map((line, idx) => {
    // If line matches last commit line at this index or file isn't dirty
    if (
      lastCommit &&
      (!file.isDirty || (idx < lastCommitLines.length && lastCommitLines[idx] === line))
    ) {
      let matchedCommit = lastCommit;
      // Search backwards through commits
      for (const commit of commits) {
        const cFile = commit.files.find((f) => f.name === file.name);
        if (cFile && cFile.content.split("\n").includes(line)) {
          matchedCommit = commit;
        }
      }
      return {
        hash: matchedCommit.hash,
        author: matchedCommit.author,
        date: matchedCommit.timestamp,
        message: matchedCommit.message,
        isUncommitted: false,
      };
    }

    // Line was modified or added after the commit
    return {
      hash: "0000000",
      author: "Vous",
      date: "maintenant",
      message: "Modifications locales non commitées",
      isUncommitted: true,
    };
  });
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFile,
  openFileIds,
  onSelectFile,
  onCloseTab,
  onUpdateContent,
  onRun,
  onTriggerGhostwriter,
  commits = [],
  showBlame = false,
  onToggleBlame,
  onCursorChange,
  onShowProblemsTab,
  targetLineToFocus,
}) => {
  const [fontSize, setFontSize] = useState<number>(13.5);
  const [copied, setCopied] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const blameGutterRef = useRef<HTMLDivElement>(null);

  const langInfo = activeFile ? getLanguageInfo(activeFile.name) : getLanguageInfo("index.js");

  // Real-time linting of active file
  const fileProblems: LintProblem[] = useMemo(() => {
    return activeFile ? lintFile(activeFile) : [];
  }, [activeFile?.content, activeFile?.name, activeFile?.id]);

  const activeLineProblem = fileProblems.find((p) => p.line === cursorPos.line);

  // Focus specific target line when requested (e.g. from Problems panel)
  useEffect(() => {
    if (targetLineToFocus && textareaRef.current && activeFile) {
      const lines = activeFile.content.split("\n");
      const targetIdx = Math.max(0, Math.min(targetLineToFocus - 1, lines.length - 1));
      let charPos = 0;
      for (let i = 0; i < targetIdx; i++) {
        charPos += lines[i].length + 1;
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(charPos, charPos);
      textareaRef.current.scrollTop = Math.max(0, targetIdx * (fontSize * 1.55) - 60);
      const newPos = { line: targetLineToFocus, col: 1 };
      setCursorPos(newPos);
      onCursorChange?.(newPos);
    }
  }, [targetLineToFocus, activeFile, fontSize]);

  // Compute blame lines for active file
  const blameLines = activeFile ? computeFileBlame(activeFile, commits) : [];

  // Reset cursor on active file change
  useEffect(() => {
    const initialPos = { line: 1, col: 1 };
    setCursorPos(initialPos);
    onCursorChange?.(initialPos);
  }, [activeFile?.id]);

  // Keep line numbers, highlight layer, and blame column in sync on scroll
  const handleScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;

      if (preRef.current) {
        preRef.current.scrollTop = top;
        preRef.current.scrollLeft = left;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
      if (blameGutterRef.current) {
        blameGutterRef.current.scrollTop = top;
      }
    }
  };

  // Track cursor line/col
  const handleCursorChange = () => {
    if (textareaRef.current && activeFile) {
      const pos = textareaRef.current.selectionStart;
      const lines = activeFile.content.slice(0, pos).split("\n");
      const newPos = {
        line: lines.length,
        col: lines[lines.length - 1].length + 1,
      };
      setCursorPos(newPos);
      onCursorChange?.(newPos);
    }
  };

  // Keyboard shortcut handlers (Tab, Auto-close, Ctrl+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current || !activeFile) return;

    // Ctrl+Enter or Cmd+Enter -> Run
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
      return;
    }

    const { selectionStart, selectionEnd, value } = textareaRef.current;

    // Tab key -> insert 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const tabSpace = "  ";

      if (e.shiftKey) {
        // Dedent: find current line start
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        if (value.startsWith(tabSpace, lineStart)) {
          const newContent = value.slice(0, lineStart) + value.slice(lineStart + 2);
          onUpdateContent(activeFile.id, newContent);
          setTimeout(() => {
            if (textareaRef.current) {
              const newPos = Math.max(lineStart, selectionStart - 2);
              textareaRef.current.selectionStart = newPos;
              textareaRef.current.selectionEnd = newPos;
            }
          }, 0);
        }
      } else {
        // Indent 2 spaces
        const newContent = value.slice(0, selectionStart) + tabSpace + value.slice(selectionEnd);
        onUpdateContent(activeFile.id, newContent);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = selectionStart + 2;
            textareaRef.current.selectionEnd = selectionStart + 2;
          }
        }, 0);
      }
      return;
    }

    // Auto-closing brackets & quotes
    const pairs: Record<string, string> = {
      "(": ")",
      "{": "}",
      "[": "]",
      '"': '"',
      "'": "'",
      "`": "`",
    };

    if (pairs[e.key] && selectionStart === selectionEnd) {
      e.preventDefault();
      const closeChar = pairs[e.key];
      const newContent =
        value.slice(0, selectionStart) + e.key + closeChar + value.slice(selectionEnd);
      onUpdateContent(activeFile.id, newContent);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = selectionStart + 1;
          textareaRef.current.selectionEnd = selectionStart + 1;
        }
      }, 0);
      return;
    }
  };

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format code safely with Prism
  const getHighlightedHtml = () => {
    if (!activeFile) return "";
    const code = activeFile.content;
    const prismLang =
      Prism.languages[langInfo.prismId] || Prism.languages.javascript;

    try {
      return Prism.highlight(code, prismLang, langInfo.prismId);
    } catch {
      return code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  };

  const openFiles = files.filter((f) => openFileIds.includes(f.id));
  const lineCount = activeFile ? activeFile.content.split("\n").length : 1;

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#13171f] text-gray-500 select-none">
        <Code2 className="w-12 h-12 text-gray-600 mb-2" />
        <p className="text-sm">Aucun fichier sélectionné</p>
        <p className="text-xs text-gray-600 mt-1">Sélectionnez un fichier dans la barre latérale</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#13171f] overflow-hidden select-none">
      {/* Top Tabs Bar */}
      <div className="flex items-center justify-between bg-[#0e1219] border-b border-[#242a36] px-2 h-9 shrink-0">
        {/* Open Files Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[70%]">
          {openFiles.map((file) => {
            const isActive = file.id === activeFile.id;
            const fileLang = getLanguageInfo(file.name);

            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded-t text-xs cursor-pointer border-b-2 transition ${
                  isActive
                    ? "bg-[#181d26] text-white border-[#f26207] font-medium"
                    : "text-gray-400 hover:bg-[#141821] hover:text-gray-200 border-transparent"
                }`}
              >
                <FileLanguageIcon fileName={file.name} className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[120px]">{file.name}</span>
                {file.isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f26207] shrink-0" />
                )}
                {openFiles.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 rounded p-0.5 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Toolbar (Blame Toggle, Ghostwriter, Font Size, Copy) */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {/* Git Blame Button */}
          {onToggleBlame && (
            <button
              onClick={onToggleBlame}
              title="Afficher les détails des auteurs et des dates par ligne (Git Blame)"
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition cursor-pointer ${
                showBlame
                  ? "bg-blue-900/60 text-blue-200 border-blue-500 font-semibold"
                  : "text-gray-300 hover:text-white bg-[#1a212e] hover:bg-[#252f42] border-[#2b3548]"
              }`}
            >
              <GitCommit className="w-3 h-3 text-blue-400" />
              <span>Blame</span>
            </button>
          )}

          {/* Quick AI Ghostwriter Trigger Buttons */}
          <button
            onClick={() => onTriggerGhostwriter("explain")}
            title="Expliquer ce code avec l'IA"
            className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white bg-[#1a212e] hover:bg-[#252f42] px-2 py-0.5 rounded border border-[#2b3548] transition cursor-pointer"
          >
            <HelpCircle className="w-3 h-3 text-purple-400" />
            <span className="hidden lg:inline">Expliquer</span>
          </button>

          <button
            onClick={() => onTriggerGhostwriter("fix")}
            title="Détecter & corriger les bugs"
            className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white bg-[#1a212e] hover:bg-[#252f42] px-2 py-0.5 rounded border border-[#2b3548] transition cursor-pointer"
          >
            <Bug className="w-3 h-3 text-red-400" />
            <span className="hidden lg:inline">Débugger</span>
          </button>

          <button
            onClick={() => onTriggerGhostwriter("optimize")}
            title="Refactoriser et optimiser ce code"
            className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white bg-[#1a212e] hover:bg-[#252f42] px-2 py-0.5 rounded border border-[#2b3548] transition cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="hidden lg:inline">Optimiser</span>
          </button>
        </div>
      </div>

      {/* Git Blame Active Notification Banner */}
      {showBlame && (
        <div className="bg-[#101726] border-b border-[#202c42] px-3 py-1 flex items-center justify-between text-xs text-blue-300 shrink-0 select-none animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <GitCommit className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white">Mode Git Blame actif</span>
            <span className="text-[11px] text-gray-400 hidden sm:inline">
              • Auteur, date et commit affichés pour chaque ligne
            </span>
          </div>
          {onToggleBlame && (
            <button
              onClick={onToggleBlame}
              className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-[#1a2336] transition cursor-pointer"
            >
              <span>Quitter Blame</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 relative overflow-hidden flex bg-[#13171f]">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          style={{ fontSize: `${fontSize}px`, lineHeight: "1.55" }}
          className="w-12 bg-[#0e1219] text-[#485366] font-mono text-right pr-2 pt-3 select-none overflow-hidden shrink-0 border-r border-[#202735]"
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const prob = fileProblems.find((p) => p.line === lineNum);
            const isCursor = lineNum === cursorPos.line;

            return (
              <div
                key={i}
                title={prob ? `Erreur de syntaxe (ligne ${lineNum}): ${prob.message}` : undefined}
                className={`flex items-center justify-end gap-1 ${
                  prob
                    ? "text-red-400 font-bold bg-red-950/20"
                    : isCursor
                    ? "text-[#f26207] font-semibold"
                    : ""
                }`}
              >
                {prob && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Git Blame Annotations Column (Visible when showBlame is true) */}
        {showBlame && (
          <div
            ref={blameGutterRef}
            style={{ fontSize: `${fontSize}px`, lineHeight: "1.55" }}
            className="w-64 bg-[#0a0e16] border-r border-[#1e2636] font-mono text-[11px] pt-3 select-none overflow-hidden shrink-0 divide-y divide-[#131923]"
          >
            {blameLines.map((blame, i) => (
              <div
                key={i}
                title={`Commit ${blame.hash} par ${blame.author} (${blame.date})\n"${blame.message}"`}
                className={`px-2 flex items-center justify-between truncate cursor-default transition hover:bg-[#151d2b] ${
                  blame.isUncommitted
                    ? "text-amber-400/90 font-medium bg-amber-950/10"
                    : "text-gray-400 hover:text-gray-200"
                } ${i + 1 === cursorPos.line ? "bg-[#141c29]" : ""}`}
              >
                <span className="font-mono text-[#f26207] text-[10px] truncate max-w-[55px]">
                  {blame.hash.slice(0, 7)}
                </span>
                <span className="truncate max-w-[85px] font-medium text-gray-300">
                  {blame.author}
                </span>
                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                  {blame.date}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Textarea + Syntax Highlight Layer Container */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Syntax Error Line Highlights and Underlines Layer */}
          <div
            aria-hidden="true"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: "1.55",
            }}
            className="absolute inset-0 m-0 p-3 font-mono pointer-events-none z-1 overflow-hidden whitespace-pre"
          >
            {Array.from({ length: lineCount }).map((_, idx) => {
              const lineNum = idx + 1;
              const prob = fileProblems.find((p) => p.line === lineNum);
              if (!prob) {
                return (
                  <div key={idx} style={{ height: `${fontSize * 1.55}px` }}>
                    &nbsp;
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  style={{ height: `${fontSize * 1.55}px` }}
                  className="w-full relative syntax-error-line rounded-xs"
                />
              );
            })}
          </div>

          {/* Syntax Highlighted Layer (Background) */}
          <pre
            ref={preRef}
            aria-hidden="true"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: "1.55",
            }}
            className="absolute inset-0 m-0 p-3 font-mono text-transparent whitespace-pre overflow-hidden pointer-events-none z-0"
            dangerouslySetInnerHTML={{
              __html: getHighlightedHtml() + "\n",
            }}
          />

          {/* Interactive Textarea (Foreground) */}
          <textarea
            ref={textareaRef}
            value={activeFile.content}
            onChange={(e) => onUpdateContent(activeFile.id, e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onKeyUp={handleCursorChange}
            onClick={handleCursorChange}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: "1.55",
            }}
            className="absolute inset-0 w-full h-full m-0 p-3 font-mono bg-transparent text-[#e6edf3] caret-[#f26207] selection:bg-[#264f78]/60 focus:outline-none resize-none z-10 whitespace-pre overflow-auto"
          />

          {/* Active Line Syntax Error Tooltip */}
          {activeLineProblem && (
            <div className="absolute right-4 bottom-4 z-20 bg-[#1a1215] border border-red-500/70 rounded-lg p-2.5 shadow-2xl text-xs text-red-200 max-w-lg animate-in fade-in zoom-in-95 pointer-events-auto">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-red-300 flex items-center justify-between">
                    <span>Erreur de syntaxe (Ligne {activeLineProblem.line}, Col {activeLineProblem.column})</span>
                    <span className="text-[10px] text-red-400 font-mono bg-red-950/60 px-1 py-0.2 rounded border border-red-800/40">
                      {activeLineProblem.source}
                    </span>
                  </div>
                  <p className="text-red-200 mt-0.5 text-[11.5px] leading-relaxed font-mono">
                    {activeLineProblem.message}
                  </p>
                  {activeLineProblem.suggestion && (
                    <div className="mt-1 text-[11px] text-amber-300/90 bg-amber-950/30 px-2 py-1 rounded border border-amber-900/40">
                      💡 {activeLineProblem.suggestion}
                    </div>
                  )}
                  {onShowProblemsTab && (
                    <button
                      onClick={onShowProblemsTab}
                      className="mt-1.5 text-[10.5px] text-blue-300 hover:text-blue-200 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Afficher dans le panneau Problèmes du terminal →</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Bottom Status Bar */}
      <div className="h-6.5 bg-[#0e1219] border-t border-[#242a36] px-3 flex items-center justify-between text-[11px] text-gray-400 select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-gray-300">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: langInfo.color }}
            />
            {langInfo.name}
          </span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span>{activeFile.content.length} car.</span>

          {/* Real-time Syntax Linter Status */}
          {fileProblems.length > 0 ? (
            <button
              onClick={onShowProblemsTab}
              title="Cliquer pour afficher les problèmes dans le terminal"
              className="flex items-center gap-1 text-[10.5px] text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/40 px-2 py-0.5 rounded border border-red-800/40 transition cursor-pointer"
            >
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span className="font-semibold">
                {fileProblems.length} {fileProblems.length > 1 ? "erreurs" : "erreur"} de syntaxe
              </span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400/90 text-[10.5px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Syntaxe valide</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Font Size controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => Math.max(11, s - 1))}
              title="Diminuer la taille de police"
              className="px-1 rounded hover:bg-[#1f2736] hover:text-white"
            >
              A-
            </button>
            <span className="text-[10px] text-gray-500">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(18, s + 1))}
              title="Augmenter la taille de police"
              className="px-1 rounded hover:bg-[#1f2736] hover:text-white"
            >
              A+
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            title="Copier le code"
            className="p-1 rounded hover:bg-[#1f2736] hover:text-white transition flex items-center gap-1"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
