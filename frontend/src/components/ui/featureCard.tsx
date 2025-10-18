import React from 'react';
import { cn } from '../../lib/utils';
import type { IconProps } from '../ui/icons';

interface FeatureCardProps {
  icon: React.ComponentType<IconProps>
  title: string;
  description: string;
  className?: string;
  color?: string
}

export function FeatureCard({ icon:Icon, title, description, className, color = "text-primary"  }: FeatureCardProps) {
  return (
    <div className={cn('p-6 rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
        <Icon className="h-6 w-6" />
        <div className={`inline-flex p-3 rounded-lg bg-primary/10 mb-4 ${color}`}></div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
