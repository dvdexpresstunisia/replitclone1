import { ProjectTemplate } from "../types";

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "python-starter",
    name: "Python 3 (Script & Maths)",
    description: "Environnement Python 3 interactif avec modules math, random, statistiques et gestion de fichiers.",
    language: "python",
    icon: "🐍",
    defaultFile: "main.py",
    files: [
      {
        name: "main.py",
        content: `# RepliLite - Démonstration Python 3
# Appuyez sur [Exécuter] ou tapez 'run' dans le terminal

import math
import random
import time

def banner():
    print("=" * 45)
    print(" 🚀 Bienvenue sur RepliLite Python Environment ")
    print("=" * 45)

def analyze_numbers():
    print("\n[1] Génération d'une série aléatoire...")
    data = [random.randint(10, 100) for _ in range(8)]
    print(f"Données: {data}")
    
    moyenne = sum(data) / len(data)
    ecart_type = math.sqrt(sum((x - moyenne) ** 2 for x in data) / len(data))
    
    print(f"📊 Moyenne: {moyenne:.2f}")
    print(f"📈 Écart-type: {ecart_type:.2f}")
    print(f"⭐ Maximum: {max(data)} | Minimum: {min(data)}")

def est_premier(n):
    if n < 2:
        return False
    for i in range(2, int(math.isqrt(n)) + 1):
        if n % i == 0:
            return False
    return True

def prime_finder(limite=50):
    print(f"\n[2] Nombres premiers jusqu'à {limite}:")
    premiers = [x for x in range(2, limite + 1) if est_premier(x)]
    print(", ".join(map(str, premiers)))
    print(f"Total: {len(premiers)} nombres premiers trouvés.")

if __name__ == "__main__":
    banner()
    analyze_numbers()
    prime_finder(40)
    print("\n✨ Exécution terminée avec succès!")
`,
      },
      {
        name: "utils.py",
        content: `# Fonctions utilitaires
def format_currency(valeur, devise="€"):
    return f"{valeur:,.2f} {devise}".replace(",", " ")

def saluer(nom="Développeur"):
    return f"Bonjour {nom}, ravi de coder avec toi sur RepliLite!"
`,
      },
      {
        name: "README.md",
        content: `# Projet Python sur RepliLite

Bienvenue dans votre espace Python en ligne !

### Fonctionnalités disponibles :
- **Exécution directe** : Cliquez sur le bouton vert **Exécuter** ou faites \`Ctrl+Entrée\`
- **Terminal interactif** : Tapez \`python main.py\` ou \`ls\`
- **Assistant IA** : Demandez à l'IA d'expliquer, corriger ou ajouter des fonctions !
`,
      },
    ],
  },
  {
    id: "javascript-starter",
    name: "JavaScript (Node.js style)",
    description: "Script JS moderne avec promesses, async/await, traitement de données et console.",
    language: "javascript",
    icon: "⚡",
    defaultFile: "index.js",
    files: [
      {
        name: "index.js",
        content: `// RepliLite - JavaScript Playground
// Cliquez sur [Exécuter] ou faites Ctrl+Enter

console.log("⚡ Démarrage du script JavaScript...");

// Données d'exemple
const utilisateurs = [
  { id: 1, nom: "Alice", role: "Frontend Dev", commits: 42, score: 98.5 },
  { id: 2, nom: "Bob", role: "Backend Engineer", commits: 67, score: 92.1 },
  { id: 3, nom: "Charlie", role: "DevOps Architect", commits: 29, score: 88.0 },
  { id: 4, nom: "Diana", role: "AI Researcher", commits: 83, score: 99.4 }
];

// Fonction asynchrone avec simulation de traitement
async function traiterEquipe() {
  console.log("🔍 Analyse de l'équipe de développement...");
  
  // Pipeline de transformation
  const classement = utilisateurs
    .map(u => ({
      ...u,
      productivite: ((u.commits * 1.5) + u.score).toFixed(1)
    }))
    .sort((a, b) => b.productivite - a.productivite);

  console.log("\\n🏆 Classement par productivité :");
  classement.forEach((dev, index) => {
    console.log(\`  #\${index + 1} \${dev.nom} (\${dev.role}) - Score: \${dev.productivite} pts\`);
  });

  const totalCommits = utilisateurs.reduce((sum, u) => sum + u.commits, 0);
  console.log(\`\\n📈 Total de commits enregistrés: \${totalCommits}\`);
  console.log("✅ Script exécuté avec succès !");
}

traiterEquipe();
`,
      },
      {
        name: "data.json",
        content: `{
  "workspace": "RepliLite Project",
  "version": "1.0.0",
  "tags": ["javascript", "minimalist", "replit-clone"]
}
`,
      },
      {
        name: "README.md",
        content: `# Espace JavaScript

Ce projet s'exécute directement dans le bac à sable JavaScript du navigateur.
Vous pouvez utiliser \`console.log\`, les promesses, les générateurs et le modèle moderne ES2024.
`,
      },
    ],
  },
  {
    id: "web-starter",
    name: "Web App (HTML/CSS/JS)",
    description: "Application Web avec prévisualisation en direct (Webview) et canvas interactif.",
    language: "html",
    icon: "🌐",
    defaultFile: "index.html",
    files: [
      {
        name: "index.html",
        content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>RepliLite Web Preview</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Live Webview</span>
      <h1>✨ Générateur de Particules</h1>
      <p>Cliquez ou survolez la zone pour créer des effets lumineux interactifs !</p>
    </div>

    <div class="stats-bar">
      <div>Particules: <span id="count">0</span></div>
      <div>Score: <span id="score">0</span></div>
      <button id="btn-burst" class="btn">🚀 Explosion</button>
    </div>

    <canvas id="canvas"></canvas>
  </div>

  <script src="app.js"></script>
</body>
</html>
`,
      },
      {
        name: "style.css",
        content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: radial-gradient(circle at 50% 20%, #1f2738, #0e121a);
  color: #f1f5f9;
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.card {
  background: rgba(22, 28, 41, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  width: 100%;
  max-width: 600px;
  overflow: hidden;
}

.header {
  padding: 24px;
  text-align: center;
}

.badge {
  display: inline-block;
  background: #f26207;
  color: white;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 6px;
}

p {
  color: #94a3b8;
  font-size: 14px;
}

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(15, 20, 31, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 13px;
  color: #cbd5e1;
}

.btn {
  background: linear-gradient(135deg, #f26207, #ff8c42);
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.15s, opacity 0.15s;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

canvas {
  display: block;
  width: 100%;
  height: 280px;
  background: #090c12;
}
`,
      },
      {
        name: "app.js",
        content: `// Moteur de rendu du canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const countEl = document.getElementById("count");
const scoreEl = document.getElementById("score");
const burstBtn = document.getElementById("btn-burst");

let particles = [];
let score = 0;

function resize() {
  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}
window.addEventListener("resize", resize);
resize();

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 5 + 2;
    this.speedX = (Math.random() - 0.5) * 6;
    this.speedY = (Math.random() - 0.5) * 6;
    this.color = color || \`hsl(\${Math.random() * 60 + 20}, 100%, 60%)\`;
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.01;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= this.decay;
  }

  draw(context) {
    context.save();
    context.globalAlpha = Math.max(0, this.alpha);
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

function spawnParticles(x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y));
  }
  score += count;
  scoreEl.textContent = score;
}

canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  spawnParticles(x, y, 20);
});

burstBtn.addEventListener("click", () => {
  const rect = canvas.getBoundingClientRect();
  spawnParticles(rect.width / 2, rect.height / 2, 50);
});

function animate() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  
  ctx.fillStyle = "rgba(9, 12, 18, 0.25)";
  ctx.fillRect(0, 0, w, h);

  particles = particles.filter(p => p.alpha > 0);
  particles.forEach(p => {
    p.update();
    p.draw(ctx);
  });

  countEl.textContent = particles.length;
  requestAnimationFrame(animate);
}

// Initial spawn
spawnParticles(150, 100, 15);
animate();
console.log("Webview Canvas démarré !");
`,
      },
    ],
  },
  {
    id: "algo-python",
    name: "Algorithmes & Benchmarks",
    description: "Comparaison de performances entre Fibonacci récursif naïf et programmation dynamique.",
    language: "python",
    icon: "🧮",
    defaultFile: "algo.py",
    files: [
      {
        name: "algo.py",
        content: `# Algorithmes : Fibonacci Naïf vs Programmation Dynamique
import time

def fib_naif(n):
    if n <= 1:
        return n
    return fib_naif(n - 1) + fib_naif(n - 2)

def fib_memo(n, memo=None):
    if memo is None:
        memo = {}
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

def benchmark():
    N = 32
    print(f"=== Benchmark de calcul Fibonacci (N = {N}) ===")
    
    # 1. Méthode Récursive Naïve
    print("⏳ Calcul avec méthode récursive naïve...")
    t0 = time.perf_counter()
    res1 = fib_naif(N)
    t1 = time.perf_counter()
    duree_naif = (t1 - t0) * 1000
    print(f"  Résultat: {res1} | Temps: {duree_naif:.2f} ms")
    
    # 2. Méthode Dynamique (Mémoïsation)
    print("\n⚡ Calcul avec programmation dynamique (mémoïsation)...")
    t0 = time.perf_counter()
    res2 = fib_memo(N)
    t1 = time.perf_counter()
    duree_memo = (t1 - t0) * 1000
    print(f"  Résultat: {res2} | Temps: {duree_memo:.4f} ms")
    
    if duree_memo > 0:
        ratio = duree_naif / duree_memo
        print(f"\n🚀 La version dynamique est environ {ratio:.0f}x plus rapide !")

if __name__ == "__main__":
    benchmark()
`,
      },
      {
        name: "README.md",
        content: `# Benchmark Fibonacci

Comparez la complexité exponentielle $O(2^n)$ avec la complexité linéaire $O(n)$ en un clic.
`,
      },
    ],
  },
];
