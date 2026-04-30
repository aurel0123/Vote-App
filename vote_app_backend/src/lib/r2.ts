import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.js";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = env.R2_BUCKET_NAME!;
const PUBLIC_URL = env.R2_PUBLIC_URL!;

// Générer une URL signée pour upload direct depuis le frontend
export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 300, // 5 minutes
  });

  return { uploadUrl: signedUrl, publicUrl: `${PUBLIC_URL}/${key}` };
}

// Supprimer un fichier
export async function deleteFile(key: string) {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

// Construire la clé R2 pour un fichier candidat
export function buildCandidateImageKey(eventId: string, candidateId: string, ext: string) {
  return `events/${eventId}/candidates/${candidateId}.${ext}`;
}

// Construire la clé R2 pour une bannière d'événement
export function buildEventBannerKey(eventId: string, ext: string) {
  return `events/${eventId}/banner.${ext}`;
}