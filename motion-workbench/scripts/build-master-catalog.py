"""生成主库 talkcraft-main/catalog.json：聚合五源组件元数据，统一按 talkcraft 标准字段。

底料: motion-workbench/data/catalog.json 的 1269 条(workbench 索引, 含中文 use/category)
增补: benben-b 31 条(读 external/benben-b/*/group-manifest.json)
重映射: sourcePath 一律指向主库内路径; core 13 条换源 meta.json(经像素回归 approved)
增强: remocn/snapcn 用 zh-map 关键词推断中文 category, use 空时以 description 兜底

用法: python -I build-master-catalog.py  (cwd = D:/Tabletop/自媒体)
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path("D:/Tabletop/自媒体")
MASTER = ROOT / "talkcraft-main"
WB = ROOT / "motion-workbench/data/catalog.json"

ZH_MAP = json.loads((ROOT / "motion-workbench/data/zh-map.json").read_text(encoding="utf-8"))

# talkcraft 卡的画幅例外(非 960×540): 从 template/cards/*.tsx 的 meta 读取为准
CANVAS_RE = re.compile(r"width:\s*(\d+),\s*height:\s*(\d+)")


def pinned_or_infer(rec: dict, fallback: str) -> str:
    """底料已钉住语义分类(2026-11-15 中文化时写入)则直接用,否则按 zh-map 推断。"""
    cat = rec.get("category", "")
    if cat and cat not in ("Remocn 组件", "Snapcn 组件", "综合组件"):
        return cat
    zh_cat = infer_category_zh(rec)
    return zh_cat if zh_cat != "综合组件" else fallback


def talkcraft_canvas(name: str):
    f = MASTER / "template/cards" / f"{name}.tsx"
    if not f.exists():
        return None
    head = f.read_text(encoding="utf-8", errors="ignore")[:2000]
    m = CANVAS_RE.search(head)
    if not m:
        return None
    w, h = int(m.group(1)), int(m.group(2))
    return {"width": w, "height": h} if w and h else None


def infer_category_zh(rec: dict) -> str:
    """remocn/snapcn: 用 title+description+keywords 关键词映射中文类目。"""
    text = " ".join(
        str(rec.get(k, "")) for k in ("name", "title", "description", "use")
    ).lower()
    for kw, zh in ZH_MAP.items():
        if kw.lower() in text:
            return zh
    # 退而求其次: 已有 category 里的英文目录名映射
    for kw, zh in ZH_MAP.items():
        if kw in str(rec.get("category", "")).lower():
            return zh
    return "综合组件"


# shotcraft: 建立 name -> demos 下真实 tsx 路径索引
shotcraft_index: dict[str, str] = {}
for p in (MASTER / "external/shotcraft/demos").rglob("*.tsx"):
    shotcraft_index.setdefault(p.stem, str(p.relative_to(MASTER)).replace("\\", "/"))
    shotcraft_index.setdefault(p.parent.name, str(p.relative_to(MASTER)).replace("\\", "/"))

shotcraft_candidates: dict[str, list[Path]] = {}
for p in (MASTER / "external/shotcraft/demos").rglob("*.tsx"):
    if "_legacy" not in p.parts:
        shotcraft_candidates.setdefault(p.parent.name, []).append(p)


def pascal_to_kebab(value: str) -> str:
    return "-".join(part.lower() for part in re.findall(r"[A-Z]?[a-z0-9]+", value))


def shotcraft_source(group_name: str, style_key: str) -> str | None:
    candidates = shotcraft_candidates.get(group_name, [])
    normalized = [
        (p, pascal_to_kebab(p.stem))
        for p in candidates
    ]
    exact = [p for p, stem in normalized if stem == style_key]
    prefix = [p for p, stem in normalized if stem.startswith(style_key)]
    chosen = exact or prefix or candidates
    if len(chosen) != 1:
        return None
    return str(chosen[0].relative_to(MASTER)).replace("\\", "/")


def remap(rec: dict) -> dict | None:
    lib = rec["library"]
    out = {
        "id": rec["id"],
        "library": lib,
        "libraryLabel": rec.get("libraryLabel", lib),
        "name": rec["name"],
        "title": rec.get("title") or rec["name"],
        "description": rec.get("description", ""),
        "use": rec.get("use", ""),
        "category": rec.get("category", ""),
        "keywords": rec.get("keywords", []),
        "energy": rec.get("energy", ""),
        "duration": rec.get("duration", ""),
        "previewUrl": rec.get("previewUrl", ""),
        "posterUrl": rec.get("posterUrl", ""),
    }
    if lib == "my-components":
        name = rec["name"]
        meta_f = ROOT / f"muci-engine/components/library/{name}/meta.json"
        meta = json.loads(meta_f.read_text(encoding="utf-8")) if meta_f.exists() else {}
        out.update(
            id=f"core:{name}",
            library="core",
            libraryLabel="核心组件",
            title=meta.get("description") or name,
            use=f"白窗紫核心组件: {meta.get('description', '')} 支持横竖屏与黑金/白紫双主题。",
            category="主库组件",
            aspect="both",
            canvas=None,
            themes=["whiteWindow", "blackGold"],
            sourcePath=f"core/components/{name}.tsx",
            previewPath=f"../muci-engine/components/out/previews/{name}.mp4",
            status=meta.get("status", "approved"),
        )
        return out
    if lib == "video-talkcraft":
        canvas = talkcraft_canvas(rec["name"])
        out.update(
            sourcePath=f"template/cards/{rec['name']}.tsx",
            aspect="landscape" if canvas else "adaptive",
            canvas=canvas,
            status="approved",
        )
        return out
    if lib == "video-shotcraft":
        group_name = rec["id"].split(":", 1)[-1].split("/", 1)[0]
        style_key = rec["name"]
        rel = shotcraft_source(group_name, style_key)
        rel = rel or shotcraft_index.get(group_name) or shotcraft_index.get(rec["name"])
        out.update(
            sourcePath=rel or f"external/shotcraft/demos/{rec['name']}",
            aspect="adaptive",
            status="approved",
        )
        return out
    if lib == "remocn":
        tsx_path = MASTER / "external/remocn" / f"{rec['name']}.tsx"
        ts_path = MASTER / "external/remocn" / f"{rec['name']}.ts"
        out.update(
            sourcePath=(
                f"external/remocn/{rec['name']}.tsx"
                if tsx_path.exists()
                else f"external/remocn/{rec['name']}.ts"
            ),
            aspect="adaptive",
            category=pinned_or_infer(rec, "Remocn 组件"),
            use=rec.get("use") or rec.get("description", ""),
            status="inherited",
        )
        return out
    if lib == "snapcn":
        out.update(
            sourcePath=f"external/snapcn/{rec['name']}/index.tsx",
            aspect="adaptive",
            category=pinned_or_infer(rec, "Snapcn 组件"),
            status="inherited",
        )
        return out
    return None


BENBEN_ISSUE_ZH = "待办: v3 版需按原生源实测参数重建, 并做哈希绑定复核。"


def benben_records() -> list[dict]:
    # 90 个 manifest 目录是同一份内容的重复拷贝(31 个编号各现 4 次, 逐字段一致):
    # 按编号去重、一个组件一条, 消除主库同 id 多条的歧义; createdAt 新者优先(保险起见)。
    seen: dict[str, tuple[str, dict, str]] = {}  # label -> (createdAt, item, manifest目录名)
    for mf in sorted((MASTER / "external/benben-b").glob("*/group-manifest.json")):
        try:
            m = json.loads(mf.read_text(encoding="utf-8"))
        except Exception:
            continue
        created = str(m.get("createdAt") or "")
        for it in m.get("items", []):
            label = it.get("label", "")
            prev = seen.get(label)
            if prev is None or created > prev[0]:
                seen[label] = (created, it, mf.parent.name)
    out = []
    for label, (_created, it, proj) in sorted(seen.items()):
        # 描述用中文逐条复核记录(legacyV2ChangeSummary, 条条都有),
        # 替换掉原来重复多份的英文状态套话; 套话翻译一次追加在尾。
        zh_note = (it.get("legacyV2ChangeSummary") or "").strip()
        desc = f"{zh_note}｜{BENBEN_ISSUE_ZH}" if zh_note else BENBEN_ISSUE_ZH
        out.append(
                {
                    "id": f"benben-b:{label}",
                    "library": "benben-b",
                    "libraryLabel": "Benben B 系列重建",
                    "name": label,
                    "title": label,
                    "description": desc[:200],
                    "use": "口播人物动效重建组件(源自 benben 上游老批次), 原生 1920×1080 横屏; 竖屏仅可整体缩放嵌小窗。",
                    "category": "重建组件",
                    "keywords": ["benben", "口播", "人物"],
                    "energy": "",
                    "duration": f"{it.get('durationInFrames', '')}帧@{it.get('fps', '')}fps",
                    "previewUrl": "",
                    "posterUrl": "",
                    "aspect": "landscape",
                    "canvas": {"width": it.get("width"), "height": it.get("height")},
                    "sourcePath": f"external/benben-b/{proj}",
                    "previewPath": "",
                    "status": it.get("codeStatus", "inherited-unreviewed"),
                }
            )
    return out


def main() -> None:
    wb = json.loads(WB.read_text(encoding="utf-8"))
    records, dropped = [], []
    for rec in wb["records"]:
        out = remap(rec)
        (records if out else dropped).append(out or rec["id"])

    bb = benben_records()
    # B 系列与 catalog 里可能重复的 talkcraft 系条目去重(按 id)
    seen = {r["id"] for r in records}
    records += [r for r in bb if r["id"] not in seen]

    cats: dict[str, int] = {}
    libs: dict[str, int] = {}
    for r in records:
        cats[r["category"]] = cats.get(r["category"], 0) + 1
        libs[r["library"]] = libs.get(r["library"], 0) + 1

    missing_sources = []
    for record in records:
        source_path = record.get("sourcePath")
        if source_path and not (MASTER / source_path).exists():
            missing_sources.append(f"{record['id']}: {source_path}")
    if missing_sources:
        raise RuntimeError(
            f"{len(missing_sources)} master catalog source paths missing:\n"
            + "\n".join(missing_sources)
        )

    doc = {
        "generatedAt": date.today().isoformat(),
        "masterLibrary": "talkcraft-main (唯一主库)",
        "schema": "对齐 talkcraft 卡片契约 + motion-workbench record 字段, 新增 aspect/canvas/themes/sourcePath(主库内路径)",
        "stats": {"total": len(records), "byLibrary": libs, "byCategory": cats, "dropped": dropped},
        "records": records,
    }
    (MASTER / "catalog.json").write_text(
        json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(json.dumps(doc["stats"], ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
