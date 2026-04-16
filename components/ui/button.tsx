import * as React from "react";

type ButtonVariant = "default" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[#0075de] text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-[#005bab]",
  secondary:
    "border border-[rgba(0,0,0,0.1)] bg-white text-[rgba(0,0,0,0.95)] hover:bg-[#f6f5f4]",
  ghost: "text-[rgba(0,0,0,0.95)] hover:bg-black/5",
  link: "h-auto px-0 text-[rgba(0,0,0,0.95)] underline-offset-4 hover:underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-[15px]",
  sm: "h-8 rounded-md px-3 text-sm",
  lg: "h-12 rounded-md px-6 text-base",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", type, asChild = false, children, ...props },
    ref,
  ) => {
    const mergedClassName = cx(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#097fe8] focus-visible:ring-offset-2",
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (asChild && React.isValidElement(children)) {
      const child = React.Children.only(children) as React.ReactElement<{
        className?: string;
      }>;
      return React.cloneElement(child, {
        className: cx(mergedClassName, child.props.className),
      });
    }

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={mergedClassName}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
