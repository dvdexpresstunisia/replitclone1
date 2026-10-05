import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "5mb" }));

// Initialize Google Gemini SDK with required telemetry headers
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Fallback helper for Gemini models in case of high demand spikes
async function generateGeminiWithFallback(
  aiInstance: GoogleGenAI,
  config: {
    contents: any;
    systemInstruction?: string;
    temperature?: number;
  }
) {
  const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const res = await aiInstance.models.generateContent({
        model,
        contents: config.contents,
        config: {
          systemInstruction: config.systemInstruction,
          temperature: config.temperature ?? 0.3,
        },
      });
      if (res && res.text) {
        return res;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, attempting next fallback...`, err?.message || err);
    }
  }

  throw lastError;
}
app.get("/api/status", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(geminiApiKey),
    providers: ["gemini", "huggingface", "ollama", "opencode", "freellm"],
    defaultModel: "gemini-3.8-flash",
  });
});

// Helper for Ollama (Local AI)
async function callOllama(params: {
  prompt: string;
  systemInstruction?: string;
  url?: string;
  model?: string;
}) {
  const baseUrl = (params.url || "http://localhost:11434").replace(/\/+$/, "");
  const model = params.model || "qwen2.5-coder";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          ...(params.systemInstruction
            ? [{ role: "system", content: params.systemInstruction }]
            : []),
          { role: "user", content: params.prompt },
        ],
        stream: false,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`Ollama (${res.status}): ${errTxt}`);
    }

    const data = await res.json();
    return data.message?.content || JSON.stringify(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Délai d'attente dépassé (timeout) pour Ollama sur ${baseUrl}.`);
    }
    throw new Error(
      `Connexion locale à Ollama impossible sur ${baseUrl} : ${err.message}. Assurez-vous qu'Ollama est démarré (ex: 'ollama run ${model}' ou 'ollama serve').`
    );
  }
}

// Helper for OpenCode / LM Studio / LocalAI (OpenAI-compatible local server)
async function callOpenCode(params: {
  prompt: string;
  systemInstruction?: string;
  url?: string;
  model?: string;
  apiKey?: string;
}) {
  const baseUrl = (params.url || "http://localhost:1234/v1").replace(/\/+$/, "");
  const model = params.model || "local-model";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (params.apiKey) {
      headers["Authorization"] = `Bearer ${params.apiKey}`;
    }

    const endpoint = baseUrl.endsWith("/chat/completions")
      ? baseUrl
      : `${baseUrl}/chat/completions`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          ...(params.systemInstruction
            ? [{ role: "system", content: params.systemInstruction }]
            : []),
          { role: "user", content: params.prompt },
        ],
        temperature: 0.2,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`OpenCode (${res.status}): ${errTxt}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || JSON.stringify(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new Error(
      `Connexion impossible au serveur OpenCode / OpenAI local sur ${baseUrl} : ${err.message}.`
    );
  }
}

// Helper for FreeLLM API (Zero API key open router with fallback)
async function callFreeLLM(params: {
  prompt: string;
  systemInstruction?: string;
  model?: string;
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        messages: [
          ...(params.systemInstruction
            ? [{ role: "system", content: params.systemInstruction }]
            : []),
          { role: "user", content: params.prompt },
        ],
        model: "openai-fast",
      }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes("budget") && text !== "{}") {
        return text;
      }
    }
  } catch (_e) {
    clearTimeout(timeoutId);
  }

  // Graceful fallback to Gemini free tier if public router is rate-limited
  if (ai) {
    const geminiRes = await generateGeminiWithFallback(ai, {
      contents: [{ role: "user", parts: [{ text: params.prompt }] }],
      systemInstruction: params.systemInstruction,
    });
    return geminiRes.text || "Réponse générée avec succès.";
  }

  throw new Error("FreeLLM temporairement indisponible.");
}

// Test connection endpoint for local AIs
app.post("/api/ai/test-connection", async (req, res) => {
  const { provider, url, model } = req.body;
  try {
    if (provider === "ollama") {
      const targetUrl = (url || "http://localhost:11434").replace(/\/+$/, "");
      const testRes = await fetch(`${targetUrl}/api/tags`, { method: "GET" });
      if (!testRes.ok) throw new Error(`Status ${testRes.status}`);
      const data = await testRes.json();
      return res.json({
        ok: true,
        message: `Ollama connecté avec succès ! Modèles détectés: ${(data.models || []).map((m: any) => m.name).join(", ") || "aucun"}`,
      });
    }

    if (provider === "opencode") {
      const targetUrl = (url || "http://localhost:1234/v1").replace(/\/+$/, "");
      const testRes = await fetch(`${targetUrl}/models`, { method: "GET" });
      if (!testRes.ok) throw new Error(`Status ${testRes.status}`);
      return res.json({
        ok: true,
        message: "Serveur OpenCode / LM Studio local connecté !",
      });
    }

    if (provider === "freellm") {
      const testText = await callFreeLLM({ prompt: "ping", model: "qwen-coder" });
      return res.json({
        ok: true,
        message: `FreeLLM API opérationnel : ${testText.slice(0, 50)}...`,
      });
    }

    return res.json({ ok: true, message: `Fournisseur ${provider} prêt.` });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: `Test échoué : ${err.message}`,
    });
  }
});

// Helper for Hugging Face Inference API calls
async function callHuggingFace(params: {
  prompt: string;
  systemInstruction?: string;
  hfToken?: string;
  model?: string;
}) {
  const model = params.model || "Qwen/Qwen2.5-Coder-7B-Instruct";
  const url = `https://api-inference.huggingface.co/models/${model}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (params.hfToken) {
    headers["Authorization"] = `Bearer ${params.hfToken}`;
  }

  const promptText = params.systemInstruction
    ? `<|im_start|>system\n${params.systemInstruction}<|im_end|>\n<|im_start|>user\n${params.prompt}<|im_end|>\n<|im_start|>assistant\n`
    : params.prompt;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      inputs: promptText,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.2,
        return_full_text: false,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Hugging Face API returned error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  }
  if (typeof data?.generated_text === "string") {
    return data.generated_text;
  }
  return JSON.stringify(data);
}

