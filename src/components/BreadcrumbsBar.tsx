import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Folder,
  FolderOpen,
  FileCode,
  Copy,
  Check,
  Search,
  Plus,
  GitBranch,
  Home,
  FileText,
  Clock,
  Sparkles,
  Layers,
  X
} from "lucide-react";
import { ProjectFile } from "../types";
import { getLanguageInfo } from "../utils/language";
import { FileLanguageIcon } from "./FileLanguageIcon";
import { ProjectStatsSummary } from "./ProjectStatsSummary";

export interface ProjectTabItem {
  id: string;
  name: string;
  language: string;
  hasDirtyFiles?: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  language: string;
  updatedAt: string;
  isPrivate: boolean;
  description: string;
  files: { name: string; content: string }[];
}

interface BreadcrumbsBarProps {
  projectName: string;
  activeFile: ProjectFile | null;
  files: ProjectFile[];
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string) => void;
  onGoHome?: () => void;
  isGitInitialized?: boolean;
  gitBranch?: string;
  recentProjects?: ProjectSummary[];
  onOpenProject?: (project: ProjectSummary) => void;
  cursorPos?: { line: number; col: number };
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onOpenShortcuts?: () => void;
  openProjects?: ProjectTabItem[];
  activeProjectId?: string;
  onSwitchProjectTab?: (projectId: string) => void;
  onCloseProjectTab?: (projectId: string) => void;
  onOpenProjectInTab?: (project: ProjectSummary) => void;
  onCreateNewProjectTab?: (name: string, templateId?: string) => void;
  projectCreationDate?: string;
}

