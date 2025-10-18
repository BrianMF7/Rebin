import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  highlight?: string;
  description?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, highlight, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('text-center mb-12', className)}>
      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance mb-4">
        {title}{highlight && <span className="text-primary">{highlight}</span>}
      </h2>
      {(subtitle || description) && (
        <p className="text-lg sm:text-xl text-muted-foreground text-pretty leading-relaxed max-w-2xl mx-auto">
          {subtitle || description}
        </p>
      )}
    </div>
  );
}
