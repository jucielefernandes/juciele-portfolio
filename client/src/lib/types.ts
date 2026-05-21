export interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  imageKey?: string | null;
  techTags?: string | null;
  projectUrl?: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Certificate {
  id: number;
  name: string;
  issuer: string;
  date: string;
  imageUrl?: string | null;
  imageKey?: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminSession {
  id: number;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
}
