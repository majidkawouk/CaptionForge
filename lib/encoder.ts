import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { CANVAS_WIDTH, CANVAS_HEIGHT, FPS } from "./renderer";

export function checkSupport(): { supported: boolean; reason?: string } {
  if (typeof SharedArrayBuffer === "undefined") {
    return {
      supported: false,
      reason: "SharedArrayBuffer is not supported. Ensure your browser is up to date and you're enabled cross-origin isolation headers.",
    };
  }
  return { supported: true };
}

async function createIsolatedFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  ffmpeg.on("log", ({ message }) => {
    console.log("FFmpeg isolated log:", message);
  });

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  
  return ffmpeg;
}

async function safeDelete(ffmpeg: FFmpeg, path: string) {
  try {
    await ffmpeg.deleteFile(path);
  } catch (e) {
  }
}

const CHUNK_SIZE_FRAMES = FPS * 15; 

export async function runExport(
  renderFramesFn: (onFrame: (frame: Blob, index: number) => Promise<void>) => Promise<number>,
  onProgress: (pct: number) => void
): Promise<Blob> {
  const support = checkSupport();
  if (!support.supported) {
    throw new Error(support.reason);
  }

  const ffmpeg = await createIsolatedFFmpeg();
  const chunkFiles: string[] = [];
  let currentChunkFrames = 0;

  try {
    await renderFramesFn(async (frameBlob, index) => {
      const filename = `frame${String(currentChunkFrames).padStart(5, "0")}.png`;
      await ffmpeg.writeFile(filename, await fetchFile(frameBlob));
      currentChunkFrames++;

      if (currentChunkFrames >= CHUNK_SIZE_FRAMES) {
        const chunkIndex = chunkFiles.length;
        const chunkName = `chunk_${chunkIndex}.webm`;
        
        const code = await ffmpeg.exec([
          "-framerate", String(FPS),
          "-i", "frame%05d.png",
          "-c:v", "libvpx", 
          "-pix_fmt", "yuva420p",
          "-b:v", "2M", 
          "-threads", "1",
          "-crf", "10", 
          "-auto-alt-ref", "0",
          chunkName,
        ]);

        if (code !== 0) throw new Error(`Chunk ${chunkIndex} failed with code ${code}`);
        chunkFiles.push(chunkName);

        for (let i = 0; i < currentChunkFrames; i++) {
          await safeDelete(ffmpeg, `frame${String(i).padStart(5, "0")}.png`);
        }
        currentChunkFrames = 0;
      }
      
      onProgress(Math.min(95, (index / (index + 200)) * 100));
    });

    if (currentChunkFrames > 0) {
      const chunkIndex = chunkFiles.length;
      const chunkName = `chunk_${chunkIndex}.webm`;
      await ffmpeg.exec([
        "-framerate", String(FPS),
        "-i", "frame%05d.png",
        "-c:v", "libvpx",
        "-pix_fmt", "yuva420p",
        "-b:v", "2M",
        "-threads", "1",
        "-crf", "10",
        "-auto-alt-ref", "0",
        chunkName,
      ]);
      chunkFiles.push(chunkName);
      for (let i = 0; i < currentChunkFrames; i++) {
        await safeDelete(ffmpeg, `frame${String(i).padStart(5, "0")}.png`);
      }
    }

    let finalFile = chunkFiles[0];
    if (chunkFiles.length > 1) {
      const concatContent = chunkFiles.map(f => `file '${f}'`).join("\n");
      await ffmpeg.writeFile("concat.txt", concatContent);
      const code = await ffmpeg.exec([
        "-f", "concat", "-safe", "0", "-i", "concat.txt",
        "-threads", "1", "-c", "copy", "output.webm"
      ]);
      if (code !== 0) throw new Error(`Concat failed with code ${code}`);
      finalFile = "output.webm";
    }

    const data = await ffmpeg.readFile(finalFile);
    const uint8 = new Uint8Array(
      data instanceof Uint8Array ? data.buffer.slice(0) : (data as unknown as ArrayBuffer)
    );

    return new Blob([uint8 as any], { type: "video/webm" });
  } finally {
    try {
      await ffmpeg.terminate();
    } catch (e) {
    }
  }
}

export async function prepareEncoder() { return null; }
export async function addFrame() {}
export async function finalizeEncoder() { return new Blob(); }
export async function runFFmpegCommand() {}
export async function resetFFmpeg() {}