// AI Pair Programmer Chat Endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const {
      messages,
      activeFile,
      files,
      provider = "gemini",
      hfToken,
      localUrl,
      localModel,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const filesContext = Array.isArray(files)
      ? files
          .map((f: { name: string; content: string }) => `--- Fichier: ${f.name} ---\n${f.content.slice(0, 3000)}`)
          .join("\n\n")
      : "";

    const systemInstruction = `Tu es l'assistant de programmation IA intégré de RepliLite (clone moderne de Replit).
Tu aides l'utilisateur à coder, comprendre, débugger, refactoriser et concevoir des applications.
Sois concis, pragmatique et expert. Lorsque tu proposes du code, écris du code propre, prêt à l'emploi.
Réponds en français avec clarté, ou dans la langue de la question.

Contexte de l'espace de travail:
${filesContext ? `Fichiers du projet actuels:\n${filesContext}\n` : "Aucun fichier fourni."}
${activeFile ? `Fichier actuellement ouvert: ${activeFile.name}\n` : ""}
`;

    const conversationHistory = messages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Utilisateur" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    // Ollama Local Provider
    if (provider === "ollama") {
      try {
        const reply = await callOllama({
          prompt: `${conversationHistory}\n\nAssistant:`,
          systemInstruction,
          url: localUrl,
          model: localModel,
        });
        return res.json({ reply, provider: "ollama" });
      } catch (err: any) {
        return res.status(502).json({ error: err.message });
      }
    }

    // OpenCode / Local OpenAI API (LM Studio, LocalAI)
    if (provider === "opencode") {
      try {
        const reply = await callOpenCode({
          prompt: `${conversationHistory}\n\nAssistant:`,
          systemInstruction,
          url: localUrl,
          model: localModel,
        });
        return res.json({ reply, provider: "opencode" });
      } catch (err: any) {
        return res.status(502).json({ error: err.message });
      }
    }

    // FreeLLM API (Zero API key open router)
    if (provider === "freellm") {
      try {
        const reply = await callFreeLLM({
          prompt: `${conversationHistory}\n\nAssistant:`,
          systemInstruction,
          model: localModel || "qwen-coder",
        });
        return res.json({ reply, provider: "freellm" });
      } catch (err: any) {
        return res.status(502).json({ error: err.message });
      }
    }

    // Hugging Face Provider
    if (provider === "huggingface") {
      try {
        const reply = await callHuggingFace({
          prompt: `${conversationHistory}\n\nAssistant:`,
          systemInstruction,
          hfToken,
        });
        return res.json({ reply, provider: "huggingface" });
      } catch (hfErr: any) {
        if (ai) {
          console.warn("Hugging Face error, falling back to Gemini:", hfErr.message);
        } else {
          return res.status(502).json({ error: hfErr.message || "Erreur Hugging Face API" });
        }
      }
    }

    // Default: Gemini API using gemini-3.8-flash
    if (!ai) {
      return res.status(500).json({
        error: "Clé API Gemini non configurée dans l'environnement serveur.",
      });
    }

    // Build contents for generateContent
    const formattedHistory = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await generateGeminiWithFallback(ai, {
      contents: formattedHistory,
      systemInstruction,
      temperature: 0.3,
    });

    const reply = response.text || "Aucune réponse générée.";
    return res.json({ reply, provider: "gemini" });
  } catch (error: any) {
    console.error("Erreur /api/ai/chat:", error);
    return res.status(500).json({
      error: error?.message || "Erreur interne lors de l'appel IA.",
    });
  }
});

