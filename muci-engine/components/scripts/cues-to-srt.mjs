#!/usr/bin/env node
/**
 * cues → subtitles.srt（D1 / HANDOFF P3）
 *
 * 输入：epNN.config.json（读 meta.fps + cues[]），或独立 cues JSON。
 * 不要与 audio-subtitle-roughcut（ASR/QC）混用——本脚本只做「已有 cue 表 → SRT」。
 *
 * 用法：
 *   node scripts/cues-to-srt.mjs --config path/to/epNN.config.json --out path/to/subtitles.srt
 *   node scripts/cues-to-srt.mjs --cues path/to/cues.json --fps 30 --out path/to/subtitles.srt
 *
 * cues 项形状：{ text, from, duration }（帧；半开区间 [from, from+duration)）
 */

import fs from "node:fs";
import path from "node:path";

function usage() {
  console.log(`Usage:
  node scripts/cues-to-srt.mjs --config <epNN.config.json> --out <subtitles.srt>
  node scripts/cues-to-srt.mjs --cues <cues.json> --fps <n> --out <subtitles.srt>`);
}

function parseArgs(argv) {
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { help: true };
    if (!a.startsWith("--") || i + 1 >= argv.length) throw new Error(`Bad arg: ${a}`);
    opt[a.slice(2)] = argv[++i];
  }
  return opt;
}

/** frame index → SRT clock HH:MM:SS,mmm */
function framesToSrtTime(frame, fps) {
  const totalMs = Math.round((frame / fps) * 1000);
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function normalizeCues(raw) {
  if (!Array.isArray(raw)) throw new Error("cues must be an array");
  return raw
    .map((c, i) => {
      if (typeof c?.text !== "string") throw new Error(`cues[${i}].text must be string`);
      if (!Number.isFinite(c.from) || c.from < 0) throw new Error(`cues[${i}].from invalid`);
      if (!Number.isFinite(c.duration) || c.duration <= 0) {
        throw new Error(`cues[${i}].duration must be > 0`);
      }
      return {
        text: c.text.trim(),
        from: Math.floor(c.from),
        duration: Math.floor(c.duration),
      };
    })
    .filter((c) => c.text.length > 0);
}

function cuesToSrt(cues, fps) {
  if (!Number.isFinite(fps) || fps <= 0) throw new Error("fps must be > 0");
  const blocks = cues.map((c, i) => {
    const start = framesToSrtTime(c.from, fps);
    const end = framesToSrtTime(c.from + c.duration, fps);
    return `${i + 1}\n${start} --> ${end}\n${c.text}\n`;
  });
  return blocks.join("\n");
}

function loadFromConfig(configPath) {
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const fps = cfg?.meta?.fps;
  if (!Number.isFinite(fps)) throw new Error("config.meta.fps required");
  return { fps, cues: normalizeCues(cfg.cues ?? []) };
}

function loadFromCuesFile(cuesPath, fpsRaw) {
  const fps = Number(fpsRaw);
  const data = JSON.parse(fs.readFileSync(cuesPath, "utf8"));
  const list = Array.isArray(data) ? data : data.cues;
  return { fps, cues: normalizeCues(list) };
}

function main() {
  let opt;
  try {
    opt = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    usage();
    process.exit(1);
  }
  if (opt.help || (!opt.config && !opt.cues)) {
    usage();
    process.exit(opt.help ? 0 : 1);
  }
  if (!opt.out) {
    console.error("--out required");
    process.exit(1);
  }

  const { fps, cues } = opt.config
    ? loadFromConfig(path.resolve(opt.config))
    : loadFromCuesFile(path.resolve(opt.cues), opt.fps);

  if (cues.length === 0) {
    console.error("No non-empty cues to export");
    process.exit(1);
  }

  const srt = cuesToSrt(cues, fps);
  const outPath = path.resolve(opt.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, srt, "utf8");
  console.log(`Wrote ${cues.length} cues → ${outPath} (fps=${fps})`);
}

main();
