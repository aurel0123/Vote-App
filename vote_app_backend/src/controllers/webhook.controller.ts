import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { PlanType } from "../generated/prisma/index.js";
import { Transaction } from "../lib/fedapay.js";

export const webhookController = {
  async fedapay(req: Request, res: Response) {
    const event = req.body;

    if (event?.name !== "transaction.approved") {
      return res.status(200).json({ received: true });
    }

    try {
      const transactionId = event?.data?.id;
      if (!transactionId) return res.status(400).json({ error: "Transaction ID manquant" });

      // Vérification côté FedaPay — on refetch la transaction pour éviter les faux webhooks
      // @ts-ignore
      const transaction = await Transaction.retrieve(transactionId);
      if (!transaction || transaction.status !== "approved") {
        return res.status(200).json({ received: true });
      }

      const userId = transaction.metadata?.userId;
      if (!userId) return res.status(400).json({ error: "userId manquant dans les métadonnées" });

      await prisma.subscription.update({
        where: { userId },
        data: {
          plan: PlanType.PREMIUM,
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
          fedapayId: String(transaction.id),
        },
      });

      return res.status(200).json({ received: true });
    } catch (e: unknown) {
      console.error("Webhook FedaPay erreur:", (e as Error).message);
      return res.status(500).json({ error: "Erreur traitement webhook" });
    }
  },
};
