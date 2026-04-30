import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./lib/env.js";
import eventRoutes from "./routes/event.route.js";
import onboardingRoutes from "./routes/onboarding.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { arcjetAuth, arcjetGlobal } from "./lib/arcjet.middleware.js";
import candidateRoutes from "./routes/candidate.route.js";
import voteRoutes from "./routes/vote.route.js";
import PaymentRoutes from "./routes/payment.route.js";
import uploadRoutes from "./routes/upload.route.js";
import adminRoutes from "./routes/admin.route.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import domainRoutes from "./routes/domain.route.js";


const app: express.Application = express() ; 

app.use(helmet()) ; 
app.use(
  cors({
    origin: env.FRONTEND_URL || "http://localhost:3000" , // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true,
  })
)

app.use(arcjetGlobal);

app.all('/api/auth/sign-in/*splat' , arcjetAuth , toNodeHandler(auth))
app.all(
  "/api/auth/sign-up/*splat",
  arcjetAuth,
  toNodeHandler(auth)
);
app.all(
  "/api/auth/forget-password/*splat",
  arcjetAuth,
  toNodeHandler(auth)
);
app.all(
  "/api/auth/reset-password/*splat",
  arcjetAuth,
  toNodeHandler(auth)
);
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/events", eventRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/events/:eventId", candidateRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/payments", PaymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/domains", domainRoutes);

app.get("/api/health" , (_req , res) => {
  res.json({
    status : 'ok', 
    app: "VoteApp Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
})

//404 handler 
app.use((_req, res) => {
  res.status(404).json({error : "Page non trouvée"})
})

//Handler erreur 
app.use((
  err : Error, 
  _req : express.Request, 
  res : express.Response,
  next : express.NextFunction
) => {
  console.error("Erreur" , err.message)
  res.status(500).json({
    error : 
      env.NODE_ENV === "production" 
        ? "Erreur interne du serveur"
          : err.message,
  })
})

export default app;