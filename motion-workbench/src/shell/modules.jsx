import React from 'react';
import {
  AppstoreOutlined, CheckSquareOutlined,
  ClockCircleOutlined, DatabaseOutlined, FileTextOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import Library from '../modules/Library.jsx';
import Review from '../modules/Review.jsx';
import WaitingArea from '../modules/WaitingArea.jsx';
import Ledger from '../modules/Ledger.jsx';
import Rules from '../modules/Rules.jsx';
import EpisodeParams from '../modules/EpisodeParams.jsx';

const CORE_MODULES = [
  { key: 'episode-params', label: '编排台', icon: <VideoCameraOutlined />, component: EpisodeParams },
  { key: 'library', label: '组件库', icon: <AppstoreOutlined />, component: Library },
  { key: 'rules', label: '流程与规则', icon: <FileTextOutlined />, component: Rules },
];

const LAB_MODULES = [
  { key: 'review', label: '待审核', icon: <CheckSquareOutlined />, component: Review, labs: true },
  { key: 'waiting-area', label: '等待区', icon: <ClockCircleOutlined />, component: WaitingArea, labs: true },
  { key: 'ledger', label: '落库台账', icon: <DatabaseOutlined />, component: Ledger, labs: true },
];

export function labsEnabled() {
  try {
    return new URLSearchParams(window.location.search).get('labs') === '1';
  } catch {
    return false;
  }
}

export function getModules() {
  return labsEnabled() ? [...CORE_MODULES, ...LAB_MODULES] : CORE_MODULES;
}

/** @deprecated 用 getModules() */
export const MODULES = [...CORE_MODULES, ...LAB_MODULES];
