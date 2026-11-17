import React, { useEffect, useState } from 'react';
import { Button, Card, Empty, message, Space, Table, Tag, Typography } from 'antd';
import { fetchDistillGroups, postReview } from '../shell/distillData.js';
import ComponentPreviewDrawer from './ComponentPreviewDrawer.jsx';

const { Text } = Typography;

// 跨组待审核:所有组的 pending 组件集中在这里逐条审;点映射名/预览看效果
export default function Review() {
  const [rows, setRows] = useState(null);
  const [drawerId, setDrawerId] = useState(null);
  const [drawerMapId, setDrawerMapId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetchDistillGroups().then(groups => {
      const pending = groups.flatMap(g =>
        (g.records || [])
          .filter(r => (r.review || {}).status === 'pending')
          .map(r => ({ ...r, groupTitle: g.title }))
      );
      setRows(pending);
    }).catch(error => message.error(`加载失败:${error.message}`));
  };
  useEffect(load, []);

  const act = async (record, review) => {
    setBusy(true);
    try {
      await postReview(record.group, record.id, review);
      message.success(review === 'approved' ? '已通过' : '已拒绝');
      setRows(rows.filter(r => r.id !== record.id || r.group !== record.group));
      setDrawerId(null);
    } catch (error) {
      message.error(`操作失败:${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  if (rows === null) return <Empty description="加载中…" style={{ marginTop: 80 }} />;
  if (rows.length === 0) {
    return (
      <Card>
        <Empty description="没有待审核的组件 —— 全部审完啦" style={{ padding: 32 }} />
      </Card>
    );
  }

  const drawerRecord = rows.find(r => r.id === drawerId);

  return (
    <Card title={`待审核组件(${rows.length})`} styles={{ body: { padding: 0 } }}>
      <Table
        rowKey={r => `${r.group}/${r.id}`}
        dataSource={rows}
        pagination={false}
        columns={[
          {
            title: '组件', dataIndex: 'name', width: '20%',
            render: (v, r) => (
              <>
                <Text strong>{v}</Text>
                <div><Tag style={{ marginTop: 4 }}>{r.groupTitle || r.group}</Tag></div>
              </>
            )
          },
          {
            title: '出现镜头', dataIndex: 'sourceShots', width: '14%',
            render: shots => (shots || []).slice(0, 3).map(s => (
              <Tag key={s.shot} style={{ margin: 1 }}>#{s.shot}</Tag>
            ))
          },
          {
            title: '库内映射', dataIndex: 'mapping', width: '30%',
            render: (m, r) => m?.status === 'has-similar' ? (
              <>
                {(m.similarTo || []).map(id => (
                  <Tag key={id} color="purple" style={{ cursor: 'pointer' }}
                    onClick={() => { setDrawerId(r.id); setDrawerMapId(id); }}>{id}</Tag>
                ))}
                <div style={{ fontSize: 12, color: '#909090' }}>{m.matchNote}</div>
              </>
            ) : m?.status === 'partial' ? (
              <>
                <Tag color="gold" style={{ cursor: 'pointer' }} onClick={() => { setDrawerId(r.id); setDrawerMapId(null); }}>部分相似·需组合</Tag>
                <div style={{ fontSize: 12, color: '#909090' }}>{m.matchNote}</div>
              </>
            ) : (
              <Button size="small" onClick={() => { setDrawerId(r.id); setDrawerMapId(null); }}>查看预览</Button>
            )
          },
          {
            title: '审核', dataIndex: 'review', width: '10%',
            render: rv => <Tag color={rv?.status === 'approved' ? 'green' : rv?.status === 'rejected' ? 'red' : 'orange'}>
              {rv?.status === 'approved' ? '已通过' : rv?.status === 'rejected' ? '已拒绝' : '待审核'}
            </Tag>
          },
          {
            title: '操作', width: '20%',
            render: (_, r) => (
              <Space>
                <Button size="small" type="primary" onClick={() => act(r, 'approved')}>通过</Button>
                <Button size="small" danger onClick={() => act(r, 'rejected')}>拒绝</Button>
                <Button size="small" onClick={() => { setDrawerId(r.id); setDrawerMapId(null); }}>预览</Button>
              </Space>
            )
          },
        ]}
      />

      <ComponentPreviewDrawer
        open={!!drawerRecord}
        record={drawerRecord}
        initialMapId={drawerMapId}
        onClose={() => setDrawerId(null)}
        onReview={act}
        busy={busy}
      />
    </Card>
  );
}
