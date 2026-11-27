import { createHmac } from "node:crypto";

export const e2eBaseURL = process.env.E2E_BASE_URL || `http://localhost:${process.env.E2E_PORT || 3100}`;

export function adminCookieValue(): string {
  const secret = process.env.SESSION_SECRET || "bhakshannashala-dev-secret-change-me";
  const signature = createHmac("sha256", secret).update("admin").digest("base64url");
  return `admin.${signature}`;
}
