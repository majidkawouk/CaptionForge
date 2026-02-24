export type Animation = "word-by-word" | "fade" | "bounce" | "typewriter" | "pop" | "slide-up" | "slide-left" | "glitch" | "zoom";

export interface TextStyle {
  name: string;
  font: string;
  fontSize: number;
  color: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number;
  shadow: boolean;
  shadowColor: string;
  animation: Animation;
  uppercase: boolean;
  letterSpacing: number;
  skew: number;
  backgroundBox: boolean;
}

export const PRESETS: Record<string, TextStyle> = {
  hormozi: {
    name: "Hormozi",
    font: "Montserrat",
    fontSize: 72,
    color: "#FFFFFF",
    highlightColor: "#FFD700",
    strokeColor: "#000000",
    strokeWidth: 6,
    shadow: true,
    shadowColor: "rgba(0,0,0,0.8)",
    animation: "word-by-word",
    uppercase: true,
    letterSpacing: 2,
    skew: 0,
    backgroundBox: false,
  },
  beast: {
    name: "MrBeast",
    font: "Montserrat",
    fontSize: 80,
    color: "#FFFFFF",
    highlightColor: "#FFD700",
    strokeColor: "#000000",
    strokeWidth: 8,
    shadow: true,
    shadowColor: "rgba(0,0,0,1)",
    animation: "bounce",
    uppercase: true,
    letterSpacing: 2,
    skew: -0.1,
    backgroundBox: false,
  },
  cyberpunk: {
    name: "Cyberpunk",
    font: "Orbitron",
    fontSize: 64,
    color: "#00FFFF",
    highlightColor: "#FF00FF",
    strokeColor: "#000000",
    strokeWidth: 3,
    shadow: true,
    shadowColor: "rgba(0,255,255,0.8)",
    animation: "glitch",
    uppercase: true,
    letterSpacing: 4,
    skew: 0.1,
    backgroundBox: false,
  },
  vlog: {
    name: "Vlog",
    font: "Inter",
    fontSize: 56,
    color: "#FFFFFF",
    highlightColor: "#60A5FA",
    strokeColor: "rgba(0,0,0,0.2)",
    strokeWidth: 2,
    shadow: true,
    shadowColor: "rgba(0,0,0,0.4)",
    animation: "pop",
    uppercase: false,
    letterSpacing: 0,
    skew: 0,
    backgroundBox: false,
  },
  dev: {
    name: "Terminal",
    font: "Orbitron",
    fontSize: 48,
    color: "#10B981",
    highlightColor: "#FFFFFF",
    strokeColor: "transparent",
    strokeWidth: 0,
    shadow: false,
    shadowColor: "transparent",
    animation: "typewriter",
    uppercase: false,
    letterSpacing: 1,
    skew: 0,
    backgroundBox: true,
  },
  neon: {
    name: "Neon Blue",
    font: "Orbitron",
    fontSize: 64,
    color: "#00FFFF",
    highlightColor: "#FFFFFF",
    strokeColor: "#000033",
    strokeWidth: 4,
    shadow: true,
    shadowColor: "rgba(0,255,255,0.6)",
    animation: "fade",
    uppercase: true,
    letterSpacing: 4,
    skew: 0,
    backgroundBox: false,
  },
  fire: {
    name: "Fire",
    font: "Bebas Neue",
    fontSize: 80,
    color: "#FF4500",
    highlightColor: "#FFD700",
    strokeColor: "#7B1500",
    strokeWidth: 5,
    shadow: true,
    shadowColor: "rgba(255,69,0,0.7)",
    animation: "bounce",
    uppercase: true,
    letterSpacing: 3,
    skew: 0,
    backgroundBox: false,
  },
  minimal: {
    name: "Minimalist",
    font: "Lato",
    fontSize: 56,
    color: "#FFFFFF",
    highlightColor: "#F59E0B",
    strokeColor: "transparent",
    strokeWidth: 0,
    shadow: false,
    shadowColor: "transparent",
    animation: "typewriter",
    uppercase: false,
    letterSpacing: 1,
    skew: 0,
    backgroundBox: false,
  },
};
