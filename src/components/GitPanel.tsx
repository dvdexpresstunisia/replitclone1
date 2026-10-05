import React, { useState } from "react";
import {
  GitBranch,
  GitCommit as GitCommitIcon,
  Check,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  FileCode,
  Clock,
  ChevronRight,
  ChevronDown,
  Layers,
  AlertCircle,
  Eye,
  X,
  GitCompare,
  ArrowRight
} from "lucide-react";
import { ProjectFile } from "../types";
import { DiffViewer } from "./DiffViewer";

export interface GitCommit {
  id: string;
  hash: string;
  message: string;
  timestamp: string;
  author: string;
  files: { name: string; content: string }[];
}

interface GitPanelProps {
  files: ProjectFile[];
  isInitialized: boolean;
  onInitRepo: () => void;
  branch: string;
  onChangeBranch: (branch: string) => void;
  commits: GitCommit[];
  onCommit: (message: string) => void;
  onCheckoutCommit: (commit: GitCommit) => void;
  onGenerateAICommitMessage: () => Promise<string>;
  stagedFileIds: string[];
  onToggleStageFile: (fileId: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  files,
  isInitialized,
  onInitRepo,
  branch,
  commits,
  onCommit,
  onCheckoutCommit,
  onGenerateAICommitMessage,
  stagedFileIds,
  onToggleStageFile,
  onStageAll,
  onUnstageAll,
}) => {
  const [commitMessage, setCommitMessage] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<GitCommit | null>(null);
  const [diffFile, setDiffFile] = useState<ProjectFile | null>(null);

  // Diff viewer state
  const [diffModalData, setDiffModalData] = useState<{
    fileName: string;
    oldContent: string;
    newContent: string;
    commitHash: string;
    commitMessage: string;
    allFilesInCommit: { name: string; content: string }[];
  } | null>(null);

  // Files modified (dirty) or untracked
  const modifiedFiles = files.filter((f) => f.isDirty || stagedFileIds.includes(f.id));
  const stagedFiles = files.filter((f) => stagedFileIds.includes(f.id));
  const unstagedFiles = files.filter((f) => !stagedFileIds.includes(f.id) && f.isDirty);

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = commitMessage.trim();
    if (!msg) return;

    onCommit(msg);
    setCommitMessage("");
  };

  const handleAICommitMessage = async () => {
    setIsGeneratingAI(true);
    try {
      const generated = await onGenerateAICommitMessage();
      if (generated) {
        setCommitMessage(generated);
      }
    } catch (err) {
      console.warn("Could not generate commit message", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Open Diff between commit version and current workspace version
  const handleOpenDiff = (
    fileName: string,
    commitFileContent: string,
    commit: GitCommit
  ) => {
    const currentWorkspaceFile = files.find((f) => f.name === fileName);
    const currentContent = currentWorkspaceFile ? currentWorkspaceFile.content : "";

    setDiffModalData({
      fileName,
      oldContent: commitFileContent,
      newContent: currentContent,
      commitHash: commit.hash,
      commitMessage: commit.message,
      allFilesInCommit: commit.files,
    });
  };

  // Switch diffed file inside the modal
  const handleSwitchDiffFile = (newFileName: string) => {
    if (!diffModalData) return;
    const commitFile = diffModalData.allFilesInCommit.find((f) => f.name === newFileName);
    const oldContent = commitFile ? commitFile.content : "";
    const currentWorkspaceFile = files.find((f) => f.name === newFileName);
    const newContent = currentWorkspaceFile ? currentWorkspaceFile.content : "";

    setDiffModalData({
      ...diffModalData,
      fileName: newFileName,
      oldContent,
      newContent,
    });
  };

  // If repo is not initialized yet
  if (!isInitialized) {
    return (
      <div className="w-64 bg-[#0f141c] border-r border-[#262c36] flex flex-col h-full select-none shrink-0 p-4 text-xs">
        <div className="flex items-center gap-2 text-gray-300 font-bold mb-4 uppercase tracking-wider text-[11px]">
          <GitBranch className="w-4 h-4 text-[#f26207]" />
          <span>Contrôle de version (Git)</span>
        </div>

        <div className="bg-[#151b26] border border-[#273244] rounded-xl p-4 text-center space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#1e2637] text-[#f26207] flex items-center justify-center mx-auto border border-[#2c384e]">
            <GitBranch className="w-5 h-5" />
          </div>

          <div>
            <div className="font-semibold text-gray-200 text-xs">Aucun dépôt Git initialisé</div>
            <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
              Initialisez un dépôt Git pour suivre les modifications, faire des commits et sauvegarder des versions de votre code.
            </p>
          </div>

          <button
            onClick={onInitRepo}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#f26207] to-[#ff7b25] hover:from-[#ff7315] hover:to-[#ff8d3f] text-white font-semibold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <GitCommitIcon className="w-3.5 h-3.5" />
            <span>Initialiser le dépôt (git init)</span>
          </button>
        </div>

        <div className="mt-4 p-3 bg-[#131822] rounded-lg border border-[#222a3a] text-[11px] text-gray-400 space-y-1.5">
          <div className="text-gray-300 font-medium">Commandes terminal équivalentes :</div>
          <code className="text-emerald-400 font-mono block">git init</code>
          <code className="text-emerald-400 font-mono block">git status</code>
          <code className="text-emerald-400 font-mono block">git commit -m "message"</code>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#0f141c] border-r border-[#262c36] flex flex-col h-full select-none shrink-0 text-xs">
      {/* Header with branch badge */}
      <div className="px-3 py-2.5 border-b border-[#262c36] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-4 h-4 text-[#f26207]" />
          <span className="font-bold text-gray-300 tracking-tight text-xs">Source Control</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] bg-[#1a2230] text-gray-300 px-2 py-0.5 rounded border border-[#29354a] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{branch}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {/* Commit Message Box */}
        <form onSubmit={handleCommitSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Message de commit (ex: feat: add math utilities)..."
              rows={2}
              className="w-full bg-[#151c27] text-gray-200 placeholder-gray-500 p-2 rounded-lg border border-[#273244] focus:outline-none focus:border-[#f26207] text-xs resize-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAICommitMessage}
              disabled={isGeneratingAI || (stagedFiles.length === 0 && modifiedFiles.length === 0)}
              title="Générer un message de commit descriptif avec l'IA"
              className="px-2 py-1.5 rounded bg-[#1c2434] hover:bg-[#253046] text-purple-300 border border-purple-800/40 text-[11px] font-medium transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{isGeneratingAI ? "Génération..." : "IA Message"}</span>
            </button>

            <button
              type="submit"
              disabled={!commitMessage.trim() || (stagedFiles.length === 0 && modifiedFiles.length === 0)}
              className="flex-1 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-[11px] transition shadow-xs flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Valider (Commit)</span>
            </button>
          </div>
        </form>

        {/* Changes / Staging Section */}
        <div className="space-y-2">
          {/* Staged Changes Header */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase font-semibold tracking-wider px-1">
            <div className="flex items-center gap-1">
              <span>Staged Changes</span>
              <span className="text-[10px] bg-[#222a3a] text-emerald-400 px-1.5 py-0.2 rounded-full font-bold">
                {stagedFiles.length}
              </span>
            </div>
            {stagedFiles.length > 0 && (
              <button
                type="button"
                onClick={onUnstageAll}
                className="text-gray-400 hover:text-white text-[10px] lowercase"
              >
                unstage all
              </button>
            )}
          </div>

          {/* Staged Files List */}
          {stagedFiles.length > 0 && (
            <div className="space-y-0.5 bg-[#121620] rounded-lg p-1 border border-[#202736]">
              {stagedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-[#1b2230] text-gray-200 group text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                    <span className="text-emerald-400 font-bold text-[10px]">M</span>
                    <span className="truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDiffFile(file)}
                      title="Voir le contenu"
                      className="p-0.5 text-gray-400 hover:text-white"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleStageFile(file.id)}
                      title="Désindexer (unstage)"
                      className="p-0.5 text-gray-400 hover:text-red-400"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unstaged Changes Header */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase font-semibold tracking-wider px-1 pt-1">
            <div className="flex items-center gap-1">
              <span>Modifications</span>
              <span className="text-[10px] bg-[#222a3a] text-amber-400 px-1.5 py-0.2 rounded-full font-bold">
                {unstagedFiles.length}
              </span>
            </div>
            {unstagedFiles.length > 0 && (
              <button
                type="button"
                onClick={onStageAll}
                className="text-[#f26207] hover:text-[#ff822e] text-[10px] lowercase font-semibold"
              >
                stage all
              </button>
            )}
          </div>

          {/* Unstaged Files List */}
          {unstagedFiles.length === 0 && stagedFiles.length === 0 ? (
            <div className="text-[11px] text-gray-500 italic px-2 py-3 text-center bg-[#131722] rounded-lg border border-[#1e2533]">
              L'arbre de travail est propre (aucun fichier modifié).
            </div>
          ) : (
            <div className="space-y-0.5 bg-[#121620] rounded-lg p-1 border border-[#202736]">
              {unstagedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-[#1b2230] text-gray-300 group text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                    <span className="text-amber-400 font-bold text-[10px]">M</span>
                    <span className="truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDiffFile(file)}
                      title="Voir le fichier"
                      className="p-0.5 text-gray-400 hover:text-white"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleStageFile(file.id)}
                      title="Indexer (stage)"
                      className="p-0.5 text-gray-400 hover:text-green-400"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commit History (Git Log) */}
        <div className="pt-2 border-t border-[#222938]">
          <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase font-semibold tracking-wider px-1 mb-2">
            <span>Historique des commits</span>
            <span className="text-[10px] text-gray-500">{commits.length}</span>
          </div>

          {commits.length === 0 ? (
            <div className="text-[11px] text-gray-500 italic px-2 py-2 text-center">
              Aucun commit pour le moment.
            </div>
          ) : (
            <div className="space-y-1.5">
              {commits.map((commit) => (
                <div
                  key={commit.id}
                  onClick={() => setSelectedCommit(commit)}
                  className="p-2 rounded-lg bg-[#141a25] hover:bg-[#1c2434] border border-[#222a38] cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-200 text-xs truncate max-w-[130px] group-hover:text-[#f26207] transition">
                      {commit.message}
                    </span>
                    <span className="font-mono text-[10px] text-[#f26207] bg-[#f26207]/10 px-1 py-0.2 rounded font-bold">
                      {commit.hash}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {commit.timestamp}
                    </span>

                    {/* Prominent "Afficher Diff" Button in commit history view */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (commit.files.length > 0) {
                          handleOpenDiff(commit.files[0].name, commit.files[0].content, commit);
                        }
                      }}
                      title="Comparer visuellement avec la version actuelle"
                      className="px-2 py-0.5 rounded bg-blue-950/70 hover:bg-blue-800 text-blue-300 hover:text-white border border-blue-700/50 flex items-center gap-1 font-semibold text-[10px] transition cursor-pointer shadow-2xs"
                    >
                      <GitCompare className="w-3 h-3 text-blue-400" />
                      <span>Afficher Diff</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Snapshot / Commit detail view modal */}
      {selectedCommit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#141924] border border-[#2c364a] rounded-xl max-w-md w-full p-4 text-xs space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242d3d] pb-2">
              <div className="flex items-center gap-2">
                <GitCommitIcon className="w-4 h-4 text-[#f26207]" />
                <span className="font-bold text-white">Détails du Commit</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedCommit.files.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenDiff(
                        selectedCommit.files[0].name,
                        selectedCommit.files[0].content,
                        selectedCommit
                      );
                    }}
                    className="px-2 py-1 rounded bg-blue-950/80 hover:bg-blue-800 text-blue-300 hover:text-white border border-blue-700/60 flex items-center gap-1 text-[10px] font-semibold transition cursor-pointer"
                  >
                    <GitCompare className="w-3 h-3 text-blue-400" />
                    <span>Afficher Diff</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedCommit(null)}
                  className="text-gray-400 hover:text-white cursor-pointer p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-[#0e121a] p-3 rounded-lg border border-[#212837] space-y-1">
              <div className="font-semibold text-sm text-gray-100">{selectedCommit.message}</div>
              <div className="text-[11px] text-gray-400 flex items-center gap-2">
                <span>Hash : <strong className="text-[#f26207] font-mono">{selectedCommit.hash}</strong></span>
                <span>•</span>
                <span>{selectedCommit.timestamp}</span>
              </div>
            </div>

            <div>
              <div className="text-gray-400 font-semibold mb-1 text-[11px] flex items-center justify-between">
                <span>Fichiers archivés ({selectedCommit.files.length}) :</span>
                <span className="text-[10px] text-gray-500">Cliquez sur « Afficher Diff » pour comparer</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[#0c1017] p-2 rounded-lg border border-[#222938]">
                {selectedCommit.files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-1.5 rounded bg-[#131722] hover:bg-[#1a202e] border border-[#1f2736] text-[11px] text-gray-300 font-mono transition"
                  >
                    <span className="truncate max-w-[170px] text-gray-200">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenDiff(f.name, f.content, selectedCommit)}
                      className="px-2 py-0.8 rounded bg-blue-950/60 hover:bg-blue-800 text-blue-300 hover:text-white border border-blue-700/50 flex items-center gap-1 font-sans text-[10px] font-semibold transition cursor-pointer shadow-xs"
                    >
                      <GitCompare className="w-3 h-3 text-blue-400" />
                      <span>Afficher Diff</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#242d3d]">
              <button
                onClick={() => {
                  onCheckoutCommit(selectedCommit);
                  setSelectedCommit(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-semibold transition cursor-pointer shadow-xs"
              >
                Restaurer cette version
              </button>
              <button
                onClick={() => setSelectedCommit(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#202737] hover:bg-[#2a3449] text-gray-300 hover:text-white transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Git Diff Viewer Modal using DiffViewer component */}
      {diffModalData && (
        <DiffViewer
          fileName={diffModalData.fileName}
          oldContent={diffModalData.oldContent}
          newContent={diffModalData.newContent}
          oldLabel={`Commit ${diffModalData.commitHash}`}
          newLabel="Version actuelle (Working Tree)"
          allFiles={diffModalData.allFilesInCommit}
          onSelectFile={handleSwitchDiffFile}
          onClose={() => setDiffModalData(null)}
          onRestore={() => {
            const target = files.find((f) => f.name === diffModalData.fileName);
            if (target) {
              target.content = diffModalData.oldContent;
              target.isDirty = true;
            }
            setDiffModalData(null);
          }}
        />
      )}

      {/* Raw file preview modal */}
      {diffFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#131822] border border-[#2a3447] rounded-xl max-w-xl w-full p-4 text-xs space-y-3 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-[#242d3d] pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white font-mono">{diffFile.name}</span>
                <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/40">
                  Modifié
                </span>
              </div>
              <button
                onClick={() => setDiffFile(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="flex-1 overflow-auto bg-[#0a0d14] p-3 rounded font-mono text-[11px] text-gray-200 whitespace-pre">
              {diffFile.content}
            </pre>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setDiffFile(null)}
                className="px-4 py-1.5 rounded bg-[#202737] text-gray-200 hover:text-white font-semibold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
