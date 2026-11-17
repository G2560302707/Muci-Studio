from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LIBRARY = ROOT / "library"
SOURCE_ROOT = Path("D:/Tabletop/自媒体/my-components")
PACKAGE = "components/projects/my-components-20261113"
PACKAGE_ROOT = ROOT / PACKAGE
COLLECTION_ID = "my-components-20261113"
ADDED_AT = "2026-11-13T08:00:00+08:00"

COMPONENTS = {
    "Backdrop": {
        "categoryId": "explain",
        "title": "低干扰点阵背景层",
        "description": "白底外层与黑色小窗之间的低干扰点阵背景，保持层级稳定。",
        "useIds": ["explanation"],
        "conceptIds": ["text", "orientation"],
        "scenarioId": "window",
        "inputObjects": [],
        "action": "以细点阵建立背景层级，不抢主体内容",
        "segmentRole": "背景层",
        "sceneTypes": ["background", "relationship"],
        "tags": ["背景", "点阵", "层级", "黑窗", "低干扰"],
    },
    "BulletList": {
        "categoryId": "explain",
        "title": "逐条出现的要点列表",
        "description": "要点逐条进入，当前行用紫色强调，适合步骤、亮点和结论。",
        "useIds": ["explanation"],
        "conceptIds": ["text", "process", "cards"],
        "scenarioId": "list",
        "inputObjects": ["文本清单"],
        "action": "逐条展示要点并高亮当前行",
        "segmentRole": "讲解步骤与清单",
        "sceneTypes": ["list", "process", "relationship"],
        "tags": ["要点", "列表", "讲解", "步骤", "结论"],
    },
    "ChapterCard": {
        "categoryId": "handoff",
        "title": "章节分隔卡",
        "description": "用章节号和标题建立分段，适合教程或系列内容的换章停顿。",
        "useIds": ["transition"],
        "conceptIds": ["text", "handoff"],
        "scenarioId": "chapter",
        "inputObjects": ["章节序号", "章节标题"],
        "action": "章节号与标题先后出现，形成分段锚点",
        "segmentRole": "章节过渡",
        "sceneTypes": ["chapter", "transition"],
        "tags": ["章节", "转场", "分段", "教程"],
    },
    "FlashIntro": {
        "categoryId": "explain",
        "title": "榜单开场快闪",
        "description": "多张信息卡快速切换，适合榜单开场或项目关键词强调。",
        "useIds": ["explanation"],
        "conceptIds": ["text", "cards", "handoff"],
        "scenarioId": "headline",
        "inputObjects": ["短句卡片"],
        "action": "按节奏快速切换开场卡",
        "segmentRole": "开场强调",
        "sceneTypes": ["opening", "transition"],
        "tags": ["开场", "榜单", "快闪", "强调"],
    },
    "MaskText": {
        "categoryId": "explain",
        "title": "遮罩文本揭示",
        "description": "文本按方向遮入，适合金句、强调句和短文本承接。",
        "useIds": ["explanation", "transition"],
        "conceptIds": ["text", "handoff"],
        "scenarioId": "text",
        "inputObjects": ["短文本"],
        "action": "文本从指定方向遮入并停留",
        "segmentRole": "文本强调",
        "sceneTypes": ["text-reveal", "transition"],
        "tags": ["文本", "揭示", "金句", "强调"],
    },
    "NumberRoll": {
        "categoryId": "data",
        "title": "数字滚动落定",
        "description": "数字从起点滚动到目标值，适合数据、涨星和增长指标。",
        "useIds": ["numbers"],
        "conceptIds": ["data", "text"],
        "scenarioId": "number",
        "inputObjects": ["数字", "说明文案"],
        "action": "数字滚动到目标值并落定",
        "segmentRole": "数据落定",
        "sceneTypes": ["number", "data"],
        "tags": ["数字", "数据", "滚动", "增长"],
    },
    "OutroCard": {
        "categoryId": "explain",
        "title": "结尾推荐卡",
        "description": "回收要点、提问和行动按钮，适合推荐或视频收尾。",
        "useIds": ["explanation"],
        "conceptIds": ["summary", "text", "cards"],
        "scenarioId": "headline",
        "inputObjects": ["标题", "要点", "提问", "行动按钮"],
        "action": "结尾依次回收内容并引导行动",
        "segmentRole": "结尾引导",
        "sceneTypes": ["outro", "summary"],
        "tags": ["结尾", "推荐", "互动", "引导"],
    },
    "PillTags": {
        "categoryId": "explain",
        "title": "时序弹点标签组",
        "description": "标签按 cue 时序弹入，适合功能点、关键词和身份标签。",
        "useIds": ["explanation"],
        "conceptIds": ["text", "cards"],
        "scenarioId": "list",
        "inputObjects": ["标签", "出现时序"],
        "action": "标签按节奏依次弹入",
        "segmentRole": "标签强调",
        "sceneTypes": ["tags", "list"],
        "tags": ["标签", "关键词", "功能点", "时序"],
    },
    "ProjectCard": {
        "categoryId": "images",
        "title": "项目详情展示卡",
        "description": "聚合项目图、要点、标签和仓库地址，适合开源项目推荐。",
        "useIds": ["media", "explanation"],
        "conceptIds": ["cards", "media", "summary"],
        "scenarioId": "wall",
        "inputObjects": ["项目图", "要点", "标签", "仓库地址"],
        "action": "项目信息分层进场并强化关键点",
        "segmentRole": "作品或项目展示",
        "sceneTypes": ["media", "cards", "detail"],
        "tags": ["项目", "开源", "详情", "展示"],
    },
    "RankingIntro": {
        "categoryId": "explain",
        "title": "榜单开场与项目列表",
        "description": "标题和候选项目依次进入，适合榜单推荐、清单和对比总结。",
        "useIds": ["explanation", "numbers"],
        "conceptIds": ["cards", "text", "comparison"],
        "scenarioId": "list",
        "inputObjects": ["标题", "候选项目"],
        "action": "标题与候选项目逐条进场",
        "segmentRole": "榜单开场",
        "sceneTypes": ["opening", "list"],
        "tags": ["榜单", "清单", "排名", "开场"],
    },
    "ScreenCard": {
        "categoryId": "recording-focus",
        "title": "截图/录屏展示卡",
        "description": "用黑色小窗承载真实录屏，支持标题、速度徽标和局部聚焦。",
        "useIds": ["recording-focus"],
        "conceptIds": ["media", "focus"],
        "scenarioId": "focus",
        "inputObjects": ["截图或录屏", "标题"],
        "action": "媒体进入小窗并按 cue 局部聚焦",
        "segmentRole": "真实素材展示",
        "sceneTypes": ["device-demo", "screen-recording"],
        "tags": ["录屏", "截图", "演示", "聚焦"],
    },
    "Subtitle": {
        "categoryId": "explain",
        "title": "底部字幕 cue",
        "description": "字幕按 cue 时序显示，适合口播对齐、说明转写和临时强调。",
        "useIds": ["explanation", "transition"],
        "conceptIds": ["text", "process"],
        "scenarioId": "text",
        "inputObjects": ["字幕 cue"],
        "action": "字幕按时间轴逐句切换",
        "segmentRole": "口播对齐",
        "sceneTypes": ["subtitle", "timing"],
        "tags": ["字幕", "口播", "时间轴", "对齐"],
    },
}


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def route_key(value: str) -> str:
    return "/api/design-assets/" + value[:24]


