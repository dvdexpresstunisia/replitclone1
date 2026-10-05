import React from "react";

interface FileLanguageIconProps {
  fileName: string;
  className?: string;
  size?: number;
}

export const FileLanguageIcon: React.FC<FileLanguageIconProps> = ({
  fileName,
  className = "w-3.5 h-3.5",
  size,
}) => {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const lowerName = fileName.toLowerCase();
  const style = size ? { width: size, height: size } : undefined;

  // 1. Python (.py, .pyw)
  if (ext === ".py" || ext === ".pyw") {
    return (
      <svg
        viewBox="0 0 128 128"
        className={className}
        style={style}
        aria-label="Python"
      >
        <path
          d="M63.38 0c-17.15 0-30.84 3.03-31.96 16.48h18.23c1.69 0 3.06 1.37 3.06 3.06v5.8c0 1.69-1.37 3.06-3.06 3.06H19.78C8.86 28.4 0 37.66 0 51.77c0 13.9 7.6 23.37 19.78 23.37h9.09V63.95c0-8.94 7.63-16.37 16.57-16.37h27.91c7.4 0 13.43-6.03 13.43-13.43V13.43C86.78 4.5 76.81 0 63.38 0zm-11.8 8.78a4.29 4.29 0 1 1 0 8.58 4.29 4.29 0 0 1 0-8.58z"
          fill="#3776AB"
        />
        <path
          d="M64.62 128c17.15 0 30.84-3.03 31.96-16.48H78.35a3.06 3.06 0 0 1-3.06-3.06v-5.8c0-1.69 1.37-3.06 3.06-3.06h29.87c10.92 0 19.78-9.26 19.78-23.37 0-13.9-7.6-23.37-19.78-23.37h-9.09v11.19c0 8.94-7.63 16.37-16.57 16.37H56.65c-7.4 0-13.43 6.03-13.43 13.43v20.72c0 8.93 9.97 13.43 21.4 13.43zm11.8-8.78a4.29 4.29 0 1 1 0-8.58 4.29 4.29 0 0 1 0 8.58z"
          fill="#FFD43B"
        />
      </svg>
    );
  }

  // 2. JavaScript (.js, .mjs, .cjs)
  if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
    return (
      <svg
        viewBox="0 0 128 128"
        className={className}
        style={style}
        aria-label="JavaScript"
      >
        <rect width="128" height="128" rx="20" fill="#F7DF1E" />
        <path
          d="M37.5 103.5c4.7 0 9.2-2.7 11.8-7.3l-10-6c-1.3 2.1-3.4 3.7-5.9 3.7-4 0-6.4-2.8-6.4-7.4V54.5h-13v32c0 10.3 6.9 17 23.5 17zm46.5 0c14.2 0 23.5-7.7 23.5-19.3 0-11.4-8.1-16.4-18.7-20.9l-3.3-1.4c-5.5-2.3-9-4.3-9-8.4 0-4.2 3.6-7.2 8.5-7.2 4.5 0 8.1 2.3 10.2 6.2l10.8-6.6c-4-7.4-11.2-11.3-21-11.3-13.3 0-21.7 8.3-21.7 18.7 0 11.2 7.7 16.1 17.5 20.3l3.3 1.4c6.3 2.7 10.2 4.9 10.2 9.5 0 5-4.4 8.2-10.4 8.2-6.5 0-11-3.8-13.3-8.8l-11 6.5c3.8 8.8 11.8 13.4 24.7 13.4z"
          fill="#000000"
        />
      </svg>
    );
  }

  // 3. TypeScript (.ts, .tsx)
  if (ext === ".ts" || ext === ".tsx") {
    return (
      <svg
        viewBox="0 0 128 128"
        className={className}
        style={style}
        aria-label="TypeScript"
      >
        <rect width="128" height="128" rx="20" fill="#3178C6" />
        <path
          d="M22 43.5h38v10H46.5v44h-11v-44H22v-10zm46 44.5l9.5-6.5c3 4.2 7.5 6.5 13.5 6.5 6.5 0 10.5-3.3 10.5-8 0-4.8-4-7-10.5-9.5l-3.5-1.5c-11-4.2-15-9.5-15-17.5 0-9.5 8-16 20.5-16 8.5 0 15 3.3 19 8.5l-9 7c-2.5-3-5.5-4.5-10-4.5-5.5 0-8.5 2.8-8.5 6.5 0 4 3 6 9.5 8.5l3.5 1.5c12 4.5 16 10 16 18.5 0 10.5-8.5 17.5-22.5 17.5-10.5 0-18.5-4.5-23-12.5z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 4. HTML (.html, .htm)
  if (ext === ".html" || ext === ".htm") {
    return (
      <svg
        viewBox="0 0 128 128"
        className={className}
        style={style}
        aria-label="HTML"
      >
        <path d="M19 113.3L8 0h112l-11 113.3L64 128z" fill="#E44D26" />
        <path d="M64 117.2l36.5-10.1 9.2-95.1H64z" fill="#F16529" />
        <path
          d="M64 54.5h20.1l-1.4 15.3H64v14.4l18.5-5.1.8-9.3h14.7l-2 22.8L64 104.7v-14.7l-18.5-5.1-.4-4.8H30.4l.8 9.3 32.8 9.1V54.5z"
          fill="#FFFFFF"
          fillOpacity="0.9"
        />
        <path
          d="M64 26.6h38.2l-1.4 15.3H64V26.6zM64 54.5v14.4H44.1l-.8-9.3-.5-5.1H64zM64 26.6v15.3H26.3L25 26.6H64z"
          fill="#EBEBEB"
        />
      </svg>
    );
  }

  // 5. CSS (.css, .scss, .sass, .less)
  if (ext === ".css" || ext === ".scss" || ext === ".sass" || ext === ".less") {
    return (
      <svg
        viewBox="0 0 128 128"
        className={className}
        style={style}
        aria-label="CSS"
      >
        <path d="M19 113.3L8 0h112l-11 113.3L64 128z" fill="#1572B6" />
        <path d="M64 117.2l36.5-10.1 9.2-95.1H64z" fill="#33A9DC" />
        <path
          d="M64 54.5h20.1l-1.4 15.3H64v14.4l18.5-5.1.8-9.3h14.7l-2 22.8L64 104.7v-14.7l-18.5-5.1-.4-4.8H30.4l.8 9.3 32.8 9.1V54.5z"
          fill="#FFFFFF"
          fillOpacity="0.9"
        />
        <path
          d="M64 26.6h38.2l-1.4 15.3H64V26.6zM64 54.5v14.4H44.1l-.8-9.3-.5-5.1H64zM64 26.6v15.3H26.3L25 26.6H64z"
          fill="#EBEBEB"
        />
      </svg>
    );
  }

  // 6. JSON (.json)
  if (ext === ".json") {
    return (
      <svg
        viewBox="0 0 128 128"
        className={className}
        style={style}
        aria-label="JSON"
      >
        <rect width="128" height="128" rx="20" fill="#20252E" />
        <rect
          x="6"
          y="6"
          width="116"
          height="116"
          rx="16"
          fill="none"
          stroke="#FBC02D"
          strokeWidth="6"
          strokeOpacity="0.8"
        />
        <text
          x="64"
          y="84"
          fontSize="58"
          fontWeight="bold"
          fontFamily="monospace"
          fill="#FBC02D"
          textAnchor="middle"
        >
          {"{ }"}
        </text>
      </svg>
    );
  }

  // 7. Markdown (.md, .markdown)
  if (ext === ".md" || ext === ".markdown" || lowerName === "readme") {
    return (
      <svg
        viewBox="0 0 128 128"
        className={className}
        style={style}
        aria-label="Markdown"
      >
        <rect width="128" height="128" rx="20" fill="#083FA1" />
        <path
          d="M20 38h18l12 15 12-15h18v52H65V60l-15 18-15-18v30H20V38zm74 0h14v28h14L101 90 80 66h14V38z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 8. Shell / Bash (.sh, .bash, .zsh)
  if (ext === ".sh" || ext === ".bash" || ext === ".zsh") {
    return (
      <svg
        viewBox="0 0 128 128"
        className={className}
        style={style}
        aria-label="Shell"
      >
        <rect width="128" height="128" rx="20" fill="#182234" />
        <rect
          x="4"
          y="4"
          width="120"
          height="120"
          rx="18"
          fill="none"
          stroke="#4EAA25"
          strokeWidth="6"
          strokeOpacity="0.6"
        />
        <path
          d="M30 42l24 22-24 22M62 86h36"
          stroke="#4EAA25"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // 9. SQL (.sql)
  if (ext === ".sql") {
    return (
      <svg
        viewBox="0 0 128 128"
        className={className}
        style={style}
        aria-label="SQL"
      >
        <rect width="128" height="128" rx="20" fill="#1A2230" />
        <ellipse cx="64" cy="36" rx="36" ry="14" fill="#E38C00" />
        <path
          d="M28 36v24c0 7.7 16.1 14 36 14s36-6.3 36-14V36"
          fill="none"
          stroke="#E38C00"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M28 60v24c0 7.7 16.1 14 36 14s36-6.3 36-14V60"
          fill="none"
          stroke="#E38C00"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Default: Generic document icon
  return (
    <svg
      viewBox="0 0 128 128"
      className={className}
      style={style}
      aria-label="File"
    >
      <rect width="128" height="128" rx="20" fill="#1F2633" />
      <path
        d="M36 28h38l22 22v50a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V34a6 6 0 0 1 6-6z"
        fill="#2B3648"
      />
      <path d="M74 28v22h22" fill="#3E4C63" />
      <path
        d="M44 64h40M44 78h40M44 92h26"
        stroke="#8B949E"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
};
