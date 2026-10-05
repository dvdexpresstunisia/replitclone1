import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Copy,
  Check,
  RotateCcw,
  Code2,
  FileCode,
  Zap,
  MessageSquare,
  AlertCircle,
  Layers,
  Target
} from "lucide-react";
import { ProjectFile } from "../types";
import { FileLanguageIcon } from "./FileLanguageIcon";

interface AIFileAnalysisPopoverProps {
  file: ProjectFile | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInAIChat?: (prompt: string) => void;
}

export const AIFileAnalysisPopover: React.FC<AIFileAnalysisPopoverProps> = ({
  file,
  isOpen,
  onClose,
  onOpenInAIChat,
}) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Trigger analysis when file changes or popover opens
  useEffect(() => {
    if (!isOpen || !file) {
      return;
    }

    let isMounted = true;
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      setSummary(null);

      try {
        const res = await fetch("/api/ai/analyze-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            content: file.content || "",
            language: file.language || "text",
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erreur serveur (${res.status})`);
        }

        const data = await res.json();
        if (isMounted) {
          setSummary(data.summary || data.analysis || "Aucune analyse disponible.");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Impossible d'analyser le fichier avec Gemini.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalysis();

    return () => {
      isMounted = false;
    };
  }, [file?.id, file?.name, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReanalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/analyze-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          content: file.content || "",
          language: file.language || "text",
        }),
      });

      if (!res.ok) throw new Error("Erreur de régénération");
      const data = await res.json();
      setSummary(data.summary || data.analysis || "Aucune analyse disponible.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format markdown sections with visual styling
  const renderFormattedSummary = (rawText: string) => {
    const sections = rawText.split(/(?=###\s+)/g);

    return (
      <div className="space-y-3">
        {sections.map((sec, idx) => {
          const lines = sec.trim().split("\n");
          const titleLine = lines[0].replace(/^###\s+/, "").trim();
          const contentLines = lines.slice(1).join("\n").trim();

          let icon = <Target className="w-3.5 h-3.5 text-[#f26207]" />;
          let headerColor = "text-[#f26207]";
          let cardBg = "bg-[#161d2a]/80 border-[#232f44]";

          if (titleLine.includes("Fonction") || titleLine.includes("Élément") || titleLine.includes("⚡")) {
            icon = <Zap className="w-3.5 h-3.5 text-amber-400" />;
            headerColor = "text-amber-400";
            cardBg = "bg-[#181a24]/80 border-[#2c2b3e]";
          } else if (titleLine.includes("Architecture") || titleLine.includes("Dépendance") || titleLine.includes("📦")) {
            icon = <Layers className="w-3.5 h-3.5 text-blue-400" />;
            headerColor = "text-blue-400";
            cardBg = "bg-[#121b28]/80 border-[#1f3048]";
          } else if (titleLine.includes("Attention") || titleLine.includes("Remarque") || titleLine.includes("💡")) {
            icon = <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
            headerColor = "text-purple-400";
            cardBg = "bg-[#1a1526]/80 border-[#32254a]";
          }

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${cardBg} shadow-xs text-xs text-gray-200`}
            >
              <div className={`font-semibold flex items-center gap-1.5 mb-1.5 ${headerColor}`}>
                {icon}
                <span>{titleLine}</span>
              </div>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap pl-1 font-sans text-[11.5px]">
                {contentLines || lines[0]}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center sm:justify-start sm:pl-64 bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0f141d] border border-[#2b3548] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 select-text"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#131924] border-b border-[#232b3c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f26207] to-purple-600 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-100 text-xs sm:text-sm">
                  AI File Analysis
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-purple-950/70 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Gemini 3.8 Flash
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                <FileLanguageIcon fileName={file.name} className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono text-gray-200">{file.name}</span>
                <span>•</span>
                <span>{file.content ? file.content.split("\n").length : 0} lignes</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#1f2838] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-purple-900/30 border border-purple-600/40 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#f26207] animate-ping" />
              </div>
              <div className="space-y-1">
                <p className="text-gray-200 text-xs font-semibold">
                  Génération de la synthèse avec Gemini...
                </p>
                <p className="text-gray-400 text-[11px] max-w-xs">
                  Analyse de l'objectif, des dépendances et extraction des fonctions clés de <span className="font-mono text-gray-300">{file.name}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300">Échec de l'analyse IA</p>
                <p className="text-[11.5px] mt-0.5 text-red-200">{error}</p>
                <button
                  onClick={handleReanalyze}
                  className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-900/50 hover:bg-red-850 border border-red-700 text-xs text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réessayer</span>
                </button>
              </div>
            </div>
          )}

          {/* Result State */}
          {summary && !loading && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {renderFormattedSummary(summary)}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-2.5 bg-[#121722] border-t border-[#232b3c] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading || !summary}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-gray-300 hover:text-white bg-[#1a212e] hover:bg-[#252f42] border border-[#2b3548] transition cursor-pointer disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-300">Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  <span>Copier la synthèse</span>
                </>
              )}
            </button>

            <button
              onClick={handleReanalyze}
              disabled={loading}
              title="Régénérer l'analyse"
              className="flex items-center gap-1 px-2 py-1 rounded text-gray-400 hover:text-white hover:bg-[#1a212e] transition cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {onOpenInAIChat && (
            <button
              onClick={() => {
                onClose();
                onOpenInAIChat(`Peux-tu m'en dire plus sur le fichier ${file.name} et comment l'améliorer ?`);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded font-medium bg-gradient-to-r from-[#f26207] to-[#e05200] hover:brightness-110 text-white shadow-xs transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discuter avec l'IA</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