// Ghostwriter / Inline Code Actions Endpoint
app.post("/api/ai/ghostwriter", async (req, res) => {
  try {
    const {
      action, // 'generate' | 'fix' | 'explain' | 'optimize' | 'tests' | 'custom'
      prompt,
      currentCode = "",
      fileName = "code",
      language = "javascript",
      errorOutput = "",
      provider = "gemini",
      hfToken,
      localUrl,
      localModel,
    } = req.body;

    let systemInstruction = "Tu es l'agent Ghostwriter et moteur d'assistance de code pour RepliLite.";
    let userPrompt = "";

    switch (action) {
      case "fix":
        systemInstruction += " Tu es un expert en débogage de code. Analyse l'erreur et le code source, et fournis la version corrigée.";
        userPrompt = `Fichier: ${fileName} (${language})
Code actuel:
\`\`\`${language}
${currentCode}
\`\`\`

Erreur / Sortie du terminal:
\`\`\`
${errorOutput || "Erreur non spécifiée"}
\`\`\`

Instructions supplémentaires: ${prompt || "Corrige l'erreur et explique brièvement le correctif."}
Renvoie:
1. Une explication très courte du bug.
2. Le bloc de code complet corrigé dans un bloc de code markdown.`;
        break;

      case "explain":
        systemInstruction += " Tu es un enseignant et ingénieur senior. Explique le code de manière limpide, concise et structurée.";
        userPrompt = `Explique ce code (${fileName}, langage: ${language}):
\`\`\`${language}
${currentCode}
\`\`\`
Détaille les points clés, la complexité si pertinente, et les cas d'utilisation.`;
        break;

      case "optimize":
        systemInstruction += " Tu es un expert en optimisation de code (performance, lisibilité, idiomes modernes).";
        userPrompt = `Optimise et refactorise ce code (${fileName}, ${language}):
\`\`\`${language}
${currentCode}
\`\`\`
Conserve la même logique métier mais rends le code plus élégant, performant et propre.
Fournis le code complet optimisé ainsi qu'un résumé des améliorations.`;
        break;

      case "tests":
        systemInstruction += " Tu es un ingénieur QA et testeur automatisé expert.";
        userPrompt = `Écris une suite de tests unitaires complète et robuste pour ce code (${fileName}, ${language}):
\`\`\`${language}
${currentCode}
\`\`\`
Inclus les cas normaux et les cas limites (edge cases).`;
        break;

      case "analyze":
        systemInstruction += " Tu es un ingénieur logiciel senior et analyste de code IA. Tu synthétises de manière limpide et concise le rôle d'un fichier et ses fonctions clés.";
        userPrompt = `Analyse le fichier '${fileName}' (${language}):
\`\`\`${language}
${currentCode.slice(0, 15000)}
\`\`\`

Rédige une synthèse concise, élégante et structurée en français selon ce format exact :
### 🎯 Objectif du fichier
[1 à 2 phrases précises expliquant le rôle et la finalité de ce fichier]

### ⚡ Fonctions & Éléments clés
[3 à 5 puces décrivant les fonctions, classes ou blocs principaux et leur utilité]

### 📦 Architecture & Dépendances
[Bibliothèques importées et intégration dans l'application]

### 💡 Points d'attention
[Une remarque technique concise sur la qualité, la performance ou l'extensibilité]`;
        break;

      case "generate":
      default:
        systemInstruction += " Tu écris du code propre, moderne et immédiatement exécutable.";
        userPrompt = `Écris le code correspondant à la demande suivante dans le fichier ${fileName} (${language}):
Demande: ${prompt}

${currentCode ? `Code existant dans le fichier:\n\`\`\`${language}\n${currentCode}\n\`\`\`\n` : ""}
Fournis le code prêt à l'emploi.`;
        break;
    }

    // Ollama Local Provider
    if (provider === "ollama") {
      try {
        const result = await callOllama({
          prompt: userPrompt,
          systemInstruction,
          url: localUrl,
          model: localModel,
        });
        return res.json({ result, provider: "ollama" });
      } catch (err: any) {
        return res.status(502).json({ error: err.message });
      }
    }

    // OpenCode / Local OpenAI API (LM Studio, LocalAI)
    if (provider === "opencode") {
      try {
        const result = await callOpenCode({
          prompt: userPrompt,
          systemInstruction,
          url: localUrl,
          model: localModel,
        });
        return res.json({ result, provider: "opencode" });
      } catch (err: any) {
        return res.status(502).json({ error: err.message });
      }
    }

    // FreeLLM API (Zero API key open router)
    if (provider === "freellm") {
      try {
        const result = await callFreeLLM({
          prompt: userPrompt,
          systemInstruction,
          model: localModel || "qwen-coder",
        });
        return res.json({ result, provider: "freellm" });
      } catch (err: any) {
        return res.status(502).json({ error: err.message });
      }
    }

    if (provider === "huggingface") {
      try {
        const result = await callHuggingFace({
          prompt: userPrompt,
          systemInstruction,
          hfToken,
        });
        return res.json({ result, provider: "huggingface" });
      } catch (hfErr: any) {
        if (!ai) {
          return res.status(502).json({ error: hfErr.message });
        }
        console.warn("Hugging Face failed, falling back to Gemini:", hfErr.message);
      }
    }

    if (!ai) {
      return res.status(500).json({
        error: "Clé API Gemini non configurée dans l'environnement serveur.",
      });
    }

    const response = await generateGeminiWithFallback(ai, {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction,
      temperature: 0.2,
    });

    const result = response.text || "Aucune réponse générée.";
    return res.json({ result, provider: "gemini" });
  } catch (error: any) {
    console.error("Erreur /api/ai/ghostwriter:", error);
    return res.status(500).json({
      error: error?.message || "Erreur interne lors de l'exécution de l'assistant.",
    });
  }
});

