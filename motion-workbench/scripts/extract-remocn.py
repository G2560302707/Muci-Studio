"""把 remocn registry-artifacts 的 937 个组件 JSON 解包成可直接使用的 tsx。

用法: python -I extract-remocn.py <artifacts_dir> <out_dir>
每个 artifact JSON 的 files[].content 写到 out_dir/<name>.tsx；
registry.json 索引原样复制为 out_dir/registry.json。
"""
import json
import shutil
import sys
from pathlib import Path

def main() -> None:
    artifacts = Path(sys.argv[1])
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    written, skipped = 0, 0
    for f in sorted(artifacts.glob("*.json")):
        if f.name == "registry.json":
            shutil.copy(f, out / "registry.json")
            continue
        data = json.loads(f.read_text(encoding="utf-8"))
        files = data.get("files") or []
        if not files:
            skipped += 1
            continue
        # 单文件组件为主；多文件取 path 主名,其余加后缀
        for i, spec in enumerate(files):
            rel = spec.get("path") or f.stem
            suffix = Path(rel).suffix or ".tsx"
            name = f.stem if i == 0 else f"{f.stem}-{i}"
            target = out / f"{name}{suffix}"
            target.write_text(spec.get("content", ""), encoding="utf-8")
            written += 1
    print(f"written={written} skipped={skipped} -> {out}")

if __name__ == "__main__":
    main()
