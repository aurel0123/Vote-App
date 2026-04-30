import type { Request, Response } from "express";
import { eventService } from "../services/event.service.js";
import { ok, fail, notFound, forbidden } from "../utils/response.js";

export const eventController = {
  async create(req: Request, res: Response) {
    try {
      const event = await eventService.create({
        ...req.body,
        organizerId: req.user!.id,
      });
      return ok(res, event, 201, "Evènement créer avec succès");
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  //recuperation des événement de l'utilisateur actuellement connecte 
  async myEvents(req: Request, res: Response) {
    try {
      const myEvent = await eventService.findByOrganizer(req.user!.id);
      return ok(res, myEvent, 201)
    } catch (e) {
      return fail(res, (e as Error).message)
    }
  },

  //Recuperation d'un évènement par son id 
  async getDashboard(req: Request<{ id: string }>, res: Response) {
    try {
      const id = req.params.id
      const event = await eventService.findById(id);
      if (!event) return notFound(res, "Evenement")
      if (event.organizerId !== req.user!.id) return forbidden(res)
      const revenu = await eventService.getRevenue(event.id)
      return ok(res, { ...revenu, event })
    } catch (e) {
      return fail(res, (e as Error).message)
    }
  },

  // GET /api/events/:slug — page publique 
  async getBySlug(req: Request<{ slug: string }>, res: Response) {
    try {
      const slug = req.params.slug;
      const event = await eventService.findBySlug(slug);
      if (event?.status === "DRAFT" || event?.status === "SUSPENDED")
        return notFound(res, "Evènement")

      return ok(res, event)
    } catch (e: unknown) {
      return fail(res, (e as Error).message)
    }
  },

  async update(req: Request<{ id: string }>, res: Response) {
    try {
      const event = await eventService.findById(req.params.id);
      if (!event) return notFound(res, "Evenement");
      if (event.organizerId !== req.user!.id) return forbidden(res);
      const updated = await eventService.update(req.params.id, req.body)
      return ok(res, updated, 200, "Evènement modifier avec succes");
    } catch (e: unknown) {
      return fail(res, (e as Error).message)
    }
  },

  //Suppression d'un evenment 
  async delete(req: Request<{ id: string }>, res: Response) {
    const event = await eventService.findById(req.params.id);

    if (!event) return notFound(res, "Evenement");

    if (!req.user) return forbidden(res);

    if (event.organizerId !== req.user.id) return forbidden(res);

    try {
      await eventService.delete(event.id);
      return ok(res, null, 200, `Evènement ${event.title} supprimée avec succès `);
    } catch {
      return fail(res, "Erreur lors de la suppression");
    }
  },

  // POST /api/events/:id/publish
  async publish(req: Request<{ id: string }>, res: Response) {
    try {
      const event = await eventService.findById(req.params.id);
      if (!event) return notFound(res, "Événement");
      if (event.organizerId !== req.user!.id) return forbidden(res);
      const published = await eventService.publish(req.params.id);
      return ok(res, published);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // POST /api/events/:id/end
  async end(req: Request<{ id: string }>, res: Response) {
    try {
      const event = await eventService.findById(req.params.id);
      if (!event) return notFound(res, "Événement");
      if (event.organizerId !== req.user!.id) return forbidden(res);
      const ended = await eventService.end(req.params.id);
      return ok(res, ended);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // GET /api/events/:id/ranking — classement temps réel
  async getRanking(req: Request<{ id: string }>, res: Response) {
    try {
      const ranking = await eventService.getRanking(req.params.id);
      return ok(res, ranking);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
}