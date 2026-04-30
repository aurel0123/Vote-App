import type { NextFunction, Request , Response } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export async function requireAuth(
  req : Request, 
  res : Response, 
  next : NextFunction
) {
  const session = await auth.api.getSession({
    headers : fromNodeHeaders(req.headers)
  })

  if(!session){
    return res.status(401).json({ error: "Non authentifié" });
  }

  req.user = session.user; 
  req.session = session.session; 
  next()
}

export async function requireAdmin(
  req : Request, 
  res : Response, 
  next : NextFunction
){
  const session = await auth.api.getSession({
    headers : fromNodeHeaders(req.headers)
  })

  if(!session) {
    return res.status(401).json({error : "Non authentifié"})
  }

  if(session.user.role !== "admin") {
    return res.status(403).json({
      error : "Accès non autorisé"
    })
  }

  req.user = session.user ; 
  req.session = session.session ; 
  next(); 
}