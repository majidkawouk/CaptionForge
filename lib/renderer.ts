import { TextStyle, Animation } from "./presets";

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1080;
export const FPS = 30;

interface RenderOptions {
  text: string;
  style: TextStyle;
  durationSeconds: number;
  onFrame: (frame: Blob, index: number, total: number) => Promise<void> | void;
  onProgress?: (pct: number) => void;
}

function loadGoogleFont(family: string): Promise<void> {
  const id = `font-${family.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@700&display=swap`;
    link.onload = () => {
      setTimeout(resolve, 300);
    };
    document.head.appendChild(link);
  });
}

function drawTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  words: string[],
  visibleCount: number,
  style: TextStyle,
  alpha: number,
  animation: Animation,
  frameInWord: number,
  totalFramesPerWord: number,
  totalProgress: number
) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const fontStr = `bold ${style.fontSize}px '${style.font}', sans-serif`;
  ctx.font = fontStr;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = `${style.letterSpacing}px`;

  const displayWords = words.slice(0, visibleCount);
  const text = style.uppercase
    ? displayWords.join(" ").toUpperCase()
    : displayWords.join(" ");

  const lastWord = style.uppercase
    ? (words[visibleCount - 1] || "").toUpperCase()
    : words[visibleCount - 1] || "";

  const maxWidth = CANVAS_WIDTH - 80;
  const lines = wrapText(ctx, text, maxWidth);

  const lineHeight = style.fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const startY = CANVAS_HEIGHT / 2 - totalHeight / 2 + lineHeight / 2;

  const wordProgress = frameInWord / totalFramesPerWord;

  lines.forEach((line, lineIdx) => {
    const y = startY + lineIdx * lineHeight;
    const x = CANVAS_WIDTH / 2;

    let offsetY = 0;
    let scaleAmt = 1;
    let lineAlpha = alpha;

    if (animation === "bounce" && lineIdx === lines.length - 1) {
      offsetY = Math.sin(wordProgress * Math.PI) * -30;
    }
    if (animation === "pop" && lineIdx === lines.length - 1) {
      scaleAmt = 0.8 + wordProgress * 0.2;
      lineAlpha = wordProgress;
    }
    if (animation === "fade" && lineIdx === lines.length - 1) {
      lineAlpha = wordProgress;
    }
    if (animation === "slide-up" && lineIdx === lines.length - 1) {
      offsetY = (1 - wordProgress) * 50;
      lineAlpha = wordProgress;
    }
    if (animation === "slide-left" && lineIdx === lines.length - 1) {
      ctx.translate((1 - wordProgress) * 50, 0);
      lineAlpha = wordProgress;
    }
    if (animation === "zoom" && lineIdx === lines.length - 1) {
      scaleAmt = 0.5 + wordProgress * 0.5;
      lineAlpha = wordProgress;
    }
    if (animation === "glitch" && lineIdx === lines.length - 1) {
      if (Math.random() > 0.8) {
        ctx.translate((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
      }
    }

    ctx.save();
    ctx.globalAlpha = lineAlpha;
    ctx.translate(x, y + offsetY);
    ctx.scale(scaleAmt, scaleAmt);

    const isLastLine = lineIdx === lines.length - 1;

    if (animation === "typewriter") {
        drawTypewriterLine(ctx, line, lineIdx, lines, totalProgress, style, 0, 0);
    } else if (isLastLine) {
      drawHighlightedLine(ctx, line, lastWord, style, 0, 0);
    } else {
      drawPlainLine(ctx, line, style, 0, 0);
    }

    ctx.restore();
  });
}

function drawPlainLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  style: TextStyle,
  x: number,
  y: number
) {
  ctx.save();
  if (style.skew && style.skew !== 0) {
    ctx.transform(1, 0, style.skew, 1, 0, 0);
  }

  if (style.strokeWidth > 0 && style.strokeColor !== "transparent") {
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth;
    ctx.lineJoin = "round";
    ctx.strokeText(line, x, y);
  }
  if (style.shadow) {
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  }
  ctx.fillStyle = style.color;
  ctx.fillText(line, x, y);
  ctx.restore();
}

function drawHighlightedLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  highlightWord: string,
  style: TextStyle,
  x: number,
  y: number
) {
  const words = line.split(" ");
  const totalWidth = ctx.measureText(line).width;
  let currentX = x - totalWidth / 2;

  words.forEach((word, i) => {
    const wordWidth = ctx.measureText(word).width;
    const spaceWidth = ctx.measureText(" ").width;
    const isHighlighted = word === highlightWord && i === words.length - 1;
    const drawX = currentX + wordWidth / 2;

    if (isHighlighted) {
      const pad = 8;
      ctx.fillStyle = style.highlightColor;
      ctx.beginPath();
      ctx.roundRect(
        drawX - wordWidth / 2 - pad,
        y - style.fontSize / 2 - pad / 2,
        wordWidth + pad * 2,
        style.fontSize + pad,
        6
      );
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.fillText(word, drawX, y);
    } else {
      drawPlainLineWord(ctx, word, style, drawX, y);
    }

    currentX += wordWidth + spaceWidth;
  });
}

function drawTypewriterLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  lineIdx: number,
  allLines: string[],
  totalProgress: number,
  style: TextStyle,
  x: number,
  y: number
) {
  const allCharacters = Array.from(allLines.join(""));
  const totalChars = allCharacters.length;
  
  const typingProgress = Math.min(1, totalProgress / 0.9);
  const visibleCharsTotal = Math.floor(totalChars * typingProgress);

  const previousTextChars = Array.from(allLines.slice(0, lineIdx).join(""));
  const charsBeforeThisLine = previousTextChars.length;
  
  const lineCharacters = Array.from(line);
  const charsInThisLine = lineCharacters.length;
  const visibleCharsInLine = Math.max(0, Math.min(charsInThisLine, visibleCharsTotal - charsBeforeThisLine));

  let displayText = lineCharacters.slice(0, visibleCharsInLine).join("");
  
  const isCurrentlyTypingThisLine = visibleCharsTotal >= charsBeforeThisLine && visibleCharsTotal < charsBeforeThisLine + charsInThisLine;
  const isLastLine = lineIdx === allLines.length - 1;
  const isDoneTypingAll = visibleCharsTotal >= totalChars;

  if (isCurrentlyTypingThisLine || (isLastLine && isDoneTypingAll)) {
    if (Math.floor(Date.now() / 400) % 2 === 0) {
        displayText += "|";
    } else {
        displayText += " "; 
    }
  }

  drawPlainLine(ctx, displayText, style, x, y);
}

function drawPlainLineWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  style: TextStyle,
  x: number,
  y: number
) {
  ctx.save();
  
  if (style.skew && style.skew !== 0) {
    ctx.transform(1, 0, style.skew, 1, 0, 0);
  }

  const wordWidth = ctx.measureText(word).width;

  if (style.backgroundBox) {
    const pad = 10;
    ctx.fillStyle = style.highlightColor;
    ctx.beginPath();
    ctx.roundRect(
      x - wordWidth / 2 - pad,
      y - style.fontSize / 2 - pad / 2,
      wordWidth + pad * 2,
      style.fontSize + pad,
      8
    );
    ctx.fill();
    ctx.fillStyle = "#000000";
  } else {
    ctx.fillStyle = style.color;
  }

  if (style.strokeWidth > 0 && style.strokeColor !== "transparent") {
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth;
    ctx.lineJoin = "round";
    ctx.strokeText(word, x, y);
  }

  if (style.shadow) {
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  }

  ctx.fillText(word, x, y);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function renderFrames(options: RenderOptions): Promise<void> {
  const { text, style, durationSeconds, onFrame, onProgress } = options;

  await loadGoogleFont(style.font);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  const words = text.trim().split(/\s+/);
  const totalFrames = Math.round(durationSeconds * FPS);
  const framesPerWord = Math.round(totalFrames / words.length);

  for (let frame = 0; frame < totalFrames; frame++) {
    const wordIndex = Math.min(
      Math.floor(frame / framesPerWord),
      words.length - 1
    );
    const frameInWord = frame % framesPerWord;

    const animation = style.animation;

    const wordIndexForLayout = animation === "typewriter" ? words.length : wordIndex + 1;
    let alpha = 1;

    drawTextOnCanvas(
      ctx,
      words,
      wordIndexForLayout,
      style,
      alpha,
      animation,
      frameInWord,
      framesPerWord,
      frame / totalFrames
    );

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/png");
    });
    
    await onFrame(blob, frame, totalFrames);

    onProgress?.((frame / totalFrames) * 100);

    await new Promise((r) => setTimeout(r, 0));
  }
}
