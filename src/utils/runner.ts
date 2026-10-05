import { ProjectFile } from "../types";

let pyodidePromise: Promise<any> | null = null;
let pyodideInstance: any = null;

/**
 * Loads Pyodide dynamically from CDN for genuine client-side WebAssembly Python 3 execution
 */
export async function loadPyodideEngine(onStatus?: (msg: string) => void): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (pyodidePromise) {
    return pyodidePromise;
  }

  pyodidePromise = new Promise(async (resolve, reject) => {
    try {
      if (onStatus) onStatus("Téléchargement du moteur Python 3 (WebAssembly)...");

      // Check if script already on page
      if (!(window as any).loadPyodide) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.async = true;
        document.head.appendChild(script);

        await new Promise((res, rej) => {
          script.onload = res;
          script.onerror = () => rej(new Error("Impossible de charger Pyodide depuis le CDN."));
        });
      }

      if (onStatus) onStatus("Initialisation de l'interpréteur Python...");
      const pyodide = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
      });

      pyodideInstance = pyodide;
      resolve(pyodide);
    } catch (err) {
      pyodidePromise = null;
      reject(err);
    }
  });

  return pyodidePromise;
}

/**
 * Executes Python code using Pyodide
 */
export async function runPythonCode(
  code: string,
  allFiles: ProjectFile[],
  options: {
    onStdout: (text: string) => void;
    onStderr: (text: string) => void;
    onStatus?: (status: string) => void;
  }
) {
  const pyodide = await loadPyodideEngine(options.onStatus);

  // Sync workspace files into Pyodide virtual filesystem so `import ...` works
  try {
    for (const f of allFiles) {
      pyodide.FS.writeFile(f.name, f.content);
    }
  } catch (fsErr) {
    console.warn("Could not sync all files to Pyodide FS", fsErr);
  }

  // Set stdout / stderr handlers
  pyodide.setStdout({
    batched: (text: string) => {
      options.onStdout(text);
    },
  });

  pyodide.setStderr({
    batched: (text: string) => {
      options.onStderr(text);
    },
  });

  try {
    const result = await pyodide.runPythonAsync(code);
    if (result !== undefined && result !== null) {
      // If Python returned an expression value
      const resultStr = String(result);
      if (resultStr && resultStr !== "None") {
        options.onStdout(`=> ${resultStr}`);
      }
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    options.onStderr(errMsg);
    throw err;
  }
}

/**
 * Executes JavaScript in an isolated async context capturing console calls
 */
export async function runJavaScriptCode(
  code: string,
  options: {
    onStdout: (text: string) => void;
    onStderr: (text: string) => void;
  }
) {
  const formatArg = (arg: any): string => {
    if (typeof arg === "string") return arg;
    if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  };

  const customConsole = {
    log: (...args: any[]) => {
      options.onStdout(args.map(formatArg).join(" "));
    },
    info: (...args: any[]) => {
      options.onStdout(args.map(formatArg).join(" "));
    },
    warn: (...args: any[]) => {
      options.onStdout(`⚠️ ${args.map(formatArg).join(" ")}`);
    },
    error: (...args: any[]) => {
      options.onStderr(`❌ ${args.map(formatArg).join(" ")}`);
    },
    dir: (arg: any) => {
      options.onStdout(formatArg(arg));
    },
    table: (data: any) => {
      options.onStdout(formatArg(data));
    },
  };

  try {
    // Wrap code in async function
    const wrappedCode = `
      return (async function(console) {
        ${code}
      })(customConsole);
    `;

    // Execute
    const fn = new Function("customConsole", wrappedCode);
    const result = await fn(customConsole);

    if (result !== undefined) {
      options.onStdout(`=> ${formatArg(result)}`);
    }
  } catch (err: any) {
    options.onStderr(`Error: ${err?.message || String(err)}`);
    throw err;
  }
}

/**
 * Builds HTML document with bundled CSS and JS for Webview preview
 */
export function buildWebviewDocument(files: ProjectFile[]): string {
  const htmlFile = files.find((f) => f.name.endsWith(".html") || f.name.endsWith(".htm"));
  const cssFiles = files.filter((f) => f.name.endsWith(".css"));
  const jsFiles = files.filter((f) => f.name.endsWith(".js") && !f.name.endsWith(".json"));

  let htmlContent = htmlFile?.content || "<!DOCTYPE html><html><body><h1>Aucun fichier HTML trouvé</h1></body></html>";
  const cssBundle = cssFiles.map((f) => f.content).join("\n\n");
  const jsBundle = jsFiles.map((f) => f.content).join("\n\n");

  // Console relay script to post back to parent
  const relayScript = `
    <script>
      (function() {
        const _log = console.log;
        const _error = console.error;
        const _warn = console.warn;
        
        function send(type, args) {
          try {
            window.parent.postMessage({
              source: 'replilite-preview',
              type: type,
              message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }, '*');
          } catch(e) {}
        }

        console.log = function(...args) { _log.apply(console, args); send('stdout', args); };
        console.error = function(...args) { _error.apply(console, args); send('stderr', args); };
        console.warn = function(...args) { _warn.apply(console, args); send('warn', args); };

        window.onerror = function(msg, url, line) {
          send('stderr', ['Erreur (' + line + '): ' + msg]);
        };
      })();
    </script>
  `;

  // Inject CSS inside head
  if (cssBundle) {
    if (htmlContent.includes("</head>")) {
      htmlContent = htmlContent.replace("</head>", `<style>${cssBundle}</style></head>`);
    } else {
      htmlContent = `<style>${cssBundle}</style>` + htmlContent;
    }
  }

  // Inject console relay and JS script
  if (htmlContent.includes("</body>")) {
    htmlContent = htmlContent.replace("</body>", `${relayScript}<script>${jsBundle}</script></body>`);
  } else {
    htmlContent += `${relayScript}<script>${jsBundle}</script>`;
  }

  return htmlContent;
}
