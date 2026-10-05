import { useEffect, useRef, useState } from "react";
import { ProjectFile } from "../types";

export const NAVIGATION_STORAGE_KEY = "replilite_navigation_state_v1";

export interface PersistedProjectSession {
  id: string;
  name: string;
  language: string;
  updatedAt?: string;
  files: {
    id: string;
    name: string;
    content: string;
    language: string;
    isDirty?: boolean;
  }[];
  activeFileId?: string;
  activeFileName?: string;
  openFileIds?: string[];
  openFileNames?: string[];
}

export interface PersistedNavigationState {
  version: number;
  currentView: "home" | "ide";
  projectName: string;
  activeProjectId?: string;
  openProjects?: PersistedProjectSession[];
  activeFileName: string | null;
  activeFileId?: string;
  openFileNames: string[];
  fileHistoryNames: string[];
  historyIndex: number;
  cursorPos?: { line: number; col: number };
  files: {
    id: string;
    name: string;
    content: string;
    language: string;
    isDirty?: boolean;
  }[];
  timestamp: number;
}

/**
 * Safely loads the persisted navigation state from localStorage.
 */
export function loadPersistedNavigation(): PersistedNavigationState | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(NAVIGATION_STORAGE_KEY);
    if (!raw) return null;

    const parsed: PersistedNavigationState = JSON.parse(raw);

    // Basic integrity validation
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.projectName !== "string" ||
      !Array.isArray(parsed.files) ||
      parsed.files.length === 0
    ) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn("Could not load persisted navigation state from localStorage:", err);
    return null;
  }
}

/**
 * Safely saves the navigation state to localStorage.
 */
export function savePersistedNavigation(
  state: Omit<PersistedNavigationState, "version" | "timestamp">
): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const fullPayload: PersistedNavigationState = {
      ...state,
      version: 1,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(fullPayload));
  } catch (err) {
    console.warn("Could not save navigation state to localStorage:", err);
  }
}

/**
 * Clears the persisted navigation state from localStorage.
 */
export function clearPersistedNavigation(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(NAVIGATION_STORAGE_KEY);
  } catch (err) {
    console.warn("Could not clear navigation state from localStorage:", err);
  }
}

export interface UseNavigationPersistenceProps {
  currentView: "home" | "ide";
  projectName: string;
  activeProjectId?: string;
  openProjects?: PersistedProjectSession[];
  files: ProjectFile[];
  activeFileId: string;
  openFileIds: string[];
  fileHistory: string[];
  historyIndex: number;
  cursorPos: { line: number; col: number };
}

/**
 * Custom React hook to automatically persist open project and active file breadcrumb path
 * in localStorage and restore it upon page refresh.
 */
export function useNavigationPersistence({
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
}: UseNavigationPersistenceProps) {
  const [isRestored, setIsRestored] = useState<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Latest state ref for beforeunload immediate sync
  const latestStateRef = useRef({
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

  useEffect(() => {
    latestStateRef.current = {
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
    };
  }, [
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
  ]);

  // Synchronous flush function
  const flushSave = () => {
    const s = latestStateRef.current;
    const activeFile = s.files.find((f) => f.id === s.activeFileId) || s.files[0] || null;
    const openFiles = s.files.filter((f) => s.openFileIds.includes(f.id));
    const historyFiles = s.fileHistory
      .map((id) => s.files.find((f) => f.id === id)?.name)
      .filter(Boolean) as string[];

    savePersistedNavigation({
      currentView: s.currentView,
      projectName: s.projectName,
      activeProjectId: s.activeProjectId,
      openProjects: s.openProjects,
      activeFileName: activeFile ? activeFile.name : null,
      activeFileId: s.activeFileId,
      openFileNames: openFiles.map((f) => f.name),
      fileHistoryNames: historyFiles,
      historyIndex: s.historyIndex,
      cursorPos: s.cursorPos,
      files: s.files.map((f) => ({
        id: f.id,
        name: f.name,
        content: f.content,
        language: f.language,
        isDirty: f.isDirty,
      })),
    });
  };

  // Immediate write on window unload / refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSave();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Debounced auto-save on navigation or file change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      flushSave();
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    currentView,
    projectName,
    files,
    activeFileId,
    openFileIds,
    fileHistory,
    historyIndex,
    cursorPos,
  ]);

  return {
    isRestored,
    setIsRestored,
    clearPersistence: clearPersistedNavigation,
    forceSave: flushSave,
  };
}
