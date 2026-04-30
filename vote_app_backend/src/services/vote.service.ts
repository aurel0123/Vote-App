import { prisma } from "../lib/prisma.js"
import { emitVoteUpdate } from "../lib/socket.js";
import { eventService } from "./event.service.js";

// Limite anti-fraude pour les événements gratuits
const FREE_VOTE_LIMIT_PER_IP = 2;

export const voteService = {
  async validateEventForVoting(eventId : string) {
    const event = await prisma.event.findUnique({
      where : {
        id : eventId, 
      }, 
      select : {
        id : true , 
        status : true , 
        voteType : true , 
        endDate : true , 
        commissionRate : true 
      }
    }); 

    if(!event) {
      throw new Error("Evènement introuvable")
    }

    if(event.status !== "LIVE" && event.status !== "PUBLISHED") {
      throw new Error("Les votes ne sont pas ouverts pour cet événement")
    }

    if(new Date() > event.endDate ) {
      throw new Error("Cet événement est terminé")
    }

    return event 
  }, 

  // ══════════════════════════════════════════════════════
  // Vote GRATUIT (exception — sondages, concours asso)
  // Seulement sur les événements voteType: FREE
  // Limité à FREE_VOTE_LIMIT_PER_IP votes par IP par candidat
  // ══════════════════════════════════════════════════════
  async castFreeVote(input : {
    eventId : string, 
    candidateId : string , 
    ipAddress : string, 
    userAgent? : string , 
    fingerprint?: string, 
  }){
    const event = await voteService.validateEventForVoting(input.eventId)

    if(event.voteType !== "FREE"){
      throw new Error( "Cet événement est un vote payant. Utilisez le paiement Mobile Money pour voter.")
    }

    const existingVote = await prisma.vote.count({
      where : {
        eventId : input.eventId, 
        candidateId : input.candidateId, 
        ipAddress : input.ipAddress,
        userAgent : input.userAgent ?? "" , 
        fingerprint : input.fingerprint ?? ""
      }
    })

    if(existingVote  >= FREE_VOTE_LIMIT_PER_IP ) {
      throw new Error(
        `Vous avez atteint la limite de ${FREE_VOTE_LIMIT_PER_IP} votes gratuits pour ce candidat`
      );
    }

    const vote = await prisma.vote.create({
      data: {
        quantity: 1,
        amount: 0,
        candidateId: input.candidateId,
        eventId: input.eventId,
        ipAddress: input.ipAddress,
      },
    })

    const ranking = await eventService.getRanking(input.eventId)
    emitVoteUpdate(input.eventId , {ranking}) ; 

    return vote 
  },

  // ══════════════════════════════════════════════════════
  // Créer les votes APRÈS validation du paiement FedaPay
  // Appelé uniquement depuis payment.service.ts (webhook)
  // ══════════════════════════════════════════════════════
  async creditVotesAfterPayment(input : {
    eventId : string , 
    candidateId : string, 
    ipAddress?: string, 
    phoneNumber? : string,
    userAgent?: string , 
    quantity: number,
    amount: number,
    fingerPrint? : string, 
    transactionId: string;
  }){
    const event = await voteService.validateEventForVoting(input.eventId);

    if(event.voteType !=="PAID"){
      throw new Error("Incohérence : paiement reçu pour un événement gratuit")
    }

    const vote = await prisma.vote.create({
      data : {
        eventId : input.eventId, 
        candidateId : input.candidateId,
        ipAddress : input.ipAddress ?? "", 
        transactionId : input.transactionId , 
        quantity : input.quantity, 
        amount : input.amount, 
        phoneNumber : input.phoneNumber ?? "", 
        fingerprint : input.fingerPrint ?? "", 
        userAgent : input.userAgent ?? ""
      }
    })

    const ranking = await eventService.getRanking(input.eventId); 
    emitVoteUpdate(input.eventId , {ranking})

    return vote ;
  } ,

  async getStats(eventId: string) {
    const [totalVotesAgg, totalVoters, candidates] = await Promise.all([
      prisma.vote.aggregate({
        where: { eventId },
        _sum: { quantity: true, amount: true },
        _count: { id: true },
      }),
      prisma.vote.groupBy({
        by: ["ipAddress"],
        where: { eventId, ipAddress: { not: null } },
        _count: true,
      }),
      prisma.candidate.findMany({
        where: { eventId },
        include: {
          votes: { select: { quantity: true, amount: true } },
        },
        orderBy: { order: "asc" },
      }),
    ]);
 
    return {
      totalVotes: totalVotesAgg._sum.quantity ?? 0,
      totalRevenue: totalVotesAgg._sum.amount ?? 0,
      totalTransactions: totalVotesAgg._count.id,
      uniqueVoters: totalVoters.length,
      breakdown: candidates.map((c) => ({
        id: c.id, 
        name: c.name,
        photo: c.photo,
        votes: c.votes.reduce((sum, v) => sum + v.quantity, 0),
        revenue: c.votes.reduce((sum, v) => sum + v.amount, 0),
      })),
    };
  },
}