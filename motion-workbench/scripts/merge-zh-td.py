"""把 zh-enrich-td/td-zh-*.json 的中文 title+description 合并进底料 motion-workbench/data/catalog.json。

用法: python -I scripts/merge-zh-td.py  (cwd = D:/Tabletop/自媒体)
流程: 备份底料 → 合并全部 td-zh-*.json → 回写 → 打印统计。
合并后必须重跑 build-master-catalog.py 重建 talkcraft-main/catalog.json。
注意: 分类已钉在底料 category 字段(2026-11-15), build 脚本会优先用钉住值, 翻译不会导致分类回退。
"""
import json
from pathlib import Path

ROOT = Path("D:/Tabletop/自媒体")
WB = ROOT / "motion-workbench/data/catalog.json"
BACKUP = ROOT / "motion-workbench/data/catalog.backup-pre-td.json"
TD_DIR = ROOT / "motion-workbench/data/zh-enrich-td"


def main() -> None:
    doc = json.loads(WB.read_text(encoding="utf-8"))
    if not BACKUP.exists():
        BACKUP.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"备份已建: {BACKUP.name}")

    by_id = {r["id"]: r for r in doc["records"]}
    applied, missing, flagged, empty_title = 0, [], 0, 0
    for tf in sorted(TD_DIR.glob("td-zh-*.json")):
        entries = json.loads(tf.read_text(encoding="utf-8"))
        for rid, val in entries.items():
            rec = by_id.get(rid)
            if rec is None:
                missing.append(rid)
                continue
            title = (val.get("title") or "").strip()
            if not title:
                empty_title += 1
                continue
            rec["title"] = title
            desc = (val.get("desc") or "").strip()
            if desc:
                rec["description"] = desc
            if val.get("flag"):
                flagged += 1
            applied += 1

    WB.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(
        {"applied": applied, "missingIds": missing, "flagged": flagged, "emptyTitle": empty_title},
        ensure_ascii=False))


if __name__ == "__main__":
    main()
