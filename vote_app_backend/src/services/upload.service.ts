import { getUploadUrl, deleteFile, buildCandidateImageKey, buildEventBannerKey } from "../lib/r2.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[mime] ?? "jpg";
}

export const uploadService = {
  // Générer URL d'upload signé pour bannière d'événement
  async getEventBannerUploadUrl(eventId: string, contentType: string) {
    if (!ALLOWED_TYPES.includes(contentType)) {
      throw new Error("Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.");
    }
    const ext = getExtFromMime(contentType);
    const key = buildEventBannerKey(eventId, ext);
    return getUploadUrl(key, contentType);
  },

  // Générer URL d'upload signé pour photo candidat
  async getCandidatePhotoUploadUrl(
    eventId: string,
    candidateId: string,
    contentType: string
  ) {
    if (!ALLOWED_TYPES.includes(contentType)) {
      throw new Error("Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.");
    }
    const ext = getExtFromMime(contentType);
    const key = buildCandidateImageKey(eventId, candidateId, ext);
    return getUploadUrl(key, contentType);
  },

  // Supprimer un fichier par son URL publique
  async deleteByUrl(publicUrl: string) {
    const r2PublicBase = process.env.R2_PUBLIC_URL!;
    const key = publicUrl.replace(`${r2PublicBase}/`, "");
    await deleteFile(key);
  },

  validateSize(sizeBytes: number) {
    if (sizeBytes > MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`Fichier trop volumineux. Maximum ${MAX_SIZE_MB}MB.`);
    }
  },
};