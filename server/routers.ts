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
      if (!sessionToken) return { isAuthenticated: false };

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
          filename: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date())
          throw new TRPCError({ code: "UNAUTHORIZED" });

        // Convert base64 to buffer
        const buffer = Buffer.from(input.base64, "base64");

        // Upload to storage
        const { key, url } = await storagePut(
          `portfolio/${input.filename}`,
          buffer,
          input.mimeType
        );

        return { key, url };
      }),
  }),

  // Projects
  projects: router({
    list: publicProcedure.query(() => getProjects()),
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getProjectById(input)),
    create: publicProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          techTags: z.string().optional(),
          projectUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date())
          throw new TRPCError({ code: "UNAUTHORIZED" });
        return createProject(input);
      }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            imageUrl: z.string().optional(),
            imageKey: z.string().optional(),
            techTags: z.string().optional(),
            projectUrl: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date())
          throw new TRPCError({ code: "UNAUTHORIZED" });
        return updateProject(input.id, input.data);
      }),
    delete: publicProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date())
          throw new TRPCError({ code: "UNAUTHORIZED" });
        return deleteProject(input);
      }),
  }),

  // Certificates
  certificates: router({
    list: publicProcedure.query(() => getCertificates()),
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getCertificateById(input)),
    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          issuer: z.string(),
          date: z.string(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date())
          throw new TRPCError({ code: "UNAUTHORIZED" });
        return createCertificate(input);
      }),
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            name: z.string().optional(),
            issuer: z.string().optional(),
            date: z.string().optional(),
            imageUrl: z.string().optional(),
            imageKey: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date())
          throw new TRPCError({ code: "UNAUTHORIZED" });
        return updateCertificate(input.id, input.data);
      }),
    delete: publicProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const sessionToken = ctx.req.cookies?.admin_session;
        if (!sessionToken) throw new TRPCError({ code: "UNAUTHORIZED" });
        const session = await getAdminSessionByToken(sessionToken);
        if (!session || session.expiresAt < new Date())
          throw new TRPCError({ code: "UNAUTHORIZED" });
        return deleteCertificate(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
