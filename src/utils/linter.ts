import { ProjectFile } from "../types";

export interface LintProblem {
  id: string;
  fileId: string;
  fileName: string;
  line: number; // 1-indexed
  column: number; // 1-indexed
  endColumn?: number;
  message: string;
  severity: "error" | "warning";
  source: string;
  codeSnippet?: string;
  suggestion?: string;
}

/**
 * Validates Python syntax and structure
 */
function lintPython(file: ProjectFile): LintProblem[] {
  const problems: LintProblem[] = [];
  const lines = file.content.split("\n");
  const openBrackets: { char: string; line: number; col: number }[] = [];
  let inTripleQuote: null | { quote: string; line: number } = null;
  const bracketPairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const closingBrackets: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  const controlKeywords = [
    "def",
    "class",
    "if",
    "elif",
    "else",
    "for",
    "while",
    "try",
    "except",
    "finally",
    "with",
    "async def",
    "async for",
    "async with",
  ];

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();

    // Check triple quotes multiline
    let searchPos = 0;
    while (searchPos < lineText.length) {
      if (!inTripleQuote) {
        if (lineText.slice(searchPos, searchPos + 3) === '"""') {
          inTripleQuote = { quote: '"""', line: lineNum };
          searchPos += 3;
          continue;
        } else if (lineText.slice(searchPos, searchPos + 3) === "'''") {
          inTripleQuote = { quote: "'''", line: lineNum };
          searchPos += 3;
          continue;
        }
      } else {
        if (lineText.slice(searchPos, searchPos + 3) === inTripleQuote.quote) {
          inTripleQuote = null;
          searchPos += 3;
          continue;
        }
      }
      searchPos++;
    }

    if (inTripleQuote && inTripleQuote.line !== lineNum) {
      // Inside multiline string
      return;
    }

    // Skip empty lines or pure comments
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    // Bracket matching on this line (unless in single string)
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let isEscaped = false;

    for (let c = 0; c < lineText.length; c++) {
      const char = lineText[c];
      const col = c + 1;

      if (char === "\\" && (inSingleQuote || inDoubleQuote)) {
        isEscaped = !isEscaped;
        continue;
      }

      if (char === "'" && !inDoubleQuote && !isEscaped) {
        inSingleQuote = !inSingleQuote;
        continue;
      }
      if (char === '"' && !inSingleQuote && !isEscaped) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }
      isEscaped = false;

      // Ignore comments outside strings
      if (char === "#" && !inSingleQuote && !inDoubleQuote) {
        break;
      }

      if (!inSingleQuote && !inDoubleQuote) {
        if (bracketPairs[char]) {
          openBrackets.push({ char, line: lineNum, col });
        } else if (closingBrackets[char]) {
          if (openBrackets.length === 0) {
            problems.push({
              id: `${file.id}-p-${lineNum}-${col}`,
              fileId: file.id,
              fileName: file.name,
              line: lineNum,
              column: col,
              message: `SyntaxError: '${char}' fermant inattendu sans parenthèse/crochet ouvrant correspondant`,
              severity: "error",
              source: "python-syntax",
              codeSnippet: lineText,
              suggestion: `Supprimez ce '${char}' ou ajoutez l'ouvrant '${closingBrackets[char]}'`,
            });
          } else {
            const lastOpen = openBrackets[openBrackets.length - 1];
            if (bracketPairs[lastOpen.char] !== char) {
              problems.push({
                id: `${file.id}-p-${lineNum}-${col}`,
                fileId: file.id,
                fileName: file.name,
                line: lineNum,
                column: col,
                message: `SyntaxError: '${char}' ne correspond pas à l'ouvrant '${lastOpen.char}' à la ligne ${lastOpen.line}`,
                severity: "error",
                source: "python-syntax",
                codeSnippet: lineText,
                suggestion: `Remplacez par '${bracketPairs[lastOpen.char]}'`,
              });
              openBrackets.pop();
            } else {
              openBrackets.pop();
            }
          }
        }
      }
    }

    // Unterminated single line string
    if (inSingleQuote || inDoubleQuote) {
      problems.push({
        id: `${file.id}-p-${lineNum}-str`,
        fileId: file.id,
        fileName: file.name,
        line: lineNum,
        column: lineText.length,
        message: "SyntaxError: Chaîne littérale non terminée (guillemet manquant)",
        severity: "error",
        source: "python-syntax",
        codeSnippet: lineText,
        suggestion: inSingleQuote ? "Fermez avec un simple guillemet '" : 'Fermez avec un double guillemet "',
      });
    }

    // Check missing colon on control statements
    for (const kw of controlKeywords) {
      const regex = new RegExp(`^${kw}\\b`);
      if (regex.test(trimmed)) {
        // Strip comments
        const noComment = trimmed.split("#")[0].trim();
        if (noComment && !noComment.endsWith(":") && !noComment.endsWith("\\")) {
          // If parentheses are open, it might span multiple lines, otherwise it's a missing colon
          if (openBrackets.length === 0) {
            problems.push({
              id: `${file.id}-p-${lineNum}-colon`,
              fileId: file.id,
              fileName: file.name,
              line: lineNum,
              column: lineText.length,
              message: `SyntaxError: Deux-points ':' attendu(s) à la fin de l'instruction '${kw}'`,
              severity: "error",
              source: "python-syntax",
              codeSnippet: lineText,
              suggestion: "Ajoutez ':' à la fin de la ligne",
            });
          }
        }
        break;
      }
    }

    // Common JS mistakes in Python:
    if (/\bfunction\s+[a-zA-Z_]/.test(trimmed)) {
      problems.push({
        id: `${file.id}-p-${lineNum}-func`,
        fileId: file.id,
        fileName: file.name,
        line: lineNum,
        column: lineText.indexOf("function") + 1,
        message: "SyntaxError: 'function' n'est pas un mot-clé Python valide. Utilisez 'def'",
        severity: "error",
        source: "python-linter",
        codeSnippet: lineText,
        suggestion: "Remplacez 'function' par 'def'",
      });
    }

    if (/\bvar\s+|\blet\s+|\bconst\s+/.test(trimmed)) {
      problems.push({
        id: `${file.id}-p-${lineNum}-var`,
        fileId: file.id,
        fileName: file.name,
        line: lineNum,
        column: 1,
        message: "SyntaxError: 'var', 'let' ou 'const' ne sont pas valides en Python",
        severity: "error",
        source: "python-linter",
        codeSnippet: lineText,
        suggestion: "Assignez directement: nom = valeur",
      });
    }

    if (/===|!==/.test(trimmed)) {
      problems.push({
        id: `${file.id}-p-${lineNum}-triple-eq`,
        fileId: file.id,
        fileName: file.name,
        line: lineNum,
        column: lineText.search(/===|!==/) + 1,
        message: "SyntaxError: Opérateur '===' ou '!==' non valide en Python. Utilisez '==' ou '!='",
        severity: "error",
        source: "python-linter",
        codeSnippet: lineText,
        suggestion: "Remplacez par '==' ou '!='",
      });
    }

    if (/\btrue\b|\bfalse\b|\bnull\b/.test(trimmed)) {
      const match = trimmed.match(/\b(true|false|null)\b/);
      if (match) {
        const replacement = match[1] === "true" ? "True" : match[1] === "false" ? "False" : "None";
        problems.push({
          id: `${file.id}-p-${lineNum}-bool`,
          fileId: file.id,
          fileName: file.name,
          line: lineNum,
          column: lineText.indexOf(match[1]) + 1,
          message: `SyntaxError: '${match[1]}' doit être écrit '${replacement}' en Python`,
          severity: "warning",
          source: "python-linter",
          codeSnippet: lineText,
          suggestion: `Remplacez par '${replacement}'`,
        });
      }
    }

    // if x = 5: instead of ==
    if (/^\s*(if|elif|while)\s+[^=!<>]+\s*=\s*[^=]/.test(lineText) && !lineText.includes(":=")) {
      problems.push({
        id: `${file.id}-p-${lineNum}-assign`,
        fileId: file.id,
        fileName: file.name,
        line: lineNum,
        column: lineText.indexOf("=") + 1,
        message: "SyntaxError: Affectation '=' dans une condition. Vouliez-vous utiliser '==' ?",
        severity: "error",
        source: "python-syntax",
        codeSnippet: lineText,
        suggestion: "Utilisez '==' pour la comparaison d'égalité",
      });
    }
  });

  // Check unclosed brackets remaining at EOF
  if (openBrackets.length > 0) {
    const unclosed = openBrackets[openBrackets.length - 1];
    problems.push({
      id: `${file.id}-p-unclosed-${unclosed.line}`,
      fileId: file.id,
      fileName: file.name,
      line: unclosed.line,
      column: unclosed.col,
      message: `SyntaxError: '${unclosed.char}' ouvrant non fermé à la fin du fichier (attendu: '${bracketPairs[unclosed.char]}')`,
      severity: "error",
      source: "python-syntax",
      codeSnippet: lines[unclosed.line - 1] || "",
      suggestion: `Ajoutez '${bracketPairs[unclosed.char]}' pour fermer le bloc`,
    });
  }

  return problems;
}

