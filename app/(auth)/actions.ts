"use server";

import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  loginUser,
  registerUser,
  setSessionCookie,
} from "@/lib/auth";
import type { AuthFormState } from "@/types/auth";

function roleHome(): string {
  return "/dashboard";
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await loginUser(email, password);
  if (!result.ok) {
    if (result.error === "USER_NOT_FOUND") {
      return { error: "用户不存在" };
    }
    if (result.error === "INVALID_PASSWORD") {
      return { error: "密码错误" };
    }
    return { error: "请输入有效的邮箱和密码" };
  }

  await setSessionCookie(result.user.id, result.user.email);
  redirect(roleHome());
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "STUDENT");
  const role = roleRaw === "TEACHER" ? "TEACHER" : "STUDENT";

  const result = await registerUser(email, password, role);
  if (!result.ok) {
    if (result.error === "EMAIL_TAKEN") {
      return { error: "该邮箱已被注册" };
    }
    return { error: "邮箱格式无效、密码不足 8 位或角色无效" };
  }

  await setSessionCookie(result.user.id, result.user.email);
  redirect(roleHome());
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
