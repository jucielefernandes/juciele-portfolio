import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createContextWithCookie(sessionToken?: string): {
  ctx: TrpcContext;
  cookieSet: CookieCall[];
} {
  const cookieSet: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: sessionToken ? { admin_session: sessionToken } : {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookieSet.push({ name, value, options });
      },
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx, cookieSet };
}

describe("admin session flow", () => {
  it("should complete full login -> check session -> logout flow", async () => {
    // Step 1: Login
    const { ctx: loginCtx, cookieSet: loginCookies } = createContextWithCookie();
    const loginCaller = appRouter.createCaller(loginCtx);

    const loginResult = await loginCaller.admin.login({
      email: "juciele.bol@gmail.com",
      password: "juciele1.0",
    });

    expect(loginResult).toEqual({ success: true });
    expect(loginCookies).toHaveLength(1);
    expect(loginCookies[0]?.name).toBe("admin_session");

    const sessionToken = loginCookies[0]?.value;
    expect(sessionToken).toBeDefined();
    expect(sessionToken).toHaveLength(32);

    // Step 2: Check session with token
    const { ctx: checkCtx } = createContextWithCookie(sessionToken);
    const checkCaller = appRouter.createCaller(checkCtx);

    const checkResult = await checkCaller.admin.checkSession();
    expect(checkResult).toEqual({ isAuthenticated: true });

    // Step 3: Check session without token (should fail)
    const { ctx: noTokenCtx } = createContextWithCookie();
    const noTokenCaller = appRouter.createCaller(noTokenCtx);

    const noTokenResult = await noTokenCaller.admin.checkSession();
    expect(noTokenResult).toEqual({ isAuthenticated: false });
  });

  it("should reject invalid session token", async () => {
    const { ctx } = createContextWithCookie("invalid_token_12345678901234567890");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.checkSession();
    expect(result).toEqual({ isAuthenticated: false });
  });
});
