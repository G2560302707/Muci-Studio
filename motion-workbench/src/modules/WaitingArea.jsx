import React, { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Table, Tag, Typography } from 'antd';
import { fetchDistillGroups, fetchJson } from '../shell/distillData.js';

const { Text } = Typography;

const STATUS_META = {
  waiting: { label: '等待二次复用', color: 'blue' },
  deposited: { label: '已落库', color: 'purple' },
};

function normalizeManualItem(item) {
  return {
    key: `manual:${item.id}`,
    id: item.id,
    name: item.name,
    source: item.source || item.episode || '原创',
    origin: item.origin || '用户授权原创',
    reason: item.reason || '—',
    authorizedBy: item.authorizedBy || '用户',
    authorizedAt: item.authorizedAt || item.createdAt,
    status: item.status || 'waiting',
    secondUse: item.secondUse,
    depositedPath: item.depositedPath,
  };
}

function normalizeDistillEligible(record, groupTitle) {
  return {
    key: `distill:${record.group}/${record.id}`,
    id: record.id,
    name: record.name,
    source: groupTitle || record.group,
    origin: '对标拆解 · 库内无相似',
    reason: record.review?.note || record.mapping?.matchNote || '—',
    authorizedBy: '用户（工作台审核）',
    authorizedAt: record.review?.reviewedAt,
    status: 'waiting',
    secondUse: null,
    depositedPath: record.deposit?.depositedPath,
  };
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

// 等待区：已授权原创 / 已获落库资格的条目都住在这里，二次复用并确认后才落主库。
export default function WaitingArea() {
  const [manualItems, setManualItems] = useState(null);
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchJson('/motion-workbench/data/waiting-area.json'),
      fetchDistillGroups(),
    ]).then(([waiting, distillGroups]) => {
      if (!alive) return;
      setManualItems(waiting.items || []);
      setGroups(distillGroups);
    }).catch(() => {
      if (!alive) return;
      setManualItems([]);
      setGroups([]);
    });
    return () => { alive = false; };
  }, []);

  const rows = useMemo(() => {
    const manual = (manualItems || [])
      .filter(item => item.status !== 'deposited')
      .map(normalizeManualItem);
    const distill = (groups || []).flatMap(group => (group.records || [])
      .filter(record => record.deposit?.status === 'eligible')
      .map(record => normalizeDistillEligible(record, group.title)));
    return [...manual, ...distill];
  }, [manualItems, groups]);

  if (manualItems === null || groups === null) {
    return <Empty description="加载中…" style={{ marginTop: 80 }} />;
  }

  return (
    <div>
      <Card style={{ maxWidth: 860, marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16 }}>原创等待区</Text>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          库内无合适项时，先向用户说明原创原因；明确同意后才可以原创，并登记到这里。
          条目在第二次复用并经用户确认后，才实际落进主库。
        </Text>
      </Card>

      <Card title={`等待区(${rows.length})`} styles={{ body: { padding: 0 } }}>
        {rows.length === 0 ? (
          <Empty
            description={(
              <>
                等待区为空
                <div style={{ fontSize: 12, color: '#909090', marginTop: 6 }}>
                  已授权原创或已获落库资格的组件会出现在这里，等待二次复用
                </div>
              </>
            )}
            style={{ padding: 32 }}
          />
        ) : (
          <Table
            rowKey={row => row.key}
            dataSource={rows}
            pagination={false}
            columns={[
              {
                title: '组件',
                dataIndex: 'name',
                width: '18%',
                render: (value, row) => (
                  <>
                    <Text strong>{value}</Text>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#909090' }}>{row.id}</div>
                  </>
                ),
              },
              {
                title: '来源',
                dataIndex: 'source',
                width: '16%',
              },
              {
                title: '授权原因',
                dataIndex: 'reason',
                width: '24%',
                ellipsis: true,
              },
              {
                title: '授权',
                width: '18%',
                render: (_, row) => (
                  <>
                    <Tag color="green">{row.authorizedBy}</Tag>
                    <div style={{ fontSize: 12, color: '#909090', marginTop: 4 }}>{formatDateTime(row.authorizedAt)}</div>
                  </>
                ),
              },
              {
                title: '状态',
                dataIndex: 'status',
                width: '12%',
                render: value => {
                  const meta = STATUS_META[value] || STATUS_META.waiting;
                  return <Tag color={meta.color}>{meta.label}</Tag>;
                },
              },
              {
                title: '落库路径',
                dataIndex: 'depositedPath',
                render: value => value
                  ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{value}</span>
                  : <span style={{ color: '#909090' }}>等待第二次复用</span>,
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
