import type { Request, Response } from "express";
import { onboardingService } from "../services/onboarding.service.js";
import { ok, fail } from "../utils/response.js";

export const onboardingController = {
  async setup(req: Request, res: Response) {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return fail(res, "Le nom de l'organisation est requis (min. 2 caractères)");
    }

    try {
      const result = await onboardingService.setup(
        req.user!.id,
        name.trim(),
        req.headers,
      );
      return ok(res, result, 201);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  async upgrade(req: Request, res: Response) {
    try {
      const result = await onboardingService.upgrade(
        req.user!.id,
        req.user!.name,
        req.user!.email,
      );
      return ok(res, result);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
};
