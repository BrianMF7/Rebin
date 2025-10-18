import { cn } from '../../lib/utils';

interface MissionCardProps {
  title: string;
  description: string;
  className?: string;
  color?: string;
  size?: string;
}

export function MissionCard({ title, description, className, color = "text-secondary", size = "text-xl" }: MissionCardProps) {
  return (
    <div className={cn('p-6 rounded-lg bg-card text-card-foreground shadow-sm', className)}>
      <h3 className={`${size} font-bold mb-3 ${color}`}>{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
