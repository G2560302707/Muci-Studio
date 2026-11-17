import React from 'react';
import ReactDOM from 'react-dom/client';
import AppShell from './shell/AppShell.jsx';
import './styles.css';

// 全站主题(深/浅)由 AppShell 持有并切换,此处只负责挂载
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
