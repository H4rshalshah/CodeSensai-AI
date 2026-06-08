import React from "react";
import { BrainCircuit, Moon, Sun } from "lucide-react";

const Navbar = ({ theme, onThemeChange, isScrolled }) => {
  const isDark = theme === "dark";

  return (
    <header className={`nav ${isScrolled ? "is-scrolled" : ""}`}>
      <a className="brand" href="#page-title" aria-label="CodeSensai AI home">
        <span className="brand-mark">
          <BrainCircuit size={24} />
        </span>
        <span className="brand-copy">
          <strong>CodeSensai AI</strong>
        </span>
      </a>

      <div className="nav-actions">
        <button
          className="theme-button"
          type="button"
          onClick={() => onThemeChange(isDark ? "light" : "dark")}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          title={`Switch to ${isDark ? "light" : "dark"} theme`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
