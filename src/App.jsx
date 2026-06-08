import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Editor from "@monaco-editor/react";
import Select from "react-select";
import Markdown from "react-markdown";
import RingLoader from "react-spinners/RingLoader";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  Download,
  FileSearch,
  Gauge,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";

const MAX_REVIEW_CHUNK_LENGTH = 12000;

const languageOptions = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
];

const starterCode = `function calculateCartTotal(items) {
  let total = 0

  items.forEach(item => {
    total += item.price * item.qty
  })

  return total
}`;

const trustItems = [
  { icon: ShieldCheck, label: "Production risk checks" },
  { icon: Gauge, label: "Fast code feedback" },
  { icon: Activity, label: "Structured review reports" },
];

const extensionByLanguage = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  cpp: "cpp",
  csharp: "cs",
};

const languageByExtension = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  cs: "csharp",
};
async function generateGeminiContent(prompt) {
  const response = await fetch("https://codesensai-ai-backend.onrender.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error || "Groq review failed. Please try again."
    );
  }

  const text = data?.text?.trim();

  if (!text) {
    throw new Error("Groq returned an empty response.");
  }

  return text;
}

function splitCodeForReview(source) {
  if (source.length <= MAX_REVIEW_CHUNK_LENGTH) return [source];

  const chunks = [];
  const lines = source.split("\n");
  let current = "";

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;

    if (next.length > MAX_REVIEW_CHUNK_LENGTH && current) {
      chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

const createReviewPrompt = ({ language, source, part, total }) => `
You are CodeSensai AI, a senior SaaS code-review assistant.

Review this ${language} code${total > 1 ? ` chunk ${part} of ${total}` : ""} for a production team. Return:
## Executive summary
Briefly explain the current state of this ${total > 1 ? "chunk" : "code"}.

## Quality score
Give a score from 1 to 10 and explain why.

## Bugs and runtime risks
List concrete issues. If none are found, say "No major runtime risks found."

## Security and reliability
Call out security, edge-case, and reliability concerns.

## Recommended improvements
Give practical, prioritized improvements.

## Suggested refactor
Include refactored code only if it materially improves the code.

Code:
${source}
`;

const createFixPrompt = ({ language, source }) => `
You are CodeSensai AI, a senior software engineer.

Improve this ${language} code for production readiness. Fix bugs, improve readability, and explain the changes. Return the improved code in a fenced code block first, followed by concise notes.

Code:
${source}
`;

const App = () => {
  const [selectedOption, setSelectedOption] = useState(languageOptions[0]);
  const [code, setCode] = useState(starterCode);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [activeAction, setActiveAction] = useState("");
  const [suggestedCode, setSuggestedCode] = useState("");
  const [responseKind, setResponseKind] = useState("idle");
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const downloadLinkRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("codesensai-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsNavScrolled(window.scrollY > 24);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = useMemo(() => {
    const lines = code ? code.split("\n").length : 0;
    const characters = code.length;
    const language = selectedOption.label;

    return [
      { label: "Language", value: language },
      { label: "Lines", value: lines },
      { label: "Characters", value: characters },
    ];
  }, [code, selectedOption.label]);

  const selectStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 46,
        backgroundColor: "var(--field-bg)",
        borderColor: state.isFocused ? "var(--accent)" : "var(--border)",
        borderRadius: 10,
        boxShadow: state.isFocused ? "0 0 0 3px var(--accent-soft)" : "none",
        color: "var(--text)",
        cursor: "pointer",
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
        zIndex: 20,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "var(--accent-soft)" : "var(--panel)",
        color: "var(--text)",
        cursor: "pointer",
      }),
      singleValue: (base) => ({ ...base, color: "var(--text)" }),
      input: (base) => ({ ...base, color: "var(--text)" }),
      indicatorSeparator: (base) => ({ ...base, backgroundColor: "var(--border)" }),
    }),
    []
  );

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("codesensai-theme", newTheme);
  };

  const handleDownloadCode = () => {
    const extension = extensionByLanguage[selectedOption.value] || "txt";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = downloadLinkRef.current;

    link.href = url;
    link.download = `codesensai-review.${extension}`;
    link.click();

    // Small delay before revoking so the browser can start the download
    setTimeout(() => URL.revokeObjectURL(url), 300);
  };

  const handleUploadCode = (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const uploadedCode = String(reader.result || "");
      const extension = file.name.split(".").pop()?.toLowerCase();
      const detectedLanguage = languageByExtension[extension];

      if (detectedLanguage) {
        const nextLanguage = languageOptions.find((item) => item.value === detectedLanguage);
        if (nextLanguage) setSelectedOption(nextLanguage);
      }

      setCode(uploadedCode);
      setResponse("");
      setResponseKind("idle");
      setSuggestedCode("");
      input.value = "";
    };
    reader.readAsText(file);
  };

  const handleEditorBeforeMount = (monaco) => {
    monaco.editor.defineTheme("codesensai-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#000000",
        "editorGutter.background": "#000000",
        "editorLineNumber.foreground": "#8d8d98",
        "editorLineNumber.activeForeground": "#f5f3ff",
        "editorCursor.foreground": "#c084fc",
        "editor.lineHighlightBackground": "#08020f",
        "editorIndentGuide.background1": "#24202a",
        "editorIndentGuide.activeBackground1": "#6d28d9",
      },
    });

    monaco.editor.defineTheme("codesensai-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editorGutter.background": "#ffffff",
        "editorLineNumber.foreground": "#64748b",
        "editorLineNumber.activeForeground": "#0f172a",
        "editorCursor.foreground": "#0369a1",
        "editor.lineHighlightBackground": "#eff8ff",
      },
    });
  };

  async function runAiTask(kind) {
    if (!code.trim()) {
      setResponse("Add code to the editor before asking CodeSensai AI to analyze it.");
      setResponseKind("setup");
      return;
    }

    setLoading(true);
    setActiveAction(kind);
    setResponse("");
    setSuggestedCode("");
    setResponseKind("idle");
    setProgressMessage(kind === "fix" ? "Optimizing your code..." : "Preparing review...");

    try {
      let text = "";

      if (kind === "review") {
        const chunks = splitCodeForReview(code);
        const reviews = [];

        for (let index = 0; index < chunks.length; index += 1) {
          setProgressMessage(
            chunks.length > 1
              ? `Reviewing code section ${index + 1} of ${chunks.length}...`
              : "Reviewing your code..."
          );

          const chunkReview = await generateGeminiContent(
            createReviewPrompt({
              language: selectedOption.label,
              source: chunks[index],
              part: index + 1,
              total: chunks.length,
            })
          );

          reviews.push(
            chunks.length > 1
              ? `# Review section ${index + 1} of ${chunks.length}\n\n${chunkReview}`
              : chunkReview
          );
        }

        text =
          chunks.length > 1
            ? `# Complete code review\n\nReviewed ${chunks.length} code sections so larger files can still be analyzed.\n\n${reviews.join("\n\n---\n\n")}`
            : reviews[0];
      } else {
        text = await generateGeminiContent(
          createFixPrompt({
            language: selectedOption.label,
            source: code,
          })
        );
      }

      const codeBlock = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
      setResponse(text.trim());
      setResponseKind("success");
      setSuggestedCode(kind === "fix" && codeBlock ? codeBlock[1].trim() : "");
    } catch (error) {
      console.error(error);
      setResponse(error?.message || "Groq did not return a response. Check backend server.");
      setResponseKind("setup");
    } finally {
      setLoading(false);
      setActiveAction("");
      setProgressMessage("");
    }
  }

  return (
    <div className="app-shell">
      <Navbar
        theme={theme}
        onThemeChange={updateTheme}
        isScrolled={isNavScrolled}
      />

      <main className="workspace">
        <section className="hero-panel" aria-labelledby="page-title">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={16} />
              Professional code review workspace
            </span>
            <h1 id="page-title">Review, refine, and release production-ready code.</h1>
            <p>
              CodeSensai AI turns raw code into clear engineering feedback, quality insights, and
              practical fixes your team can act on before release.
            </p>
          </div>

          <div className="trust-row" aria-label="Product capabilities">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className="trust-item" key={item.label}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="stats-grid" aria-label="Current code statistics">
          {stats.map((item) => (
            <div className="metric-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>

        <section className="tool-grid" aria-label="AI code review tool">
          <div className="panel editor-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  <Code2 size={16} />
                  Source
                </span>
                <h2>Code editor</h2>
              </div>
              <div className="editor-tools">
                <div className="language-select">
                  <Select
                    value={selectedOption}
                    onChange={setSelectedOption}
                    options={languageOptions}
                    styles={selectStyles}
                    aria-label="Select language"
                  />
                </div>
                <label className="file-action" title="Upload code file">
                  <Upload size={17} />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.cc,.cxx,.cs,.txt"
                    onChange={handleUploadCode}
                  />
                </label>
                <button
                  className="file-action"
                  type="button"
                  onClick={handleDownloadCode}
                  title="Download current code"
                >
                  <Download size={17} />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="editor-frame">
              <Editor
                height="100%"
                beforeMount={handleEditorBeforeMount}
                theme={theme === "dark" ? "codesensai-dark" : "codesensai-light"}
                language={selectedOption.value}
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 22,
                  padding: { top: 18, bottom: 18 },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                }}
              />
            </div>

            <div className="action-row">
              <button
                className="primary-action"
                onClick={() => runAiTask("review")}
                disabled={loading}
              >
                <FileSearch size={18} />
                Review code
                <ArrowRight size={17} />
              </button>
              <button
                className="secondary-action"
                onClick={() => runAiTask("fix")}
                disabled={loading}
              >
                <Wand2 size={18} />
                Optimize
              </button>
            </div>
          </div>

          <div className={`panel response-panel ${response ? "has-response" : ""}`}>
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  <Bot size={16} />
                  Intelligence
                </span>
                <h2>AI response</h2>
              </div>
              <div className="response-actions">
                {suggestedCode && (
                  <button
                    className="apply-action"
                    type="button"
                    onClick={() => setCode(suggestedCode)}
                  >
                    <Wand2 size={15} />
                    Apply optimized code
                  </button>
                )}
                <span className="status-pill">
                  {responseKind === "setup" ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                  {responseKind === "setup" ? "Needs setup" : "Ready"}
                </span>
              </div>
            </div>

            <div className="response-body">
              {loading ? (
                <div className="loading-state">
                  <RingLoader color="var(--accent)" size={74} />
                  <strong>{activeAction === "fix" ? "Optimizing code" : "Reviewing code"}</strong>
                  <span>
                    {progressMessage ||
                      "CodeSensai AI is checking quality, risks, and production readiness."}
                  </span>
                </div>
              ) : responseKind === "setup" ? (
                <div className="setup-state">
                  <AlertTriangle size={42} />
                  <strong>Action needed</strong>
                  <p>{response}</p>
                  <div className="setup-steps">
                  <span>Make sure backend server is running on port 5000.</span>
                  <span>Verify GROQ_API_KEY is configured in .env.</span>
                  <span>Restart backend after changing environment variables.</span>
                  </div>
                  <button className="secondary-action" type="button" onClick={() => runAiTask("review")}>
                    Retry review
                  </button>
                </div>
              ) : response ? (
                <article className="markdown-response">
                  <Markdown>{response}</Markdown>
                </article>
              ) : (
                <div className="empty-state">
                  <Bot size={42} />
                  <strong>Your review will appear here</strong>
                  <span>
                    Choose a language, paste code, and run a review or optimization pass.
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Hidden anchor for reliable file downloads */}
      <a ref={downloadLinkRef} style={{ display: "none" }} aria-hidden="true" />
    </div>
  );
};

export default App;
