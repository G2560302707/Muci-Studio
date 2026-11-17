"""把 zh-enrich/zh-*.json 的中文 use+keywords 合并进底料 motion-workbench/data/catalog.json。

用法: python -I scripts/merge-zh-enrich.py  (cwd = D:/Tabletop/自媒体)
流程: 备份底料 → 合并全部 zh-*.json → 回写 → 打印统计。
合并后必须重跑 build-master-catalog.py 重建 talkcraft-main/catalog.json。
"""
import json
from pathlib import Path

ROOT = Path("D:/Tabletop/自媒体")
WB = ROOT / "motion-workbench/data/catalog.json"
BACKUP = ROOT / "motion-workbench/data/catalog.backup-pre-zh.json"
ZH_DIR = ROOT / "motion-workbench/data/zh-enrich"


def main() -> None:
    doc = json.loads(WB.read_text(encoding="utf-8"))
    if not BACKUP.exists():
        BACKUP.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"备份已建: {BACKUP.name}")

    by_id = {r["id"]: r for r in doc["records"]}
    applied, missing, flagged, empty_use = 0, [], 0, 0
    for zf in sorted(ZH_DIR.glob("zh-*.json")):
        entries = json.loads(zf.read_text(encoding="utf-8"))
        for rid, val in entries.items():
            rec = by_id.get(rid)
            if rec is None:
                missing.append(rid)
                continue
            use = (val.get("use") or "").strip()
            kws = val.get("keywords") or []
            if not use or not kws:
                empty_use += 1
                continue
            rec["use"] = use
            rec["keywords"] = kws
            if val.get("flag"):
                flagged += 1
            applied += 1

    WB.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(
        {"applied": applied, "missingIds": missing, "flagged": flagged, "emptyUse": empty_use},
        ensure_ascii=False))


if __name__ == "__main__":
    main()
