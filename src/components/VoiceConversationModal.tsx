import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Radio,
  Square,
  AlertCircle,
  FileCode,
  CornerDownLeft,
  Send
} from "lucide-react";
import { ProjectFile } from "../types";

interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile: ProjectFile | null;
  files: ProjectFile[];
}

interface TranscriptItem {
  id: string;
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
}

export const VoiceConversationModal: React.FC<VoiceConversationModalProps> = ({
  isOpen,
  onClose,
  activeFile,
  files,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [statusText, setStatusText] = useState("Prêt à démarrer");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    {
      id: "t-init",
      sender: "gemini",
      text: "Bonjour ! Je suis Gemini en direct (gemini-3.8-live). Posez-moi vos questions à voix haute sur votre code ou votre projet.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [textInput, setTextInput] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopVoiceSession();
    }
    return () => {
      stopVoiceSession();
    };
  }, [isOpen]);

  const startVoiceSession = async () => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);
      setStatusText("Connexion à Gemini Live (gemini-3.8-live)...");

      // Setup WebSocket connection to backend live bridge
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Audio contexts: 16kHz for input (Gemini standard), 24kHz for output
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatusText("Session Live active • En écoute");

        // Send initial context about active project and files
        const projectSummary = `Fichier actif: ${activeFile ? activeFile.name : "aucun"}\nContenu du fichier:\n${
          activeFile ? activeFile.content.slice(0, 2000) : ""
        }`;
        ws.send(JSON.stringify({ text: `[Contexte du projet RepliLite]: ${projectSummary}` }));

        // Start processing microphone audio
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (isMuted) return;

          const inputData = e.inputBuffer.getChannelData(0);

          // Detect user speech volume
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          const avg = sum / inputData.length;
          setIsUserSpeaking(avg > 0.02);

          // Convert Float32 to 16-bit PCM little-endian
          const pcmBuffer = floatTo16BitPCM(inputData);
          const base64Audio = arrayBufferToBase64(pcmBuffer);

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "audio" && data.audio) {
            setIsSpeaking(true);
            setStatusText("🔊 Gemini vous répond en direct...");
            playAudioChunk(outputCtx, data.audio);
          }

          if (data.type === "text" && data.text) {
            setTranscripts((prev) => [
              ...prev,
              {
                id: `t-${Date.now()}-${Math.random()}`,
                sender: "gemini",
                text: data.text,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }

          if (data.type === "interrupted") {
            setIsSpeaking(false);
            setStatusText("Interrompu • En écoute...");
          }

          if (data.type === "error") {
            setErrorMessage(data.error);
            setStatusText("Erreur lors de la session");
          }
        } catch (err) {
          console.warn("Error handling live WS message", err);
        }
      };

      ws.onerror = (e) => {
        console.error("Live WebSocket error:", e);
        setErrorMessage("Erreur de connexion avec le service Gemini Live.");
        stopVoiceSession();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatusText("Session terminée");
      };
    } catch (err: any) {
      console.error("Could not start voice session:", err);
      setErrorMessage(
        err.message || "Impossible d'accéder au microphone ou de démarrer la session vocale."
      );
      stopVoiceSession();
    }
  };

  const stopVoiceSession = () => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setIsUserSpeaking(false);
    setStatusText("Session arrêtée");
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ text: textInput.trim() }));
    setTranscripts((prev) => [
      ...prev,
      {
        id: `t-user-${Date.now()}`,
        sender: "user",
        text: textInput.trim(),
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setTextInput("");
  };

  // Utilities for Audio PCM conversion
  function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const output = new DataView(new ArrayBuffer(input.length * 2));
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return output.buffer;
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function playAudioChunk(audioCtx: AudioContext, base64PCM: string) {
    try {
      const binaryString = atob(base64PCM);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const dataView = new DataView(bytes.buffer);
      const numSamples = Math.floor(len / 2);
      const float32Array = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / (int16 < 0 ? 32768 : 32767);
      }

      const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();

      source.onended = () => {
        setIsSpeaking(false);
      };
    } catch (playbackErr) {
      console.warn("Could not play audio chunk", playbackErr);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#10141d] border border-[#273244] rounded-2xl w-full max-w-2xl h-[82vh] shadow-2xl flex flex-col overflow-hidden text-xs text-gray-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#141924] border-b border-[#232c3d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Conversation Vocale Live</h3>
                <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.2 rounded font-mono font-semibold">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Parlez naturellement avec Gemini et obtenez des réponses audio en temps réel
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopVoiceSession();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-[#20293b] text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Central Visualizer Area */}
        <div className="bg-[#0b0e15] border-b border-[#1f2736] p-6 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
          {/* Ambient Glow */}
          <div
            className={`absolute w-72 h-72 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none ${
              isSpeaking
                ? "bg-purple-600/20 opacity-100"
                : isUserSpeaking
                ? "bg-emerald-600/20 opacity-100"
                : isConnected
                ? "bg-blue-600/10 opacity-70"
                : "bg-gray-600/5 opacity-30"
            }`}
          />

          {/* Central Animated Mic Orb */}
          <div className="relative z-10 flex flex-col items-center space-y-3">
            <div className="relative">
              {/* Pulsing rings when speaking */}
              {isSpeaking && (
                <div className="absolute -inset-3 rounded-full bg-purple-500/30 animate-ping pointer-events-none" />
              )}
              {isUserSpeaking && (
                <div className="absolute -inset-3 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
              )}

              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-2 transition-all duration-300 ${
                  isSpeaking
                    ? "bg-gradient-to-tr from-purple-600 to-indigo-600 border-purple-300 text-white scale-105"
                    : isUserSpeaking
                    ? "bg-gradient-to-tr from-emerald-600 to-teal-600 border-emerald-300 text-white scale-105"
                    : isConnected
                    ? "bg-[#182130] border-[#313f56] text-blue-400"
                    : "bg-[#141a24] border-[#252f40] text-gray-500"
                }`}
              >
                {isSpeaking ? (
                  <Volume2 className="w-8 h-8 animate-bounce" />
                ) : isMuted ? (
                  <MicOff className="w-8 h-8 text-red-400" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                }`}
              />
              <span className="font-medium text-xs text-gray-300">{statusText}</span>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-red-300 bg-red-950/50 border border-red-800/60 px-3 py-1.5 rounded-lg max-w-md text-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex items-center gap-2 pt-2">
              {!isConnected ? (
                <button
                  onClick={startVoiceSession}
                  disabled={isConnecting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                  <span>{isConnecting ? "Connexion..." : "Démarrer la conversation"}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Réactiver le micro" : "Couper le micro"}
                    className={`px-3 py-2 rounded-xl border font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                      isMuted
                        ? "bg-red-950/70 border-red-700 text-red-300 hover:bg-red-900"
                        : "bg-[#182130] border-[#2c394d] text-gray-200 hover:bg-[#202c40]"
                    }`}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isMuted ? "Micro coupé" : "Muet"}</span>
                  </button>

                  <button
                    onClick={stopVoiceSession}
                    className="px-4 py-2 rounded-xl bg-[#261822] hover:bg-red-950/80 text-red-300 border border-red-800/60 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Square className="w-3.5 h-3.5 text-red-400" />
                    <span>Arrêter</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0c1017]">
          <div className="px-4 py-2 border-b border-[#1d2533] flex items-center justify-between text-[11px] text-gray-400 font-semibold tracking-wider uppercase">
            <span>Transcription des échanges en direct</span>
            {activeFile && (
              <span className="flex items-center gap-1 text-gray-500 font-mono text-[10px] lowercase">
                <FileCode className="w-3 h-3 text-[#f26207]" />
                {activeFile.name}
              </span>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcripts.map((t) => (
              <div
                key={t.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  t.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                    t.sender === "user"
                      ? "bg-[#f26207] text-white"
                      : "bg-purple-600 text-white"
                  }`}
                >
                  {t.sender === "user" ? "U" : "AI"}
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    t.sender === "user"
                      ? "bg-[#1f2838] text-gray-100 rounded-tr-xs border border-[#2b374c]"
                      : "bg-[#141a25] text-gray-200 rounded-tl-xs border border-[#232b3a]"
                  }`}
                >
                  <div>{t.text}</div>
                  <div className="text-[10px] text-gray-500 mt-1 text-right">{t.timestamp}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Optional Text fallback input while in voice session */}
          {isConnected && (
            <form
              onSubmit={handleSendTextMessage}
              className="p-2 bg-[#121620] border-t border-[#1d2533] flex items-center gap-2"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ou tapez un message texte pour Gemini Live..."
                className="flex-1 bg-[#18202d] text-xs text-gray-200 px-3 py-1.5 rounded-lg border border-[#293448] focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
