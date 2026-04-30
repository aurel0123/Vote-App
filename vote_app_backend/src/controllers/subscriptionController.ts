import type { Request, Response } from "express";
import { subscriptionService } from "../services/subscription.service.js";
import { ok, fail } from "../utils/response.js";
import crypto from "crypto";
import { env } from "../lib/env.js";

export const subscriptionController = {
  // GET /api/subscriptions/me — plan actuel de l'utilisateur connecté
  async getMyPlan(req: Request, res: Response) {
    try {
      const plan = await subscriptionService.getCurrentPlan(req.user!.id);
      return ok(res, plan);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // POST /api/subscriptions/init — initier un paiement d'abonnement
  async initPayment(req: Request, res: Response) {
    try {
      const { plan, phoneNumber, customerName, customerEmail } = req.body as {
        plan: "PACK" | "PREMIUM";
        phoneNumber: string;
        customerName: string;
        customerEmail?: string;
      };

      if (!plan || !phoneNumber || !customerName) {
        return fail(res, "plan, phoneNumber et customerName sont requis");
      }

      if (!["PACK", "PREMIUM"].includes(plan)) {
        return fail(res, "Plan invalide. Choisissez PACK ou PREMIUM");
      }

      const result = await subscriptionService.initSubscriptionPayment(
        req.user!.id,
        plan,
        phoneNumber,
        customerName,
        customerEmail
      );

      return ok(res, result, 201);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // POST /api/subscriptions/webhook — appelé par FedaPay
  async webhook(req: Request, res: Response) {
    try {
      // Vérification signature FedaPay
      const signature = req.headers["x-fedapay-signature"] as string;
      const webhookSecret = env.FEDAPAY_WEBHOOK_SECRET!;

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

      await subscriptionService.handleWebhook(req.body);
      return res.status(200).json({ received: true });
    } catch (e: unknown) {
      console.error("Subscription webhook error:", (e as Error).message);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  },

  // DELETE /api/subscriptions/cancel
  async cancel(req: Request, res: Response) {
    try {
      const result = await subscriptionService.cancel(req.user!.id);
      return ok(res, result);
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },

  // GET /api/subscriptions — liste complète (admin)
  async getAll(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      return ok(res, await subscriptionService.getAll(page));
    } catch (e: unknown) {
      return fail(res, (e as Error).message);
    }
  },
};