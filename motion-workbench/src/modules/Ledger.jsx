import React, { useEffect, useState } from 'react';
import { Card, Empty, Table, Tag, Typography } from 'antd';
import { fetchDistillGroups } from '../shell/distillData.js';

const { Text } = Typography;

// 落库台账:已实际写入主库的组件清单;等待二次复用的条目见 WaitingArea
export default function Ledger() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    fetchDistillGroups().then(groups => {
      const list = groups.flatMap(g =>
        (g.records || [])
          .filter(r => (r.deposit || {}).status === 'deposited')
          .map(r => ({ ...r, groupTitle: g.title }))
      );
      setRows(list);
    }).catch(() => setRows([]));
  }, []);

  if (rows === null) return <Empty description="加载中…" style={{ marginTop: 80 }} />;
  if (rows.length === 0) {
    return (
      <Card>
        <Empty description={<>落库台账为空<div style={{ fontSize: 12, color: '#909090', marginTop: 6 }}>等待二次复用的组件在工作台「等待区」;二次复用并确认后才进入这里</div></>} style={{ padding: 32 }} />
      </Card>
    );
  }

  return (
    <Card title={`落库台账(${rows.length})`} styles={{ body: { padding: 0 } }}>
      <Table
        rowKey={r => `${r.group}/${r.id}`}
        dataSource={rows}
        pagination={false}
        columns={[
          { title: '组件', dataIndex: 'name', width: '18%', render: (v, r) => (
            <><Text strong>{v}</Text><div><Tag style={{ marginTop: 4 }}>{r.groupTitle}</Tag></div></>
          )},
          { title: '状态', dataIndex: 'deposit', width: '16%', render: d => d.status === 'deposited'
            ? <Tag color="purple">已落库</Tag>
            : <Tag color="blue">准予落库·待二次复用</Tag> },
          { title: '落库变体', dataIndex: 'deposit', width: '22%', render: d =>
            (d.variants && d.variants.length) ? d.variants.join('、') : <span style={{ color: '#909090' }}>落库执行时按暗/亮参数可切规则判定</span> },
          { title: '落库路径', dataIndex: 'deposit', render: d => d.depositedPath
            ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.depositedPath}</span>
            : <span style={{ color: '#909090' }}>—</span> },
        ]}
      />
    </Card>
  );
}
