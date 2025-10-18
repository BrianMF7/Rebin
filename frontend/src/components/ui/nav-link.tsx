import React from 'react';
import { cn } from '../../lib/utils';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function NavLink({ href, children, onClick, className }: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "text-foreground hover:text-primary transition-colors font-medium",
        className
      )}
    >
      {children}
    </a>
  );
}
