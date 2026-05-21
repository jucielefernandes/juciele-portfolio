import { describe, expect, it, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

const { sessionStore } = vi.hoisted(() => ({
  sessionStore: new Map<string, Date>(),
}));

vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    createAdminSession: vi.fn(async (token: string, expiresAt: Date) => {
      sessionStore.set(token, expiresAt);
    }),
    getAdminSessionByToken: vi.fn(async (token: string) => {
      const expiresAt = sessionStore.get(token);
      if (!expiresAt) return undefined;
      return { sessionToken: token, expiresAt };
    }),
    deleteAdminSession: vi.fn(async (token: string) => {
      sessionStore.delete(token);
    }),
  };
});

beforeAll(() => {
  vi.stubEnv("ADMIN_EMAIL", "juciele.bol@gmail.com");
  vi.stubEnv("ADMIN_PASSWORD", "juciele1.0");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

function createAuthContext(): {
  ctx: TrpcContext;
  cookies: Record<string, string>;
  setCookies: CookieCall[];
} {
  const cookies: Record<string, string> = {};
  const setCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies,
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        cookies[name] = value;
        setCookies.push({ name, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        delete cookies[name];
        setCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, cookies, setCookies };
}

describe("admin.login", () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it("should fail with invalid credentials", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.login({
        email: "wrong@email.com",
        password: "wrongpassword",
      });
      expect.fail("Should have thrown UNAUTHORIZED error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });

  it("should succeed with valid credentials", async () => {
    const { ctx, cookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.login({
      email: "juciele.bol@gmail.com",
      password: "juciele1.0",
    });

    expect(result.success).toBe(true);
    expect(cookies.admin_session).toBeDefined();
    expect(cookies.admin_session).toBeTruthy();
  });
});

describe("admin.checkSession", () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it("should return false when no session cookie exists", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.checkSession();
    expect(result.isAuthenticated).toBe(false);
  });

  it("should return true when valid session exists", async () => {
    const { ctx, cookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First login
    await caller.admin.login({
      email: "juciele.bol@gmail.com",
      password: "juciele1.0",
    });

    // Then check session
    const result = await caller.admin.checkSession();
    expect(result.isAuthenticated).toBe(true);
  });
});

describe("admin.logout", () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it("should clear admin_session cookie", async () => {
    const { ctx, cookies, setCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Login first
    await caller.admin.login({
      email: "juciele.bol@gmail.com",
      password: "juciele1.0",
    });

    expect(cookies.admin_session).toBeDefined();

    // Then logout
    const result = await caller.admin.logout();
    expect(result.success).toBe(true);
    expect(cookies.admin_session).toBeUndefined();

    // Check that cookie was cleared
    const clearCall = setCookies.find((c) => c.name === "admin_session" && c.options.maxAge === -1);
    expect(clearCall).toBeDefined();
  });
});
