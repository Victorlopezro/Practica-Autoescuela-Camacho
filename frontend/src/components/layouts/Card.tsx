import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}

export function Card({ children, className, accent }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-outline-variant/30 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden',
        accent && 'before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-primary',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-semibold text-on-surface">{title}</h3>
        {subtitle && <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}