export const BreadcrumbsBar: React.FC<BreadcrumbsBarProps> = ({
  projectName,
  activeFile,
  files,
  onSelectFile,
  onCreateFile,
  onGoHome,
  isGitInitialized = false,
  gitBranch = "main",
  recentProjects = [],
  onOpenProject,
  cursorPos,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  openProjects,
  activeProjectId,
  onSwitchProjectTab,
  onCloseProjectTab,
  onOpenProjectInTab,
  onCreateNewProjectTab,
  projectCreationDate,
}) => {
  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<"project" | "projectTabs" | "folder" | "file" | "quickSwitch" | null>(null);
  const [folderDropdownIndex, setFolderDropdownIndex] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedPath, setCopiedPath] = useState(false);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isCreatingProjectInline, setIsCreatingProjectInline] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const barRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setFolderDropdownIndex(null);
        setIsCreatingInline(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setFolderDropdownIndex(null);
        setIsCreatingInline(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (activeDropdown === "file" || activeDropdown === "quickSwitch") {
      setSearchFilter("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [activeDropdown]);

  // Focus new file input
  useEffect(() => {
    if (isCreatingInline) {
      setNewFileName("");
      setTimeout(() => {
        newFileInputRef.current?.focus();
      }, 50);
    }
  }, [isCreatingInline]);

  // Copy full path to clipboard
  const handleCopyPath = () => {
    if (!activeFile) return;
    const fullPath = `${projectName}/${activeFile.name}`;
    navigator.clipboard.writeText(fullPath).then(() => {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    });
  };

  // Submit inline file creation
  const handleCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFileName.trim();
    if (!trimmed) {
      setIsCreatingInline(false);
      return;
    }
    onCreateFile(trimmed);
    setIsCreatingInline(false);
    setActiveDropdown(null);
  };

  // Decompose active file into path segments
  // e.g. "src/components/Header.tsx" -> ["src", "components"] + "Header.tsx"
  // or "index.js" -> [] + "index.js"
  const fileName = activeFile ? activeFile.name : "";
  const pathParts = fileName ? fileName.split("/") : [];
  const folderSegments = pathParts.length > 1 ? pathParts.slice(0, -1) : [];
  const leafFileName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "";

  const activeLang = activeFile ? getLanguageInfo(activeFile.name) : null;
  const lineCount = activeFile ? activeFile.content.split("\n").length : 0;
  const byteCount = activeFile ? new Blob([activeFile.content]).size : 0;

  // Filtered files for search
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const currentActiveProjectId = activeProjectId || projectName;
  const effectiveCreationDate =
    projectCreationDate ||
    recentProjects.find(
      (p) =>
        p.id === activeProjectId ||
        p.name.toLowerCase() === projectName.toLowerCase()
    )?.updatedAt ||
    "5 months ago";

  const projectTabs: ProjectTabItem[] =
    openProjects && openProjects.length > 0
      ? openProjects
      : [
          {
            id: currentActiveProjectId,
            name: projectName,
            language: activeLang?.id || "text",
            hasDirtyFiles: files.some((f) => f.isDirty),
          },
        ];

  return (
    <div
      ref={barRef}
      className="h-8.5 bg-[#0e1219] border-b border-[#212734] px-3 flex items-center justify-between text-xs select-none z-20 shrink-0 relative"
      aria-label="Fil d'Ariane de navigation du projet"
    >
      {/* Left: History Nav Buttons + Path Breadcrumb */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar">
        {/* Navigation History: Back & Forward */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-[#212734] shrink-0">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            title="Reculer dans l'historique des fichiers"
            className={`p-1 rounded transition flex items-center justify-center ${
              canGoBack
                ? "text-gray-300 hover:text-white hover:bg-[#1a212e] cursor-pointer"
                : "text-gray-600 cursor-not-allowed opacity-40"
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            title="Avancer dans l'historique des fichiers"
            className={`p-1 rounded transition flex items-center justify-center ${
              canGoForward
                ? "text-gray-300 hover:text-white hover:bg-[#1a212e] cursor-pointer"
                : "text-gray-600 cursor-not-allowed opacity-40"
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Project Tabs Manager */}
        <div className="relative shrink-0 flex items-center gap-1 bg-[#0b0e14] p-0.5 rounded-md border border-[#212734]">
          {/* List of open project tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[190px] xs:max-w-[270px] sm:max-w-[360px] md:max-w-[460px]">
            {projectTabs.map((pTab) => {
              const isActive = pTab.id === currentActiveProjectId;
              return (
                <div
                  key={pTab.id}
                  onClick={() => {
                    if (onSwitchProjectTab && !isActive) {
                      onSwitchProjectTab(pTab.id);
                    }
                  }}
                  className={`group flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer shrink-0 border ${
                    isActive
                      ? "bg-[#1d2534] text-white border-[#2f3b4e] shadow-xs"
                      : "text-gray-400 hover:text-gray-200 hover:bg-[#131922] border-transparent"
                  }`}
                  title={`Projet : ${pTab.name}${isActive ? " (Actuel)" : " (Cliquer pour basculer)"}`}
                >
                  <Folder
                    className={`w-3 h-3 shrink-0 ${
                      isActive ? "text-[#f26207]" : "text-gray-500 group-hover:text-gray-300"
                    }`}
                  />
                  <span className="truncate max-w-[75px] sm:max-w-[110px]">{pTab.name}</span>
                  {pTab.hasDirtyFiles && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#f26207] shrink-0"
                      title="Modifications non enregistrées dans ce projet"
                    />
                  )}

                  {/* Close project tab button if more than 1 tab open */}
                  {projectTabs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCloseProjectTab) {
                          onCloseProjectTab(pTab.id);
                        }
                      }}
                      title={`Fermer l'onglet du projet '${pTab.name}'`}
                      className="opacity-0 group-hover:opacity-100 hover:bg-[#2b3548] hover:text-red-400 rounded p-0.5 transition ml-0.5 text-gray-400"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add / Manage Projects Button (+) */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setActiveDropdown(activeDropdown === "projectTabs" ? null : "projectTabs");
                setFolderDropdownIndex(null);
              }}
              title="Ouvrir un autre projet en onglet ou en créer un nouveau"
              className={`p-1 rounded transition flex items-center justify-center cursor-pointer ${
                activeDropdown === "projectTabs"
                  ? "bg-[#1f2838] text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#161c27]"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu to open projects in tabs or create new */}
            {activeDropdown === "projectTabs" && (
              <div className="absolute left-0 top-full mt-1.5 w-68 bg-[#141923] border border-[#273040] rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-[#212734] flex items-center justify-between">
                  <span>Gestionnaire d'onglets</span>
                  <span className="text-[#f26207] lowercase font-normal">
                    {projectTabs.length} {projectTabs.length > 1 ? "onglets ouverts" : "onglet ouvert"}
                  </span>
                </div>

                {/* Available projects to open */}
                {recentProjects && recentProjects.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] text-gray-400 font-semibold">
                      Ouvrir un projet en onglet
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {recentProjects.map((p) => {
                        const isOpen = projectTabs.some(
                          (t) => t.id === p.id || t.name.toLowerCase() === p.name.toLowerCase()
                        );
                        const isCurrent = p.name === projectName;

                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (isOpen && onSwitchProjectTab) {
                                onSwitchProjectTab(p.id);
                              } else if (onOpenProjectInTab) {
                                onOpenProjectInTab(p);
                              } else if (onOpenProject) {
                                onOpenProject(p);
                              }
                              setActiveDropdown(null);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition ${
                              isCurrent
                                ? "bg-[#1f283a] text-white font-medium"
                                : "text-gray-300 hover:bg-[#1a212e] hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Folder className="w-3.5 h-3.5 text-[#f26207] shrink-0" />
                              <span className="truncate">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 text-[10px] text-gray-400">
                              {isOpen ? (
                                <span className="text-[#238636] font-medium bg-[#238636]/10 px-1 py-0.2 rounded">
                                  Actif
                                </span>
                              ) : (
                                <span>{p.updatedAt}</span>
                              )}
                              {isCurrent && <Check className="w-3 h-3 text-[#f26207]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t border-[#212734] my-1" />

                {/* Inline project creation or action */}
                {onCreateNewProjectTab && (
                  <div className="px-2 py-1">
                    {isCreatingProjectInline ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (newProjectName.trim()) {
                            onCreateNewProjectTab(newProjectName.trim());
                            setNewProjectName("");
                            setIsCreatingProjectInline(false);
                            setActiveDropdown(null);
                          }
                        }}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="text"
                          placeholder="Nom du projet..."
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          autoFocus
                          className="w-full bg-[#1b2230] text-gray-100 text-xs px-2 py-1 rounded border border-[#f26207] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-[#f26207] hover:bg-[#e05603] text-white text-[11px] rounded shrink-0 font-medium"
                        >
                          Créer
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsCreatingProjectInline(true)}
                        className="w-full px-2 py-1 text-left text-xs text-[#f26207] hover:bg-[#1a212e] rounded flex items-center gap-1.5 transition font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Créer un nouveau projet en onglet...</span>
                      </button>
                    )}
                  </div>
                )}

                {/* New File action */}
                <button
                  onClick={() => {
                    setActiveDropdown(null);
                    setIsCreatingInline(true);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:text-white hover:bg-[#1a212e] flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-[#238636]" />
                  <span>Nouveau fichier dans {projectName}...</span>
                </button>

                {onGoHome && (
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      onGoHome();
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:text-white hover:bg-[#1a212e] flex items-center gap-2 border-t border-[#212734]/50"
                  >
                    <Home className="w-3.5 h-3.5 text-blue-400" />
                    <span>Retourner à l'accueil Replit</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Project Statistics Summary (Creation Date, Total LOC, Language Distribution) */}
        <ProjectStatsSummary
          projectName={projectName}
          creationDate={effectiveCreationDate}
          files={files}
          className="shrink-0"
        />

        {/* Separator */}
        <ChevronRight className="w-3.5 h-3.5 text-[#484f58] shrink-0" />

        {/* 2. Intermediate Folder Segments (if file has subpaths like src/components/...) */}
        {folderSegments.map((segment, idx) => {
          const currentSubpath = folderSegments.slice(0, idx + 1).join("/");
          const isFolderDropdownOpen =
            activeDropdown === "folder" && folderDropdownIndex === idx;

          // Files in this folder
          const filesInThisFolder = files.filter(
            (f) =>
              f.name.startsWith(currentSubpath + "/") &&
              !f.name.slice(currentSubpath.length + 1).includes("/")
          );

          return (
            <React.Fragment key={currentSubpath}>
              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    if (isFolderDropdownOpen) {
                      setActiveDropdown(null);
                      setFolderDropdownIndex(null);
                    } else {
                      setActiveDropdown("folder");
                      setFolderDropdownIndex(idx);
                    }
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11.5px] transition ${
                    isFolderDropdownOpen
                      ? "bg-[#1f2838] text-white"
                      : "text-gray-300 hover:text-white hover:bg-[#161c27]"
                  }`}
                  title={`Dossier : ${segment}`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400/90" />
                  <span>{segment}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400 opacity-60" />
                </button>

                {/* Folder Submenu */}
                {isFolderDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-[#141923] border border-[#273040] rounded-lg shadow-2xl py-1 z-50">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 border-b border-[#212734]">
                      {currentSubpath}
                    </div>
                    {filesInThisFolder.length > 0 ? (
                      filesInThisFolder.map((f) => {
                        const isCurrent = activeFile?.id === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              onSelectFile(f.id);
                              setActiveDropdown(null);
                              setFolderDropdownIndex(null);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition ${
                              isCurrent
                                ? "bg-[#1f283a] text-white font-medium"
                                : "text-gray-300 hover:bg-[#1a212e] hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileLanguageIcon fileName={f.name} className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{f.name.split("/").pop()}</span>
                            </div>
                            {isCurrent && <Check className="w-3 h-3 text-[#f26207]" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        Aucun autre fichier dans ce dossier
                      </div>
                    )}
                  </div>
                )}
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#484f58] shrink-0" />
            </React.Fragment>
          );
        })}

        {/* 3. Active File Segment with Dropdown Selector */}
        {activeFile ? (
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setActiveDropdown(activeDropdown === "file" ? null : "file");
                setFolderDropdownIndex(null);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11.5px] transition group ${
                activeDropdown === "file"
                  ? "bg-[#1f2838] text-white"
                  : "text-gray-100 hover:text-white hover:bg-[#161c27]"
              }`}
              title="Cliquer pour naviguer entre les fichiers ou rechercher rapidement"
            >
              <FileLanguageIcon fileName={activeFile.name} className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-white truncate max-w-[200px] sm:max-w-[320px]">
                {leafFileName}
              </span>
              {activeFile.isDirty && (
                <span
                  title="Modifications non enregistrées"
                  className="w-1.5 h-1.5 rounded-full bg-[#f26207] shrink-0"
                />
              )}
              <ChevronDown className="w-3 h-3 text-gray-400 opacity-60 group-hover:opacity-100" />
            </button>

            {/* Quick File Switcher Dropdown */}
            {activeDropdown === "file" && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-[#141923] border border-[#273040] rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Search Bar inside dropdown */}
                <div className="px-2 pb-1.5 border-b border-[#212734]">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Filtrer les fichiers..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-[#1b2230] text-gray-100 text-xs pl-7 pr-2 py-1 rounded border border-[#2c3749] focus:outline-none focus:border-[#f26207]"
                    />
                  </div>
                </div>

                {/* File list */}
                <div className="max-h-60 overflow-y-auto py-1">
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map((file) => {
                      const isCurrent = file.id === activeFile.id;
                      const fLines = file.content.split("\n").length;

                      return (
                        <button
                          key={file.id}
                          onClick={() => {
                            onSelectFile(file.id);
                            setActiveDropdown(null);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition ${
                            isCurrent
                              ? "bg-[#1f283a] text-white font-medium"
                              : "text-gray-300 hover:bg-[#1a212e] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileLanguageIcon fileName={file.name} className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{file.name}</span>
                            {file.isDirty && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#f26207] shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-gray-400">
                            <span>{fLines} l.</span>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-[#f26207]" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-center text-xs text-gray-400">
                      Aucun fichier trouvé pour "{searchFilter}"
                    </div>
                  )}
                </div>

                {/* Footer action: Add file */}
                <div className="border-t border-[#212734] pt-1 px-2">
                  <button
                    onClick={() => {
                      setActiveDropdown(null);
                      setIsCreatingInline(true);
                    }}
                    className="w-full px-2 py-1 text-xs text-[#f26207] hover:bg-[#1a212e] rounded flex items-center justify-center gap-1.5 transition font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer un nouveau fichier...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-500 italic text-[11px]">Aucun fichier ouvert</span>
        )}

        {/* Inline new file creation input if triggered */}
        {isCreatingInline && (
          <form onSubmit={handleCreateSubmit} className="flex items-center gap-1 shrink-0">
            <span className="text-[#484f58] text-xs">/</span>
            <input
              ref={newFileInputRef}
              type="text"
              placeholder="nom_du_fichier.ext"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => {
                if (!newFileName.trim()) setIsCreatingInline(false);
              }}
              className="bg-[#1b2230] text-white text-xs px-2 py-0.5 rounded border border-[#f26207] focus:outline-none w-36"
            />
            <button
              type="submit"
              className="px-1.5 py-0.5 bg-[#f26207] hover:bg-[#e05603] text-white text-[11px] rounded"
            >
              OK
            </button>
          </form>
        )}
      </div>

      {/* Right side: Path details, Git branch, Cursor position, and Copy path button */}
      <div className="flex items-center gap-2.5 shrink-0 text-gray-400 text-[11px] pl-2">
        {/* Cursor Position & Stats (if file is active) */}
        {activeFile && (
          <div className="hidden sm:flex items-center gap-2 text-gray-400 border-r border-[#212734] pr-2.5">
            {cursorPos && (
              <span className="text-gray-300 font-mono text-[10.5px]">
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
            )}
            <span className="text-gray-400 text-[10px]">
              {lineCount} {lineCount > 1 ? "lignes" : "ligne"}
            </span>
            <span className="text-gray-400 text-[10px]">
              {byteCount > 1024 ? `${(byteCount / 1024).toFixed(1)} KB` : `${byteCount} o`}
            </span>
            {activeLang && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/5"
                style={{
                  backgroundColor: `${activeLang.color}20`,
                  color: activeLang.color,
                }}
              >
                <FileLanguageIcon fileName={activeFile.name} className="w-2.5 h-2.5 shrink-0" />
                <span>{activeLang.name}</span>
              </span>
            )}
          </div>
        )}

        {/* Git Branch Badge */}
        {isGitInitialized && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#161d28] text-gray-300 text-[10.5px] border border-[#232c3d]"
            title={`Branche Git active : ${gitBranch}`}
          >
            <GitBranch className="w-3 h-3 text-[#f26207]" />
            <span className="font-mono text-[10px]">{gitBranch}</span>
          </div>
        )}

        {/* Copy Path Button */}
        {activeFile && (
          <button
            onClick={handleCopyPath}
            title={`Copier le chemin relatif : ${projectName}/${activeFile.name}`}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#1a212e] hover:text-gray-200 transition text-[11px] border border-transparent hover:border-[#273040]"
          >
            {copiedPath ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 text-[10px] font-medium">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-gray-400" />
                <span className="hidden md:inline text-[10px]">Copier chemin</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
