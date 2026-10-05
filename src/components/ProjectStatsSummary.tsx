import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar,
  Code2,
  FileCode,
  PieChart,
  Layers,
  ChevronDown,
  Info,
  Clock
} from "lucide-react";
import { ProjectFile } from "../types";
import { getLanguageInfo } from "../utils/language";
import { FileLanguageIcon } from "./FileLanguageIcon";

interface LanguageStat {
  id: string;
  name: string;
  color: string;
  lines: number;
  percentage: number;
  filesCount: number;
}

interface ProjectStatsSummaryProps {
  projectName: string;
  creationDate?: string;
  files: ProjectFile[];
  className?: string;
}

export const ProjectStatsSummary: React.FC<ProjectStatsSummaryProps> = ({
  projectName,
  creationDate = "5 months ago",
  files,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute stats across all project files
  const { totalLines, totalBytes, languageStats, dominantLanguage } = useMemo(() => {
    let linesCount = 0;
    let bytesCount = 0;
    const langMap: Record<
      string,
      { id: string; name: string; color: string; lines: number; filesCount: number }
    > = {};

    files.forEach((file) => {
      const info = getLanguageInfo(file.name);
      const lines = file.content ? file.content.split("\n").length : 0;
      const bytes = new Blob([file.content || ""]).size;

      linesCount += lines;
      bytesCount += bytes;

      if (!langMap[info.id]) {
        langMap[info.id] = {
          id: info.id,
          name: info.name,
          color: info.color,
          lines: 0,
          filesCount: 0,
        };
      }
      langMap[info.id].lines += lines;
      langMap[info.id].filesCount += 1;
    });

    const statsList: LanguageStat[] = Object.values(langMap)
      .map((item) => ({
        ...item,
        percentage:
          linesCount > 0 ? Math.round((item.lines / linesCount) * 100) : 0,
      }))
      .sort((a, b) => b.lines - a.lines);

    return {
      totalLines: linesCount,
      totalBytes: bytesCount,
      languageStats: statsList,
      dominantLanguage: statsList[0] || null,
    };
  }, [files]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formattedSize =
    totalBytes > 1024
      ? `${(totalBytes / 1024).toFixed(1)} KB`
      : `${totalBytes} o`;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Compact summary trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`Statistiques du projet '${projectName}' :\n• Création : ${creationDate}\n• Lignes de code : ${totalLines}\n• Langage principal : ${dominantLanguage?.name || "N/A"}`}
        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10.5px] transition cursor-pointer border ${
          isOpen
            ? "bg-[#1f283a] text-white border-[#33425b]"
            : "bg-[#121620] hover:bg-[#1a2230] text-gray-400 hover:text-gray-200 border-[#222a3a]"
        }`}
      >
        {/* Creation Date Badge */}
        <span className="flex items-center gap-1 text-gray-400 hover:text-gray-300">
          <Clock className="w-2.5 h-2.5 text-blue-400/90 shrink-0" />
          <span className="hidden xl:inline text-[9.5px]">{creationDate}</span>
        </span>

        <span className="text-gray-600 select-none">·</span>

        {/* Lines of Code Count */}
        <span className="flex items-center gap-1 font-mono text-gray-300">
          <Code2 className="w-2.5 h-2.5 text-[#f26207] shrink-0" />
          <span>{totalLines} L</span>
        </span>

        <span className="text-gray-600 select-none">·</span>

        {/* Mini Language Distribution Bar / Badges */}
        <div className="flex items-center gap-1">
          {/* GitHub-style mini segmented progress line */}
          <div className="w-10 h-1.5 rounded-full overflow-hidden flex bg-gray-800 shrink-0">
            {languageStats.map((stat) => (
              <div
                key={stat.id}
                style={{
                  width: `${stat.percentage}%`,
                  backgroundColor: stat.color,
                }}
                className="h-full"
                title={`${stat.name}: ${stat.percentage}% (${stat.lines} lignes)`}
              />
            ))}
          </div>

          {/* Top language badge */}
          {dominantLanguage && (
            <span
              className="text-[9.5px] font-medium hidden sm:inline"
              style={{ color: dominantLanguage.color }}
            >
              {dominantLanguage.name} {dominantLanguage.percentage}%
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-2.5 h-2.5 text-gray-500 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Detailed Statistics Popover Card */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-76 bg-[#121620] border border-[#2b3548] rounded-lg shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#212838]">
            <div className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-[#f26207]" />
              <span className="font-semibold text-gray-200 truncate max-w-[170px]">
                {projectName}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 bg-[#1c2332] px-1.5 py-0.5 rounded border border-[#283244]">
              {files.length} {files.length > 1 ? "fichiers" : "fichier"}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-[#212838]">
            <div className="bg-[#181e2b] p-2 rounded border border-[#232c3e]">
              <div className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>Créé</span>
              </div>
              <div className="font-medium text-gray-200 text-[11px] truncate">
                {creationDate}
              </div>
            </div>

            <div className="bg-[#181e2b] p-2 rounded border border-[#232c3e]">
              <div className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5">
                <Code2 className="w-3 h-3 text-[#f26207]" />
                <span>Lignes</span>
              </div>
              <div className="font-medium font-mono text-gray-200 text-[11px]">
                {totalLines} L
              </div>
            </div>

            <div className="bg-[#181e2b] p-2 rounded border border-[#232c3e]">
              <div className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>Taille</span>
              </div>
              <div className="font-medium font-mono text-gray-200 text-[11px]">
                {formattedSize}
              </div>
            </div>
          </div>

          {/* Language Distribution Section */}
          <div className="pt-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-300 mb-1.5">
              <span>Répartition des langages</span>
              <span className="text-[10px] text-gray-500">
                {languageStats.length} {languageStats.length > 1 ? "langages" : "langage"}
              </span>
            </div>

            {/* Segmented color bar */}
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-800 my-2 shadow-inner">
              {languageStats.map((stat) => (
                <div
                  key={stat.id}
                  style={{
                    width: `${Math.max(stat.percentage, 3)}%`,
                    backgroundColor: stat.color,
                  }}
                  className="h-full transition-all duration-300"
                  title={`${stat.name}: ${stat.percentage}% (${stat.lines} lignes)`}
                />
              ))}
            </div>

            {/* Language details list */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {languageStats.map((stat) => (
                <div
                  key={stat.id}
                  className="flex items-center justify-between text-[11px] py-0.5 px-1 rounded hover:bg-[#1a212e] transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-gray-200 truncate font-medium">
                      {stat.name}
                    </span>
                    <span className="text-gray-500 text-[10px]">
                      ({stat.filesCount} {stat.filesCount > 1 ? "fichiers" : "fichier"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-400 font-mono text-[10.5px]">
                      {stat.lines} l.
                    </span>
                    <span
                      className="font-bold text-[10.5px] w-9 text-right font-mono"
                      style={{ color: stat.color }}
                    >
                      {stat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
