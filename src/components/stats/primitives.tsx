import React from 'react';

/**
 * The stats page's building blocks: a bordered surface card, an uppercase section heading,
 * and the icon-tile stat row that `StatsPopup` and the old panel both drew.
 */

export const iconClass = 'h-5 w-5 text-text-muted';

export const StatCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`rounded-lg border border-border bg-surface p-4 ${className}`}>{children}</div>
);

export const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mb-3 font-body text-[11px] font-semibold uppercase tracking-wider text-text-muted">
    {children}
  </h2>
);

/** One stat: icon tile + big mono value + muted label. */
export const StatRow: React.FC<{
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}> = ({ icon, value, label }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="font-mono text-2xl font-bold text-text">{value}</div>
      <div className="font-body text-sm text-text-muted">{label}</div>
    </div>
  </div>
);
