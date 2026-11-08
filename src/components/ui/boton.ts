/**
 * Variantes del botón (adaptado del componente shadcn del prototipo, sin React ni class-variance-authority).
 */
export const VARIANTES_BOTON = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  // Llamada a la acción "dibujada" del panel del mural en el prototipo.
  tinta:
    'rounded-none border-2 border-ink bg-ochre font-medium text-ink shadow-[4px_4px_0_var(--ink)] transition-transform hover:-translate-y-0.5',
} as const;

export const TAMANOS_BOTON = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-10 rounded-md px-8',
  xl: 'px-5 py-3 text-base',
  icon: 'h-9 w-9',
} as const;

export type VarianteBoton = keyof typeof VARIANTES_BOTON;
export type TamanoBoton = keyof typeof TAMANOS_BOTON;

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

export function clasesBoton(variante: VarianteBoton = 'default', tamano: TamanoBoton = 'default', extra = ''): string {
  return [BASE, VARIANTES_BOTON[variante], TAMANOS_BOTON[tamano], extra].filter(Boolean).join(' ');
}
