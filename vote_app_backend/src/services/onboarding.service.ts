import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "http";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { PlanType } from "../generated/prisma/index.js";
import { generateSlug } from "../utils/slug.js";
import { Transaction } from "../lib/fedapay.js";
import { env } from "../lib/env.js";

async function uniqueOrgSlug(name: string): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let i = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${i}`;
    i++;
  }
  return slug;
}

export const onboardingService = {
  async setup(userId: string, orgName: string, headers: IncomingHttpHeaders) {
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    if (existing) throw new Error("Onboarding déjà effectué pour ce compte");

    const slug = await uniqueOrgSlug(orgName);

    const organization = await auth.api.createOrganization({
      body: { name: orgName, slug },
      headers: fromNodeHeaders(headers),
    });

    const subscription = await prisma.subscription.create({
      data: {
        plan: PlanType.FREE,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date("2099-12-31"),
        userId,
      },
    });

    return { organization, subscription };
  },

  async upgrade(userId: string, userName: string, userEmail: string) {
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) throw new Error("Veuillez d'abord compléter l'onboarding");
    if (subscription.plan === PlanType.PREMIUM && subscription.status === "ACTIVE") {
      throw new Error("Vous êtes déjà abonné au plan Premium");
    }

    const amount = parseInt(env.FEDAPAY_PREMIUM_AMOUNT, 10);
    const [firstname, ...rest] = userName.split(" ");
    const lastname = rest.join(" ") || firstname;

    // @ts-ignore — FedaPay SDK types non fournis
    const transaction = await Transaction.create({
      description: "Abonnement Premium VoteApp",
      amount,
      currency: { iso: "XOF" },
      callback_url: `${env.FRONTEND_URL}/dashboard?payment=success`,
      customer: { firstname, lastname, email: userEmail },
      metadata: { userId },
    });

    // @ts-ignore
    const token = await transaction.generateToken();

    return {
      paymentUrl: token.token
        ? `https://checkout.fedapay.com/${token.token}`
        : token.url,
      transactionId: String(transaction.id),
    };
  },
};
