import { Router } from "express";
import { arcjetPayment, arcjetPublic } from "../lib/arcjet.middleware.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { paymentController } from "../controllers/paymentController.js";

const PaymentRoutes:Router = Router();

// Webhook FedaPay — public, pas de rate limit
// (FedaPay peut envoyer plusieurs webhooks pour la même transaction)
PaymentRoutes.post("/webhook", paymentController.webhook);

// Init paiement — public mais très rate-limité
PaymentRoutes.post("/init", arcjetPayment, paymentController.initPayment);

// Historique transactions — protégé organisateur
PaymentRoutes.get(
  "/event/:eventId",
  arcjetPublic,
  requireAuth,
  paymentController.getEventTransactions
);

export default PaymentRoutes;