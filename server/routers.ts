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
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!verifyAdminCredentials(input.email, input.password)) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials",
          });
        }

        // Create session token
        const sessionToken = nanoid(32);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await createAdminSession(sessionToken, expiresAt);

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("admin_session", sessionToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

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
      
      if (!sessionToken) {
        return { isAuthenticated: false };
      }

      const session = await getAdminSessionByToken(sessionToken);
      
      if (!session || session.expiresAt < new Date()) {
        return { isAuthenticated: false };
      }

      return { isAuthenticated: true };
    }),
  }),

  // Upload
  upload: router({
    uploadImage: publicProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string().regex(/^[\w\-. ]+$/, "Invalid filename").max(255),
          mimeType: z.string().regex(/^[\w]+\/[\w\-+.]+$/, "Invalid MIME type"),
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
          title: z.string().min(1).max(255),
          description: z.string().min(1),
          imageUrl: z.string().url().optional(),
          techTags: z.array(z.string()),
          projectUrl: z.string().url().optional(),
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
          title: z.string().min(1).max(255).optional(),
          description: z.string().min(1).optional(),
          imageUrl: z.string().url().optional(),
          techTags: z.array(z.string()).optional(),
          projectUrl: z.string().url().optional(),
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
          name: z.string().min(1).max(255),
          issuer: z.string().min(1).max(255),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
          imageUrl: z.string().url().optional(),
          certificateUrl: z.string().url().optional(),
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
          name: z.string().min(1).max(255).optional(),
          issuer: z.string().min(1).max(255).optional(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
          imageUrl: z.string().url().optional(),
          certificateUrl: z.string().url().optional(),
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