/**
 * Validates JavaScript and TypeScript syntax
 */
function lintJavaScript(file: ProjectFile): LintProblem[] {
  const problems: LintProblem[] = [];
  const lines = file.content.split("\n");

  // 1. Try real JavaScript syntax parser (via Function constructor in a sandbox)
  try {
    // Only check if it parses without throwing SyntaxError
    new Function(file.content);
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      // Extract line and message if available
      let line = 1;
      let col = 1;
      const stack = err.stack || "";
      const match = stack.match(/<anonymous>:(\d+):(\d+)/) || stack.match(/:(\d+):(\d+)/);
      if (match) {
        line = Math.min(parseInt(match[1], 10), lines.length);
        col = parseInt(match[2], 10);
      } else {
        // Fallback: search for first unmatched bracket or unterminated string
        line = lines.length;
      }

      problems.push({
        id: `${file.id}-js-syn-${line}`,
        fileId: file.id,
        fileName: file.name,
        line: Math.max(1, line),
        column: Math.max(1, col),
        message: `SyntaxError: ${err.message}`,
        severity: "error",
        source: "javascript-parser",
        codeSnippet: lines[Math.max(0, line - 1)] || "",
        suggestion: "Vérifiez les parenthèses, accolades ou virgules manquantes",
      });
    }
  }

  // 2. Bracket and brace depth verification
  const openBrackets: { char: string; line: number; col: number }[] = [];
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const closing: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    let inString = false;
    let stringQuote = "";
    let isEscaped = false;

    for (let i = 0; i < lineText.length; i++) {
      const char = lineText[i];
      const col = i + 1;

      if (char === "\\" && inString) {
        isEscaped = !isEscaped;
        continue;
      }

      if ((char === "'" || char === '"' || char === "`") && !isEscaped) {
        if (!inString) {
          inString = true;
          stringQuote = char;
        } else if (stringQuote === char) {
          inString = false;
          stringQuote = "";
        }
        continue;
      }
      isEscaped = false;

      // Ignore single line comment
      if (char === "/" && lineText[i + 1] === "/" && !inString) {
        break;
      }

      if (!inString) {
        if (pairs[char]) {
          openBrackets.push({ char, line: lineNum, col });
        } else if (closing[char]) {
          if (openBrackets.length === 0) {
            // Already flagged by parser if parser worked, or flag here
            if (!problems.some((p) => p.line === lineNum)) {
              problems.push({
                id: `${file.id}-js-${lineNum}-${col}`,
                fileId: file.id,
                fileName: file.name,
                line: lineNum,
                column: col,
                message: `SyntaxError: Accolade ou parenthèse fermante '${char}' inattendue`,
                severity: "error",
                source: "javascript-linter",
                codeSnippet: lineText,
              });
            }
          } else {
            const last = openBrackets[openBrackets.length - 1];
            if (pairs[last.char] !== char) {
              if (!problems.some((p) => p.line === lineNum)) {
                problems.push({
                  id: `${file.id}-js-mismatch-${lineNum}`,
                  fileId: file.id,
                  fileName: file.name,
                  line: lineNum,
                  column: col,
                  message: `SyntaxError: '${char}' ne correspond pas à l'ouvrant '${last.char}' (ligne ${last.line})`,
                  severity: "error",
                  source: "javascript-linter",
                  codeSnippet: lineText,
                });
              }
              openBrackets.pop();
            } else {
              openBrackets.pop();
            }
          }
        }
      }
    }
  });

  return problems;
}

