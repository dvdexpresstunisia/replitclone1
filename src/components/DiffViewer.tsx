import React, { useState, useEffect } from "react";
import {
  GitCompare,
  Columns,
  List,
  Check,
  X,
  FileCode,
  ArrowRight,
  Maximize2,
  Minimize2,
  Copy,
  RotateCcw
} from "lucide-react";

export interface DiffEntry {
  type: "added" | "removed" | "unchanged";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

// LCS-based Diff algorithm to compute exact differences between two file versions
export function computeDiff(oldText: string, newText: string): DiffEntry[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const n = oldLines.length;
  const m = newLines.length;

  if (n > 1500 || m > 1500) {
    return newLines.map((l, i) => ({
      type: "added",
      newLineNumber: i + 1,
      content: l,
    }));
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffEntry[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({
        type: "unchanged",
        oldLineNumber: i,
        newLineNumber: j,
        content: oldLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: "added",
        newLineNumber: j,
        content: newLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: "removed",
        oldLineNumber: i,
        content: oldLines[i - 1],
      });
      i--;
    }
  }

  return result;
}

export interface DiffViewerProps {
  fileName: string;
  oldContent: string;
  newContent: string;
  oldLabel: string;
  newLabel: string;
  allFiles?: { name: string; content: string }[];
  onSelectFile?: (name: string) => void;
  onClose: () => void;
  onRestore?: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  fileName,
  oldContent,
  newContent,
  oldLabel,
  newLabel,
  allFiles = [],
  onSelectFile,
  onClose,
  onRestore,
}) => {
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const diffEntries = computeDiff(oldContent, newContent);
  const additions = diffEntries.filter((e) => e.type === "added").length;
  const deletions = diffEntries.filter((e) => e.type === "removed").length;

  const handleCopyOld = () => {
    navigator.clipboard.writeText(oldContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div
        className={`bg-[#0f141d] border border-[#2b3548] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs text-gray-200 transition-all ${
          isFullScreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[88vh]"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-3 bg-[#131924] border-b border-[#232c3d] flex items-center justify-between shrink-0 gap-3">
          {/* File information */}
          <div className="flex items-center gap-3 truncate min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-700/60 flex items-center justify-center text-blue-400 shrink-0">
              <GitCompare className="w-4 h-4" />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-mono truncate">
                  {fileName}
                </span>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.2 rounded font-mono font-bold">
                  +{additions}
                </span>
                <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-800/60 px-1.5 py-0.2 rounded font-mono font-bold">
                  -{deletions}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5 truncate mt-0.5">
                <span className="text-[#f26207] font-semibold">{oldLabel}</span>
                <ArrowRight className="w-3 h-3 text-gray-500" />
                <span className="text-gray-300 font-medium">{newLabel}</span>
              </div>
            </div>
          </div>

          {/* Controls: File Picker, View Mode, Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* File Switcher Dropdown */}
            {allFiles.length > 1 && onSelectFile && (
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={fileName}
                  onChange={(e) => onSelectFile(e.target.value)}
                  className="bg-[#18212e] text-gray-200 border border-[#2c374b] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#f26207]"
                >
                  {allFiles.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Unified / Split Toggle */}
            <div className="bg-[#18212e] p-0.5 rounded-lg border border-[#2a3548] flex items-center">
              <button
                type="button"
                onClick={() => setViewMode("unified")}
                title="Mode unifié"
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                  viewMode === "unified"
                    ? "bg-[#253046] text-white shadow-xs"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unifié</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("split")}
                title="Mode côte à côte"
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                  viewMode === "split"
                    ? "bg-[#253046] text-white shadow-xs"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Côte à côte</span>
              </button>
            </div>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Réduire" : "Plein écran"}
              className="p-1.5 rounded-lg hover:bg-[#20293b] text-gray-400 hover:text-white transition cursor-pointer"
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              title="Fermer (Échap)"
              className="p-1.5 rounded-lg hover:bg-[#20293b] text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Diff Content Body */}
        <div className="flex-1 overflow-auto bg-[#0a0d14] font-mono text-[12px] leading-relaxed">
          {diffEntries.length === 0 || (additions === 0 && deletions === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 p-8 text-center">
              <Check className="w-8 h-8 text-emerald-400" />
              <div className="text-sm font-semibold text-gray-300">
                Fichiers identiques
              </div>
              <p className="text-xs text-gray-500 max-w-sm">
                Aucune différence détectée entre {oldLabel} et {newLabel}.
              </p>
            </div>
          ) : viewMode === "unified" ? (
            /* Unified Diff View */
            <div className="min-w-full divide-y divide-[#161c28]">
              {diffEntries.map((entry, idx) => (
                <div
                  key={idx}
                  className={`flex items-start select-text ${
                    entry.type === "added"
                      ? "bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500"
                      : entry.type === "removed"
                      ? "bg-red-950/30 text-red-300 border-l-2 border-red-500"
                      : "text-gray-300 hover:bg-[#121620]"
                  }`}
                >
                  <span className="w-12 text-right px-2 py-0.5 text-gray-600 select-none shrink-0 font-mono text-[11px]">
                    {entry.oldLineNumber || ""}
                  </span>
                  <span className="w-12 text-right px-2 py-0.5 text-gray-600 select-none shrink-0 font-mono text-[11px] border-r border-[#1c2331]">
                    {entry.newLineNumber || ""}
                  </span>
                  <span className="w-6 text-center py-0.5 font-bold select-none shrink-0">
                    {entry.type === "added" ? "+" : entry.type === "removed" ? "-" : " "}
                  </span>
                  <span className="flex-1 py-0.5 pr-4 whitespace-pre overflow-x-auto">
                    {entry.content || " "}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Split / Side-by-Side Diff View */
            <div className="grid grid-cols-2 divide-x divide-[#202737] min-h-full">
              {/* Left Column: Old Version */}
              <div className="overflow-x-auto divide-y divide-[#151b26]">
                <div className="bg-[#121722] px-3 py-1.5 text-[11px] font-bold text-gray-400 border-b border-[#202737] sticky top-0 z-10 flex items-center justify-between">
                  <span>{oldLabel}</span>
                  <span className="text-[10px] text-red-400 font-mono">-{deletions}</span>
                </div>
                {diffEntries
                  .filter((e) => e.type !== "added")
                  .map((entry, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start select-text ${
                        entry.type === "removed"
                          ? "bg-red-950/30 text-red-300 border-l-2 border-red-500"
                          : "text-gray-400 hover:bg-[#121620]"
                      }`}
                    >
                      <span className="w-10 text-right px-2 py-0.5 text-gray-600 select-none shrink-0 text-[11px] border-r border-[#1c2331]">
                        {entry.oldLineNumber || ""}
                      </span>
                      <span className="w-5 text-center py-0.5 font-bold select-none shrink-0">
                        {entry.type === "removed" ? "-" : " "}
                      </span>
                      <span className="flex-1 py-0.5 pr-2 whitespace-pre overflow-x-auto">
                        {entry.content || " "}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Right Column: New Version */}
              <div className="overflow-x-auto divide-y divide-[#151b26]">
                <div className="bg-[#121722] px-3 py-1.5 text-[11px] font-bold text-gray-400 border-b border-[#202737] sticky top-0 z-10 flex items-center justify-between">
                  <span>{newLabel}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">+{additions}</span>
                </div>
                {diffEntries
                  .filter((e) => e.type !== "removed")
                  .map((entry, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start select-text ${
                        entry.type === "added"
                          ? "bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500"
                          : "text-gray-300 hover:bg-[#121620]"
                      }`}
                    >
                      <span className="w-10 text-right px-2 py-0.5 text-gray-600 select-none shrink-0 text-[11px] border-r border-[#1c2331]">
                        {entry.newLineNumber || ""}
                      </span>
                      <span className="w-5 text-center py-0.5 font-bold select-none shrink-0">
                        {entry.type === "added" ? "+" : " "}
                      </span>
                      <span className="flex-1 py-0.5 pr-2 whitespace-pre overflow-x-auto">
                        {entry.content || " "}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#131924] border-t border-[#232c3d] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyOld}
              className="px-2.5 py-1 rounded bg-[#1c2534] hover:bg-[#253145] text-gray-300 hover:text-white border border-[#2b374c] text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copié !" : "Copier la version archivée"}</span>
            </button>

            {onRestore && (
              <button
                type="button"
                onClick={onRestore}
                className="px-2.5 py-1 rounded bg-blue-950/70 hover:bg-blue-800 text-blue-300 hover:text-white border border-blue-700/50 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurer ce fichier</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#222b3c] hover:bg-[#2c374d] text-gray-200 hover:text-white font-semibold transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
