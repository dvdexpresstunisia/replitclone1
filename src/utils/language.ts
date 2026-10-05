export interface LanguageInfo {
  id: string;
  name: string;
  prismId: string;
  extension: string;
  color: string;
  icon: string;
}

export function getLanguageInfo(fileName: string): LanguageInfo {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  switch (ext) {
    case ".py":
      return {
        id: "python",
        name: "Python",
        prismId: "python",
        extension: ".py",
        color: "#3572A5",
        icon: "🐍",
      };
    case ".js":
      return {
        id: "javascript",
        name: "JavaScript",
        prismId: "javascript",
        extension: ".js",
        color: "#f1e05a",
        icon: "⚡",
      };
    case ".ts":
      return {
        id: "typescript",
        name: "TypeScript",
        prismId: "typescript",
        extension: ".ts",
        color: "#3178c6",
        icon: "🔷",
      };
    case ".html":
    case ".htm":
      return {
        id: "html",
        name: "HTML",
        prismId: "html",
        extension: ".html",
        color: "#e34c26",
        icon: "🌐",
      };
    case ".css":
      return {
        id: "css",
        name: "CSS",
        prismId: "css",
        extension: ".css",
        color: "#563d7c",
        icon: "🎨",
      };
    case ".json":
      return {
        id: "json",
        name: "JSON",
        prismId: "json",
        extension: ".json",
        color: "#292929",
        icon: "📋",
      };
    case ".md":
      return {
        id: "markdown",
        name: "Markdown",
        prismId: "markdown",
        extension: ".md",
        color: "#083fa1",
        icon: "📝",
      };
    case ".sh":
    case ".bash":
      return {
        id: "bash",
        name: "Bash",
        prismId: "bash",
        extension: ".sh",
        color: "#89e051",
        icon: "🐚",
      };
    case ".sql":
      return {
        id: "sql",
        name: "SQL",
        prismId: "sql",
        extension: ".sql",
        color: "#e38c00",
        icon: "🗄️",
      };
    default:
      return {
        id: "text",
        name: "Text",
        prismId: "text",
        extension: ext || ".txt",
        color: "#8b949e",
        icon: "📄",
      };
  }
}