/**
 * Validates JSON files
 */
function lintJSON(file: ProjectFile): LintProblem[] {
  const problems: LintProblem[] = [];
  try {
    JSON.parse(file.content);
  } catch (err: any) {
    const lines = file.content.split("\n");
    let line = 1;
    let col = 1;
    // Extract line/column from error message (e.g. "at position 145 (line 12 column 5)")
    const match = err.message.match(/line (\d+) column (\d+)/i);
    if (match) {
      line = parseInt(match[1], 10);
      col = parseInt(match[2], 10);
    } else {
      const posMatch = err.message.match(/position (\d+)/i);
      if (posMatch) {
        const pos = parseInt(posMatch[1], 10);
        let currentPos = 0;
        for (let i = 0; i < lines.length; i++) {
          if (currentPos + lines[i].length >= pos) {
            line = i + 1;
            col = pos - currentPos + 1;
            break;
          }
          currentPos += lines[i].length + 1; // +1 for newline
        }
      }
    }

    problems.push({
      id: `${file.id}-json-${line}`,
      fileId: file.id,
      fileName: file.name,
      line: Math.min(line, lines.length),
      column: Math.max(1, col),
      message: `JSON SyntaxError: ${err.message}`,
      severity: "error",
      source: "json-parser",
      codeSnippet: lines[Math.min(line - 1, lines.length - 1)] || "",
      suggestion: "Vérifiez les virgules en trop ou les clés sans guillemets doubles",
    });
  }
  return problems;
}

