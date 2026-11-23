import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        solid: 'bg-ink text-mat hover:bg-ink/85',
        outline: 'border border-line bg-paper text-ink hover:bg-mat',
        ghost: 'text-ink hover:bg-ink/10',
        danger: 'border border-line bg-paper text-magenta hover:bg-magenta/10',
      },
      size: {
        md: 'h-9 px-3',
        sm: 'h-8 px-2.5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';
