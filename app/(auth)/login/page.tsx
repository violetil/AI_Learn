import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthPageShell
      title="欢迎回来，继续你的学习旅程"
      subtitle="登录后即可查看课程进度、作业反馈和 AI 学习建议，专注学习本身。"
    >
      <LoginForm />
    </AuthPageShell>
  );
}
