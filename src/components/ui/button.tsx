import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** The one button style. Every size is at least 48px tall for thumbs. */
const buttonVariants = cva(
  [
    "inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap",
    "transition-[background-color,border-color,color,transform] duration-150 ease-out",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent-hover",
        secondary: "border border-field bg-surface text-ink hover:border-ink hover:bg-paper-2",
        outline: "border border-field bg-surface text-ink hover:border-ink hover:bg-paper-2",
        ghost: "text-ink hover:bg-paper-2",
        ink: "bg-ink text-paper hover:bg-ink/90",
        danger: "bg-danger text-paper hover:bg-danger/90",
      },
      size: {
        sm: "min-h-12 px-4 text-sm",
        md: "min-h-12 px-5 text-base",
        lg: "min-h-14 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
