import { PlanType } from "../generated/prisma/index.js";

export function getCommissionRate(plan: PlanType): number {
  switch (plan) {
    case PlanType.FREE:
      return 0.20; // 20%
    case PlanType.PACK:
    case PlanType.PREMIUM:
      return 0.15; // 15%
    default:
      return 0.20;
  }
}

export function splitAmount(
  totalAmount: number,
  commissionRate: number
): { commissionAmount: number; organizerAmount: number } {
  const commissionAmount = Math.round(totalAmount * commissionRate);
  const organizerAmount = totalAmount - commissionAmount;
  return { commissionAmount, organizerAmount };
}