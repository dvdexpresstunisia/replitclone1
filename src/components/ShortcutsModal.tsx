import React from "react";
import { X, Keyboard, Sparkles, Terminal, Code2, Cpu } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Ctrl + Entrée / ⌘ + Entrée", action: "Exécuter le code actif (Run)" },
    { key: "Tab", action: "Indenter de 2 espaces sans quitter l'éditeur" },
    { key: "Shift + Tab", action: "Désindenter la ligne courante" },
    { key: "Ctrl + S / ⌘ + S", action: "Sauvegarder immédiatement" },
    { key: "Alt + ← / Alt + →", action: "Naviguer dans l'historique des fichiers (Fil d'Ariane)" },
    { key: "Onglets de projet", action: "Basculer instantanément entre projets ouverts (+ pour en ouvrir)" },
    { key: "Clic sur Fil d'Ariane", action: "Changer rapidement de fichier ou de projet" },
    { key: "Haut / Bas dans le terminal", action: "Naviguer dans l'historique des commandes" },
    { key: "(), {}, [], \"\", ''", action: "Fermeture automatique des parenthèses/guillemets" },
  ];

  const terminalCommands = [
    { cmd: "run [fichier]", desc: "Exécute le fichier courant ou spécifié" },
    { cmd: "python <fichier.py>", desc: "Lance l'interpréteur Python 3 WebAssembly" },
    { cmd: "node <fichier.js>", desc: "Exécute le script JavaScript" },
    { cmd: "ls", desc: "Liste tous les fichiers du projet et leur taille" },
    { cmd: "cat <fichier>", desc: "Affiche le contenu d'un fichier dans le terminal" },
    { cmd: "lint", desc: "Analyse en temps réel les erreurs de syntaxe du projet" },
    { cmd: "clear", desc: "Efface l'écran de la console" },
    { cmd: "ai <question>", desc: "Pose une question directe à l'IA depuis la ligne de commande" },
    { cmd: "git init", desc: "Initialise le dépôt Git dans le projet" },
    { cmd: "git status", desc: "Affiche l'état des fichiers (modifiés, indexés)" },
    { cmd: "git add .", desc: "Indexe tous les fichiers modifiés" },
    { cmd: "git commit -m \"msg\"", desc: "Enregistre un commit avec un message" },
    { cmd: "git log", desc: "Affiche l'historique complet des commits" },
    { cmd: "date", desc: "Affiche l'heure et la date" },
    { cmd: "help", desc: "Affiche l'aide des commandes disponibles" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#141924] border border-[#2b3548] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-xs text-gray-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#252e3e] flex items-center justify-between bg-[#10141d]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#f26207]/20 border border-[#f26207]/30 flex items-center justify-center text-[#f26207]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Raccourcis & Guide RepliLite</h2>
              <p className="text-[11px] text-gray-400">Clone Replit avec éditeur & terminal WebAssembly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#1f2738] text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-5">
          {/* Shortcuts table */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#f26207] mb-2 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              <span>Raccourcis Clavier de l'Éditeur</span>
            </div>
            <div className="bg-[#0e121a] rounded-lg border border-[#232c3c] divide-y divide-[#1e2634]">
              {shortcuts.map((sc, i) => (
                <div key={i} className="px-3 py-2 flex items-center justify-between">
                  <span className="text-gray-300">{sc.action}</span>
                  <kbd className="px-2 py-0.5 bg-[#1a212e] text-gray-300 rounded font-mono text-[10px] border border-[#2b3548] shadow-xs">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal commands */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Commandes Shell Disponibles</span>
            </div>
            <div className="bg-[#0e121a] rounded-lg border border-[#232c3c] divide-y divide-[#1e2634]">
              {terminalCommands.map((tc, i) => (
                <div key={i} className="px-3 py-1.5 flex items-center justify-between">
                  <code className="text-emerald-400 font-mono font-semibold">{tc.cmd}</code>
                  <span className="text-gray-400 text-[11px]">{tc.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Providers Info */}
          <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-purple-300 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Moteurs d'IA Gratuits Intégrés</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              • <strong>Google Gemini (gemini-3.8-flash)</strong> : Rapide, précis, idéal pour expliquer le code, débugger les erreurs de terminal et générer des fonctions.
              <br />
              • <strong>Hugging Face Inference API</strong> : Modèles open-source pour le code avec compatibilité token HF.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#252e3e] bg-[#10141d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#f26207] hover:bg-[#ff771f] text-white font-semibold text-xs shadow-md transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
