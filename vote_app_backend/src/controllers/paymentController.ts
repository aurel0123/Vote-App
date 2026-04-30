import type { Request, Response } from "express";
import { paymentService } from "../services/payment.service.js";
import { ok, fail } from "../utils/response.js";
import { buildFingerprint } from "../lib/fingerprint.js";
import crypto from "crypto";

export const paymentController = {
  // POST /api/payments/init — lancer un paiement
  async initPayment(req: Request, res: Response) {
    try {
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      const result = await paymentService.initTransaction({
        ...req.body,
        ipAddress: ip,
        userAgent: req.headers["user-agent"],
        fingerprint: buildFingerprint(req),
      });
      return ok(res, result, 201);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // POST /api/payments/webhook — appelé par FedaPay
  async webhook(req: Request, res: Response) {
    try {
      // Vérification de la signature FedaPay
      const signature = req.headers["x-fedapay-signature"] as string;
      const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET!;

      if (signature && webhookSecret) {
        const body = JSON.stringify(req.body);
        const expectedSig = crypto
          .createHmac("sha256", webhookSecret)
          .update(body)
          .digest("hex");

        if (signature !== expectedSig) {
          return res.status(401).json({ error: "Signature invalide" });
        }
      }

      await paymentService.handleWebhook(req.body);
      return res.status(200).json({ received: true });
    } catch (e: unknown) {
      console.error("Webhook error:", (e as Error).message);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  },

  // GET /api/payments/event/:eventId
  async getEventTransactions(req: Request<{eventId : string}>, res: Response) {
    try {
      const transactions = await paymentService.getEventTransactions(
        req.params.eventId
      );
      return ok(res, transactions);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
};