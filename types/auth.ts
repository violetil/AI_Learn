export type AppRole = "TEACHER" | "STUDENT";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: AppRole;
};

/** 登录 / 注册表单 Server Action 状态 */
export type AuthFormState = { error: string | null };
