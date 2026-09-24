"use client";

import { useEffect, useState, type FC } from "react";
import { motion } from "motion/react";
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
    width = 58,
    height = 28,
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
            className={`relative inline-flex items-center rounded-full border transition-all cursor-pointer select-none overflow-hidden shrink-0 ${className}`}
            style={{
                width,
                height,
                borderColor: isDark ? borderDarkColor : borderLightColor,
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
                animate={{
                    left: isDark ? width - knobSize - knobOffset : knobOffset,
                }}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
                className="absolute rounded-full border shadow-sm z-10"
                style={{
                    width: knobSize,
                    height: knobSize,
                    top: knobOffset,
                    backgroundColor: isDark ? knobDarkColor : knobLightColor,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(15, 23, 42, 0.1)",
                    boxShadow: isDark 
                        ? "0 1px 4px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)" 
                        : "0 1px 4px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
                }}
            />
        </motion.button>
    );
};

export default SwitchMode;
