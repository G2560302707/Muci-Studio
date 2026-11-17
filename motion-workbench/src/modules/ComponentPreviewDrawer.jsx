import React, { useEffect, useState } from 'react';
import { Button, Drawer, Space, Tag, Typography } from 'antd';

const { Text } = Typography;

const REVIEW_LABEL = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
const REVIEW_COLOR = { pending: 'orange', approved: 'green', rejected: 'red' };

// 组件预览抽屉:mapping.details 里每个映射 ID 各带 previewUrl/codePath,
// 点哪个映射标签就看哪个;不指定则显示主代理(拆解时借好的那条)
export default function ComponentPreviewDrawer({ open, record, initialMapId, onClose, onReview, busy }) {
  const [selId, setSelId] = useState(null);

  useEffect(() => {
    setSelId(initialMapId || null);
  }, [record?.id, initialMapId, open]);

  if (!record) return null;
  const d = record.distill || {};
  const m = record.mapping || {};
  const rv = record.review || {};

  const detail = (m.details || []).find(x => x.id === selId);
  const pv = (detail && detail.previewUrl) || record.previewUrl;
  const ptype = (detail && detail.previewType) || record.previewType;
  const code = (detail && detail.codePath) || record.codePath;

  const tagFor = x => {
    const selected = (detail ? detail.id : null) === x.id || (!detail && !selId && (m.similarTo || [])[0] === x.id);
    return (
      <Tag
        key={x.id}
        color={selected ? 'geekblue' : 'purple'}
        style={{ cursor: m.details && m.details.length > 1 ? 'pointer' : 'default' }}
        onClick={() => m.details && m.details.length > 1 && setSelId(x.id)}
      >
        {x.id}
      </Tag>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={<Space wrap size={6}><Text strong>{record.name}</Text><Tag>{record.group}</Tag>{detail && <Tag color="geekblue">{detail.id}</Tag>}</Space>}
    >
      {pv ? (
        ptype === 'iframe' ? (
          <iframe
            key={pv}
            src={pv}
            title={record.name}
            style={{ width: '100%', aspectRatio: '16/9', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10 }}
            allow="autoplay"
          />
        ) : (
          <video key={pv} src={pv} controls autoPlay muted loop style={{ width: '100%', borderRadius: 10, background: '#000' }} />
        )
      ) : (
        <div style={{ color: '#909090', fontSize: 13, padding: '20px 0', textAlign: 'center', background: '#fafafa', borderRadius: 10 }}>
          该映射暂无预览(源码可在下方查看)
        </div>
      )}

      <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 14 }}>
        <div>
          <Text type="secondary">库内映射:</Text>
          {m.status === 'has-similar' && <Tag color="green">库内有类似</Tag>}
          {m.status === 'partial' && <Tag color="gold">部分相似·需组合</Tag>}
          {m.status === 'none' && <Tag>库内无</Tag>}
          {(m.details || []).map(x => tagFor(x))}
          {(m.details || []).length > 1 && <Text type="secondary" style={{ fontSize: 12 }}>点击标签切换预览</Text>}
        </div>
        <div><Text type="secondary">效果:</Text>{record.description}</div>
        {m.matchNote && <div><Text type="secondary">匹配说明:</Text>{m.matchNote}</div>}
        {d.measured && <div><Text type="secondary">实测参数:</Text>{d.measured}</div>}
        <div>
          <Text type="secondary">出现镜头:</Text>
          {(record.sourceShots || []).map(s => (
            <Tag key={s.shot} style={{ margin: 2 }}>#{s.shot} · {Math.floor(s.start / 60)}:{String(Math.floor(s.start % 60)).padStart(2, '0')}</Tag>
          ))}
        </div>
        <div>
          <Text type="secondary">审核状态:</Text>
          <Tag color={REVIEW_COLOR[rv.status]}>{REVIEW_LABEL[rv.status]}</Tag>
          {(record.deposit || {}).status === 'eligible' && <Tag color="blue">准予落库·待二次复用</Tag>}
        </div>
        {code && (
          <div>
            <Text type="secondary">源码:</Text>
            <Button size="small" type="link" href={`/${code.split('/').map(encodeURIComponent).join('/')}`} target="_blank">
              {code}
            </Button>
          </div>
        )}
        {onReview && (
          <Space style={{ marginTop: 6 }}>
            {rv.status !== 'approved' && (
              <Button type="primary" size="small" disabled={busy} onClick={() => onReview(record.id, 'approved')}>通过</Button>
            )}
            {rv.status !== 'rejected' && (
              <Button danger size="small" disabled={busy} onClick={() => onReview(record.id, 'rejected')}>拒绝</Button>
            )}
            {rv.status !== 'pending' && (
              <Button size="small" disabled={busy} onClick={() => onReview(record.id, 'pending')}>撤回待审</Button>
            )}
          </Space>
        )}
      </Space>
    </Drawer>
  );
}
