import type { NextFunction, Request, Response } from "express";
import { authRateLimiter, createRateLimiter, paymentRateLimiter, publicRateLimiter, voteRateLimiter, aj } from "./arject.js";

async function applyArcjet(
  instance: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decision = await instance.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          success: false,
          error: "Trop de requêtes. Veuillez patienter avant de réessayer.",
          retryAfter: decision.reason.resetTime
            ? Math.ceil(
              (decision.reason.resetTime.getTime() - Date.now()) / 1000
            )
            : 60,
        });
      }

      if (decision.reason.isBot()) {
        return res.status(403).json({
          success: false,
          error: "Accès refusé.",
        });
      }

      if (decision.reason.isShield()) {
        return res.status(403).json({
          success: false,
          error: "Requête bloquée pour raison de sécurité.",
        });
      }

      return res.status(403).json({
        success: false,
        error: "Accès refusé.",
      });
    }

    next();
  } catch (err) {
    // Fail open : en cas d'erreur Arcjet, on laisse passer
    // pour ne pas bloquer le service si Arcjet est down
    console.warn("Arcjet error (fail open):", (err as Error).message);
    next();
  }
}

export const arcjetGlobal = (req: Request, res: Response, next: NextFunction) =>
  applyArcjet(aj, req, res, next);

export const arcjetAuth = (req: Request, res: Response, next: NextFunction) =>
  applyArcjet(authRateLimiter, req, res, next);

export const arcjetVote = (req: Request, res: Response, next: NextFunction) =>
  applyArcjet(voteRateLimiter, req, res, next);

export const arcjetPayment = (req: Request, res: Response, next: NextFunction) =>
  applyArcjet(paymentRateLimiter, req, res, next);

export const arcjetCreate = (req: Request, res: Response, next: NextFunction) =>
  applyArcjet(createRateLimiter, req, res, next);

export const arcjetPublic = (req: Request, res: Response, next: NextFunction) =>
  applyArcjet(publicRateLimiter, req, res, next);