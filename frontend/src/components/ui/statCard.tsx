import React from 'react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  value: string;
  label: string;
  description?: string;
  className?: string;
}

export function StatCard({ value, label, description, className }: StatCardProps) {
  return (
    <div className={cn('text-center p-6 rounded-lg bg-card text-card-foreground shadow-sm', className)}>
      <div className="text-3xl font-bold text-primary mb-2">{value}</div>
      <div className="text-lg font-semibold mb-1">{label}</div>
      {description && (
        <div className="text-sm text-muted-foreground">{description}</div>
      )}
    </div>
  );
}
