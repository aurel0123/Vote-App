import type { Request, Response } from "express";
import { adminService } from "../services/admin.service.js";
import { ok, fail } from "../utils/response.js";

export const adminController = {
  async getStats(_req: Request, res: Response) {
    try {
      return ok(res, await adminService.getStats());
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  async getOrganizers(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      return ok(res, await adminService.getOrganizers(page));
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  async getEvents(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const status = req.query.status as string | undefined;
      return ok(res, await adminService.getEvents(page, 20, status as never));
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  async suspendEvent(req: Request<{id : string }>, res: Response) {
    try {
      const event = await adminService.suspendEvent(
        req.params.id,
        req.body.reason
      );
      return ok(res, event);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  async restoreEvent(req: Request<{id : string }>, res: Response) {
    try {
      return ok(res, await adminService.restoreEvent(req.params.id));
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  async blockUser(req: Request<{id : string }>, res: Response) {
    try {
      return ok(res, await adminService.blockUser(req.params.id));
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  async getTransactions(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      return ok(res, await adminService.getTransactions(page));
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  async createPayout(req: Request, res: Response) {
    try {
      return ok(res, await adminService.createPayout(req.body), 201);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  async updatePayoutStatus(req: Request<{id : string }>, res: Response) {
    try {
      return ok(
        res,
        await adminService.updatePayoutStatus(req.params.id, req.body.status)
      );
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
};