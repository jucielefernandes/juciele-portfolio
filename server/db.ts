import { eq, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, InsertProject, certificates, InsertCertificate, adminSessions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Projects queries
export async function getProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(projects.order);
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return result;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(projects).where(eq(projects.id, id));
}

// Certificates queries
export async function getCertificates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(certificates).orderBy(certificates.order);
}

export async function getCertificateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCertificate(data: InsertCertificate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(certificates).values(data);
}

export async function updateCertificate(id: number, data: Partial<InsertCertificate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(certificates).set(data).where(eq(certificates.id, id));
}

export async function deleteCertificate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(certificates).where(eq(certificates.id, id));
}

// Admin sessions queries
export async function createAdminSession(sessionToken: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(adminSessions).values({ sessionToken, expiresAt });
}

export async function getAdminSessionByToken(sessionToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminSessions).where(eq(adminSessions.sessionToken, sessionToken)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteAdminSession(sessionToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(adminSessions).where(eq(adminSessions.sessionToken, sessionToken));
}

export async function deleteExpiredAdminSessions() {
  const db = await getDb();
  if (!db) return;
  return db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
}

// Helper to verify admin credentials
export function verifyAdminCredentials(email: string, password: string): boolean {
  const ADMIN_EMAIL = "juciele.bol@gmail.com";
  const ADMIN_PASSWORD = "juciele1.0";
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}
