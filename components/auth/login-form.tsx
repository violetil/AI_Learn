"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/types/auth";

const initialState: AuthFormState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-3 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#615d59]">
          AI Learn
        </p>
        <CardTitle className="text-[28px] leading-[1.25] tracking-[-0.01em]">
          登录
        </CardTitle>
        <CardDescription className="text-sm">
          继续你的学习进度，查看课程、作业与 AI 辅助结果。
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              required
              autoComplete="email"
              name="email"
              type="email"
              placeholder="请输入邮箱地址"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              required
              autoComplete="current-password"
              name="password"
              type="password"
              minLength={8}
              placeholder="输入你的密码"
            />
          </div>

          {state.error ? (
            <p className="text-sm text-[#d14343]" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button className="mt-1 w-full" disabled={pending} type="submit">
            {pending ? "登录中…" : "登录"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-[#615d59]">
          没有账号？{" "}
          <Link
            href="/register"
            className="font-semibold text-[rgba(0,0,0,0.95)] underline-offset-4 hover:underline"
          >
            去注册
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
