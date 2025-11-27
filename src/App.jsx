import React, { useState } from 'react'
import "./App.css"
import Navbar from './components/Navbar'
import Editor from '@monaco-editor/react';
import Select from 'react-select';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown'
import RingLoader from "react-spinners/RingLoader";

const App = () => {

  const options = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'rust', label: 'Rust' },
    { value: 'dart', label: 'Dart' },
    { value: 'scala', label: 'Scala' },
    { value: 'perl', label: 'Perl' },
    { value: 'haskell', label: 'Haskell' },
    { value: 'elixir', label: 'Elixir' },
    { value: 'r', label: 'R' },
    { value: 'matlab', label: 'MATLAB' },
    { value: 'bash', label: 'Bash' }
  ];

  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [code, setCode] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState("dark");
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const ai = new GoogleGenAI({
    apiKey: "AIzaSyDO3vl7q1e35dIgn-d_Rj5z-h7BEbmSQSo"
  });

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
      borderColor: theme === "dark" ? "#3f3f46" : "#cfcfcf",
      color: theme === "dark" ? "#fff" : "#000",
      width: "100%"
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: theme === "dark" ? "#fff" : "#000",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? theme === "dark" ? "#27272a" : "#e6e6e6"
        : theme === "dark" ? "#18181b" : "#ffffff",
      color: theme === "dark" ? "#fff" : "#000",
      cursor: 'pointer'
    }),
  };

  // -------- REVIEW CODE ----------------
  async function reviewCode() {
    if (!code) return alert("Please enter code first");

    setLoading(true);
    setResponse("");

    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
      Review the following ${selectedOption.value} code. Give:

      1. Code Quality Rating (Better/Good/Normal/Bad)
      2. List potential bugs
      3. Syntax/runtime errors
      4. Improve & Fix Suggestions

      Code:
      ${code}
      `,
    });

    setResponse(res.text);
    setLoading(false);
  }

  // -------- FIX CODE ----------------
  async function fixCode() {
    if (!code) return alert("Please enter code first");

    setLoading(true);

    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `
      You are a senior software engineer.
      Optimize this ${selectedOption.value} code.
      Fix bugs, improve efficiency, readability, and structure.

      Return ONLY optimized code. With explanation.

      Code:
      ${code}
      `,
    });

    const optimized = res.text || "";
    setLoading(false);

    if (window.confirm("Replace your code with optimized version?")) {
      setCode(optimized);
    }

    setResponse("✅ Code optimization completed.\n\n" + optimized);
  }

  // --------------------------------------------------------------

  return (
    <>
      <Navbar onThemeChange={handleThemeChange} />

      <div
        className="main flex justify-between"
        data-theme={theme}
        style={{ height: "calc(100vh - 90px)" }}
      >

        {/* LEFT SIDE */}
        <div className="left h-[87.5%] w-[50%]">

          <div className="tabs !mt-5 !px-5 !mb-3 w-full flex items-center gap-[10px]">
            <Select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e)}
              options={options}
              styles={customStyles}
            />

            <button onClick={fixCode} className="btnNormal bg-zinc-900 min-w-[120px] hover:bg-zinc-800">
              Fix Code
            </button>

            <button onClick={reviewCode} className="btnNormal bg-zinc-900 min-w-[120px] hover:bg-zinc-800">
              Review
            </button>
          </div>

          <Editor
            height="100%"
            theme={theme === "dark" ? "vs-dark" : "light"}
            language={selectedOption.value}
            value={code}
            onChange={(e) => setCode(e)}
          />
        </div>

        {/* RIGHT SIDE */}
        <div
          className="right relative overflow-scroll !pl-[10px] w-[50%] h-[101%]"
          style={{
            backgroundColor: theme === "dark" ? "#000" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
            transition: "0.1s ease"
          }}
        >

          <div className="topTab border-b-[1px] border-[#27272a] flex items-center h-[60px]">
            <p className="font-[700] text-[30px]" style={{ color: '#9333ea', padding: '10px', }}>
              AI Response
            </p>
          </div>

          {loading && (
            <div className="loader-container">
              <RingLoader color="#9333ea" size={80} />
            </div>
          )}

          <div style={{ padding: "10p x", opacity: loading ? 0.3 : 1 }}>
            <Markdown>{response}</Markdown>
          </div>

        </div>

      </div>
    </>
  );
};

export default App;
