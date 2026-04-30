import { EventStatus } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";

export const adminService = {
  // Dashboard stats globales
  async getStats() {
    const [
      totalUsers,
      totalEvents,
      activeEvents,
      totalTransactions,
      revenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.event.count({
        where: { status: { in: [EventStatus.LIVE, EventStatus.PUBLISHED] } },
      }),
      prisma.transaction.count({ where: { status: "APPROVED" } }),
      prisma.transaction.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true, commissionAmount: true },
      }),
    ]);

    return {
      totalUsers,
      totalEvents,
      activeEvents,
      totalTransactions,
      totalRevenue: revenue._sum.amount ?? 0,
      totalCommission: revenue._sum.commissionAmount ?? 0,
    };
  },

  // Liste des organisateurs
  async getOrganizers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: "organizer" },
        skip,
        take: limit,
        include: {
          subscription: true,
          _count: { select: { events: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { role: "organizer" } }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  },

  // Liste des événements (avec filtres)
  async getEvents(
    page = 1,
    limit = 20,
    status?: EventStatus
  ) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          organizer: { select: { id: true, name: true, email: true } },
          _count: { select: { votes: true, transactions: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total, page, totalPages: Math.ceil(total / limit) };
  },

  // Suspendre un événement
  async suspendEvent(eventId: string, reason?: string) {
    return prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.SUSPENDED,
        ...(reason ? { pageConfig: { suspendReason: reason } } : {}),
      },
    });
  },

  // Réactiver un événement
  async restoreEvent(eventId: string) {
    return prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.PUBLISHED },
    });
  },

  // Bloquer un organisateur
  async blockUser(userId: string) {
    // Better Auth gère le ban via l'API - ici on met un flag custom
    return prisma.user.update({
      where: { id: userId },
      data: { role: "banned" },
    });
  },

  // Historique transactions global avec pagination
  async getTransactions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        include: {
          event: { select: { id: true, title: true } },
          vote: {
            include: {
              candidate: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count(),
    ]);

    return { transactions, total, page, totalPages: Math.ceil(total / limit) };
  },

  // Créer un versement organisateur (payout)
  async createPayout(data: {
    organizerId: string;
    amount: number;
    eventId?: string;
    phoneNumber: string;
    notes?: string;
  }) {
    return prisma.payout.create({ data });
  },

  // Mettre à jour statut payout
  async updatePayoutStatus(
    payoutId: string,
    status: "PROCESSING" | "COMPLETED" | "FAILED"
  ) {
    return prisma.payout.update({
      where: { id: payoutId },
      data: { status },
    });
  },
};