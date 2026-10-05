import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import confetti from "canvas-confetti";
import { FolderTree, GitBranch } from "lucide-react";
import { Header } from "./components/Header";
import { FileTree } from "./components/FileTree";
import { CodeEditor } from "./components/CodeEditor";
import { Terminal } from "./components/Terminal";
import { WebPreview } from "./components/WebPreview";
import { AIPanel } from "./components/AIPanel";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { ReplitHome } from "./components/ReplitHome";
import { GitPanel, GitCommit } from "./components/GitPanel";
import { VoiceConversationModal } from "./components/VoiceConversationModal";
import { BreadcrumbsBar } from "./components/BreadcrumbsBar";
import { useNavigationPersistence, loadPersistedNavigation } from "./hooks/useNavigationPersistence";
import {
  ProjectFile,
  TerminalLine,
  AIMessage,
  AIProvider,
  ProjectTemplate
} from "./types";
import { TEMPLATES } from "./utils/templates";
import { runPythonCode, runJavaScriptCode } from "./utils/runner";
import { lintFile, lintProject, LintProblem } from "./utils/linter";

interface ProjectItem {
  id: string;
  name: string;
  updatedAt: string;
  isPrivate: boolean;
  language: string;
  description: string;
  files: { name: string; content: string }[];
}

export interface OpenProjectSession {
  id: string;
  name: string;
  language: string;
  updatedAt: string;
  files: ProjectFile[];
  activeFileId: string;
  openFileIds: string[];
}

// Initial recent projects matching the user's uploaded screenshot
const INITIAL_RECENT_PROJECTS: ProjectItem[] = [
  {
    id: "trend-finder",
    name: "TrendFinder",
    updatedAt: "5 months ago",
    isPrivate: true,
    language: "python",
    description: "Analyseur de tendances et détection d'opportunités en temps réel.",
    files: [
      {
        name: "trend_scanner.py",
        content: `# TrendFinder - Moteur d'analyse de tendances
import random
import time
import math

trends = [
    {"topic": "AI Agents & Autonomous Coding", "volume": 12850, "growth": "+42%"},
    {"topic": "WebAssembly in Browser", "volume": 9420, "growth": "+68%"},
    {"topic": "Quantum Computing Simulators", "volume": 4120, "growth": "+19%"},
    {"topic": "Local LLM Fine-Tuning", "volume": 18200, "growth": "+85%"},
    {"topic": "Interactive Audio & Live APIs", "volume": 7650, "growth": "+34%"}
]

def scan_trends():
    print("=" * 50)
    print(" 🔍 TrendFinder - Recherche de signaux faibles...")
    print("=" * 50)
    time.sleep(0.5)
    
    print("\\n📊 Top 5 des sujets en forte croissance aujourd'hui :")
    for i, t in enumerate(sorted(trends, key=lambda x: x["volume"], reverse=True), 1):
        print(f"  #{i} {t['topic']:<32} | Volume: {t['volume']:>6} | Croissance: {t['growth']}")
    
    avg_vol = sum(t["volume"] for t in trends) / len(trends)
    print(f"\\n📈 Volume moyen analysé : {avg_vol:.0f} mentions/heure")
    print("✅ Scan de tendances terminé avec succès.")

if __name__ == "__main__":
    scan_trends()
`,
      },
      {
        name: "README.md",
        content: `# TrendFinder

Projet Python d'exploration de tendances et d'agrégation de signaux faibles.
Appuyez sur [Exécuter] pour lancer l'analyse dans le terminal.
`,
      },
    ],
  },
  {
    id: "workflow-genie",
    name: "WorkflowGenie",
    updatedAt: "5 months ago",
    isPrivate: true,
    language: "javascript",
    description: "Générateur et orchestrateur de workflows asynchrones.",
    files: [
      {
        name: "workflow.js",
        content: `// WorkflowGenie - Moteur d'automatisation
console.log("🧞 Initialisation de WorkflowGenie...");

const etapes = [
  { id: 1, nom: "Extraction des données", dureeMs: 200 },
  { id: 2, nom: "Nettoyage & Normalisation", dureeMs: 350 },
  { id: 3, nom: "Enrichissement par IA (Gemini)", dureeMs: 450 },
  { id: 4, nom: "Synchronisation & Notification", dureeMs: 150 }
];

async function executerWorkflow() {
  console.log("\\n🚀 Démarrage du pipeline automatisé :\\n");
  
  for (const etape of etapes) {
    console.log(\`  [En cours] \${etape.nom}...\`);
    await new Promise(r => setTimeout(r, etape.dureeMs));
    console.log(\`  ✓ \${etape.nom} terminé (\${etape.dureeMs}ms)\`);
  }
  
  console.log("\\n🎉 Workflow terminé avec 100% de succès !");
}

executerWorkflow();
`,
      },
      {
        name: "config.json",
        content: `{
  "name": "Daily Automation Pipeline",
  "retryCount": 3,
  "timeoutSeconds": 30
}
`,
      },
      {
        name: "README.md",
        content: `# WorkflowGenie

Orchestrateur de tâches asynchrones en JavaScript.
`,
      },
    ],
  },
  {
    id: "avatar-dual-layer",
    name: "Avatar Dual Layer",
    updatedAt: "5 months ago",
    isPrivate: true,
    language: "html",
    description: "Visualiseur interactif d'avatar en double couche Canvas HTML5.",
    files: [
      {
        name: "index.html",
        content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Avatar Dual Layer</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Dual Layer Webview</span>
      <h1>Avatar Dual Layer</h1>
      <p>Couche faciale & particules réactives interactives</p>
    </div>
    <canvas id="avatarCanvas"></canvas>
    <div class="controls">
      <button id="toggleGlow" class="btn">Changer Aura</button>
      <button id="pulseBtn" class="btn">Pulsation</button>
    </div>
  </div>
  <script src="avatar.js"></script>
</body>
</html>
`,
      },
      {
        name: "style.css",
        content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: radial-gradient(circle at 50% 30%, #1a1e2e, #0a0c14);
  color: #fff;
  font-family: system-ui, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.card {
  background: rgba(20, 25, 40, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
}
.badge {
  display: inline-block;
  background: #f26207;
  font-size: 11px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
canvas {
  width: 100%;
  height: 240px;
  background: #07090f;
  border-radius: 12px;
  margin: 16px 0;
  display: block;
}
.controls { display: flex; gap: 10px; justify-content: center; }
.btn {
  background: #f26207;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn:hover { opacity: 0.9; }
`,
      },
      {
        name: "avatar.js",
        content: `const canvas = document.getElementById("avatarCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 240;

let time = 0;
let glowHue = 25;

function draw() {
  ctx.fillStyle = "rgba(7, 9, 15, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  
  // Outer layer
  ctx.save();
  ctx.strokeStyle = \`hsl(\${glowHue}, 100%, 55%)\`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 60 + Math.sin(time) * 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner core
  ctx.save();
  ctx.fillStyle = \`hsl(\${glowHue + 40}, 100%, 65%)\`;
  ctx.beginPath();
  ctx.arc(cx, cy, 35 + Math.cos(time * 1.5) * 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  time += 0.04;
  requestAnimationFrame(draw);
}

document.getElementById("toggleGlow").onclick = () => {
  glowHue = (glowHue + 60) % 360;
};

draw();
`,
      },
    ],
  },
  {
    id: "dual-lip-sync",
    name: "Dual Lip Sync",
    updatedAt: "5 months ago",
    isPrivate: true,
    language: "python",
    description: "Alignement phonétique et synchronisation labiale double canal.",
    files: [
      {
        name: "lip_sync.py",
        content: `# Dual Lip Sync Engine
print("🎤 Chargement du module Dual Lip Sync...")
phonemes = ["AA", "B", "CH", "D", "EE", "F", "L", "M", "OH", "P", "R", "S", "TH"]
print(f"Phonèmes supportés: {len(phonemes)}")
print("✓ Modèle acoustique synchronisé.")
`,
      },
    ],
  },
  {
    id: "avatar-sync-layer",
    name: "Avatar Sync Layer",
    updatedAt: "5 months ago",
    isPrivate: true,
    language: "python",
    description: "Couche de synchronisation pour avatars virtuels 3D.",
    files: [
      {
        name: "sync.py",
        content: `# Avatar Sync Layer
print("✨ Synchronisation des couches d'animation...")
`,
      },
    ],
  },
  {
    id: "beyond-presence",
    name: "Beyond Presence",
    updatedAt: "5 months ago",
    isPrivate: true,
    language: "javascript",
    description: "Détection de présence temps réel multi-utilisateurs.",
    files: [
      {
        name: "presence.js",
        content: `console.log("🛰️ Beyond Presence Service connecté.");`,
      },
    ],
  },
];

