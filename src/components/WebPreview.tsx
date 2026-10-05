import React, { useState } from "react";
import {
  Globe,
  RotateCw,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor
} from "lucide-react";
import { ProjectFile } from "../types";
import { buildWebviewDocument } from "../utils/runner";

interface WebPreviewProps {
  files: ProjectFile[];
  refreshKey: number;
  onRefresh: () => void;
}

export const WebPreview: React.FC<WebPreviewProps> = ({
  files,
  refreshKey,
  onRefresh,
}) => {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const htmlContent = buildWebviewDocument(files);

  const getDeviceWidthClass = () => {
    switch (deviceMode) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      case "desktop":
      default:
        return "w-full";
    }
  };

  const handleOpenNewWindow = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-l border-[#262c36] select-none">
      {/* Address Bar & Controls */}
      <div className="h-9 bg-[#131822] border-b border-[#242b38] px-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <div className="bg-[#1a212e] text-[11px] text-gray-400 px-2 py-0.5 rounded border border-[#273244] truncate flex-1 flex items-center gap-1">
            <span className="text-gray-500 font-mono">http://localhost:3000/</span>
            <span className="text-gray-300">preview</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Device Switcher */}
          <div className="flex items-center bg-[#18202d] rounded p-0.5 border border-[#273244]">
            <button
              onClick={() => setDeviceMode("desktop")}
              title="Bureau"
              className={`p-1 rounded ${
                deviceMode === "desktop"
                  ? "bg-[#252f42] text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDeviceMode("tablet")}
              title="Tablette"
              className={`p-1 rounded ${
                deviceMode === "tablet"
                  ? "bg-[#252f42] text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Tablet className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              title="Mobile"
              className={`p-1 rounded ${
                deviceMode === "mobile"
                  ? "bg-[#252f42] text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={onRefresh}
            title="Recharger la page"
            className="p-1 text-gray-400 hover:text-white hover:bg-[#1a212e] rounded transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenNewWindow}
            title="Ouvrir dans un nouvel onglet"
            className="p-1 text-gray-400 hover:text-white hover:bg-[#1a212e] rounded transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-[#090c12] p-2 flex items-center justify-center overflow-auto">
        <div
          className={`${getDeviceWidthClass()} h-full transition-all duration-300 bg-white rounded-md overflow-hidden shadow-2xl border border-[#242b38] flex flex-col`}
        >
          <iframe
            key={refreshKey}
            srcDoc={htmlContent}
            title="Webview Preview"
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="w-full h-full border-none bg-white"
          />
        </div>
      </div>
    </div>
  );
};
