import type { Request, Response } from "express";
import { uploadService } from "../services/upload.service.js";
import { eventService } from "../services/event.service.js";
import { ok, fail, forbidden } from "../utils/response.js";

export const uploadController = {
  // POST /api/upload/event/:eventId/banner
  async eventBanner(req: Request<{eventId : string}>, res: Response) {
    try {
      const event = await eventService.findById(req.params.eventId);
      if (!event) return fail(res, "Événement introuvable", 404);
      if (event.organizerId !== req.user!.id) return forbidden(res);

      const { contentType, sizeBytes } = req.body as {
        contentType: string;
        sizeBytes: number;
      };

      uploadService.validateSize(sizeBytes);
      const urls = await uploadService.getEventBannerUploadUrl(
        req.params.eventId,
        contentType
      );

      // Mettre à jour l'URL de la bannière en DB
      await eventService.update(req.params.eventId, {
        coverImage: urls.publicUrl,
      });

      return ok(res, urls);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // POST /api/upload/event/:eventId/candidate/:candidateId/photo
  async candidatePhoto(req: Request<{eventId : string , candidateId : string}>, res: Response) {
    try {
      const event = await eventService.findById(req.params.eventId);
      if (!event) return fail(res, "Événement introuvable", 404);
      if (event.organizerId !== req.user!.id) return forbidden(res);

      const { contentType, sizeBytes } = req.body as {
        contentType: string;
        sizeBytes: number;
      };

      uploadService.validateSize(sizeBytes);
      const urls = await uploadService.getCandidatePhotoUploadUrl(
        req.params.eventId,
        req.params.candidateId,
        contentType
      );

      return ok(res, urls);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
};