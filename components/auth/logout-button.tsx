import { logoutAction } from "@/app/(auth)/actions";

/** 服务端表单触发退出，无需客户端 JS */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        type="submit"
      >
        退出登录
      </button>
    </form>
  );
}