/**
 * Validates HTML tags and attributes
 */
function lintHTML(file: ProjectFile): LintProblem[] {
  const problems: LintProblem[] = [];
  const lines = file.content.split("\n");
  const voidTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
    "!doctype",
  ]);

  const tagStack: { tag: string; line: number; col: number }[] = [];

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const tagRegex = /<\/?([a-zA-Z0-9\-!]+)([^>]*?)>/g;
    let match;

    while ((match = tagRegex.exec(lineText)) !== null) {
      const fullTag = match[0];
      const rawTag = match[1].toLowerCase();
      const col = match.index + 1;

      if (rawTag.startsWith("!--")) {
        // Comment
        continue;
      }

      if (voidTags.has(rawTag)) {
        continue;
      }

      const isClosing = fullTag.startsWith("</");
      const isSelfClosing = fullTag.endsWith("/>");

      if (isSelfClosing) {
        continue;
      }

      if (!isClosing) {
        tagStack.push({ tag: rawTag, line: lineNum, col });
      } else {
        if (tagStack.length === 0) {
          problems.push({
            id: `${file.id}-html-unmatched-${lineNum}`,
            fileId: file.id,
            fileName: file.name,
            line: lineNum,
            column: col,
            message: `HTML SyntaxError: Balise fermante '</${rawTag}>' sans balise ouvrante correspondante`,
            severity: "error",
            source: "html-linter",
            codeSnippet: lineText,
          });
        } else {
          const last = tagStack[tagStack.length - 1];
          if (last.tag !== rawTag) {
            problems.push({
              id: `${file.id}-html-mismatch-${lineNum}`,
              fileId: file.id,
              fileName: file.name,
              line: lineNum,
              column: col,
              message: `HTML SyntaxError: Balise fermante '</${rawTag}>' attendue '</${last.tag}>' ouverte à la ligne ${last.line}`,
              severity: "error",
              source: "html-linter",
              codeSnippet: lineText,
              suggestion: `Fermez d'abord la balise '</${last.tag}>'`,
            });
            tagStack.pop();
          } else {
            tagStack.pop();
          }
        }
      }
    }
  });

  if (tagStack.length > 0) {
    const unclosed = tagStack[tagStack.length - 1];
    problems.push({
      id: `${file.id}-html-unclosed-${unclosed.line}`,
      fileId: file.id,
      fileName: file.name,
      line: unclosed.line,
      column: unclosed.col,
      message: `HTML SyntaxError: Balise ouvrante '<${unclosed.tag}>' non fermée`,
      severity: "warning",
      source: "html-linter",
      codeSnippet: lines[unclosed.line - 1] || "",
      suggestion: `Ajoutez la balise fermante '</${unclosed.tag}>'`,
    });
  }

  return problems;
}

/**
 * Main real-time linter function
 */
export function lintFile(file: ProjectFile): LintProblem[] {
  if (!file || !file.content) return [];

  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "py":
      return lintPython(file);
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return lintJavaScript(file);
    case "json":
      return lintJSON(file);
    case "html":
    case "htm":
      return lintHTML(file);
    default:
      return [];
  }
}

/**
 * Lints all project files
 */
export function lintProject(files: ProjectFile[]): LintProblem[] {
  const allProblems: LintProblem[] = [];
  files.forEach((file) => {
    const problems = lintFile(file);
    allProblems.push(...problems);
  });
  return allProblems;
}
