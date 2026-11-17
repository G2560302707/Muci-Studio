# -*- coding: utf-8 -*-
"""迁移:distill-fred-weekly.json → data/distill/github周榜/(project.json + components.json)+ index.json
按 PLAN-对标视频仿制模块.md 第 2 节 schema;review 初始全 pending;mapping 从 mappedComponents 推导。
"""
import json, os, datetime

WB = r"D:\Tabletop\自媒体\motion-workbench"
ROOT = r"D:\Tabletop\自媒体"
OLD = os.path.join(WB, "data", "distill", "github周榜", "components.json")  # 迁移后读现行组数据,支持反复重建
TC = os.path.join(ROOT, "talkcraft-main", "catalog.json")
GDIR = os.path.join(WB, "data", "distill", "github周榜")
os.makedirs(GDIR, exist_ok=True)

# 两个 catalog:workbench(含按需渲染合并)+ 主库,用于给每个映射 ID 取各自的预览/源码
wb_cat = json.load(open(os.path.join(WB, "data", "catalog.json"), encoding="utf-8"))
tc_cat = json.load(open(TC, encoding="utf-8"))
wb_by_id = {r["id"]: r for r in wb_cat["records"]}
tc_by_id = {r["id"]: r for r in tc_cat["records"]}

def _exists(posix_path):
    return os.path.isfile(os.path.join(ROOT, posix_path.replace("/", os.sep)))

def component_details(ids):
    """每个映射 ID 各自带 previewUrl/previewType/codePath(供工作台按点击分别展示)。
    codePath 过磁盘存在性校验;remocn 的 registry 路径多为坏路径,兜底扁平文件。"""
    out = []
    for mid in ids:
        r = wb_by_id.get(mid) or tc_by_id.get(mid) or {}
        pv = r.get("previewUrl")
        # 核心组件预览优先横屏变体(对标原片 16:9)
        if pv and pv.startswith("/my-components/out/previews/") and pv.endswith(".mp4") and "-landscape" not in pv:
            cand = pv[:-4] + "-landscape.mp4"
            if os.path.isfile(os.path.join(ROOT, cand.lstrip("/").replace("/", os.sep))):
                pv = cand
        pt = r.get("previewType")
        if pv:
            pt = pt if pt in ("video", "iframe", "poster") else ("iframe" if pv.endswith(".html") else "video")
        else:
            pt = "missing"
        cands = []
        if r.get("codePath"):
            cands.append(r["codePath"])
        short = mid.split(":")[-1].split("/")[-1]
        if mid.startswith("remocn:"):
            cands.append(f"talkcraft-main/external/remocn/{short}.tsx")
        sp = r.get("sourcePath")
        if sp:
            cands.append("talkcraft-main/" + sp)
        code = next((c for c in cands if _exists(c)), None)
        out.append({"id": mid, "previewUrl": pv, "previewType": pt, "codePath": code})
    return out

old = json.load(open(OLD, encoding="utf-8"))

# 逐镜时间(来自 rea-video breakdown,秒)
SHOT_T = {1:(0.0,0.27),2:(0.27,0.47),3:(0.47,0.7),4:(0.7,1.2),5:(1.2,3.23),6:(3.23,4.03),7:(4.03,8.63),
8:(8.63,14.5),9:(14.5,19.17),10:(19.17,19.83),11:(19.83,20.57),12:(20.57,21.2),13:(21.2,23.23),
14:(23.23,24.17),15:(24.17,31.33),16:(31.33,33.93),17:(33.93,39.13),18:(39.13,41.37),19:(41.43,43.5),
20:(43.5,47.47),21:(47.47,51.47),22:(51.47,53.87),23:(53.87,56.57),24:(56.57,58.97),25:(58.97,61.2),
26:(61.2,65.1),27:(65.1,69.57),28:(69.57,74.73),29:(74.73,79.77),30:(79.77,83.73),31:(83.73,92.23),
32:(92.23,95.77),33:(95.77,97.9),34:(97.9,106.33),35:(106.33,110.47),36:(110.47,112.93),37:(112.93,114.7),
38:(114.7,116.7),39:(116.7,121.63),40:(121.63,125.73),41:(125.73,128.9),42:(128.9,131.37),43:(131.37,133.77)}

def shots(spec):
    out = []
    for part in spec.split("/"):
        part = part.strip().lstrip("#")
        if part in ("全片", ""):  # 常驻类组件(字幕条/水印):取一个代表镜头
            part = "9"
        nums = [int(x) for x in part.replace("–", "-").split("-")]
        for n in ([nums[0]] if len(nums) == 1 else list(range(nums[0], nums[1] + 1))):
            s, e = SHOT_T[n]
            out.append({"shot": n, "start": s, "end": e})
    return out

