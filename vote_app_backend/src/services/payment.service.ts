

import { prisma } from "../lib/prisma.js";
import { emitVoteUpdate } from "../lib/socket.js";
import { splitAmount } from "../utils/commission.js";
import { eventService } from "./event.service.js";

const FEDAPAY_BASE_URL =
  process.env.FEDAPAY_ENVIRONMENT === "production"
    ? "https://api.fedapay.com/v1"
    : "https://sandbox-api.fedapay.com/v1";

const FEDAPAY_SECRET = process.env.FEDAPAY_SECRET_KEY!;

interface InitPaymentInput {
  eventId: string;
  candidateId: string;
  quantity: number;
  phoneNumber: string;
  customerName: string;
  customerEmail?: string;
  ipAddress: string;
  userAgent?: string;
  fingerprint?: string;
}

export const paymentService = {
  // Initialiser une transaction FedaPay
  async initTransaction(input: InitPaymentInput) {
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      select: {
        id: true,
        title: true,
        pricePerVote: true,
        commissionRate: true,
        status: true,
        endDate: true,
        voteType: true,
      },
    });

    if (!event) throw new Error("Événement introuvable");
    if (event.status !== "LIVE" && event.status !== "PUBLISHED")
      throw new Error("Les votes ne sont pas ouverts pour cet événement");
    if (new Date() > event.endDate)
      throw new Error("Cet événement est terminé");
    if (event.voteType === "FREE")
      throw new Error("Cet événement n'accepte pas les votes payants");

    const totalAmount = event.pricePerVote * input.quantity;
    if (totalAmount <= 0) throw new Error("Montant invalide");

    const { commissionAmount, organizerAmount } = splitAmount(
      totalAmount,
      event.commissionRate
    );

    // Créer la transaction en DB (statut PENDING)
    const transaction = await prisma.transaction.create({
      data: {
        amount: totalAmount,
        commissionAmount,
        organizerAmount,
        status: "PENDING",
        phoneNumber: input.phoneNumber,
        eventId: input.eventId,
      },
    });

    // Appel API FedaPay pour créer la transaction
    const fedapayResponse = await fetch(`${FEDAPAY_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FEDAPAY_SECRET}`,
      },
      body: JSON.stringify({
        description: `${input.quantity} vote(s) - ${event.title}`,
        amount: totalAmount,
        currency: { iso: "XOF" },
        callback_url: `${process.env.BETTER_AUTH_URL}/api/payments/webhook`,
        customer: {
          firstname: input.customerName,
          phone_number: {
            number: input.phoneNumber,
            country: "BJ",
          },
          ...(input.customerEmail && { email: input.customerEmail }),
        },
        metadata: {
          transactionId: transaction.id,
          eventId: input.eventId,
          candidateId: input.candidateId,
          quantity: input.quantity,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          fingerprint: input.fingerprint,
        },
      }),
    });

    if (!fedapayResponse.ok) {
      const err = await fedapayResponse.json() as { message?: string };
      throw new Error(`FedaPay error: ${err.message || "Erreur inconnue"}`);
    }

    const fedapayData = await fedapayResponse.json() as {
      v1: { transaction: { id: number; reference: string } };
      url?: string;
    };

    const fedapayTransaction = fedapayData.v1.transaction;

    // Mettre à jour la transaction avec l'ID FedaPay
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        fedapayId: String(fedapayTransaction.id),
        fedapayReference: fedapayTransaction.reference,
      },
    });

    // Générer le lien de paiement FedaPay
    const paymentUrl = `${FEDAPAY_BASE_URL}/transactions/${fedapayTransaction.id}/token`;
    const tokenResponse = await fetch(paymentUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${FEDAPAY_SECRET}` },
    });

    const tokenData = await tokenResponse.json() as { token?: string };

    return {
      transactionId: transaction.id,
      fedapayId: fedapayTransaction.id,
      paymentUrl: `https://checkout${process.env.FEDAPAY_ENVIRONMENT === "production" ? "" : "-sandbox"}.fedapay.com/${tokenData.token}`,
      amount: totalAmount,
    };
  },

  // Traiter le webhook FedaPay (après paiement)
  async handleWebhook(payload: {
    name: string;
    entity: {
      id: number;
      status: string;
      metadata?: {
        transactionId: string;
        eventId: string;
        candidateId: string;
        quantity: number;
        ipAddress: string;
        userAgent?: string;
        fingerprint?: string;
      };
    };
  }) {
    const { name: eventName, entity } = payload;

    if (eventName !== "transaction.approved") return;

    const metadata = entity.metadata;
    if (!metadata?.transactionId) return;

    // Récupérer la transaction en DB
    const transaction = await prisma.transaction.findUnique({
      where: { id: metadata.transactionId },
    });

    if (!transaction || transaction.status !== "PENDING") return;

    // Atomique : update transaction APPROVED + création du vote dans le même tx
    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: metadata.transactionId },
        data: { status: "APPROVED" },
      });

      await tx.vote.create({
        data: {
          eventId: metadata.eventId,
          candidateId: metadata.candidateId,
          transactionId: transaction.id,
          quantity: metadata.quantity,
          amount: transaction.amount,
          ipAddress: metadata.ipAddress ?? "",
          phoneNumber: transaction.phoneNumber ?? "",
          userAgent: metadata.userAgent ?? "",
          fingerprint: metadata.fingerprint ?? "",
        },
      });
    });

    // Émettre la mise à jour du classement après commit
    const ranking = await eventService.getRanking(metadata.eventId);
    emitVoteUpdate(metadata.eventId, { ranking });
  },

  // Historique des transactions d'un événement
  async getEventTransactions(eventId: string) {
    return prisma.transaction.findMany({
      where: { eventId },
      include: {
        vote: {
          include: {
            candidate: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};