import Link from "next/link";

/** 登录区 UI：后续可接入 Server Actions 与表单校验 */
export function LoginForm() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        登录
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        占位表单，后续在此接入认证逻辑。
      </p>
      <Link
        href="/register"
        className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
      >
        没有账号？去注册
      </Link>
    </div>
  );
}
