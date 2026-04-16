import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="创建账号，开启 AI 教学与学习闭环"
      subtitle="支持教师与学生双角色，注册后立即进入课程、作业与智能辅助场景。"
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
