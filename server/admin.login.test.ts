import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createLoginContext(): {
  ctx: TrpcContext;
  cookieSet: Array<{ name: string; value: string; options: Record<string, unknown> }>;
} {
  const cookieSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
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

describe("admin.login", () => {
  it("should successfully login with correct credentials", async () => {
    const { ctx, cookieSet } = createLoginContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.login({
      email: "juciele.bol@gmail.com",
      password: "juciele1.0",
    });

    expect(result).toEqual({ success: true });
    expect(cookieSet).toHaveLength(1);
    expect(cookieSet[0]?.name).toBe("admin_session");
    expect(cookieSet[0]?.value).toBeDefined();
    expect(cookieSet[0]?.value).toHaveLength(32); // nanoid(32)
  });

  it("should fail with incorrect password", async () => {
    const { ctx } = createLoginContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.login({
        email: "juciele.bol@gmail.com",
        password: "wrong_password",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });

  it("should fail with incorrect email", async () => {
    const { ctx } = createLoginContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.login({
        email: "wrong@email.com",
        password: "juciele1.0",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});
