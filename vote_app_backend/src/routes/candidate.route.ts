import { Router } from "express";
import { arcjetCreate, arcjetPublic } from "../lib/arcjet.middleware.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { candidateController } from "../controllers/candidateController.js";

const candidateRoutes:Router = Router({mergeParams : true})

//route public
candidateRoutes.get('/candidates' , arcjetPublic , candidateController.list)

candidateRoutes.use(requireAuth)
candidateRoutes.post("/candidates", arcjetCreate, candidateController.create);
candidateRoutes.post("/candidates/bulk", arcjetCreate, candidateController.createManyCandidates);
candidateRoutes.put("/candidates/reorder", arcjetCreate, candidateController.reorder);
candidateRoutes.put("/candidates/:id", arcjetCreate, candidateController.update);
candidateRoutes.delete("/candidates/:id", candidateController.remove); 

export default candidateRoutes; 