def source_route_key(value: str) -> str:
    return "/api/design-source/" + value[:24]


def preview_durations() -> dict[str, int]:
    text = (SOURCE_ROOT / "src/components/previews.tsx").read_text(encoding="utf-8")
    values = {
        match.group(1): int(match.group(2))
        for match in re.finditer(
            r'\{ name: "([^"]+)", durationInFrames: (\d+), component:',
            text,
        )
    }
    missing = set(COMPONENTS) - set(values)
    if missing:
        raise ValueError(f"Missing preview durations: {sorted(missing)}")
    return values


def copy_component_sources() -> dict[str, str]:
    target = PACKAGE_ROOT / "src/components"
    target.mkdir(parents=True, exist_ok=True)
    names = [*COMPONENTS, "WindowShell", "index", "previews"]
    hashes = {}
    for name in names:
        source = SOURCE_ROOT / "src/components" / f"{name}.tsx"
        destination = target / f"{name}.tsx"
        if source.stat().st_size != destination.stat().st_size or sha256(source) != sha256(destination):
            shutil.copyfile(source, destination)
        hashes[str(destination.relative_to(ROOT))] = sha256(destination)
    for filename in ("package.json", "tsconfig.json", "INDEX.md", "STYLE-GUIDE.md"):
        source = SOURCE_ROOT / filename
        destination = PACKAGE_ROOT / filename
        if source.stat().st_size != destination.stat().st_size or sha256(source) != sha256(destination):
            shutil.copyfile(source, destination)
    return hashes


