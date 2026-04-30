import type { Response } from "express";

export const ok = (res: Response, data: unknown, status = 200 , message?: string) =>
  res.status(status).json({ success: true, message : message , data });

export const fail = (res: Response, message: string, status = 400) =>
  res.status(status).json({ success: false, error: message });

export const notFound = (res: Response, entity = "Ressource") =>
  res.status(404).json({ success: false, error: `${entity} introuvable` });

export const forbidden = (res: Response) =>
  res.status(403).json({ success: false, error: "Accès refusé" });