// Dedicated AI File Analysis Endpoint using Gemini
app.post("/api/ai/analyze-file", async (req, res) => {
  try {
    const { fileName = "fichier", content = "", language = "text" } = req.body;

    const systemInstruction =
      "Tu es un ingénieur logiciel principal et analyste d'architecture de code IA. Tu rédiges des synthèses claires, concises et professionnelles du rôle du fichier et de ses fonctions clés.";

    const userPrompt = `Analyse le fichier '${fileName}' (langage: ${language}) :
\`\`\`${language}
${content.slice(0, 18000)}
\`\`\`

Rédige une analyse synthétique structurée en français avec le format exact suivant :
### 🎯 Objectif du fichier
Explique en 1 à 2 phrases précises la raison d'être et le rôle de ce fichier dans l'application.

### ⚡ Fonctions & Éléments clés
- Liste à puces des fonctions, classes ou variables exported/essentielles avec une explication succincte de ce qu'elles font.

### 📦 Architecture & Dépendances
Mentionne les modules ou dépendances clés utilisés et comment ce fichier s'intègre au reste du projet.

### 💡 Points clés & Suggestions
1 remarque technique ou conseil d'amélioration rapide.`;

    if (!ai) {
      const lines = content.split("\n").length;
      return res.json({
        summary: `### 🎯 Objectif du fichier\nLe fichier \`${fileName}\` contient la logique ${language} (${lines} lignes) du projet.\n\n### ⚡ Fonctions & Éléments clés\n• Structure principale et déclarations de module.\n• Traitement des données et routines d'exécution.\n\n### 📦 Architecture & Dépendances\nFichier source interne au workspace RepliLite.`,
        provider: "fallback",
      });
    }

    const response = await generateGeminiWithFallback(ai, {
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      systemInstruction,
      temperature: 0.2,
    });

    const summary = response.text || "Analyse indisponible.";
    return res.json({ summary, provider: "gemini" });
  } catch (error: any) {
    console.error("Erreur /api/ai/analyze-file:", error);
    return res.status(500).json({
      error: error?.message || "Erreur lors de l'analyse du fichier par Gemini.",
    });
  }
});

