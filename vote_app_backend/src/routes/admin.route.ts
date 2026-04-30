import { Router } from "express";
import { requireAdmin } from "../middlewares/auth.middlewares.js";
import { adminController } from "../controllers/adminController.js";

const adminRoutes:Router = Router();

// Toutes les routes admin nécessitent le rôle admin
adminRoutes.use(requireAdmin);

adminRoutes.get("/stats", adminController.getStats);
adminRoutes.get("/organizers", adminController.getOrganizers);
adminRoutes.get("/events", adminController.getEvents);
adminRoutes.patch("/events/:id/suspend", adminController.suspendEvent);
adminRoutes.patch("/events/:id/restore", adminController.restoreEvent);
adminRoutes.patch("/users/:id/block", adminController.blockUser);
adminRoutes.get("/transactions", adminController.getTransactions);
adminRoutes.post("/payouts", adminController.createPayout);
adminRoutes.patch("/payouts/:id/status", adminController.updatePayoutStatus);

export default adminRoutes;