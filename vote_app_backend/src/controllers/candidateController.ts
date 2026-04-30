import type { Request, Response } from "express";
import { CandidateService } from "../services/candidate.service.js";
import { fail, forbidden, notFound, ok } from "../utils/response.js";
import { eventService } from "../services/event.service.js";

export const candidateController = {
  async list(req: Request<{ eventId: string }>, res: Response) {
    try {
      const listCandidates = await CandidateService.findByEvent(req.params.eventId)
      return ok(res, listCandidates)
    } catch (error: unknown) {
      return fail(res, (error as Error).message)
    }
  },

  //Create candidate Requet Post 
  async create(req: Request<{ eventId: string }>, res: Response) {
    try {
      const event = await eventService.findById(req.params.eventId)
      if (!event) return notFound(res, "Evenement");
      if (event.organizerId !== req.user!.id) return forbidden(res)

      const created = await CandidateService.create({
        ...req.body,
        eventId: req.params.eventId
      })
      return ok(res, created, 201, "Candidat créer avec succès",)
    } catch (error: unknown) {
      return fail(res, (error as Error).message)
    }
  },

  async createManyCandidates(req: Request<{ eventId: string }>, res: Response) {
    try {
      const event = await eventService.findById(req.params.eventId)
      if (!event) return notFound(res, "Evenement");
      if (event.organizerId !== req.user!.id) return forbidden(res)
      const candidatesInput = req.body.map((c: any) => ({
        ...c,
        eventId: req.params.eventId
      }));

      const candidates = await CandidateService.createMany(
        candidatesInput, req.params.eventId
      )

      return ok(res, candidates, 201, "Candidats créés avec succès",)
    } catch (error: unknown) {
      return fail(res, (error as Error).message)
    }
  }, 

  async update(req: Request<{eventId : string , id : string}>, res: Response) {
    try {
      const event = await eventService.findById(req.params.eventId);
      if (!event) return notFound(res, "Événement");
      if (event.organizerId !== req.user!.id) return forbidden(res);
 
      const candidate = await CandidateService.update(req.params.id, req.body);
      return ok(res, candidate);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
 
  // DELETE /api/events/:eventId/candidates/:id
  async remove(req: Request<{eventId : string , id : string}>, res: Response) {
    try {
      const event = await eventService.findById(req.params.eventId);
      if (!event) return notFound(res, "Événement");
      if (event.organizerId !== req.user!.id) return forbidden(res);
      if (event.status === "LIVE")
        return fail(res, "Impossible de supprimer un candidat pendant un vote en cours");
 
      await CandidateService.delete(req.params.id);
      return ok(res, { deleted: true });
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
 
  // PUT /api/events/:eventId/candidates/reorder
  async reorder(req: Request<{eventId : string}>, res: Response) {
    try {
      const event = await eventService.findById(req.params.eventId);
      if (!event) return notFound(res, "Événement");
      if (event.organizerId !== req.user!.id) return forbidden(res);
 
      const { orderedIds } = req.body as { orderedIds: string[] };
      if (!Array.isArray(orderedIds))
        return fail(res, "orderedIds doit être un tableau d'IDs");
 
      await CandidateService.reorder(req.params.eventId, orderedIds);
      return ok(res, { reordered: true });
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
}