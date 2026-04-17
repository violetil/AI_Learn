"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/(auth)/actions";
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

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-3 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#615d59]">
          AI Learn
        </p>
        <CardTitle className="text-[28px] leading-[1.25] tracking-[-0.01em]">
          注册
        </CardTitle>
        <CardDescription className="text-sm">
          创建账号后可进入学生端或教师端，开始完整学习闭环。
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
              autoComplete="new-password"
              name="password"
              type="password"
              minLength={8}
              placeholder="至少 8 位字符"
            />
            <span className="text-xs text-[#615d59]">至少 8 位字符</span>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role">账号角色</Label>
            <select
              id="role"
              name="role"
              defaultValue="STUDENT"
              className="h-10 rounded-lg border border-[#dddddd] bg-white px-3 text-sm text-[rgba(0,0,0,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#097fe8]"
            >
              <option value="STUDENT">学生</option>
              <option value="TEACHER">教师</option>
            </select>
          </div>

          {state.error ? (
            <p className="text-sm text-[#d14343]" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button className="mt-1 w-full" disabled={pending} type="submit">
            {pending ? "注册中…" : "注册并登录"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-[#615d59]">
          已有账号？{" "}
          <Link
            href="/login"
            className="font-semibold text-[rgba(0,0,0,0.95)] underline-offset-4 hover:underline"
          >
            去登录
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
