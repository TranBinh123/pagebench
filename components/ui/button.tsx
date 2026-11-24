import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,border-color,color,transform] duration-100 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 disabled:active:scale-100',
  {
    variants: {
      variant: {
        solid: 'bg-ink text-mat hover:bg-ink/85',
        outline: 'border border-line bg-paper text-ink hover:border-brand hover:bg-brand/15',
        ghost: 'text-ink hover:bg-ink/10',
        danger: 'border border-line bg-paper text-ink hover:border-sun hover:bg-sun hover:text-navy',
        accent: 'bg-sun text-navy hover:bg-sun/85',
        onDark: 'text-white hover:bg-white/15',
        outlineDark: 'border border-white/40 text-white hover:bg-white/15',
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
