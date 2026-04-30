import { Router } from "express";
import { arcjetPublic, arcjetVote } from "../lib/arcjet.middleware.js";
import { voteController } from "../controllers/voteController.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";

const voteRoutes: Router = Router() ; 
//Route public pour le vote 

// Vote gratuit — public mais très rate-limité (anti-fraude)
voteRoutes.post("/free", arcjetVote, voteController.freeVote);
// Stats — protégé organisateur + anti-scraping
voteRoutes.get("/:eventId/stats", arcjetPublic, requireAuth, voteController.getStats);

export default voteRoutes ; 