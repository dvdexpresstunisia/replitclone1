export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: string;
  isDirty?: boolean;
  isReadonly?: boolean;
}

export type TerminalLineType = "stdout" | "stderr" | "stdin" | "system" | "info" | "ai";

export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  text: string;
  timestamp: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  suggestedCode?: string;
  actionType?: string;
}

export type AIProvider = "gemini" | "huggingface" | "ollama" | "opencode" | "freellm";

export interface LocalAISettings {
  ollamaUrl: string;
  ollamaModel: string;
  opencodeUrl: string;
  opencodeModel: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  language: "python" | "javascript" | "html" | "typescript";
  icon: string;
  defaultFile: string;
  files: {
    name: string;
    content: string;
  }[];
}
