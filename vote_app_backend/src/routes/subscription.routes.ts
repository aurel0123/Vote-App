import { Router } from "express";
import { subscriptionController } from "../controllers/subscriptionController.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middlewares.js";
import { arcjetPayment, arcjetPublic } from "../lib/arcjet.middleware.js";

const subscriptionRoutes:Router = Router();

// Webhook FedaPay — public, pas de rate limit
subscriptionRoutes.post("/webhook", subscriptionController.webhook);

// Plan actuel — protégé + anti-scraping léger
subscriptionRoutes.get("/me", arcjetPublic, requireAuth, subscriptionController.getMyPlan);

// Init paiement abonnement — protégé + rate limit paiement
subscriptionRoutes.post(
  "/init",
  requireAuth,
  arcjetPayment,
  subscriptionController.initPayment
);

// Annulation — protégé
subscriptionRoutes.delete("/cancel", requireAuth, subscriptionController.cancel);

// Liste admin
subscriptionRoutes.get("/", requireAdmin, subscriptionController.getAll);

export default subscriptionRoutes;