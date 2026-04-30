import { EventStatus, PlanType, type VoteType } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { getCommissionRate } from "../utils/commission.js";
import { uniqueSlug } from "../utils/slug.js";

interface CreateEventInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  voteType?: VoteType;
  pricePerVote?: number;
  organizerId: string;
  coverImage?: string
}

interface UpdateEventInput {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  voteType?: VoteType;
  pricePerVote?: number;
  coverImage?: string;
  pageConfig?: object;
  customDomain?: string;
}

export const eventService = {
  // Créer un événement
  async create(input: CreateEventInput) {
    const slug = await uniqueSlug(input.title);

    // Vérifier le plan de l'organisateur
    const subscription = await prisma.subscription.findUnique({
      where: { userId: input.organizerId },
    });
    const plan = subscription?.status === "ACTIVE" && subscription?.plan === PlanType.PREMIUM
      ? PlanType.PREMIUM
      : PlanType.FREE;
    const commissionRate = getCommissionRate(plan);

    // Plan gratuit : 1 seul événement actif autorisé
    if (plan === PlanType.FREE) {
      const activeCount = await prisma.event.count({
        where: {
          organizerId: input.organizerId,
          status: { in: [EventStatus.PUBLISHED, EventStatus.LIVE] },
        },
      });
      if (activeCount >= 1) {
        throw new Error(
          "Plan gratuit : 1 événement actif maximum. Passez en Premium pour en créer davantage."
        );
      }
    }

    return prisma.event.create({
      data: {
        title: input.title,
        description: input.description ?? '',
        slug,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        voteType: input.voteType ?? 'FREE',
        pricePerVote: input.pricePerVote ?? 0,
        organizerId: input.organizerId,
        plan,
        commissionRate,
        coverImage: input.coverImage ?? ""
      },
    });
  },

  // Récupérer les événements d'un organisateur
  async findByOrganizer(organizerId: string) {
    return prisma.event.findMany({
      where: { organizerId },
      include: {
        candidates: { select: { id: true, name: true, photo: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Récupérer un événement par slug (page publique)
  async findBySlug(slug: string) {
    return prisma.event.findUnique({
      where: { slug },
      include: {
        candidates: {
          include: {
            _count: { select: { votes: true } },
          },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  // Récupérer un événement par ID (dashboard organisateur)
  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        candidates: {
          include: { _count: { select: { votes: true } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { votes: true, transactions: true } },
      },
    });
  },

  // Mettre à jour
  async update(id: string, data: UpdateEventInput) {
    const { startDate, endDate, ...rest } = data;
    return prisma.event.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
    });
  },

  //Supprimer un evenement
  async delete(id: string) {
    return await prisma.event.delete({
      where: {
        id
      }
    })
  },

  // Publier un événement
  async publish(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { candidates: true },
    });
    if (!event) throw new Error("Événement introuvable");
    if (event.candidates.length < 2)
      throw new Error("Un événement doit avoir au moins 2 candidats avant publication.");

    return prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED },
    });
  },

  // Terminer un événement
  async end(id: string) {
    return prisma.event.update({
      where: { id },
      data: { status: EventStatus.ENDED },
    });
  },

  // Classement en temps réel
  async getRanking(eventId: string) {
    const candidates = await prisma.candidate.findMany({
      where: { eventId },
      include: {
        votes: {
          where: {
            transaction: { status: "APPROVED" },
          },
          select: { quantity: true },
        },
      },
      orderBy: { order: "asc" },
    });

    const ranking = candidates
      .map((c) => ({
        id: c.id,
        name: c.name,
        photo: c.photo,
        totalVotes: c.votes.reduce((sum, v) => sum + v.quantity, 0),
      }))
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .map((c, i) => ({ ...c, rank: i + 1 }));

    return ranking;
  },

  // Revenus d'un événement
  async getRevenue(eventId: string) {
    const result = await prisma.transaction.aggregate({
      where: { eventId, status: "APPROVED" },
      _sum: { amount: true, commissionAmount: true, organizerAmount: true },
      _count: { id: true },
    });

    return {
      totalRevenue: result._sum.amount ?? 0,
      commissionAmount: result._sum.commissionAmount ?? 0,
      organizerAmount: result._sum.organizerAmount ?? 0,
      transactionCount: result._count.id,
    };
  },
};