def register_media() -> tuple[dict[str, dict[str, str]], dict[str, str]]:
    media_path = LIBRARY / "media-manifest.json"
    routes_path = LIBRARY / "routes.json"
    media = read_json(media_path)
    routes = read_json(routes_path)
    records = {}
    preview_hashes = {}
    for name in COMPONENTS:
        video = SOURCE_ROOT / "out/previews" / f"{name}-style-test.mp4"
        if not video.is_file():
            raise FileNotFoundError(video)
        digest = sha256(video)
        preview_hashes[name] = digest
        relative = f"media/previews/{digest}.mp4"
        target = ROOT / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.stat().st_size != video.stat().st_size or sha256(target) != digest:
            shutil.copyfile(video, target)
        media["files"][relative] = {
            "sha256": digest,
            "size": video.stat().st_size,
            "kind": "mp4",
            "status": "reviewed",
        }
        route = route_key(digest)
        routes[route] = relative
        poster_digest = hashlib.sha256(f"{COLLECTION_ID}:{name}:poster".encode()).hexdigest()
        poster_relative = f"media/previews/{poster_digest}.jpg"
        poster_target = ROOT / poster_relative
        poster_target.parent.mkdir(parents=True, exist_ok=True)
        if not poster_target.is_file():
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-ss",
                    "0.5",
                    "-i",
                    str(video),
                    "-frames:v",
                    "1",
                    "-q:v",
                    "2",
                    str(poster_target),
                ],
                check=True,
                capture_output=True,
            )
        media["files"][poster_relative] = {
            "sha256": poster_digest,
            "size": poster_target.stat().st_size,
            "kind": "jpg",
            "status": "reviewed",
        }
        poster_route = route_key(poster_digest)
        routes[poster_route] = poster_relative
        records[name] = {
            "video": {
                "relative": relative,
                "route": route,
                "sha256": digest,
                "size": video.stat().st_size,
            },
            "poster": {
                "relative": poster_relative,
                "route": poster_route,
                "sha256": poster_digest,
                "size": poster_target.stat().st_size,
            },
        }
    write_json(media_path, media)
    write_json(routes_path, routes)
    return records, preview_hashes