export default function App() {
  // Load persisted navigation state from localStorage if available
  const restoredNav = useRef(loadPersistedNavigation()).current;

  const initialFiles: ProjectFile[] = useMemo(() => {
    if (restoredNav?.files && restoredNav.files.length > 0) {
      return restoredNav.files.map((f, i) => ({
        id: f.id || `file-${i}-${Date.now()}`,
        name: f.name,
        content: f.content,
        language:
          f.language ||
          (f.name.endsWith(".py")
            ? "python"
            : f.name.endsWith(".js")
            ? "javascript"
            : f.name.endsWith(".html")
            ? "html"
            : f.name.endsWith(".css")
            ? "css"
            : "markdown"),
        isDirty: Boolean(f.isDirty),
      }));
    }
    return INITIAL_RECENT_PROJECTS[0].files.map((f, i) => ({
      id: `file-${i}-${Date.now()}`,
      name: f.name,
      content: f.content,
      language: f.name.endsWith(".py")
        ? "python"
        : f.name.endsWith(".js")
        ? "javascript"
        : f.name.endsWith(".html")
        ? "html"
        : f.name.endsWith(".css")
        ? "css"
        : "markdown",
      isDirty: false,
    }));
  }, [restoredNav]);

  const initialActiveFileId = useMemo(() => {
    if (restoredNav?.activeFileName) {
      const match = initialFiles.find((f) => f.name === restoredNav.activeFileName);
      if (match) return match.id;
    }
    return initialFiles[0]?.id || "";
  }, [restoredNav, initialFiles]);

  const initialOpenFileIds = useMemo(() => {
    if (restoredNav?.openFileNames && restoredNav.openFileNames.length > 0) {
      const matched = initialFiles
        .filter((f) => restoredNav.openFileNames.includes(f.name))
        .map((f) => f.id);
      if (matched.length > 0) return matched;
    }
    return initialFiles.map((f) => f.id);
  }, [restoredNav, initialFiles]);

  const initialFileHistory = useMemo(() => {
    if (restoredNav?.fileHistoryNames && restoredNav.fileHistoryNames.length > 0) {
      const matched = restoredNav.fileHistoryNames
        .map((name) => initialFiles.find((f) => f.name === name)?.id)
        .filter(Boolean) as string[];
      if (matched.length > 0) return matched;
    }
    return initialActiveFileId ? [initialActiveFileId] : [];
  }, [restoredNav, initialFiles, initialActiveFileId]);

  // Navigation view: 'home' (matching user's screenshot) or 'ide' (code editor & terminal)
  const [currentView, setCurrentView] = useState<"home" | "ide">(
    () => restoredNav?.currentView ?? "home"
  );
  const [userName, setUserName] = useState<string>("maestro");
  const [recentProjects, setRecentProjects] = useState<ProjectItem[]>(INITIAL_RECENT_PROJECTS);

  // Multi-project Tabs state
  const initialOpenProjects: OpenProjectSession[] = useMemo(() => {
    if (restoredNav?.openProjects && restoredNav.openProjects.length > 0) {
      return restoredNav.openProjects.map((p) => ({
        id: p.id,
        name: p.name,
        language: p.language || "text",
        updatedAt: p.updatedAt || "session restaurée",
        files: p.files.map((f, i) => ({
          id: f.id || `file-${p.id}-${i}`,
          name: f.name,
          content: f.content,
          language: f.language || "text",
          isDirty: Boolean(f.isDirty),
        })),
        activeFileId: p.activeFileId || p.files[0]?.id || "",
        openFileIds: p.openFileIds || p.files.map((f) => f.id),
      }));
    }
    return [
      {
        id: "trend-finder",
        name: "TrendFinder",
        language: "python",
        updatedAt: "5 months ago",
        files: initialFiles,
        activeFileId: initialActiveFileId,
        openFileIds: initialOpenFileIds,
      },
      {
        id: "workflow-genie",
        name: "WorkflowGenie",
        language: "javascript",
        updatedAt: "5 months ago",
        files: INITIAL_RECENT_PROJECTS[1].files.map((f, i) => ({
          id: `file-wf-${i}-${Date.now()}`,
          name: f.name,
          content: f.content,
          language: f.name.endsWith(".js") ? "javascript" : "text",
          isDirty: false,
        })),
        activeFileId: "",
        openFileIds: [],
      },
    ];
  }, [restoredNav, initialFiles, initialActiveFileId, initialOpenFileIds]);

  const [activeProjectId, setActiveProjectId] = useState<string>(
    () => restoredNav?.activeProjectId || initialOpenProjects[0]?.id || "trend-finder"
  );
  const [openProjects, setOpenProjects] = useState<OpenProjectSession[]>(initialOpenProjects);

  // Active Project state
  const [projectName, setProjectName] = useState<string>(
    () => restoredNav?.projectName ?? "TrendFinder"
  );
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string>(initialActiveFileId);
  const [openFileIds, setOpenFileIds] = useState<string[]>(initialOpenFileIds);
  const [fileHistory, setFileHistory] = useState<string[]>(initialFileHistory);
  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    if (restoredNav && typeof restoredNav.historyIndex === "number") {
      return Math.max(
        0,
        Math.min(restoredNav.historyIndex, initialFileHistory.length - 1)
      );
    }
    return 0;
  });
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>(() => {
    return restoredNav?.cursorPos ?? { line: 1, col: 1 };
  });

  // Keep active project session updated in openProjects list
  useEffect(() => {
    setOpenProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              name: projectName,
              files,
              activeFileId,
              openFileIds,
            }
          : p
      )
    );
  }, [files, activeFileId, openFileIds, projectName, activeProjectId]);

  // Layout toggles
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showTerminal, setShowTerminal] = useState<boolean>(true);
  const [showWebview, setShowWebview] = useState<boolean>(() => {
    return initialFiles.some((f) => f.name.endsWith(".html"));
  });
  const [showAIPanel, setShowAIPanel] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [webviewRefreshKey, setWebviewRefreshKey] = useState<number>(1);

  // Hook to persist the open project and active file breadcrumb path in localStorage
  useNavigationPersistence({
    currentView,
    projectName,
    activeProjectId,
    openProjects,
    files,
    activeFileId,
    openFileIds,
    fileHistory,
    historyIndex,
    cursorPos,
  });

  // Terminal state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(() => {
    const defaultLines: TerminalLine[] = [
      {
        id: "init-1",
        type: "system",
        text: "⚡ RepliLite Web IDE v1.0 [Moteur Python 3 WebAssembly & JS]",
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: "init-2",
        type: "info",
        text: "💡 Cliquez sur [Exécuter] ou appuyez sur Ctrl+Entrée pour lancer le script.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ];

    if (restoredNav && restoredNav.currentView === "ide") {
      defaultLines.push({
        id: "init-restore",
        type: "system",
        text: `🔄 Fil d'Ariane & session restaurés : [${restoredNav.projectName}] > ${restoredNav.activeFileName || "fichier actif"}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    return defaultLines;
  });
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Git / Version Control state
  const [activeSidebarTab, setActiveSidebarTab] = useState<"files" | "git">("files");
  const [isGitInitialized, setIsGitInitialized] = useState<boolean>(true);
  const [gitBranch, setGitBranch] = useState<string>("main");
  const [stagedFileIds, setStagedFileIds] = useState<string[]>([]);
  const [showBlame, setShowBlame] = useState<boolean>(false);
  const [gitCommits, setGitCommits] = useState<GitCommit[]>([
    {
      id: "c-init",
      hash: "8f3a1b2",
      message: "feat: initial commit",
      timestamp: "il y a 5 mois",
      author: "maestro",
      files: INITIAL_RECENT_PROJECTS[0].files,
    },
  ]);

  // AI state
  const [aiProvider, setAIProvider] = useState<AIProvider>("gemini");
  const [hfToken, setHfToken] = useState<string>("");
  const [localUrl, setLocalUrl] = useState<string>("http://localhost:11434");
  const [localModel, setLocalModel] = useState<string>("qwen2.5-coder");
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);

  // Real-time Linting state
  const [terminalTab, setTerminalTab] = useState<"console" | "problems">("console");
  const [targetLineToFocus, setTargetLineToFocus] = useState<number | null>(null);

  const projectProblems = useMemo(() => {
    return lintProject(files);
  }, [files]);

  const handleNavigateToProblem = (fileId: string, line: number, column: number) => {
    if (fileId !== activeFileId) {
      handleSelectFile(fileId);
    }
    setTargetLineToFocus(line);
    setTimeout(() => setTargetLineToFocus(null), 150);
  };

  // Check server health
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiKey !== undefined) {
          setHasGeminiKey(Boolean(data.hasGeminiKey));
        }
      })
      .catch((err) => console.warn("Could not check /api/status", err));
  }, []);

  // Listen to Webview postMessage console logs
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.source === "replilite-preview") {
        addTerminalLine(
          e.data.type === "stderr" ? "stderr" : e.data.type === "warn" ? "system" : "stdout",
          `[Webview] ${e.data.message}`
        );
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || null;
  const isWebProject = files.some((f) => f.name.endsWith(".html"));

  const addTerminalLine = useCallback(
    (type: TerminalLine["type"], text: string) => {
      setTerminalLines((prev) => [
        ...prev,
        {
          id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    },
    []
  );

  // Multi-project Tabs management
  const handleSwitchProjectTab = (targetId: string) => {
    if (targetId === activeProjectId) return;

    // 1. Sync current project state into openProjects list
    const updatedProjects = openProjects.map((p) =>
      p.id === activeProjectId
        ? {
            ...p,
            name: projectName,
            files,
            activeFileId,
            openFileIds,
          }
        : p
    );
    setOpenProjects(updatedProjects);

    // 2. Find target project
    const target = updatedProjects.find((p) => p.id === targetId);
    if (!target) return;

    setActiveProjectId(target.id);
    setProjectName(target.name);
    setFiles(target.files);

    const targetActiveFile =
      target.files.find((f) => f.id === target.activeFileId) || target.files[0];
    const targetActiveFileId = targetActiveFile?.id || "";
    setActiveFileId(targetActiveFileId);

    const targetOpenIds =
      target.openFileIds && target.openFileIds.length > 0
        ? target.openFileIds
        : target.files.map((f) => f.id);
    setOpenFileIds(targetOpenIds);

    setFileHistory(targetActiveFileId ? [targetActiveFileId] : []);
    setHistoryIndex(0);

    if (target.files.some((f) => f.name.endsWith(".html"))) {
      setShowWebview(true);
    } else {
      setShowWebview(false);
    }

    addTerminalLine("system", `📂 Basculé vers le projet '${target.name}'`);
  };

  const handleCloseProjectTab = (targetId: string) => {
    if (openProjects.length <= 1) return; // Keep at least one project open

    const closingIndex = openProjects.findIndex((p) => p.id === targetId);
    const closingProject = openProjects[closingIndex];
    const remaining = openProjects.filter((p) => p.id !== targetId);

    setOpenProjects(remaining);

    // If the closed tab was currently active, switch to adjacent project
    if (targetId === activeProjectId) {
      const nextIndex = closingIndex > 0 ? closingIndex - 1 : 0;
      const nextProj = remaining[nextIndex];
      if (nextProj) {
        setActiveProjectId(nextProj.id);
        setProjectName(nextProj.name);
        setFiles(nextProj.files);

        const nextActive =
          nextProj.files.find((f) => f.id === nextProj.activeFileId) || nextProj.files[0];
        const nextActiveId = nextActive?.id || "";
        setActiveFileId(nextActiveId);

        const nextOpenIds =
          nextProj.openFileIds && nextProj.openFileIds.length > 0
            ? nextProj.openFileIds
            : nextProj.files.map((f) => f.id);
        setOpenFileIds(nextOpenIds);

        setFileHistory(nextActiveId ? [nextActiveId] : []);
        setHistoryIndex(0);

        if (nextProj.files.some((f) => f.name.endsWith(".html"))) {
          setShowWebview(true);
        } else {
          setShowWebview(false);
        }
      }
    }

    addTerminalLine("info", `Onglet du projet '${closingProject?.name || targetId}' fermé.`);
  };

  const handleOpenProjectInTab = (proj: ProjectItem | any) => {
    // If project is already open, just switch to it
    const existing = openProjects.find((p) => p.id === proj.id || p.name === proj.name);
    if (existing) {
      handleSwitchProjectTab(existing.id);
      return;
    }

    const newFiles: ProjectFile[] = proj.files.map((f: any, i: number) => ({
      id: `file-${proj.id}-${i}-${Date.now()}`,
      name: f.name,
      content: f.content,
      language: f.name.endsWith(".py")
        ? "python"
        : f.name.endsWith(".js")
        ? "javascript"
        : f.name.endsWith(".html")
        ? "html"
        : f.name.endsWith(".css")
        ? "css"
        : "markdown",
      isDirty: false,
    }));

    const newSession: OpenProjectSession = {
      id: proj.id,
      name: proj.name,
      language: proj.language || "text",
      updatedAt: proj.updatedAt || "à l'instant",
      files: newFiles,
      activeFileId: newFiles[0]?.id || "",
      openFileIds: newFiles.map((f) => f.id),
    };

    setOpenProjects((prev) => [
      ...prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, name: projectName, files, activeFileId, openFileIds }
          : p
      ),
      newSession,
    ]);

    setActiveProjectId(newSession.id);
    setProjectName(newSession.name);
    setFiles(newFiles);
    setActiveFileId(newFiles[0]?.id || "");
    setOpenFileIds(newFiles.map((f) => f.id));
    setFileHistory(newFiles[0]?.id ? [newFiles[0].id] : []);
    setHistoryIndex(0);

    if (proj.language === "html" || newFiles.some((f) => f.name.endsWith(".html"))) {
      setShowWebview(true);
    } else {
      setShowWebview(false);
    }

    addTerminalLine("system", `📂 Nouveau projet ouvert en onglet : '${proj.name}'`);
    setCurrentView("ide");
  };

  const handleCreateNewProjectTab = (name: string, templateId?: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
    const newProjItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      name,
      updatedAt: "à l'instant",
      isPrivate: true,
      language: tmpl.language,
      description: tmpl.description,
      files: tmpl.files,
    };

    setRecentProjects((prev) => [newProjItem, ...prev]);
    handleOpenProjectInTab(newProjItem);
  };

  // Open existing project from Home
  const handleOpenProject = (project: ProjectItem) => {
    handleOpenProjectInTab(project);
  };

  // Create new project from Home or Header
  const handleCreateNewProject = (name: string, templateId?: string) => {
    handleCreateNewProjectTab(name, templateId);
  };

  // Git / Version Control Operations
  const handleInitGitRepo = () => {
    setIsGitInitialized(true);
    const initialCommit: GitCommit = {
      id: `c-${Date.now()}`,
      hash: Math.random().toString(16).slice(2, 9),
      message: "feat: initial commit",
      timestamp: "à l'instant",
      author: userName || "maestro",
      files: files.map((f) => ({ name: f.name, content: f.content })),
    };
    setGitCommits([initialCommit]);
    setFiles((prev) => prev.map((f) => ({ ...f, isDirty: false })));
    setStagedFileIds([]);
    addTerminalLine("system", "Initialized empty Git repository in /workspace/.git/");
    addTerminalLine("stdout", `[${gitBranch} (root-commit) ${initialCommit.hash}] feat: initial commit`);
  };

  const handleCommit = (message: string) => {
    if (!message.trim()) return;
    const newHash = Math.random().toString(16).slice(2, 9);
    const newCommit: GitCommit = {
      id: `c-${Date.now()}`,
      hash: newHash,
      message: message.trim(),
      timestamp: "à l'instant",
      author: userName || "maestro",
      files: files.map((f) => ({ name: f.name, content: f.content })),
    };
    setGitCommits((prev) => [newCommit, ...prev]);
    // Clear dirty state on committed files
    setFiles((prev) => prev.map((f) => ({ ...f, isDirty: false })));
    setStagedFileIds([]);

    addTerminalLine("stdout", `[${gitBranch} ${newHash}] ${message}`);
    addTerminalLine("info", `✓ ${files.length} fichiers archivés dans le commit ${newHash}.`);

    confetti({
      particleCount: 20,
      spread: 45,
      origin: { y: 0.9 },
    });
  };

  const handleCheckoutCommit = (commit: GitCommit) => {
    const restoredFiles: ProjectFile[] = commit.files.map((cf, i) => ({
      id: `restored-${i}-${Date.now()}`,
      name: cf.name,
      content: cf.content,
      language: cf.name.endsWith(".py")
        ? "python"
        : cf.name.endsWith(".js")
        ? "javascript"
        : cf.name.endsWith(".html")
        ? "html"
        : "text",
      isDirty: false,
    }));
    setFiles(restoredFiles);
    setActiveFileId(restoredFiles[0].id);
    setOpenFileIds(restoredFiles.map((f) => f.id));
    setStagedFileIds([]);
    addTerminalLine("system", `HEAD est maintenant sur ${commit.hash} ${commit.message}`);
  };

  const handleGenerateAICommitMessage = async (): Promise<string> => {
    const dirtyFiles = files.filter((f) => f.isDirty || stagedFileIds.includes(f.id));
    const summary = dirtyFiles.map((f) => `${f.name}:\n${f.content.slice(0, 500)}`).join("\n\n");
    try {
      const res = await fetch("/api/ai/ghostwriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          prompt: `Génère uniquement un message de commit Git court, précis et au format Conventional Commits (ex: feat: add primes algorithm, fix: update loop condition, refactor: optimize math helpers) pour ces changements:\n${summary || "mises à jour du code"}`,
          currentCode: "",
          fileName: "git",
          language: "text",
          provider: aiProvider,
          hfToken,
          localUrl,
          localModel,
        }),
      });
      const data = await res.json();
      let text = data.result || "update project files";
      text = text.replace(/```[a-z]*\n?/g, "").replace(/`/g, "").trim().split("\n")[0];
      return text;
    } catch {
      return "feat: update project codebase";
    }
  };

  const handleToggleStageFile = (fileId: string) => {
    setStagedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleStageAll = () => {
    const dirtyIds = files.filter((f) => f.isDirty).map((f) => f.id);
    setStagedFileIds(dirtyIds);
  };

  const handleUnstageAll = () => {
    setStagedFileIds([]);
  };

  // Git Status mapping for FileTree (Modified: Yellow, Created: Green, Deleted: Red)
  const headCommit = gitCommits[0] || null;

  const gitStatusMap = useMemo(() => {
    const map: Record<string, "modified" | "created" | "deleted" | "unmodified"> = {};
    const headFiles = headCommit?.files || [];

    files.forEach((file) => {
      const headFile = headFiles.find((hf) => hf.name === file.name);
      if (!headFile) {
        // Created / Untracked -> Green
        map[file.id] = "created";
      } else if (file.isDirty || file.content !== headFile.content) {
        // Modified -> Yellow
        map[file.id] = "modified";
      } else {
        map[file.id] = "unmodified";
      }
    });

    return map;
  }, [files, headCommit]);

  const deletedGitFiles = useMemo(() => {
    if (!headCommit) return [];
    return headCommit.files
      .filter((hf) => !files.some((f) => f.name === hf.name))
      .map((hf) => ({
        name: hf.name,
        originalContent: hf.content,
      }));
  }, [files, headCommit]);

  const handleRestoreDeletedFile = (deletedFile: { name: string; originalContent: string }) => {
    const restored: ProjectFile = {
      id: `file-restored-${Date.now()}`,
      name: deletedFile.name,
      content: deletedFile.originalContent,
      language: deletedFile.name.endsWith(".py")
        ? "python"
        : deletedFile.name.endsWith(".js")
        ? "javascript"
        : deletedFile.name.endsWith(".html")
        ? "html"
        : deletedFile.name.endsWith(".css")
        ? "css"
        : "markdown",
      isDirty: false,
    };
    setFiles((prev) => [...prev, restored]);
    setActiveFileId(restored.id);
    setOpenFileIds((prev) => [...prev, restored.id]);
    addTerminalLine("system", `Git: Fichier '${deletedFile.name}' restauré depuis le commit HEAD.`);
  };

  const handleViewBlame = (fileId: string) => {
    setActiveFileId(fileId);
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds((prev) => [...prev, fileId]);
    }
    setShowBlame(true);
    addTerminalLine("info", "Vue Git Blame activée : inspection des auteurs et commits ligne par ligne.");
  };

  // Submit prompt from Home Agent input box
  const handleHomePromptSubmit = async (prompt: string, provider: AIProvider) => {
    // Generate a new project for this task
    const projectNameFromPrompt = prompt
      .slice(0, 24)
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "ai-agent-task";

    setProjectName(projectNameFromPrompt);
    setCurrentView("ide");
    setShowAIPanel(true);

    // Add prompt to AI messages
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString(),
    };
    setAiMessages([userMsg]);
    setIsAILoading(true);

    addTerminalLine("system", `🤖 Replit Agent sollicité pour : "${prompt}"`);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          activeFile,
          files,
          provider,
          hfToken,
          localUrl,
          localModel,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setAiMessages((prev) => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            role: "assistant",
            content: data.reply,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        addTerminalLine("ai", `Ghostwriter: ${data.reply.slice(0, 180)}...`);
      }
    } catch (err: any) {
      console.warn("AI prompt error", err);
    } finally {
      setIsAILoading(false);
    }
  };

  // File management
  const handleSelectFile = (id: string, recordHistory = true) => {
    setActiveFileId(id);
    if (!openFileIds.includes(id)) {
      setOpenFileIds((prev) => [...prev, id]);
    }
    if (recordHistory) {
      setFileHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        if (upToCurrent[upToCurrent.length - 1] === id) {
          return upToCurrent;
        }
        return [...upToCurrent, id];
      });
      setHistoryIndex((prev) => {
        const currentId = fileHistory[prev];
        if (currentId === id) return prev;
        return prev + 1;
      });
    }
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const targetId = fileHistory[prevIdx];
      if (targetId && files.some((f) => f.id === targetId)) {
        setHistoryIndex(prevIdx);
        handleSelectFile(targetId, false);
      }
    }
  };

  const handleGoForward = () => {
    if (historyIndex < fileHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      const targetId = fileHistory[nextIdx];
      if (targetId && files.some((f) => f.id === targetId)) {
        setHistoryIndex(nextIdx);
        handleSelectFile(targetId, false);
      }
    }
  };

  const handleCloseTab = (id: string) => {
    const remaining = openFileIds.filter((fid) => fid !== id);
    setOpenFileIds(remaining);
    if (activeFileId === id) {
      if (remaining.length > 0) {
        setActiveFileId(remaining[remaining.length - 1]);
      } else if (files.length > 0) {
        setActiveFileId(files[0].id);
      }
    }
  };

  const handleCreateFile = (name: string) => {
    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name,
      content: "",
      language: name.endsWith(".py") ? "python" : name.endsWith(".js") ? "javascript" : "text",
      isDirty: false,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setOpenFileIds((prev) => [...prev, newFile.id]);
    addTerminalLine("info", `📄 Nouveau fichier créé : ${name}`);
  };

  const handleDeleteFile = (id: string) => {
    const fileToDelete = files.find((f) => f.id === id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setOpenFileIds((prev) => prev.filter((fid) => fid !== id));
    if (activeFileId === id) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
    }
    if (fileToDelete) {
      addTerminalLine("info", `🗑️ Fichier supprimé : ${fileToDelete.name}`);
    }
  };

  const handleRenameFile = (id: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
    );
    addTerminalLine("info", `✏️ Fichier renommé en : ${newName}`);
  };

  const handleUpdateContent = (id: string, content: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, content, isDirty: true } : f))
    );
  };

  // Template loader
  const handleLoadTemplate = (template: ProjectTemplate) => {
    setProjectName(template.id);
    const newFiles: ProjectFile[] = template.files.map((f, i) => ({
      id: `file-${template.id}-${i}-${Date.now()}`,
      name: f.name,
      content: f.content,
      language: f.name.endsWith(".py")
        ? "python"
        : f.name.endsWith(".js")
        ? "javascript"
        : f.name.endsWith(".html")
        ? "html"
        : "markdown",
      isDirty: false,
    }));

    setFiles(newFiles);
    const defaultF = newFiles.find((f) => f.name === template.defaultFile) || newFiles[0];
    setActiveFileId(defaultF.id);
    setOpenFileIds(newFiles.map((f) => f.id));
    setFileHistory([defaultF.id]);
    setHistoryIndex(0);

    if (template.language === "html") {
      setShowWebview(true);
    }

    setTerminalLines([
      {
        id: `load-${Date.now()}`,
        type: "system",
        text: `📦 Modèle chargé : ${template.name} (${template.files.length} fichiers).`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Execution runner
  const handleRun = async () => {
    if (isRunning) return;
    if (!activeFile) {
      addTerminalLine("stderr", "Erreur: Aucun fichier actif à exécuter.");
      return;
    }

    // Save dirty files
    setFiles((prev) => prev.map((f) => ({ ...f, isDirty: false })));
    setIsRunning(true);
    setShowTerminal(true);

    addTerminalLine("stdin", `▶ run ${activeFile.name}`);

    // Pre-execution syntax validation via real-time linter
    const syntaxErrors = activeFile ? lintFile(activeFile) : [];
    if (syntaxErrors.length > 0) {
      addTerminalLine(
        "stderr",
        `⚠️ Problème de syntaxe détecté dans ${activeFile.name} (Ligne ${syntaxErrors[0].line}) : ${syntaxErrors[0].message}`
      );
    }

    const ext = activeFile.name.slice(activeFile.name.lastIndexOf(".")).toLowerCase();

    try {
      if (ext === ".py") {
        await runPythonCode(activeFile.content, files, {
          onStdout: (text) => addTerminalLine("stdout", text),
          onStderr: (text) => addTerminalLine("stderr", text),
          onStatus: (status) => setStatusMessage(status),
        });
        addTerminalLine("info", `\n✓ ${activeFile.name} exécuté avec succès.`);
      } else if (ext === ".js" || ext === ".ts") {
        await runJavaScriptCode(activeFile.content, {
          onStdout: (text) => addTerminalLine("stdout", text),
          onStderr: (text) => addTerminalLine("stderr", text),
        });
        addTerminalLine("info", `\n✓ ${activeFile.name} exécuté avec succès.`);
      } else if (ext === ".html" || isWebProject) {
        setShowWebview(true);
        setWebviewRefreshKey((k) => k + 1);
        addTerminalLine("info", "🌐 Application Web rafraîchie dans la Webview.");
      } else {
        addTerminalLine(
          "stdout",
          `Contenu de ${activeFile.name} :\n${activeFile.content}`
        );
      }

      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.85 },
      });
    } catch (err: any) {
      console.error("Execution error:", err);
    } finally {
      setIsRunning(false);
      setStatusMessage("");
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setStatusMessage("");
    addTerminalLine("stderr", "⏹ Exécution interrompue par l'utilisateur.");
  };

  // Terminal interactive commands
  const handleExecuteCommand = async (cmd: string) => {
    addTerminalLine("stdin", cmd);
    const parts = cmd.trim().split(" ");
    const command = parts[0]?.toLowerCase();
    const arg = parts.slice(1).join(" ");

    switch (command) {
      case "help":
        addTerminalLine(
          "info",
          `Commandes disponibles :
  run [fichier]       - Exécute le fichier actif ou spécifié
  python <fichier>    - Lance un script avec Pyodide Python 3
  node <fichier>      - Exécute du JavaScript
  ls                  - Liste les fichiers du projet
  cat <fichier>       - Affiche le contenu d'un fichier
  clear               - Efface la console
  lint                - Analyse syntaxique en temps réel (linter)
  echo <texte>        - Affiche du texte
  date                - Affiche la date et l'heure
  ai <question>       - Interroge l'IA directement depuis le terminal
  eval <code js>      - Évalue une expression JavaScript`
        );
        break;

      case "lint":
      case "check": {
        const issues = lintProject(files);
        if (issues.length === 0) {
          addTerminalLine("stdout", "✓ Linting réussi : Aucun problème de syntaxe détecté dans le projet.");
        } else {
          addTerminalLine("system", `🔍 Linting en temps réel : ${issues.length} problème(s) de syntaxe détecté(s) :`);
          issues.forEach((p) => {
            addTerminalLine("stderr", `  [${p.fileName}:${p.line}:${p.column}] ${p.message}`);
            if (p.codeSnippet) {
              addTerminalLine("stderr", `    ${p.codeSnippet}`);
              addTerminalLine("stderr", `    ${" ".repeat(Math.max(0, p.column - 1))}^`);
            }
          });
          addTerminalLine("info", "💡 Consultez l'onglet 'Problèmes' pour la vue détaillée interactive.");
        }
        break;
      }

      case "clear":
        setTerminalLines([]);
        break;

      case "ls":
        const listStr = files
          .map((f) => `  ${f.name.padEnd(20)} ${f.content.length} octets (${f.content.split("\n").length} lignes)`)
          .join("\n");
        addTerminalLine("stdout", listStr);
        break;

      case "cat":
        if (!arg) {
          addTerminalLine("stderr", "Usage: cat <nom-du-fichier>");
          break;
        }
        const target = files.find((f) => f.name === arg);
        if (target) {
          addTerminalLine("stdout", target.content);
        } else {
          addTerminalLine("stderr", `Erreur: Fichier '${arg}' introuvable.`);
        }
        break;

      case "echo":
        addTerminalLine("stdout", arg);
        break;

      case "date":
        addTerminalLine("stdout", new Date().toLocaleString());
        break;

      case "eval":
        if (!arg) {
          addTerminalLine("stderr", "Usage: eval <expression javascript>");
          break;
        }
        try {
          const fn = new Function(`return (${arg})`);
          const res = fn();
          addTerminalLine("stdout", `=> ${typeof res === "object" ? JSON.stringify(res) : res}`);
        } catch (evalErr: any) {
          addTerminalLine("stderr", `Erreur eval: ${evalErr.message}`);
        }
        break;

      case "python":
      case "node":
      case "run":
        const fileToRun = arg ? files.find((f) => f.name === arg) : activeFile;
        if (!fileToRun) {
          addTerminalLine("stderr", `Fichier introuvable: ${arg}`);
          break;
        }
        setActiveFileId(fileToRun.id);
        handleRun();
        break;

      case "ai":
        if (!arg) {
          addTerminalLine("stderr", "Usage: ai <votre question>");
          break;
        }
        addTerminalLine("system", "Demande à l'IA en cours...");
        try {
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: arg }],
              activeFile,
              files,
              provider: aiProvider,
              hfToken,
              localUrl,
              localModel,
            }),
          });
          const data = await res.json();
          if (data.error) {
            addTerminalLine("stderr", `Erreur IA: ${data.error}`);
          } else {
            addTerminalLine("ai", `🤖 Ghostwriter:\n${data.reply}`);
          }
        } catch (err: any) {
          addTerminalLine("stderr", `Erreur réseau IA: ${err.message}`);
        }
        break;

      case "git":
        const gitSub = parts[1]?.toLowerCase();
        if (!isGitInitialized && gitSub !== "init") {
          addTerminalLine(
            "stderr",
            "fatal: not a git repository (or any of the parent directories): .git\nUtilisez 'git init' pour initialiser le dépôt."
          );
          break;
        }

        if (gitSub === "init") {
          handleInitGitRepo();
        } else if (gitSub === "status") {
          const dirty = files.filter((f) => f.isDirty);
          const staged = files.filter((f) => stagedFileIds.includes(f.id));
          addTerminalLine("stdout", `On branch ${gitBranch}`);
          if (staged.length > 0) {
            addTerminalLine(
              "stdout",
              "Changes to be committed:\n" +
                staged.map((f) => `  modified:   ${f.name}`).join("\n")
            );
          }
          if (dirty.length > 0) {
            addTerminalLine(
              "stdout",
              "Changes not staged for commit:\n" +
                dirty.map((f) => `  modified:   ${f.name}`).join("\n")
            );
          }
          if (dirty.length === 0 && staged.length === 0) {
            addTerminalLine("stdout", "nothing to commit, working tree clean");
          }
        } else if (gitSub === "add") {
          const addTarget = parts.slice(2).join(" ");
          if (addTarget === "." || addTarget === "-A") {
            handleStageAll();
            addTerminalLine("info", "Indexed all modified files.");
          } else {
            const targetF = files.find((f) => f.name === addTarget);
            if (targetF) {
              handleToggleStageFile(targetF.id);
              addTerminalLine("info", `Indexed ${targetF.name}.`);
            } else {
              addTerminalLine("stderr", `fatal: pathspec '${addTarget}' did not match any files`);
            }
          }
        } else if (gitSub === "commit") {
          const mIdx = parts.indexOf("-m");
          if (mIdx !== -1 && parts[mIdx + 1]) {
            const commitMsg = parts
              .slice(mIdx + 1)
              .join(" ")
              .replace(/^["']|["']$/g, "");
            handleCommit(commitMsg);
          } else {
            addTerminalLine("stderr", 'Usage: git commit -m "votre message"');
          }
        } else if (gitSub === "log") {
          if (gitCommits.length === 0) {
            addTerminalLine("stderr", "fatal: your current branch does not have any commits yet");
          } else {
            const logStr = gitCommits
              .map(
                (c) =>
                  `commit ${c.hash} (${c.timestamp})\nAuthor: ${c.author}\n\n    ${c.message}\n`
              )
              .join("\n");
            addTerminalLine("stdout", logStr);
          }
        } else if (gitSub === "branch") {
          addTerminalLine("stdout", `* ${gitBranch}`);
        } else {
          addTerminalLine(
            "info",
            "Commandes Git: git init, git status, git add <fichier>, git commit -m <msg>, git log, git branch"
          );
        }
        break;

      default:
        addTerminalLine(
          "stderr",
          `Commande inconnue: '${command}'. Tapez 'help' pour la liste des commandes.`
        );
        break;
    }
  };

  // AI Pair Programmer Chat
  const handleSendAIMessage = async (content: string) => {
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    const newMessages = [...aiMessages, userMsg];
    setAiMessages(newMessages);
    setIsAILoading(true);

    try {
      let replyText: string | null = null;

      // If user selected a local AI (Ollama or OpenCode), try direct client-side call to their laptop first
      if (aiProvider === "ollama") {
        try {
          const directOllamaRes = await fetch(`${localUrl.replace(/\/+$/, "")}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: localModel || "qwen2.5-coder",
              messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
              stream: false,
            }),
          });
          if (directOllamaRes.ok) {
            const oData = await directOllamaRes.json();
            if (oData.message?.content) {
              replyText = oData.message.content;
            }
          }
        } catch (_localErr) {
          // Direct browser fetch failed, fallback to server endpoint
        }
      } else if (aiProvider === "opencode") {
        try {
          const endpoint = localUrl.endsWith("/chat/completions")
            ? localUrl
            : `${localUrl.replace(/\/+$/, "")}/chat/completions`;
          const directOpenCodeRes = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: localModel || "local-model",
              messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
              temperature: 0.2,
            }),
          });
          if (directOpenCodeRes.ok) {
            const ocData = await directOpenCodeRes.json();
            if (ocData.choices?.[0]?.message?.content) {
              replyText = ocData.choices[0].message.content;
            }
          }
        } catch (_localErr) {
          // Direct browser fetch failed, fallback to server endpoint
        }
      }

      if (!replyText) {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            activeFile,
            files,
            provider: aiProvider,
            hfToken,
            localUrl,
            localModel,
          }),
        });

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        replyText = data.reply;
      }

      setAiMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          role: "assistant",
          content: replyText || "Aucune réponse générée.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Erreur de connexion avec l'IA : ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsAILoading(false);
    }
  };

  // Ghostwriter direct actions
  const handleTriggerGhostwriter = async (
    action: "explain" | "fix" | "optimize" | "tests"
  ) => {
    if (!activeFile) return;

    setShowAIPanel(true);
    setIsAILoading(true);

    const actionLabels = {
      explain: "Expliquer le code de",
      fix: "Déboguer et réparer",
      optimize: "Optimiser le code de",
      tests: "Générer des tests pour",
    };

    const userPrompt = `${actionLabels[action]} ${activeFile.name}`;
    setAiMessages((prev) => [
      ...prev,
      {
        id: `action-user-${Date.now()}`,
        role: "user",
        content: userPrompt,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    const lastError = [...terminalLines].reverse().find((l) => l.type === "stderr")?.text || "";

    try {
      const res = await fetch("/api/ai/ghostwriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          prompt: userPrompt,
          currentCode: activeFile.content,
          fileName: activeFile.name,
          language: activeFile.language,
          errorOutput: lastError,
          provider: aiProvider,
          hfToken,
          localUrl,
          localModel,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setAiMessages((prev) => [
          ...prev,
          {
            id: `action-err-${Date.now()}`,
            role: "assistant",
            content: `⚠️ Erreur : ${data.error}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else {
        setAiMessages((prev) => [
          ...prev,
          {
            id: `action-res-${Date.now()}`,
            role: "assistant",
            content: data.result,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err: any) {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `action-err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Erreur : ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleDebugErrorWithAI = (lastError: string) => {
    setShowAIPanel(true);
    handleTriggerGhostwriter("fix");
  };

  const handleApplyCodeToFile = (code: string) => {
    if (!activeFile) return;
    handleUpdateContent(activeFile.id, code);
    addTerminalLine("info", `✨ Code appliqué directement dans ${activeFile.name}`);
  };

  const handleAppendCodeToFile = (code: string) => {
    if (!activeFile) return;
    const newContent = activeFile.content ? `${activeFile.content}\n\n${code}` : code;
    handleUpdateContent(activeFile.id, newContent);
    addTerminalLine("info", `➕ Code inséré à la fin de ${activeFile.name}`);
  };

  // Export project as JSON
  const handleExportProject = () => {
    const projectData = {
      name: projectName,
      exportedAt: new Date().toISOString(),
      files: files.map((f) => ({ name: f.name, content: f.content })),
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName}.replilite.json`;
    a.click();
    URL.revokeObjectURL(url);

    addTerminalLine("info", `💾 Projet '${projectName}' exporté en JSON.`);
  };

  // Global keydown listeners
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (currentView === "ide") {
          e.preventDefault();
          handleRun();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        if (currentView === "ide") {
          e.preventDefault();
          setFiles((prev) => prev.map((f) => ({ ...f, isDirty: false })));
          addTerminalLine("info", "💾 Fichiers enregistrés.");
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        if (currentView === "ide") {
          e.preventDefault();
          setShowSidebar((s) => !s);
        }
      } else if (e.altKey && e.key === "ArrowLeft") {
        if (currentView === "ide") {
          e.preventDefault();
          handleGoBack();
        }
      } else if (e.altKey && e.key === "ArrowRight") {
        if (currentView === "ide") {
          e.preventDefault();
          handleGoForward();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleRun, currentView, handleGoBack, handleGoForward]);

  // If on Home View (matches the user's uploaded screenshot with extreme fidelity)
  if (currentView === "home") {
    return (
      <ReplitHome
        userName={userName}
        recentProjects={recentProjects}
        onOpenProject={handleOpenProject}
        onCreateNewProject={handleCreateNewProject}
        onPromptSubmit={handleHomePromptSubmit}
        aiProvider={aiProvider}
        onChangeAIProvider={setAIProvider}
        hasGeminiKey={hasGeminiKey}
      />
    );
  }

  // If in IDE Workspace View (Online Code Editor + Terminal + Ghostwriter)
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] text-[#e6edf3] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <Header
        projectName={projectName}
        onUpdateProjectName={setProjectName}
        isRunning={isRunning}
        onRun={handleRun}
        onStop={handleStop}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        showWebview={showWebview}
        onToggleWebview={() => setShowWebview(!showWebview)}
        showAIPanel={showAIPanel}
        onToggleAIPanel={() => setShowAIPanel(!showAIPanel)}
        isWebProject={isWebProject}
        aiProvider={aiProvider}
        onChangeAIProvider={setAIProvider}
        onLoadTemplate={handleLoadTemplate}
        onExportProject={handleExportProject}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        hasGeminiKey={hasGeminiKey}
        onGoHome={() => setCurrentView("home")}
        onOpenVoiceModal={() => setShowVoiceModal(true)}
      />

      {/* Breadcrumb Navigation Bar below the main header */}
      <BreadcrumbsBar
        projectName={projectName}
        activeFile={activeFile}
        files={files}
        onSelectFile={handleSelectFile}
        onCreateFile={handleCreateFile}
        onGoHome={() => setCurrentView("home")}
        isGitInitialized={isGitInitialized}
        gitBranch={gitBranch}
        recentProjects={recentProjects}
        onOpenProject={handleOpenProject}
        cursorPos={cursorPos}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < fileHistory.length - 1}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        openProjects={openProjects.map((p) => ({
          id: p.id,
          name: p.name,
          language: p.language,
          hasDirtyFiles:
            p.id === activeProjectId
              ? files.some((f) => f.isDirty)
              : p.files.some((f) => f.isDirty),
        }))}
        activeProjectId={activeProjectId}
        onSwitchProjectTab={handleSwitchProjectTab}
        onCloseProjectTab={handleCloseProjectTab}
        onOpenProjectInTab={handleOpenProjectInTab}
        onCreateNewProjectTab={handleCreateNewProjectTab}
        projectCreationDate={
          recentProjects.find(
            (p) =>
              p.id === activeProjectId ||
              p.name.toLowerCase() === projectName.toLowerCase()
          )?.updatedAt || "5 months ago"
        }
      />

      {/* Main Workspace Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Files & Git Sidebar with Activity Rail */}
        {showSidebar && (
          <div className="flex h-full shrink-0 select-none">
            {/* Slim Activity Rail */}
            <div className="w-11 bg-[#0b0e14] border-r border-[#222834] flex flex-col items-center py-2 space-y-2 shrink-0">
              <button
                onClick={() => setActiveSidebarTab("files")}
                title="Explorateur de fichiers"
                className={`p-2 rounded-lg transition relative ${
                  activeSidebarTab === "files"
                    ? "bg-[#1f2737] text-[#f26207]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#161c28]"
                }`}
              >
                <FolderTree className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveSidebarTab("git")}
                title="Contrôle de version Git"
                className={`p-2 rounded-lg transition relative ${
                  activeSidebarTab === "git"
                    ? "bg-[#1f2737] text-[#f26207]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#161c28]"
                }`}
              >
                <GitBranch className="w-4 h-4" />
                {files.filter((f) => f.isDirty).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            </div>

            {/* Active Panel: FileTree or GitPanel */}
            {activeSidebarTab === "files" ? (
              <FileTree
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onViewBlame={handleViewBlame}
                gitStatusMap={gitStatusMap}
                deletedGitFiles={deletedGitFiles}
                onRestoreDeletedFile={handleRestoreDeletedFile}
                onOpenInAIChat={(prompt) => {
                  setShowAIPanel(true);
                  handleSendAIMessage(prompt);
                }}
              />
            ) : (
              <GitPanel
                files={files}
                isInitialized={isGitInitialized}
                onInitRepo={handleInitGitRepo}
                branch={gitBranch}
                onChangeBranch={setGitBranch}
                commits={gitCommits}
                onCommit={handleCommit}
                onCheckoutCommit={handleCheckoutCommit}
                onGenerateAICommitMessage={handleGenerateAICommitMessage}
                stagedFileIds={stagedFileIds}
                onToggleStageFile={handleToggleStageFile}
                onStageAll={handleStageAll}
                onUnstageAll={handleUnstageAll}
              />
            )}
          </div>
        )}

        {/* Center: Split Editor & Terminal */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Half: Code Editor */}
          <div className="flex-1 min-h-[35%] overflow-hidden flex">
            <CodeEditor
              files={files}
              activeFile={activeFile}
              openFileIds={openFileIds}
              onSelectFile={handleSelectFile}
              onCloseTab={handleCloseTab}
              onUpdateContent={handleUpdateContent}
              onRun={handleRun}
              onTriggerGhostwriter={handleTriggerGhostwriter}
              commits={gitCommits}
              showBlame={showBlame}
              onToggleBlame={() => setShowBlame(!showBlame)}
              onCursorChange={setCursorPos}
              onShowProblemsTab={() => setTerminalTab("problems")}
              targetLineToFocus={targetLineToFocus}
            />

            {/* Split Webview if toggled side-by-side */}
            {showWebview && isWebProject && (
              <div className="w-1/2 min-w-[320px] h-full hidden md:block">
                <WebPreview
                  files={files}
                  refreshKey={webviewRefreshKey}
                  onRefresh={() => setWebviewRefreshKey((k) => k + 1)}
                />
              </div>
            )}
          </div>

          {/* Bottom Half: Interactive Terminal with Real-time Problems Tab */}
          {showTerminal && (
            <div className="h-48 md:h-56 lg:h-64 shrink-0 overflow-hidden">
              <Terminal
                lines={terminalLines}
                onClear={() => setTerminalLines([])}
                onExecuteCommand={handleExecuteCommand}
                onDebugErrorWithAI={handleDebugErrorWithAI}
                isRunning={isRunning}
                statusMessage={statusMessage}
                problems={projectProblems}
                activeTab={terminalTab}
                onTabChange={setTerminalTab}
                onNavigateToProblem={handleNavigateToProblem}
              />
            </div>
          )}
        </div>

        {/* Right: Ghostwriter AI Assistant Panel */}
        {showAIPanel && (
          <AIPanel
            messages={aiMessages}
            onSendMessage={handleSendAIMessage}
            onClearMessages={() => setAiMessages([])}
            isLoading={isAILoading}
            activeFile={activeFile}
            files={files}
            onApplyCodeToFile={handleApplyCodeToFile}
            onAppendCodeToFile={handleAppendCodeToFile}
            aiProvider={aiProvider}
            onChangeProvider={setAIProvider}
            hfToken={hfToken}
            onChangeHfToken={setHfToken}
            localUrl={localUrl}
            onChangeLocalUrl={setLocalUrl}
            localModel={localModel}
            onChangeLocalModel={setLocalModel}
            onOpenVoiceModal={() => setShowVoiceModal(true)}
          />
        )}
      </div>

      {/* Voice Conversation Modal (gemini-3.8-live) */}
      <VoiceConversationModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        activeFile={activeFile}
        files={files}
      />

      {/* Keyboard Shortcuts & Help Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
