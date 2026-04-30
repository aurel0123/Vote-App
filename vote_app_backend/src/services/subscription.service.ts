import { PlanType } from "../generated/prisma/index.js";
import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import { resend } from "../lib/resend.js";
import { invoiceEmailTemplate } from "../lib/templates/emails/subscription-invoice.js";

const FEDAPAY_BASE_URL =
  env.FEDAPAY_ENVIRONMENT === "production"
    ? "https://api.fedapay.com/v1"
    : "https://sandbox-api.fedapay.com/v1";

const FEDAPAY_SECRET = env.FEDAPAY_SECRET_KEY!;

const PLAN_PRICES: Record<"PACK" | "PREMIUM", number> = {
  PACK: 10000,
  PREMIUM: 35000,
};

const PLAN_DURATION: Record<"PACK" | "PREMIUM", number> = {
  PACK: 30,
  PREMIUM: 30,
};
export const subscriptionService = {
  async getCurrentPlan(userId : string): Promise<{
    Plan : PlanType , 
    isActive: boolean;
    endDate: Date | null;
  }>{
    const subscription = await prisma.subscription.findUnique({
      where : {
        userId : userId
      }
    })

    if(!subscription || subscription.status !== "ACTIVE"){
      return {
        Plan : PlanType.FREE, 
        isActive : false , 
        endDate : null 
      }
    }

    // Vérifier si l'abonnement n'est pas expiré
    if(new Date() > subscription.endDate){
      //expiration automatique 
      await prisma.subscription.update({
        where : {userId : userId}, 
        data : {status : "EXPIRED"}
      })

      return {
        Plan : PlanType.FREE, 
        isActive: false , 
        endDate : null 
      }
    }

    return {
      Plan : subscription.plan , 
      isActive : true ,
      endDate : subscription.endDate
    }
  },

  async initSubscriptionPayment(
    userId : string ,
    plan : "PACK" | "PREMIUM" , 
    phoneNumber : string , 
    customerName: string,
    customerEmail?: string
  ){
    if(!PLAN_PRICES[plan]){
      throw new Error("Plan invalide")
    }

    const amount = PLAN_PRICES[plan]
    const response = await fetch(`${FEDAPAY_BASE_URL}/transactions`, {
      method : "POST", 
      headers : {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FEDAPAY_SECRET}`,
      }, 
      body : JSON.stringify({
        description : `VoteApp — Abonnement ${plan}`, 
        amount, currency: { iso: "XOF" },
        callback_url: `${env.BETTER_AUTH_URL}/api/subscriptions/webhook`,
        custom : {
          firstname: customerName,
          phone_number: { number: phoneNumber, country: "BJ" },
          ...(customerEmail && { email: customerEmail }),
        }, 
        metadata : {
          type: "subscription",
          userId,
          plan,
        }
      })
    })

    if (!response.ok) {
      const err = await response.json() as { message?: string };
      throw new Error(`FedaPay error: ${err.message || "Erreur inconnue"}`);
    }

    const data = await response.json() as {
      v1: { transaction: { id: number; reference: string } };
    };
 
    const fedapayTx = data.v1.transaction;
 
    // Générer le lien de paiement
    const tokenResponse = await fetch(
      `${FEDAPAY_BASE_URL}/transactions/${fedapayTx.id}/token`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${FEDAPAY_SECRET}` },
      }
    );
    const tokenData = await tokenResponse.json() as { token?: string };

    return {
      fedapayId: fedapayTx.id,
      paymentUrl: `https://checkout${
        env.FEDAPAY_ENVIRONMENT === "production" ? "" : "-sandbox"
      }.fedapay.com/${tokenData.token}`,
      amount,
      plan,
    };
  }, 

  async activate(userId: string, plan: "PACK" | "PREMIUM", fedapayId: string){
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + PLAN_DURATION[plan]);

    const subscription = await prisma.subscription.upsert({
      where : {
        userId
      }, 
      create : {
        fedapayId: String(fedapayId),
        userId, 
        status : "ACTIVE", 
        plan : PlanType[plan],
        startDate: now,
        endDate,
      }, 
      update : {
        plan : PlanType[plan], 
        startDate: now,
        endDate,
        status : "ACTIVE"
      }
    })

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if(user?.email){
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + PLAN_DURATION[plan]);
      const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      const fmtLong = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

      await resend.emails.send({
        from: "VoteApp <no-reply@foodplus.space>",
        to: user.email,
        subject:  `VoteApp — Facture #VA-${Date.now().toString().slice(-5)} · Abonnement ${plan}`,
        html: invoiceEmailTemplate({
          name: user.name,
          plan,
          amount: PLAN_PRICES[plan],
          invoiceNumber: `VA-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
          paymentDate: fmtLong(now),
          startDate: fmt(now),
          endDate: fmt(end),
          operator: 'Mobile Money',
          phoneNumber: '',
          fedapayReference: String(fedapayId),
          dashboardUrl: process.env.BETTER_AUTH_URL?.replace(':8080', ':3000') + '/events' || `${env.FRONTEND_URL}/events`,
        }),
      }).catch(err => console.error('Invoice email error:', err))
    }

    await prisma.event.updateMany({
      where: {
        organizerId: userId,
        status: { in: ["DRAFT", "PUBLISHED", "LIVE"] },
      },
      data: { commissionRate: 0.15, plan: PlanType[plan] },
    });

    return subscription ;
  }, 

  async cancel(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
 
    if (!subscription || subscription.status !== "ACTIVE") {
      throw new Error("Aucun abonnement actif à annuler");
    }
 
    return prisma.subscription.update({
      where: { userId },
      data: { status: "CANCELLED" },
    });
  },

  async handleWebhook (
    payload: {
    name: string;
    entity: {
      id: number;
      status: string;
      metadata?: {
        type: string;
        userId: string;
        plan: "PACK" | "PREMIUM";
      };
    };
  }
  ){
    const {name : eventName , entity } = payload ; 

    if(eventName !== "transaction.approved") return ;

    const metadata = entity.metadata;
    if (metadata?.type !== "subscription" || !metadata?.userId) return;

    await subscriptionService.activate(
      metadata.userId,
      metadata.plan,
      String(entity.id)
    );
  }, 

  async getAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscription.count(),
    ]);
    return { subscriptions, total, page, totalPages: Math.ceil(total / limit) };
  },
}