import React from 'react';

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="h-72 bg-surface rounded-xl shadow-sm p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-2 text-onSurfaceVariant">{title}</h2>
        <div className="flex-1">{children}</div>
    </div>
);

export default ChartCard;
