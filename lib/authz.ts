import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import type { AppRole } from "@/types/auth";

export type { AppRole } from "@/types/auth";

/** 要求登录，否则重定向到登录页 */
export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** 要求指定角色，否则重定向到首页 */
export async function requireRole(role: AppRole) {
  const user = await requireSessionUser();
  if (user.role !== role) {
    redirect("/");
  }
  return user;
}
