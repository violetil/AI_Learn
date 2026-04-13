import type { ReactNode } from "react";

/** 聊天区占满可视高度，便于底部输入条固定 */
export default function ChatGroupLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
