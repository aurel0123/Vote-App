import type { Request, Response } from "express";
import { domainService } from "../services/domaine.service.js";
import { eventService } from "../services/event.service.js";
import { ok, fail, forbidden, notFound } from "../utils/response.js";

export const domainController = {
  // GET /api/domains/check?domain=xxx
  async checkAvailability(req: Request, res: Response) {
    try {
      const domain = req.query.domain as string;
      if (!domain) return fail(res, "Le paramètre domain est requis");
      return ok(res, await domainService.checkAvailability(domain));
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // POST /api/domains/attach
  async attach(req: Request, res: Response) {
    try {
      const { eventId, domain } = req.body as {
        eventId: string;
        domain: string;
      };

      if (!eventId || !domain) {
        return fail(res, "eventId et domain sont requis");
      }

      // Vérifier que l'événement appartient à l'organisateur connecté
      const event = await eventService.findById(eventId);
      if (!event) return notFound(res, "Événement");
      if (event.organizerId !== req.user!.id) return forbidden(res);

      const result = await domainService.attach(
        eventId,
        req.user!.id,
        domain
      );
      return ok(res, result);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // DELETE /api/domains/:eventId
  async detach(req: Request<{eventId : string}>, res: Response) {
    try {
      const event = await eventService.findById(req.params.eventId);
      if (!event) return notFound(res, "Événement");
      if (event.organizerId !== req.user!.id) return forbidden(res);

      const result = await domainService.detach(req.params.eventId);
      return ok(res, result);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // GET /api/domains/resolve?domain=xxx
  // Utilisé par le frontend pour router les domaines custom
  async resolve(req: Request, res: Response) {
    try {
      const domain = req.query.domain as string;
      if (!domain) return fail(res, "Le paramètre domain est requis");

      const event = await domainService.findEventByDomain(domain);
      if (!event) return notFound(res, "Domaine");
      if (event.status === "DRAFT" || event.status === "SUSPENDED")
        return notFound(res, "Événement");

      return ok(res, event);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
};