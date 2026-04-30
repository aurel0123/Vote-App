import { prisma } from "../lib/prisma.js";

interface CreateCandidateInput {
  name: string;
  bio?: string;
  photo?: string;
  eventId: string;
  activeQrCode?: boolean;
  qrCodeUrl?: string;
}

interface UpdateCandidateInput {
  name?: string;
  bio?: string;
  photo?: string;
  order?: number;
  activeQrCode?: boolean;
  qrCodeUrl?: string;
}

export const CandidateService = {
  async create(input: CreateCandidateInput) {
    const count = await prisma.candidate.count({
      where: {
        eventId: input.eventId
      }
    })

    const event = await prisma.event.findUnique({
      where: {
        id: input.eventId
      },
      select: { plan: true }
    })

    if (event?.plan == "FREE" && count >= 10) {
      throw new Error(
        "Plan gratuit : 10 candidats maximum. Passez en Premium pour en ajouter davantage."
      )
    }

    return await prisma.candidate.create({
      data: {
        name: input.name,
        bio: input.bio ?? "",
        photo: input.photo ?? "",
        eventId: input.eventId,
        order: count,
        activeQrCode: input.activeQrCode ?? false,
        qrCodeUrl: input.qrCodeUrl ?? "",
      }
    })
  },

  async createMany(input: CreateCandidateInput[], eventId: string) {
    if (!Array.isArray(input) || input.length === 0) {
      throw new Error("La liste des candidats ne peut pas être vide.")
    }

    // verifie que tout les candidatsn appartient aux meme evenement 
    const invalid = input.some(c => c.eventId !== eventId)
    if (invalid) {
      throw new Error("Tous les candidats doivent appartenir au même événement.")
    }

    const [event, count] = await Promise.all([
      prisma.event.findUnique({
        where: {
          id: eventId
        },
        select: { plan: true }
      }),
      prisma.candidate.count({
        where: {
          eventId
        }
      })
    ])

    if (event?.plan == "FREE" && count >= 10) {
      throw new Error(`Plan gratuit : maximum 10 candidats autorisés. Vous avez déjà ${count} candidat(s).`)
    }

    const data = input.map((c, index) => {
      if (!c.name) {
        throw new Error("Le candidat doit avoir un nom")
      }

      return {
        name: c.name,
        bio: c.bio ?? "",
        photo: c.photo ?? "",
        eventId: c.eventId,
        order: count + index,
        activeQrCode: c.activeQrCode ?? false,
        qrCodeUrl: c.qrCodeUrl ?? ""
      }
    })

    const result = await prisma.candidate.createMany({
      data,
      skipDuplicates : true 
    })

    return result ; 
  },

  async update(id: string, data: UpdateCandidateInput) {
    return prisma.candidate.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.candidate.delete({ where: { id } });
  },

  // Réordonner les candidats (drag & drop)
  async reorder(eventId: string, orderIds: string[]) {
    const updates = orderIds.map((id, index) =>
      prisma.candidate.updateMany({
        where: {
          id,
          eventId
        },
        data: {
          order: index
        }
      })
    );
    return await prisma.$transaction(updates);
  },

  async findById(id: string) {
    return await prisma.candidate.findUnique({ where: { id } })
  },

  async findByEvent(eventId: string) {
    return await prisma.candidate.findMany({
      where: {
        eventId
      },
      include: {
        _count: {
          select: { votes: true }
        }
      },
      orderBy: {
        order: "asc"
      }
    })
  }
}