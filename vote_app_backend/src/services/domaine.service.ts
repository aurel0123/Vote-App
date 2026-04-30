import { prisma } from "../lib/prisma.js";

// Regex de validation domaine
const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;

export const domainService = {
  // Valider le format d'un domaine
  validate(domain: string): { valid: boolean; error?: string } {
    const cleaned = domain.toLowerCase().trim().replace(/^https?:\/\//, "");

    if (!DOMAIN_REGEX.test(cleaned)) {
      return {
        valid: false,
        error:
          "Format de domaine invalide. Exemple valide : miss-universite.com",
      };
    }

    // Bloquer les sous-domaines de voteapp.com (réservés à la plateforme)
    if (cleaned.endsWith("voteapp.com")) {
      return {
        valid: false,
        error: "Les sous-domaines voteapp.com sont réservés à la plateforme",
      };
    }

    return { valid: true };
  },

  // Associer un domaine custom à un événement
  async attach(eventId: string, organizerId: string, domain: string) {
    const cleaned = domain.toLowerCase().trim().replace(/^https?:\/\//, "");

    // Valider le format
    const { valid, error } = domainService.validate(cleaned);
    if (!valid) throw new Error(error);

    // Vérifier que l'organisateur est bien Premium
    const subscription = await prisma.subscription.findUnique({
      where: { userId: organizerId },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      throw new Error(
        "Le domaine personnalisé est réservé aux abonnements Premium"
      );
    }

    // Vérifier que le domaine n'est pas déjà utilisé par un autre événement
    const existing = await prisma.event.findUnique({
      where: { customDomain: cleaned },
    });

    if (existing && existing.id !== eventId) {
      throw new Error("Ce domaine est déjà utilisé par un autre événement");
    }

    // Enregistrer le domaine
    const event = await prisma.event.update({
      where: { id: eventId },
      data: { customDomain: cleaned },
    });

    return {
      event,
      domain: cleaned,
      // Instructions DNS à afficher à l'organisateur
      dnsInstructions: {
        type: "CNAME",
        name: cleaned,
        value: "proxy.voteapp.com",
        message: `Ajoutez un enregistrement CNAME chez votre registrar :
  Nom : ${cleaned}
  Valeur : proxy.voteapp.com
  TTL : 3600
  
  Le SSL sera automatiquement activé par Cloudflare dans les 24-48h.`,
      },
    };
  },

  // Détacher un domaine custom d'un événement
  async detach(eventId: string) {
    return prisma.event.update({
      where: { id: eventId },
      data: { customDomain: null },
    });
  },

  // Trouver un événement par son domaine custom (utilisé par le middleware de routing)
  async findEventByDomain(domain: string) {
    return prisma.event.findUnique({
      where: { customDomain: domain.toLowerCase().trim() },
      include: {
        candidates: {
          include: { _count: { select: { votes: true } } },
          orderBy: { order: "asc" },
        },
      },
    });
  },

  // Vérifier si un domaine est disponible
  async checkAvailability(domain: string) {
    const cleaned = domain.toLowerCase().trim().replace(/^https?:\/\//, "");
    const { valid, error } = domainService.validate(cleaned);

    if (!valid) return { available: false, error };

    const existing = await prisma.event.findUnique({
      where: { customDomain: cleaned },
    });

    return {
      available: !existing,
      domain: cleaned,
      error: existing ? "Ce domaine est déjà utilisé" : undefined,
    };
  },
};