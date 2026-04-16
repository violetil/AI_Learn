import Link from "next/link";

export function AuthPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="absolute inset-0 bg-[#f6f5f4]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-white/80" />
      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_440px] lg:gap-16">
        <section className="hidden flex-col justify-center lg:flex">
          <Link
            href="/"
            className="mb-8 inline-flex w-fit items-center rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-3 py-1 text-xs font-semibold tracking-[0.06em] text-[rgba(0,0,0,0.95)]"
          >
            AI LEARN
          </Link>
          <h1 className="max-w-[16ch] text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-[rgba(0,0,0,0.95)]">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#615d59]">{subtitle}</p>
        </section>

        <section className="w-full">{children}</section>
      </div>
    </div>
  );
}
