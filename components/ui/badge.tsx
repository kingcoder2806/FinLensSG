import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-brand-green/20 text-brand-green hover:bg-brand-green/30',
        secondary:
          'border-transparent bg-brand-amber/20 text-brand-amber hover:bg-brand-amber/30',
        destructive:
          'border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30',
        outline:
          'border-surface-3 text-muted-foreground',
        blue:
          'border-transparent bg-brand-blue/20 text-brand-blue hover:bg-brand-blue/30',
        purple:
          'border-transparent bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30',
        cyan:
          'border-transparent bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
