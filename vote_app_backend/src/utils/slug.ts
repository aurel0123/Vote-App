import { prisma } from "../lib/prisma.js";

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 60);
}

// Garantit l'unicité du slug en DB
export async function uniqueSlug(title: string): Promise<string> {
  const base = generateSlug(title);
  let slug = base;
  let i = 1;

  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${base}-${i}`;
    i++;
  }

  return slug;
}