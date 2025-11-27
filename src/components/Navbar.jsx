import React, { useEffect, useState } from "react";
import { BrainCircuit, Sun, Moon } from "lucide-react";

const Navbar = () => {
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const saved = localStorage.getItem("theme") || "dark";
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    };

    return (
        <>
            <div className="nav flex items-center justify-between h-[90px] bg-black"
                style={{ padding: "0px 100px" }}>

                <div className="logo flex items-center gap-[10px]">
                    <BrainCircuit size={30} color="#9333ea" />
                    <span className="text-4xl font-bold text-white ml-2">CodeSensai AI</span>

                   <span className="text-sm ml-4 hidden md:block font-semibold" style={{ color: "#9333ea" }}>
    Think Twice Code Once
</span>


                </div>

                <div className="icons flex items-center gap-[20px]">
                    <i
                        className="cursor-pointer transition-all hover:text-[#9333ea]"
                        onClick={toggleTheme}
                    >
                        {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
                    </i>
                </div>
            </div>
        </>
    );
};

export default Navbar;
