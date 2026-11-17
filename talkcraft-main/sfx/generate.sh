#!/usr/bin/env bash
# SFX 音效库再生成脚本(ffmpeg 程序合成,零版权风险)
# 依赖: ffmpeg。在 talkcraft-main/sfx/ 目录下运行。
set -e
cd "$(dirname "$0")"

ffmpeg -y -v error -f lavfi -i "sine=frequency=620:duration=0.09" \
  -af "afade=t=out:st=0.01:d=0.08,volume=0.9" -ar 44100 pop.mp3

ffmpeg -y -v error -f lavfi -i "anoisesrc=color=pink:duration=0.45" \
  -af "lowpass=f=1400,highpass=f=300,afade=t=in:d=0.18,afade=t=out:st=0.22:d=0.23,volume=0.55" -ar 44100 whoosh-045.mp3

ffmpeg -y -v error -f lavfi -i "anoisesrc=color=pink:duration=1.0" \
  -af "lowpass=f=1600,highpass=f=250,afade=t=in:d=0.35,afade=t=out:st=0.6:d=0.4,volume=0.6" -ar 44100 whoosh-100.mp3

ffmpeg -y -v error -f lavfi -i "sine=frequency=1318:duration=0.45" \
  -af "afade=t=out:st=0.04:d=0.4,volume=0.55" -ar 44100 ding.mp3

ffmpeg -y -v error -f lavfi -i "sine=frequency=150:duration=0.16" \
  -af "afade=t=out:st=0.02:d=0.14,volume=0.95" -ar 44100 stamp.mp3

echo "生成完成:"
for f in *.mp3; do echo "  $f: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")s"; done