# 映射推导:status 与备注(与抽帧对比复核结论一致)
MAPPING = {
 "数字滚动卡": ("has-similar", ["core:NumberRoll", "video-talkcraft:number-counter"], "机制+形态同构,换参即用"),
 "评分条形卡": ("has-similar", ["remocn:progress", "video-talkcraft:chapter-progress-list"], "横条外观对位,套白卡+紫#472399改造;注意:progress 为纯展示元件、预览是静帧无动效,充能动效参考切 chapter-progress-list"),
 "技能标签轮播": ("has-similar", ["core:PillTags"], "cue 逐个激活同构;形态大黑条vs小pill,落盘时改尺寸"),
 "华夫点阵图": ("has-similar", ["remocn:unit-grid"], "点阵充能+统计行同构;底色相反,配色改造"),
 "对话气泡卡": ("has-similar", ["remocn:chat-flow", "remocn:chat-gpt"], "气泡机制同构;渲染修复后浅色主题观感接近"),
 "暗底数据牌": ("has-similar", ["remocn:stat-sequence"], "暗底统计数字同构;黑黄大写风格需配色改造"),
 "图标网格": ("has-similar", ["remocn:bento-build"], "卡片逐块拼装机制同;配色改造,复用时验证"),
 "项目卡网格": ("has-similar", ["core:ProjectCard", "remocn:grid-montage"], "单卡内容+阵列亮相组合拳"),
 "漂浮发光字": ("partial", ["video-shotcraft:type-assembly-moves/drift-assembly", "snapcn:bloom-lockup"], "两代理各承一半(漂浮/辉光),完整效果需新写"),
 "底部字幕条": ("has-similar", ["core:Subtitle", "remocn:caption-active-pop"], "cue 时间轴同构;原片字幕更重,样式调整"),
}

components = []
for r in old["records"]:
    name = r["name"]
    mstatus, similar, note = MAPPING[name]
    rec = {
        "id": r["id"], "group": "github周榜", "name": name,
        "title": r["title"], "description": r["description"], "use": r["use"],
        "library": r["library"], "libraryLabel": r["libraryLabel"], "category": r["category"],
        "keywords": r["keywords"], "energy": "", "duration": "",
        "previewType": r["previewType"], "previewUrl": r["previewUrl"], "posterUrl": None,
        "aspect": r.get("aspect"), "canvas": None, "themes": [],
        "codePath": r.get("codePath"), "license": r.get("license"),
        "sourcePath": r.get("sourcePath"),
        "sourceShots": shots(" ".join(str(s["shot"]) for s in [])) if False else None,
        "distill": r.get("distill"),
    }
    rec["sourceShots"] = shots(r["distill"]["shots"]) if r.get("distill") else []
    rec["mapping"] = {"status": mstatus, "similarTo": similar, "matchNote": note, "details": component_details(similar)}
    rec["review"] = {"status": "pending", "reviewedAt": None, "note": ""}
    rec["deposit"] = {"status": "none", "variants": [], "depositedAt": None, "depositedPath": None}
    components.append(rec)

project = {
  "id": "github周榜",
  "title": "GitHub 周榜工具盘点(Fred / FredTalk)",
  "sourceVideo": {
    "path": "对标素材/github精选榜单/github周榜.mp4",
    "url": "/对标素材/github精选榜单/github周榜.mp4",
    "duration": 133.767, "width": 1280, "height": 720, "fps": 30.0,
    "platform": "Douyin/TikTok", "author": "Fred(FredTalk)"
  },
  "distillDate": "2026-11-15",
  "tool": "rea-video 0.1.0(decompose+review 43镜+code-remake)",
  "verdict": "代码渲染 70% + 屏幕录制 20% + 3D 渲染 9% + AI 视频 2%;零实拍",
  "reaVideoDir": "rea-video-tests/github周榜_拆解",
  "notes": "首个试点组;数字滚动卡复用 8+ 次为节奏枢纽;三舞台配色轮换(白/暗/紫)"
}
json.dump(project, open(os.path.join(GDIR, "project.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump({"generatedAt": datetime.datetime.now().isoformat(timespec="seconds"), "records": components},
          open(os.path.join(GDIR, "components.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

index = {"groups": [{
  "id": "github周榜", "title": project["title"],
  "videoUrl": project["sourceVideo"]["url"],
  "distillDate": project["distillDate"], "verdict": project["verdict"],
  "componentCount": len(components), "pendingCount": len(components),
  "coverShotUrl": "/motion-workbench/data/distill/github周榜/cover.jpg"
}]}
json.dump(index, open(os.path.join(WB, "data", "distill", "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("MIGRATED:", len(components), "records → data/distill/github周榜/")
