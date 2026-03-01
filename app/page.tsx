"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { PRESETS, TextStyle, Animation } from "@/lib/presets";
import { renderFrames, CANVAS_WIDTH, CANVAS_HEIGHT, FPS } from "@/lib/renderer";
import { runExport } from "@/lib/encoder";
import CustomDropdown from "@/components/CustomDropdown";

const ANIMATIONS: { value: Animation; label: string }[] = [
  { value: "word-by-word", label: "Word by Word" },
  { value: "fade", label: "Fade In" },
  { value: "typewriter", label: "Typewriter" },
  { value: "bounce", label: "Bounce" },
  { value: "pop", label: "Pop" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-left", label: "Slide Left" },
  { value: "zoom", label: "Zoom In" },
  { value: "glitch", label: "Glitch" },
];

const FONTS = [
  "Montserrat",
  "Inter",
  "Orbitron",
  "Bebas Neue",
  "Lato",
  "Roboto",
  "Oswald",
  "Raleway",
];

type Stage = "idle" | "rendering" | "encoding" | "done";

export default function Home() {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const previewIntervalRef = useRef<number | null>(null);

  const [text, setText] = useState("This is insane");
  const [duration, setDuration] = useState(3);
  const [selectedPreset, setSelectedPreset] = useState<string>("hormozi");
  const [style, setStyle] = useState<TextStyle>(PRESETS["hormozi"]);

  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const previewFramesRef = useRef<ImageBitmap[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);

  function applyPreset(key: string) {
    setSelectedPreset(key);
    setStyle({ ...PRESETS[key] });
  }

  function updateStyle<K extends keyof TextStyle>(key: K, value: TextStyle[K]) {
    setSelectedPreset("custom");
    setStyle((prev) => ({ ...prev, [key]: value }));
  }

  const generatePreview = useCallback(async () => {
    if (!previewRef.current) return;
    const frames: ImageBitmap[] = [];

    const previewDuration = Math.min(duration, 4);
    const totalFrames = Math.round(previewDuration * FPS);
    let i = 0;

    await renderFrames({
      text,
      style,
      durationSeconds: previewDuration,
      onFrame: async (blob) => {
        const bitmap = await createImageBitmap(blob);
        frames.push(bitmap);
      },
    });
    previewFramesRef.current = frames;

    if (previewIntervalRef.current) clearInterval(previewIntervalRef.current);
    setIsPreviewing(true);
    previewIntervalRef.current = window.setInterval(() => {
      if (!previewRef.current) return;
      const f = frames[i % frames.length];
      const c = previewRef.current;
      const cx = c.getContext("2d")!;
      cx.clearRect(0, 0, c.width, c.height);
      cx.drawImage(f, 0, 0);
      i++;
    }, 1000 / FPS);
  }, [text, style, duration]);

  async function handleExport() {
    if (!text.trim()) return;
    setStage("rendering");
    setProgress(0);
    setDownloadUrl(null);

    try {
      const blob = await runExport(
        async (onFrame) => {
          let lastIndex = 0;
          await renderFrames({
            text,
            style,
            durationSeconds: duration,
            onFrame: async (frame, index, total) => {
              lastIndex = total;
              await onFrame(frame, index);
            },
            onProgress: (pct) => setProgress(pct * 0.9),
          });
          return lastIndex;
        },
        (pct) => setProgress(pct)
      );

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStage("done");
    } catch (error: any) {
      console.error("Export failed:", error);
      const msg = error?.message || "Export failed";
      alert(msg + "\n\nTry refreshing the page or checking if your browser supports SharedArrayBuffer.");
      setStage("idle");
    }
    setProgress(100);
  }

  useEffect(() => {
    return () => {
      if (previewIntervalRef.current) clearInterval(previewIntervalRef.current);
    };
  }, []);

  const isWorking = stage === "rendering" || stage === "encoding";

  return (
    <main className="bg-[#f7f8fa] min-h-screen">
      <header className="border-b border-border-main">
        <div className="max-w-6xl mx-auto px-4 md:px-12 py-4 flex items-center justify-between">
            <span className="font-black text-xl tracking-tight">
              Caption<span className="text-accent">Forge</span>
            </span>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-12 py-10 md:py-16 text-center">
        <p className="text-[13px] font-semibold tracking-[0.15em] text-text-muted uppercase mb-4">
          Creator Tool
        </p>
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-none tracking-tight mb-3 md:mb-4">
          Animated Captions.{" "}
          <span className="text-accent">Transparent Background.</span>
        </h1>
        <p className="text-text-muted text-lg max-w-[540px] mx-auto leading-relaxed">
          Generate styled, word-by-word caption videos with no background. Drop
          them onto any footage in your editor.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-12 pb-12 md:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="flex flex-col gap-5">
          <div className="glass p-4 md:p-6">
            <p className="field-label">Your Text</p>
            <textarea
              className="field-input resize-y"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Type your caption text here..."
            />
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <p className="field-label mb-0">Video Duration</p>
                <span className="text-[13px] font-bold text-accent bg-[#eff6ff] border border-[#bfdbfe] rounded-md px-2.5 py-0.5 min-w-[48px] text-center">
                  {duration}s
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                step={0.5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[11px] text-text-muted">1s</span>
                <span className="text-[11px] text-text-muted">60s</span>
              </div>
            </div>
          </div>

          <div className="glass p-4 md:p-6">
            <p className="field-label mb-3.5">Style Presets</p>
            <div className="grid grid-cols-3 gap-2.5">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <div
                  key={key}
                  className={`preset-card ${selectedPreset === key ? "preset-card-selected" : ""}`}
                  onClick={() => applyPreset(key)}
                >
                  <div className="bg-[#1e293b] rounded-md py-2 mb-2 flex items-center justify-center">
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        fontFamily: preset.font,
                        color: preset.color,
                        textShadow: preset.shadow ? `2px 2px 4px ${preset.shadowColor}` : "none",
                        letterSpacing: 1,
                      }}
                    >
                      Aa
                    </div>
                  </div>
                  <div className="text-[12px] font-semibold text-text-main">
                    {preset.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 flex flex-col gap-[18px]">
            <p className="field-label mb-0">Customize</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomDropdown
                label="Font Family"
                options={FONTS.map(f => ({ 
                  value: f, 
                  label: f,
                  style: { fontFamily: f }
                }))}
                value={style.font}
                onChange={(val) => updateStyle("font", val)}
              />
              <CustomDropdown
                label="Animation Style"
                options={ANIMATIONS}
                value={style.animation}
                onChange={(val) => updateStyle("animation", val as Animation)}
              />
            </div>

            <div className="flex gap-4 md:gap-5 flex-wrap">
              <div>
                <p className="field-label">Text Color</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.color}
                    onChange={(e) => updateStyle("color", e.target.value)}
                  />
                  <span className="text-[13px] text-text-muted">{style.color}</span>
                </div>
              </div>
              <div>
                <p className="field-label">Highlight Color</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.highlightColor}
                    onChange={(e) => updateStyle("highlightColor", e.target.value)}
                  />
                  <span className="text-[13px] text-text-muted">{style.highlightColor}</span>
                </div>
              </div>
              <div>
                <p className="field-label">Stroke Color</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.strokeColor === "transparent" ? "#000000" : style.strokeColor}
                    onChange={(e) => updateStyle("strokeColor", e.target.value)}
                  />
                  <span className="text-[13px] text-text-muted">{style.strokeColor}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="field-label">Font Size: {style.fontSize}px</p>
                <input
                  type="range"
                  min={32}
                  max={120}
                  step={2}
                  value={style.fontSize}
                  onChange={(e) => updateStyle("fontSize", Number(e.target.value))}
                />
              </div>
              <div>
                <p className="field-label">Stroke Width: {style.strokeWidth}px</p>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={style.strokeWidth}
                  onChange={(e) => updateStyle("strokeWidth", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <div>
                  <p className="field-label">Slant / Skew: {Math.round(style.skew * 100)}%</p>
                  <input
                    type="range"
                    min={-0.5}
                    max={0.5}
                    step={0.05}
                    value={style.skew}
                    onChange={(e) => updateStyle("skew", Number(e.target.value))}
                  />
               </div>
               <div>
                  <p className="field-label">Letter Spacing: {style.letterSpacing}px</p>
                  <input
                    type="range"
                    min={-4}
                    max={10}
                    step={1}
                    value={style.letterSpacing}
                    onChange={(e) => updateStyle("letterSpacing", Number(e.target.value))}
                  />
               </div>
            </div>

            <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <div
                    onClick={() => updateStyle("uppercase", !style.uppercase)}
                    className={`w-[52px] h-7 rounded-full relative transition-all duration-200 border-[1.5px] border-border-main cursor-pointer ${
                      style.uppercase ? "bg-accent shadow-[0_2px_4px_rgba(22,163,74,0.2)]" : "bg-[#e2e8f0]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm ${
                        style.uppercase ? "left-[28px]" : "left-[4px]"
                      }`}
                    />
                  </div>
                  <span className={`text-[13px] font-bold tracking-wider ${style.uppercase ? "text-text-main" : "text-text-muted"}`}>UPPERCASE</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <div
                    onClick={() => updateStyle("backgroundBox", !style.backgroundBox)}
                    className={`w-[52px] h-7 rounded-full relative transition-all duration-200 border-[1.5px] border-border-main cursor-pointer ${
                      style.backgroundBox ? "bg-accent shadow-[0_2px_4px_rgba(22,163,74,0.2)]" : "bg-[#e2e8f0]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white absolute top-[3px] transition-all duration-200 shadow-sm ${
                        style.backgroundBox ? "left-[28px]" : "left-[4px]"
                      }`}
                    />
                  </div>
                  <span className={`text-[13px] font-bold tracking-wider ${style.backgroundBox ? "text-text-main" : "text-text-muted"}`}>BOX MODE</span>
                </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="glass p-4 md:p-6">
            <div className="flex justify-between items-center mb-3.5">
              <p className="field-label mb-0">Preview</p>
              <button
                className="btn-primary px-5 py-2 text-[13px]"
                onClick={generatePreview}
                disabled={!text.trim()}
              >
                Run Preview
              </button>
            </div>
            <canvas
              ref={previewRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="preview-canvas w-full aspect-square"
            />
            <p className="text-[12px] text-text-muted text-center mt-2">
              Checkerboard = transparent background
            </p>
          </div>

          <div className="glass p-4 md:p-6">
            <p className="field-label mb-3.5">Export</p>

            {isWorking && (
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[13px] font-semibold">
                    {stage === "rendering" ? "Rendering frames..." : "Encoding video..."}
                    <span className="dot ml-1">●</span>
                    <span className="dot">●</span>
                    <span className="dot">●</span>
                  </span>
                  <span className="text-[13px] text-text-muted">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-1.5 bg-surface-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-accent rounded transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              className="btn-primary w-full mb-3"
              onClick={handleExport}
              disabled={isWorking || !text.trim()}
            >
              {isWorking ? "Processing..." : "Export Transparent .webm"}
            </button>

            {downloadUrl && stage === "done" && (
              <a
                href={downloadUrl}
                download="caption-overlay.webm"
                className="block text-center py-3 rounded-lg bg-accent text-white font-bold text-[14px] no-underline transition-colors shadow-[0_2px_4px_rgba(22,163,74,0.2)]"
              >
                Download caption-overlay.webm
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-surface border-t border-border-main mt-12 md:mt-20 py-12 md:py-24 pb-12 md:pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            <div>
              <p className="font-black text-lg mb-4">
                Caption<span className="text-accent">Forge</span>
              </p>
              <p className="text-[14px] text-text-muted leading-relaxed">
                Generate high-quality animated caption overlays for your videos. 
                Built for creators who want professional results.
              </p>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase text-text-muted mb-4">App Details</p>
              <ul className="list-none p-0 text-[14px] text-text-main flex flex-col gap-2.5">
                <li>Transparent Export (.webm)</li>
                <li>Professional Presets</li>
                <li>Instant Preview</li>
              </ul>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase text-text-muted mb-4">Privacy</p>
              <p className="text-[14px] text-text-muted leading-relaxed">
                All processing happens locally in your browser. Your text and videos never leave your computer.
              </p>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border-main text-center text-[12px] text-text-muted">
            © 2026 CaptionForge. Made for content creators.
          </div>
        </div>
      </footer>
    </main>
  );
}
