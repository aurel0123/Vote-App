import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { uploadController } from "../controllers/uploadController.js";
import { arcjetCreate } from "../lib/arcjet.middleware.js";

const uploadRoutes:Router = Router();

// Tous les uploads nécessitent auth + rate limit création
uploadRoutes.use(requireAuth, arcjetCreate);

uploadRoutes.post("/event/:eventId/banner", uploadController.eventBanner);
uploadRoutes.post(
  "/event/:eventId/candidate/:candidateId/photo",
  uploadController.candidatePhoto
);

export default uploadRoutes;