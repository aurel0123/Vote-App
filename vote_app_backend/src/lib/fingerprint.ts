import type { Request } from "express";

export function buildFingerprint(req: Request) {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const userAgent = req.headers["user-agent"] || "unknown";

  const acceptLang = req.headers["accept-language"] || "unknown";

  return `${ip}::${userAgent}::${acceptLang}`;
}