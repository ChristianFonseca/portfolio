import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/* Botones según Brandbook 07 — UI Kit:
   radio 12px, transición 0.2s, y cuatro familias:
   - default  (Primario):  gradiente púrpura→magenta, elevación al hover — 1 por vista
   - outline  (Secundario): borde púrpura, fondo transparente
   - ghost    (Ghost):      texto púrpura que vira a magenta, sin borde
   - mono     (Mono):       JetBrains Mono estilo terminal, radio 10px */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[15px] font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-primary to-accent text-white shadow-[0_8px_24px_rgba(105,40,176,0.25)] dark:shadow-[0_8px_24px_rgba(168,85,247,0.32)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(236,72,153,0.42)]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border border-primary/60 bg-transparent text-primary dark:text-[#e9defc] hover:bg-primary/15',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'bg-transparent text-primary hover:text-accent hover:bg-transparent',
        mono:
          'font-mono text-[13px] font-medium rounded-[10px] bg-card border border-border text-foreground dark:bg-[#12041f] dark:border-[#2a1445] dark:text-[#e9defc] hover:border-primary dark:hover:border-primary',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-6 py-3 has-[>svg]:px-5',
        sm: 'px-4 py-2 text-sm gap-1.5 has-[>svg]:px-3.5',
        lg: 'px-7 py-3.5 has-[>svg]:px-6',
        icon: 'size-9 rounded-[10px]',
        'icon-sm': 'size-8 rounded-[10px]',
        'icon-lg': 'size-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
