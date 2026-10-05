import React, { useState, useEffect, useMemo } from "react";
import {
  FileCode,
  FilePlus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Search,
  MoreVertical,
  GitCommit,
  Copy,
  Clock,
  RotateCcw
} from "lucide-react";
import { ProjectFile } from "../types";
import { getLanguageInfo } from "../utils/language";
import { FileLanguageIcon } from "./FileLanguageIcon";

export type GitFileStatus = "modified" | "created" | "deleted" | "unmodified";

export interface DeletedGitFile {
  name: string;
  originalContent: string;
}

interface FileTreeProps {
  files: ProjectFile[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onViewBlame?: (fileId: string) => void;
  gitStatusMap?: Record<string, GitFileStatus>;
  deletedGitFiles?: DeletedGitFile[];
  onRestoreDeletedFile?: (file: DeletedGitFile) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onViewBlame,
  gitStatusMap = {},
  deletedGitFiles = [],
  onRestoreDeletedFile,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    fileId: string;
  } | null>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener("click", handleClose);
    window.addEventListener("contextmenu", handleClose);
    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("contextmenu", handleClose);
    };
  }, []);

  const handleCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFileName.trim();
    if (!trimmed) {
      setIsCreating(false);
      return;
    }

    if (files.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("Un fichier portant ce nom existe déjà.");
      return;
    }

    onCreateFile(trimmed);
    setNewFileName("");
    setIsCreating(false);
  };

  const handleRenameSubmit = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed && !files.some((f) => f.id !== id && f.name.toLowerCase() === trimmed.toLowerCase())) {
      onRenameFile(id, trimmed);
    }
    setEditingId(null);
  };

  const handleContextMenuOpen = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      fileId,
    });
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const contextFile = files.find((f) => f.id === contextMenu?.fileId);

  // Calculate Git counts
  const { modifiedCount, createdCount, deletedCount } = useMemo(() => {
    let m = 0;
    let c = 0;
    files.forEach((file) => {
      const status = gitStatusMap[file.id] || (file.isDirty ? "modified" : "unmodified");
      if (status === "modified") m++;
      if (status === "created") c++;
    });
    return {
      modifiedCount: m,
      createdCount: c,
      deletedCount: deletedGitFiles.length,
    };
  }, [files, gitStatusMap, deletedGitFiles]);

  return (
    <div className="w-56 bg-[#0f141c] border-r border-[#262c36] flex flex-col h-full select-none shrink-0 relative">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#262c36] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Fichiers
        </span>
        <button
          onClick={() => {
            setIsCreating(true);
            setNewFileName("");
          }}
          title="Nouveau fichier"
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1f2736] transition cursor-pointer"
        >
          <FilePlus className="w-3.5 h-3.5 text-[#f26207]" />
        </button>
      </div>

      {/* Git Status Indicator Summary Bar */}
      {(modifiedCount > 0 || createdCount > 0 || deletedCount > 0) && (
        <div className="px-3 py-1 bg-[#0b0e14] border-b border-[#212734] flex items-center justify-between text-[10px]">
          <span className="text-gray-400 font-medium">Git :</span>
          <div className="flex items-center gap-2 font-mono">
            {modifiedCount > 0 && (
              <span
                className="flex items-center gap-1 text-[#e3b341] font-bold"
                title={`${modifiedCount} fichier(s) modifié(s)`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#d29922]" />
                {modifiedCount} M
              </span>
            )}
            {createdCount > 0 && (
              <span
                className="flex items-center gap-1 text-[#3fb950] font-bold"
                title={`${createdCount} fichier(s) créé(s)`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                {createdCount} U
              </span>
            )}
            {deletedCount > 0 && (
              <span
                className="flex items-center gap-1 text-[#f85149] font-bold"
                title={`${deletedCount} fichier(s) supprimé(s)`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#f85149]" />
                {deletedCount} D
              </span>
            )}
          </div>
        </div>
      )}

      {/* Optional Search if more than 3 files */}
      {files.length > 3 && (
        <div className="px-2 pt-2 pb-1">
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-gray-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161c26] text-xs text-gray-200 pl-6 pr-2 py-1 rounded border border-[#262f3e] focus:outline-none focus:border-[#f26207]"
            />
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
        {/* Creating new file inline */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-[#18202d] rounded border border-[#f26207]"
          >
            <FileText className="w-3.5 h-3.5 text-[#f26207] shrink-0" />
            <input
              type="text"
              placeholder="ex: script.py, style.css"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => handleCreateSubmit()}
              onKeyDown={(e) => e.key === "Escape" && setIsCreating(false)}
              autoFocus
              className="w-full bg-transparent text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="text-green-400 hover:text-green-300"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        )}

        {filteredFiles.map((file) => {
          const lang = getLanguageInfo(file.name);
          const isActive = file.id === activeFileId;
          const isEditing = file.id === editingId;
          const gitStatus = gitStatusMap[file.id] || (file.isDirty ? "modified" : "unmodified");

          const isModified = gitStatus === "modified";
          const isCreated = gitStatus === "created";

          // Visual text color based on Git status:
          // modified -> yellow (#e3b341)
          // created -> green (#3fb950)
          // unmodified -> standard gray/white
          const textColorClass = isModified
            ? isActive
              ? "text-[#f3cd65] font-semibold"
              : "text-[#e3b341] hover:text-[#f3cd65]"
            : isCreated
            ? isActive
              ? "text-[#56d364] font-semibold"
              : "text-[#3fb950] hover:text-[#56d364]"
            : isActive
            ? "text-white font-medium"
            : "text-gray-300 hover:text-gray-100";

          const activeBorderColor = isModified
            ? "border-[#d29922]"
            : isCreated
            ? "border-[#3fb950]"
            : "border-[#f26207]";

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              onContextMenu={(e) => handleContextMenuOpen(e, file.id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition ${
                isActive
                  ? `bg-[#1c2433] border-l-2 ${activeBorderColor}`
                  : "hover:bg-[#151b24]"
              } ${textColorClass}`}
              title={`${file.name}${isModified ? " • Fichier modifié (Git: M)" : isCreated ? " • Fichier créé (Git: U)" : ""}`}
            >
              {/* File Icon & Name */}
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <FileLanguageIcon fileName={file.name} className="w-4 h-4 shrink-0" />

                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameSubmit(file.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(file.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-[#12161f] text-white text-xs px-1 py-0.5 rounded border border-[#f26207] focus:outline-none"
                  />
                ) : (
                  <span className="truncate">{file.name}</span>
                )}

                {/* Git Status Dot */}
                {isModified && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#d29922] shrink-0"
                    title="Modifié par rapport à Git"
                  />
                )}
                {isCreated && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#3fb950] shrink-0"
                    title="Créé / Non indexé par rapport à Git"
                  />
                )}
              </div>

              {/* Status Badge + Action buttons */}
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {/* Git Badge: M for Modified (Yellow), U for Created (Green) */}
                {isModified && (
                  <span
                    className="px-1 py-0.2 text-[9px] font-bold font-mono rounded bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/35 shrink-0"
                    title="Modifié par rapport au dépôt Git"
                  >
                    M
                  </span>
                )}
                {isCreated && (
                  <span
                    className="px-1 py-0.2 text-[9px] font-bold font-mono rounded bg-[#2ea043]/20 text-[#3fb950] border border-[#2ea043]/35 shrink-0"
                    title="Créé par rapport au dépôt Git (Untracked)"
                  >
                    U
                  </span>
                )}

                {/* Action buttons (Rename, Context Menu) - Shown on hover */}
                {!isEditing && (
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-0.5">
                    <button
                      onClick={(e) => handleContextMenuOpen(e, file.id)}
                      title="Options du fichier (Blame, renommer...)"
                      className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#283244] transition"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Deleted Git Files (Red with strikethrough & restore button) */}
        {deletedGitFiles && deletedGitFiles.length > 0 && (
          <div className="pt-2 mt-2 border-t border-[#202735]">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#f85149]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f85149]" />
                Supprimés ({deletedGitFiles.length})
              </span>
            </div>

            {deletedGitFiles.map((dFile) => (
              <div
                key={`del-${dFile.name}`}
                className="group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition bg-[#1b1215]/50 hover:bg-[#25151a] border border-transparent hover:border-[#da3633]/30"
                title={`Fichier supprimé par rapport au dépôt Git : ${dFile.name}`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <FileLanguageIcon fileName={dFile.name} className="w-4 h-4 shrink-0 opacity-50" />
                  <span className="truncate text-[#f85149] line-through opacity-85 text-[11.5px] font-mono">
                    {dFile.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <span
                    className="px-1 py-0.2 text-[9px] font-bold font-mono rounded bg-[#da3633]/25 text-[#f85149] border border-[#da3633]/40 shrink-0"
                    title="Supprimé par rapport à Git"
                  >
                    D
                  </span>

                  {onRestoreDeletedFile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreDeletedFile(dFile);
                      }}
                      title={`Restaurer '${dFile.name}' depuis Git`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-white hover:bg-[#341d24] transition ml-1"
                    >
                      <RotateCcw className="w-3 h-3 text-[#f85149]" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu Popup */}
      {contextMenu && contextFile && (
        <div
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 150),
            left: Math.min(contextMenu.x, window.innerWidth - 180),
          }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-48 bg-[#18202d] border border-[#2b3548] rounded-xl shadow-2xl p-1 text-xs text-gray-200 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1.5 text-[10px] text-gray-400 font-bold border-b border-[#252f40] truncate">
            {contextFile.name}
          </div>

          <button
            onClick={() => {
              onSelectFile(contextFile.id);
              if (onViewBlame) onViewBlame(contextFile.id);
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-900/40 text-blue-300 hover:text-blue-200 flex items-center gap-2 transition"
          >
            <GitCommit className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">Voir Blame (Git)</span>
          </button>

          <button
            onClick={() => {
              setEditingId(contextFile.id);
              setEditingName(contextFile.name);
              setContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#222a3a] text-gray-300 hover:text-white flex items-center gap-2 transition"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
            <span>Renommer</span>
          </button>

          {files.length > 1 && (
            <button
              onClick={() => {
                if (confirm(`Supprimer définitivement ${contextFile.name} ?`)) {
                  onDeleteFile(contextFile.id);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300 flex items-center gap-2 transition border-t border-[#252f40] mt-0.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Supprimer</span>
            </button>
          )}
        </div>
      )}

      {/* Project Footnote */}
      <div className="px-3 py-2 border-t border-[#262c36] text-[10px] text-gray-500 flex items-center justify-between">
        <span>{files.length} fichier{files.length > 1 ? "s" : ""}</span>
        <span className="text-[#f26207] font-semibold">RepliLite v1.0</span>
      </div>
    </div>
  );
};