// Dedicated Gemini Multi-Turn Chatbot Endpoint
// Models: gemini-3.5-flash (general), gemini-3.1-flash-lite (fast), gemini-3.1-pro-preview (complex)
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const {
      messages,
      model = "gemini-3.5-flash",
      systemInstruction = "Tu es l'assistant de programmation officiel de RepliLite. Sois concis, pragmatique et donne du code propre et prêt à exécuter.",
      activeFile,
      files,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Le tableau de messages est requis." });
    }

    if (!ai) {
      return res.status(500).json({
        error: "Clé API Gemini non configurée dans l'environnement serveur.",
      });
    }

    // Context from files and active workspace
    const filesContext = Array.isArray(files)
      ? files
          .map((f: { name: string; content: string }) => `--- Fichier: ${f.name} ---\n${f.content.slice(0, 3000)}`)
          .join("\n\n")
      : "";

    const enrichedSystemInstruction = `${systemInstruction}

[Contexte du projet RepliLite]
${activeFile ? `Fichier actif: ${activeFile.name}\n` : ""}
${filesContext ? `Fichiers du projet:\n${filesContext}\n` : ""}
`;

    // Map messages to format expected by @google/genai ({ role: "user" | "model", parts: [{ text }] })
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // Choose requested model (with fallback)
    const validModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
    const targetModel = validModels.includes(model) ? model : "gemini-3.5-flash";

    let response;
    try {
      response = await ai.models.generateContent({
        model: targetModel,
        contents: formattedContents,
        config: {
          systemInstruction: enrichedSystemInstruction,
          temperature: 0.3,
        },
      });
    } catch (modelErr: any) {
      console.warn(`Model ${targetModel} error, trying fallback to gemini-3.5-flash:`, modelErr?.message || modelErr);
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: enrichedSystemInstruction,
          temperature: 0.3,
        },
      });
    }

    const reply = response.text || "Aucune réponse générée.";
    return res.json({ reply, model: targetModel });
  } catch (err: any) {
    console.error("Erreur /api/gemini/chat:", err);
    return res.status(500).json({ error: err.message || "Erreur interne lors de l'appel Gemini." });
  }
});

// Configure Vite in development or static serve in production
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);

  // Setup WebSocket server for Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: "/api/live" });

  wss.on("connection", async (clientWs: WebSocket) => {
    console.log("Client connected to Gemini Live WebSocket (/api/live)");

    if (!ai) {
      clientWs.send(JSON.stringify({ type: "error", error: "Clé API Gemini non configurée sur le serveur." }));
      clientWs.close();
      return;
    }

    let session: any = null;

    try {
      session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction:
            "Tu es l'assistant vocal IA interactif de RepliLite. Réponds aux questions de façon naturelle, concise et vivante en français.",
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (audio) {
              clientWs.send(JSON.stringify({ type: "audio", audio }));
            }
            if (text) {
              clientWs.send(JSON.stringify({ type: "text", text }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close();
            }
          },
          onerror: (err: any) => {
            console.warn("Live API session error:", err?.message || err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({ type: "error", error: err?.message || "Erreur de session Live" })
              );
            }
          },
        },
      });

      clientWs.on("message", (raw) => {
        try {
          const payload = JSON.parse(raw.toString());
          if (payload.audio && session) {
            session.sendRealtimeInput({
              audio: { data: payload.audio, mimeType: "audio/pcm;rate=16000" },
            });
          } else if (payload.text && session) {
            session.send({
              clientContent: {
                turns: [{ role: "user", parts: [{ text: payload.text }] }],
                turnComplete: true,
              },
            });
          }
        } catch (msgErr) {
          console.warn("Error processing Live WS client message:", msgErr);
        }
      });

      clientWs.on("close", () => {
        if (session) {
          try {
            session.close();
          } catch {}
        }
      });
    } catch (connectErr: any) {
      console.error("Failed to initialize Gemini Live session:", connectErr);
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: connectErr?.message || "Impossible de démarrer la session vocale Live API.",
        })
      );
      clientWs.close();
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`RepliLite server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
