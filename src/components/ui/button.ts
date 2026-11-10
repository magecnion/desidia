/**
 * Button variants (adapted from the prototype's shadcn component, without React or class-variance-authority).
 */
export const BUTTON_VARIANTS = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  // "Hand-drawn" call to action from the prototype's mural panel.
  ink:
    'rounded-none border-2 border-ink bg-ochre font-medium text-ink shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-0.5',
} as const;

export const BUTTON_SIZES = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-10 rounded-md px-8',
  xl: 'px-5 py-3 text-base',
  icon: 'h-9 w-9',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

export function buttonClasses(variant: ButtonVariant = 'default', size: ButtonSize = 'default', extra = ''): string {
  return [BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], extra].filter(Boolean).join(' ');
}
