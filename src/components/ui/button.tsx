import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:bg-accent-hover shadow-[0_1px_0_rgb(255_255_255_/0.12)_inset]",
        ink: "bg-ink text-paper hover:bg-ink/90",
        outline:
          "border border-line bg-transparent text-ink hover:bg-paper-2",
        ghost: "text-ink hover:bg-paper-2",
        danger: "bg-danger text-paper hover:bg-danger/90",
      },
      size: {
        sm: "h-10 px-3.5 text-sm rounded-[10px]",
        md: "h-12 px-5 text-[15px] rounded-[12px]",
        lg: "h-13 min-h-12 px-6 text-base rounded-[14px]",
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
