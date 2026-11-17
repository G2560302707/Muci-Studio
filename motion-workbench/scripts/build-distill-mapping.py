"""聚合全部对标组的库内映射 → motion-workbench/data/distill-mapping.json

用途:选料的「高手用法」检索面——以前拆的对标视频里,同类画面用什么动效、库里哪个最像。
START-HERE 第 2 步四步流程的第 2 步(查两处)之一就是查这张表。
数据源:motion-workbench/data/distill/*/components.json 的 records[].mapping
用法:python -I scripts/build-distill-mapping.py  (cwd = D:/Tabletop/自媒体)
"""
import json
from pathlib import Path

ROOT = Path("D:/Tabletop/自媒体")
DISTILL = ROOT / "motion-workbench/data/distill"
OUT = ROOT / "motion-workbench/data/distill-mapping.json"


def main() -> None:
    rows, groups, no_mapping = [], [], 0
    for group_dir in sorted(p for p in DISTILL.iterdir() if p.is_dir()):
        cf = group_dir / "components.json"
        if not cf.exists():
            continue
        data = json.loads(cf.read_text(encoding="utf-8"))
        items = data.get("records", data if isinstance(data, list) else [])
        groups.append(group_dir.name)
        for it in items:
            m = it.get("mapping") or {}
            if not m.get("status"):
                no_mapping += 1
            rows.append(
                {
                    "group": it.get("group", group_dir.name),
                    "id": it.get("id", ""),
                    "name": it.get("name", ""),
                    "title": it.get("title", ""),
                    "desc": (it.get("description") or "")[:120],
                    "mapping": {
                        "status": m.get("status", ""),
                        "similarTo": m.get("similarTo", []),
                        "matchNote": m.get("matchNote", ""),
                    },
                    "sourceShots": it.get("sourceShots", []),
                    "review": (it.get("review") or {}).get("status", ""),
                    "deposit": (it.get("deposit") or {}).get("status", ""),
                }
            )
    doc = {
        "generatedAt": "2026-11-15",
        "purpose": "选料先查这张表:对标视频里同类画面用什么动效、库里哪个最像(START-HERE 第 2 步)",
        "groups": groups,
        "stats": {"groups": len(groups), "rows": len(rows), "missingMapping": no_mapping},
        "rows": rows,
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(doc["stats"], ensure_ascii=False))


if __name__ == "__main__":
    main()
