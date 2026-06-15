import React from 'react';

interface WorkspaceSummaryStat {
  label: string;
  value: React.ReactNode;
}

interface WorkspaceSummaryProps {
  eyebrow: string;
  title: string;
  lead: string;
  stats: WorkspaceSummaryStat[];
}

const WorkspaceSummary: React.FC<WorkspaceSummaryProps> = ({
  eyebrow,
  title,
  lead,
  stats,
}) => (
  <div className="workspace-summary">
    <div className="workspace-summary__copy">
      <p className="workspace-summary__eyebrow">{eyebrow}</p>
      <h2 className="workspace-summary__title">{title}</h2>
      <p className="workspace-summary__lead">{lead}</p>
    </div>

    <div
      className="workspace-summary__stats"
      aria-label={`${eyebrow} summary`}
      style={{ '--workspace-summary-stat-count': stats.length } as React.CSSProperties}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="workspace-summary__stat">
          <span className="workspace-summary__stat-value">{stat.value}</span>
          <span className="workspace-summary__stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default WorkspaceSummary;