def build_items(
    source_hashes: dict[str, str],
    media: dict[str, dict[str, str]],
    durations: dict[str, int],
) -> list[dict]:
    catalog = read_json(LIBRARY / "catalog.json")
    categories = {item["id"]: item for item in catalog["categories"]}
    scenarios = {item["id"]: item for item in catalog["scenarios"]}
    items = []
    for index, (name, definition) in enumerate(COMPONENTS.items(), start=1):
        meta = read_json(SOURCE_ROOT / "src/components/meta" / f"{name}.json")
        category = categories[definition["categoryId"]]
        scenario = scenarios[definition["scenarioId"]]
        frames = durations[name]
        seconds = frames / 30
        preview = media[name]["video"]
        poster = media[name]["poster"]
        component_path = f"{PACKAGE}/src/components/{name}.tsx"
        shell_path = f"{PACKAGE}/src/components/WindowShell.tsx"
        tags = [COLLECTION_ID, name, category["title"], *definition["tags"]]
        matching_tags = [name, category["title"], *definition["tags"]]
        item = {
            "id": f"component:my-components-{name.lower()}",
            "referenceId": f"my-components-{name.lower()}",
            "label": name,
            "title": definition["title"],
            "kind": "components",
            "category": category["title"],
            "categoryId": definition["categoryId"],
            "origin": "BenBen 自制组件 12 条",
            "description": definition["description"],
            "tags": tags,
            "selectionStatus": "keep",
            "status": "keep",
            "reviewKind": "registered",
            "reviewStatus": "keep",
            "visibleByDefault": True,
            "defaultReuse": True,
            "collectionId": COLLECTION_ID,
            "addedAt": ADDED_AT,
            "isNew": True,
            "displayPriority": -1000 + index,
            "libraryOrder": index,
            "sceneTypes": definition["sceneTypes"],
            "mergedInto": [],
            "hiddenReason": None,
            "reusability": {
                "level": "parameterized",
                "label": "确认标准小窗组件 · 可替换内容",
                "parameters": meta["props"],
                "limitations": [
                    "统一使用白底外层、黑色小窗、MiSans Heavy 和 #D6BEFF 紫色强调。",
                    "替换真实内容后需重新预览，确认字数、节奏和聚焦边界。",
                ],
            },
            "previews": [
                {
                    "videoUrl": preview["route"],
                    "posterUrl": poster["route"],
                    "available": True,
                    "status": "ready",
                    "start": 0,
                    "end": seconds,
                    "fps": 30,
                    "width": 1080,
                    "height": 1920,
                    "sha256": preview["sha256"],
                    "label": definition["title"],
                    "audioPolicy": "preview-render-track-no-narration",
                    "posterTimeSeconds": 0.5,
                    "posterSelection": "confirmed style test frame",
                    "access": "public",
                }
            ],
            "sources": [
                {
                    "label": f"{name}.tsx",
                    "path": component_path,
                    "symbol": name,
                    "url": source_route_key(source_hashes[component_path]),
                    "sha256": source_hashes[component_path],
                    "available": True,
                    "status": "ready",
                    "installPath": component_path,
                    "access": "public",
                },
                {
                    "label": "WindowShell.tsx",
                    "path": shell_path,
                    "symbol": "WindowShell",
                    "url": source_route_key(source_hashes[shell_path]),
                    "sha256": source_hashes[shell_path],
                    "available": True,
                    "status": "ready",
                    "installPath": shell_path,
                    "access": "public",
                },
            ],
            "matching": {
                "referenceId": f"my-components-{name.lower()}",
                "primaryUse": definition["categoryId"],
                "useIds": definition["useIds"],
                "sourceId": COLLECTION_ID,
                "conceptIds": definition["conceptIds"],
                "inputObjects": definition["inputObjects"],
                "action": definition["action"],
                "segmentRole": definition["segmentRole"],
                "nativeDurationSeconds": seconds,
                "adaptation": "确认标准小窗实现；实际内容替换后仍需重看视频预览。",
                "tags": matching_tags,
                "scenarioId": scenario["id"],
                "scenarioTitle": scenario["title"],
                "addedAt": ADDED_AT,
                "label": name,
                "categoryId": definition["categoryId"],
                "category": category["title"],
                "sceneTypes": definition["sceneTypes"],
            },
            "implementation": {
                "compositionId": name,
                "fps": 30,
                "width": 1080,
                "height": 1920,
                "durationInFrames": frames,
                "runtimeVersions": {"remotion": "4.0.515", "react": "18.3.1"},
                "projects": [PACKAGE],
                "reuseBoundary": "Local confirmed source snapshot; WindowShell is required for visual parity.",
            },
        }
        items.append(item)
    return items


def register_catalog(items: list[dict]) -> None:
    path = LIBRARY / "catalog.json"
    catalog = read_json(path)
    retained = [item for item in catalog["items"] if item.get("collectionId") != COLLECTION_ID]
    catalog["items"] = [*retained, *items]
    counts = catalog["counts"]
    counts["total"] = len(catalog["items"])
    counts["visible"] = sum(
        item.get("visibleByDefault") is True
        and item.get("status") not in {"remove", "merged", "drop"}
        and not item.get("hiddenReason")
        for item in catalog["items"]
    )
    counts["available"] = sum(
        bool(item.get("previews") and any(preview.get("available") for preview in item["previews"]))
        for item in catalog["items"]
    )
    counts["unavailable"] = counts["total"] - counts["available"]
    counts["skillActive"] = sum(item.get("reviewKind") == "skill" for item in catalog["items"])
    counts["skillArchived"] = counts["total"] - counts["skillActive"]
    write_json(path, catalog)


def main() -> None:
    durations = preview_durations()
    source_hashes = copy_component_sources()
    media, _ = register_media()
    items = build_items(source_hashes, media, durations)
    register_catalog(items)
    print(f"Registered {len(items)} components into {COLLECTION_ID}")


if __name__ == "__main__":
    main()
