import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  createAdminSession,
  getAdminSessionByToken,
  deleteAdminSession,
  verifyAdminCredentials,
} from "./db";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Admin authentication
  admin: router({
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        console.log("[login] Email:", input.email);
        if (!verifyAdminCredentials(input.email, input.password)) {
          console.log("[login] Invalid credentials");
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials",
          });
        }

        // Create session token
        const sessionToken = nanoid(32);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await createAdminSession(sessionToken, expiresAt);
        console.log("[login] Session created:", sessionToken);

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        console.log("[login] Cookie options:", cookieOptions);
        console.log("[login] Request protocol:", ctx.req.protocol);
        
        ctx.res.cookie("admin_session", sessionToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        console.log("[login] Cookie set");

        return { success: true };
      }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      const sessionToken = ctx.req.cookies?.admin_session;
      if (sessionToken) {
        await deleteAdminSession(sessionToken);
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("admin_session", { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    checkSession: publicProcedure.query(async ({ ctx }) => {
      const sessionToken = ctx.req.cookies?.admin_session;
      console.log("[checkSession] Cookies:", ctx.req.cookies);
      console.log("[checkSession] Session token:", sessionToken);
      
      if (!sessionToken) {
        console.log("[checkSession] No session token found");
        return { isAuthenticated: false };
      }

      const session = await getAdminSessionByToken(sessionToken);
      console.log("[checkSession] Session from DB:", session);
      
      if (!session || session.expiresAt < new Date()) {
        console.log("[checkSession] Session invalid or expired");
        return { isAuthenticated: false };
      }

      console.log("[checkSession] Session valid");
      return { isAuthenticated: true };
    }),
  }),

  // Upload
  upload: router({
    uploadImage: publicProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(
          `projects/${input.filename}`,
          buffer,
          input.mimeType
        );
        return { url };
      }),
  }),

  // Projects
  projects: router({
    list: publicProcedure.query(() => getProjects()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getProjectById(input.id)),
    create: publicProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string(),
          imageUrl: z.string().optional(),
          techTags: z.array(z.string()),
          projectUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return createProject({
          ...input,
          techTags: JSON.stringify(input.techTags),
        });
      }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          techTags: z.array(z.string()).optional(),
          projectUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return updateProject(input.id, {
          ...input,
          techTags: input.techTags ? JSON.stringify(input.techTags) : undefined,
        });
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return deleteProject(input.id);
      }),
  }),

  // Certificates
  certificates: router({
    list: publicProcedure.query(() => getCertificates()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getCertificateById(input.id)),
    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          issuer: z.string(),
          date: z.string(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return createCertificate(input);
      }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          issuer: z.string().optional(),
          date: z.string().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return updateCertificate(input.id, input);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date()) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return deleteCertificate(input.id);
      }),
  }),

  // GitHub
  github: router({
    getRepositories: publicProcedure.query(async () => {
      try {
        const response = await fetch(
          "https://api.github.com/users/jucielefernandes/repos?sort=updated&per_page=10",
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
            },
          }
        );
        if (!response.ok) {
          console.error("[github] Error fetching repos:", response.statusText);
          return [];
        }
        const repos = await response.json();
        return repos.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
        }));
      } catch (error) {
        console.error("[github] Error:", error);
        return [];
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
