import * as React from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cx(
          "flex h-10 w-full rounded-lg border border-[#dddddd] bg-white px-3 py-2 text-sm text-[rgba(0,0,0,0.9)]",
          "placeholder:text-[#a39e98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#097fe8] focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:bg-[#f6f5f4] disabled:text-[#a39e98]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
