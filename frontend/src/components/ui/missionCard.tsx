import React from 'react';
import { cn } from '../../lib/utils';

interface MissionCardProps {
  title: string;
  description: string;
  className?: string;
}

export function MissionCard({ title, description, className }: MissionCardProps) {
  return (
    <div className={cn('p-6 rounded-lg bg-card text-card-foreground shadow-sm', className)}>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
