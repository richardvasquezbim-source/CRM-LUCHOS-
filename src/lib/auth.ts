import { createHash } from "node:crypto";

export const AUTH_COOKIE = "crm_auth";

export function hashAppPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function expectedAuthCookieValue() {
  return hashAppPassword(process.env.APP_PASSWORD ?? "");
}
