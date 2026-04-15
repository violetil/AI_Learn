import type { ApiResult } from "@/lib/api-response";
import { ok } from "@/lib/api-response";
import { withApiHandler } from "@/lib/api/handler";
import { getSessionUserFromRequest } from "@/lib/auth";

type SessionPayload =
  | { authenticated: false }
  | {
      authenticated: true;
      user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
      };
    };

/**
 * GET：探测当前登录状态（Cookie 或 Bearer JWT）。
 */
export async function GET(request: Request) {
  return withApiHandler(request, async (): Promise<ApiResult<SessionPayload>> => {
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return ok({ authenticated: false });
    }
    return ok({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });
}
