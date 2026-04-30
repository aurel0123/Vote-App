import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { eventController } from "../controllers/eventController.js";
import { arcjetCreate, arcjetPublic } from "../lib/arcjet.middleware.js";

const eventRoutes:Router = Router();

// Routes publiques
eventRoutes.get("/public/:slug",  arcjetPublic ,eventController.getBySlug);
eventRoutes.get("/:id/ranking", arcjetPublic, eventController.getRanking);

// Routes protégées (organisateur connecté)
eventRoutes.use(requireAuth);
eventRoutes.post("/create", arcjetCreate ,eventController.create);
eventRoutes.post("/delete",arcjetCreate,eventController.delete);
eventRoutes.get("/myEvents", eventController.myEvents);
eventRoutes.get("/:id/dashboard", eventController.getDashboard);
eventRoutes.put("/:id",arcjetCreate, eventController.update);
eventRoutes.post("/:id/publish",arcjetCreate, eventController.publish);
eventRoutes.post("/:id/end",arcjetCreate,  eventController.end); 

export default eventRoutes;