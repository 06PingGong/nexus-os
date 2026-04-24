'use client';

import React from 'react';
// 暂时由于构建环境问题 Mock Recharts 组件
const ResponsiveContainer = ({ children }: any) => <div style={{ width: '100%', height: '300px' }}>{children}</div>;
const BarChart = ({ children }: any) => <svg width="100%" height="300" style={{background: '#f9fafb', borderRadius: '8px'}}>{children}</svg>;
const Bar = () => <rect x="50" y="50" width="30" height="200" fill="#2563eb" rx="4" />;
const XAxis = () => null;
const YAxis = () => null;
const CartesianGrid = () => null;
const Tooltip = () => null;
const PieChart = ({ children }: any) => <svg width="100%" height="300" style={{background: '#f9fafb', borderRadius: '8px'}}>{children}</svg>;
const Pie = () => <circle cx="150" cy="150" r="60" fill="#2563eb" stroke="#fff" strokeWidth="4" />;
const Cell = () => null;

import { TrendingUp, Target, BookOpen, Dumbbell } from 'lucide-react';

const AnalyticsPage = () => {
  const taskData = [
    { day: '周一', completed: 4 },
    { day: '周二', completed: 7 },
    { day: '周三', completed: 5 },
    { day: '周四', completed: 8 },
    { day: '周五', completed: 12 },
    { day: '周六', completed: 3 },
    { day: '周日', completed: 2 },
  ];

  const domainData = [
    { name: '研究', value: 45, color: '#2563eb' },
    { name: '学习', value: 30, color: '#10b981' },
    { name: '生活', value: 15, color: '#f59e0b' },
    { name: '其他', value: 10, color: '#ec4899' },
  ];

  return (
    <div className="analytics-page">
      <header className="page-header">
        <h1>洞察与进展</h1>
        <p>回顾您在各个维度的成长轨迹。</p>
      </header>

      <div className="summary-grid">
        <div className="summary-card glass-card">
          <div className="summary-icon" style={{ background: 'rgba(37, 99, 235, 0.05)', color: '#2563eb' }}>
            <Target size={20} />
          </div>
          <div className="summary-info">
            <h4>任务效率</h4>
            <p>本周提升 12%</p>
          </div>
        </div>
        <div className="summary-card glass-card">
          <div className="summary-icon" style={{ background: 'rgba(16, 185, 129, 0.05)', color: '#10b981' }}>
            <BookOpen size={20} />
          </div>
          <div className="summary-info">
            <h4>阅读节奏</h4>
            <p>平均 4 篇/周</p>
          </div>
        </div>
        <div className="summary-card glass-card">
          <div className="summary-icon" style={{ background: 'rgba(245, 158, 11, 0.05)', color: '#f59e0b' }}>
            <Dumbbell size={20} />
          </div>
          <div className="summary-info">
            <h4>活跃天数</h4>
            <p>本周 5/7 天</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container glass-card">
          <div className="chart-header">
            <h3>每日生产力</h3>
            <span>完成的任务数量</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer>
              <BarChart data={taskData}>
                <Bar />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container glass-card">
          <div className="chart-header">
            <h3>时间分配</h3>
            <span>按类别统计</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer>
              <PieChart>
                <Pie />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {domainData.map(item => (
                <div key={item.name} className="legend-item">
                  <span className="dot" style={{ backgroundColor: item.color }}></span>
                  <span className="name">{item.name}</span>
                  <span className="val">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .analytics-page {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2.5rem;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #18181b;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: #71717a;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .summary-card {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #ffffff;
          border: 1px solid #f4f4f5;
          border-radius: 12px;
        }

        .summary-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-info h4 {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.2rem;
          color: #18181b;
        }

        .summary-info p {
          color: #2563eb;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .chart-container {
          padding: 1.5rem;
          background: #ffffff;
          border: 1px solid #f4f4f5;
          border-radius: 12px;
        }

        .chart-header {
          margin-bottom: 1.5rem;
        }

        .chart-header h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.2rem;
          color: #18181b;
        }

        .chart-header span {
          font-size: 0.75rem;
          color: #a1a1aa;
        }

        .pie-legend {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #52525b;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .val {
          color: #a1a1aa;
          margin-left: auto;
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsPage;
