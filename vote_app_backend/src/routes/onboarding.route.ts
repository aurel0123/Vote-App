import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { onboardingController } from "../controllers/onboarding.controller.js";

const onboardingRoutes: Router = Router();

onboardingRoutes.use(requireAuth);
onboardingRoutes.post("/setup", onboardingController.setup);
onboardingRoutes.post("/upgrade", onboardingController.upgrade);

export default onboardingRoutes;
