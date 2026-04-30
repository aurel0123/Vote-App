import type { Request, Response } from "express";
import { buildFingerprint } from "../lib/fingerprint.js";
import { voteService } from "../services/vote.service.js";
import { fail, ok } from "../utils/response.js";

export const voteController = {
  // POST /api/votes/free
  // Uniquement pour les événements voteType: FREE (sondages, concours asso)
  // Pour les événements PAID → utiliser POST /api/payments/init
  async freeVote(req : Request , res : Response) {
    try {
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      const userAgent = req.headers["user-agent"] || "unknown";
      const fingerprint = buildFingerprint(req)

      const vote = await voteService.castFreeVote({
        eventId: req.body.eventId,
        candidateId: req.body.candidateId,
        ipAddress: ip,
        userAgent : userAgent,
        fingerprint : fingerprint
      })

      return ok(res, vote , 201 , "Vote enrgistrer avec succès ")
    } catch (error : unknown) {
      return fail(res, (error as Error).message);
    } 
  }, 
   // GET /api/votes/:eventId/stats
  async getStats(req: Request<{eventId : string}>, res: Response) {
    try {
      const stats = await voteService.getStats(req.params.eventId);
      return ok(res, stats);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
}