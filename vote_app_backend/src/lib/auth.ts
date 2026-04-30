import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { admin, organization } from "better-auth/plugins";
import { resend } from "./resend.js";
import { env } from "./env.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "VoteApp <no-reply@foodplus.space>",
        to: user.email,
        subject: "Réinitialisation de votre mot de passe VoteApp",
        html: `
          <h2>Réinitialisation du mot de passe</h2>
          <p>Bonjour ${user.name},</p>
          <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
          <a href="${url}" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
            Réinitialiser mon mot de passe
          </a>
          <p>Ce lien expire dans 1 heure.</p>
        `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "VoteApp <no-reply@foodplus.space>",
        to: user.email,
        subject: "Vérifiez votre adresse email - VoteApp",
        html: `
          <h2>Vérification de votre email</h2>
          <p>Bonjour ${user.name},</p>
          <p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email :</p>
          <a href="${url}" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
            Vérifier mon email
          </a>
          <p>Ce lien expire dans 1 heure.</p>
        `,
      });
    },
  },
  plugins: [
    admin(),
    organization({
      allowUserToCreateOrganization: true,
    })
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24,      // Refresh si > 1 jour
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,             // Cache 5 minutes
    },
  },
  trustedOrigins: [
    env.FRONTEND_URL || "http://localhost:3000",
  ],

  secret: env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8080",
  advanced: {
    disableCSRFCheck: env.NODE_ENV === "development",
  },
});

export type Session = typeof auth.$Infer.Session;