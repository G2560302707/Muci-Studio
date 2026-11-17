# My Components

Remotion component library for reusable content production.

## Commands

```bash
npm run studio
npm run render:demo
npm run render:episode
```

## Layout

```text
src/components/   reusable components
src/index.ts      Remotion entry point
src/Root.tsx      composition registry
library/          approved component metadata
out/previews/     approved component previews
public/fonts/     shared fonts
public/media/     shared media assets
STYLE-GUIDE.md    shared component style rules
INDEX.md          component catalog
RECORDING.md      recording standard
```

## Component Registration

A business component is registered only when all three items exist:

```text
src/components/<Name>.tsx
library/<Name>/meta.json
out/previews/<Name>.mp4
```

Register the component in `INDEX.md` with `status: approved`. Do not promote style-test or experimental variants.
