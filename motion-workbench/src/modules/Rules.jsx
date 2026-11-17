import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

// 产品规则速览（详细流程见仓库根文档）
export default function Rules() {
  return (
    <Card style={{ maxWidth: 860 }}>
      <Title level={4} style={{ marginTop: 0 }}>幕次 Studio · 流程与规则</Title>
      <Paragraph type="secondary">
        日常必读：仓库根目录 <Text code>START-HERE.md</Text>、<Text code>AGENTS.md</Text>。
        形态对照：<Text code>MODES.md</Text>。进阶：<Text code>docs/advanced/</Text>。
      </Paragraph>

      <Title level={5}>默认路径（②′ 整片模板）</Title>
      <Paragraph>
        口播 / SRT → Skill <Text code>episode-fx-orchestrator</Text> 选卡 →
        <Text code>map:to-config</Text> → 本工作台「编排台」改参 → lint → 导出 MP4。
      </Paragraph>

      <Title level={5}>组件库</Title>
      <Paragraph>
        唯一组件库是 Talkcraft（<Text code>talkcraft-main/</Text>）。
        白窗紫套件在 <Text code>core/</Text>，不是第二套「主库」。
      </Paragraph>

      <Title level={5}>验收</Title>
      <Paragraph>
        一镜一做一审；静帧定稿前不渲 mp4。AI 生图须用户授权；不得冒充真实截图。
      </Paragraph>

      <Title level={5}>Labs（可选）</Title>
      <Paragraph>
        对标仿制 / 待审核 / 等待区 / 落库台账 默认隐藏。需要时在 URL 加 <Text code>?labs=1</Text>。
        冷藏资料在 <Text code>archive/</Text>，非主路径。
      </Paragraph>
    </Card>
  );
}
