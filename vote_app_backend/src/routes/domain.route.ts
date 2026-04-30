import { Router } from "express";
import { domainController } from "../controllers/domainController.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { arcjetCreate, arcjetPublic } from "../lib/arcjet.middleware.js";

const domainRoutes: Router = Router();

// Résolution domaine — utilisé par le frontend, anti-scraping
domainRoutes.get("/resolve", arcjetPublic, domainController.resolve);

// Vérification disponibilité — publique mais rate-limitée
domainRoutes.get("/check", arcjetPublic, domainController.checkAvailability);

// Attacher/détacher — protégé + rate limit création
domainRoutes.post("/attach", requireAuth, arcjetCreate, domainController.attach);
domainRoutes.delete("/:eventId", requireAuth, domainController.detach);

export default domainRoutes;