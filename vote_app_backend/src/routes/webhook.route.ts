import { Router } from "express";
import { webhookController } from "../controllers/webhook.controller.js";
import { arcjetPublic } from "../lib/arcjet.middleware.js";

const webhookRoutes: Router = Router();

webhookRoutes.post("/fedapay",arcjetPublic,webhookController.fedapay);

export default webhookRoutes;
