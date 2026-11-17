# Component Style Guide

> **适用范围：白窗系「风格」（白底 / 墨色 `#111114` / 稀疏紫 `#7C3AED`），与画幅无关，横屏竖屏都能用。** 本文不规定画幅；ep04 现有实现是 720×1280 竖屏，横屏需另给一套 layout token（见根 README §4）。
> ep03「GitHub Top 5」用的是黑金系（纯黑底 + `#fbbf24` + Courier New），规范在 `custom-skills/github-top5-video/SKILL.md`，与本文件互斥、不可混用。
> 新一期开工先在 `src/epXX/style/tokens.ts` 声明本期 token；跨期视觉以本期 tokens 为准，视觉硬规则仍以原则主库 `muci-engine/.../DESIGN.md` 为准。

## Overall look

- Follow the FredTalk-inspired white window look: white surface, centered dark text, clean hierarchy.
- Use MiSans Semibold (`fontWeight: 600`) for Chinese headings, labels and body lines; avoid synthetic 900 weight.
- Keep the outer background light/white and let the white rounded window carry the main content.
- Avoid decorative bullets, yellow accents, and generic pill lists unless they have a clear content reason.

## White window format

- Use a white rounded window as the main carrier.
- Include a small window chrome bar with three dots.
- Center the title and body lines inside the window.
- Use a clear main/secondary type hierarchy; do not put every line at the same size.
- Keep the composition roomy but readable.

## Motion

- Reveal text progressively, preferably character-by-character or line-by-line.
- Keep motion calm and readable, not flashy.
- Use a blinking cursor only while the content is being typed.
- Highlight the current key line with sparse `#7C3AED` purple; do not tint the whole carrier.

## Component adaptation

- Keep each component’s own function and small-window innovation.
- Apply the shared typography, spacing, motion, and window format consistently.
- Update `meta.json`, `preview.mp4`, and `INDEX.md` when a component is finalized.
- Render a single component preview before updating the full showcase.

## Reference implementation

`src/components/BulletList.tsx` is the accepted style reference.
