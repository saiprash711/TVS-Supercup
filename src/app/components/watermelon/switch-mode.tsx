"use client";

import { useEffect, useState, type FC } from "react";
import { motion } from "motion/react";
import { IoMoon, IoMoonOutline, IoSunny, IoSunnyOutline } from "react-icons/io5";
import { useTheme } from "next-themes";

/* --- Props --- */
export interface SwitchModeProps {
    width?: number;
    height?: number;
    darkColor?: string;
    lightColor?: string;
    knobDarkColor?: string;
    knobLightColor?: string;
    borderDarkColor?: string;
    borderLightColor?: string;
    className?: string;
}

export const SwitchMode: FC<SwitchModeProps> = ({
    width = 62,
    height = 32,
    darkColor = "#0f172a",
    lightColor = "#e2e8f0",
    knobDarkColor = "#1e293b",
    knobLightColor = "#ffffff",
    borderDarkColor = "rgba(255, 255, 255, 0.18)",
    borderLightColor = "rgba(15, 23, 42, 0.15)",
    className = "",
}) => {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div 
                style={{ width, height }} 
                className={`rounded-full border border-transparent ${className}`} 
                aria-hidden="true"
            />
        );
    }

    const isDark = resolvedTheme === "dark";
    const iconSize = Math.max(12, Math.round(height * 0.46));
    const knobOffset = 2;
    const knobSize = height - knobOffset * 2;

    return (
        <motion.button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`relative flex items-center justify-between rounded-full border transition-all cursor-pointer select-none overflow-hidden ${className}`}
            style={{
                width,
                height,
                borderColor: isDark ? borderDarkColor : borderLightColor,
                padding: `0 ${Math.round(height * 0.16)}px`,
                boxShadow: isDark 
                    ? "0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                    : "0 2px 8px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
            }}
            whileTap={{ scale: 0.96 }}
        >
            {/* TRACK BACKGROUND */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ backgroundColor: isDark ? darkColor : lightColor }}
                transition={{ duration: 0.3 }}
            />

            {/* SLIDING KNOB */}
            <motion.div
                layout
                layoutId="switch-knob"
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className="absolute rounded-full border shadow-sm z-10"
                style={{
                    width: knobSize,
                    height: knobSize,
                    top: knobOffset,
                    left: isDark ? width - knobSize - knobOffset : knobOffset,
                    backgroundColor: isDark ? knobDarkColor : knobLightColor,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.1)",
                    boxShadow: isDark 
                        ? "0 1px 4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)" 
                        : "0 1px 4px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
                }}
            />

            {/* SUN ICON */}
            <motion.div
                className="relative z-20 flex items-center justify-center"
                style={{ width: knobSize, height: knobSize }}
                animate={{ rotate: isDark ? 45 : 0 }}
                transition={{ duration: 0.25 }}
            >
                {isDark ? (
                    <IoSunnyOutline
                        color="#94a3b8"
                        style={{ width: iconSize, height: iconSize }}
                        className="transition-colors duration-200"
                    />
                ) : (
                    <IoSunny
                        color="#f59e0b"
                        style={{ width: iconSize, height: iconSize }}
                        className="transition-colors duration-200"
                    />
                )}
            </motion.div>

            {/* MOON ICON */}
            <motion.div
                className="relative z-20 flex items-center justify-center"
                style={{ width: knobSize, height: knobSize }}
                animate={{ rotate: isDark ? 0 : -20 }}
                transition={{ duration: 0.25 }}
            >
                {isDark ? (
                    <IoMoon
                        color="#38bdf8"
                        style={{ width: iconSize, height: iconSize }}
                        className="transition-colors duration-200"
                    />
                ) : (
                    <IoMoonOutline
                        color="#64748b"
                        style={{ width: iconSize, height: iconSize }}
                        className="transition-colors duration-200"
                    />
                )}
            </motion.div>
        </motion.button>
    );
};

export default SwitchMode;
