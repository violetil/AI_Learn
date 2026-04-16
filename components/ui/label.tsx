import * as React from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cx(
      "text-sm font-medium leading-none text-[rgba(0,0,0,0.95)]",
      className,
    )}
    {...props}
  />
));

Label.displayName = "Label";

export { Label };
