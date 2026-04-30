export interface InvoiceEmailData {
  name: string;
  plan: "PACK" | "PREMIUM";
  amount: number; // En FCFA
  invoiceNumber: string; // Ex: VA-2026-04891
  paymentDate: string; // Ex: 28 avril 2026
  startDate: string; // Ex: 28 avr. 2026
  endDate: string; // Ex: 28 mai 2026
  operator: string; // Ex: MTN Mobile Money
  phoneNumber: string; // Ex: +229 97 00 00 00
  fedapayReference: string; // Ex: FP-2026-98432
  dashboardUrl: string;
}

const PLAN_LABELS: Record<string, string> = {
  PACK: "PACK ÉVÉNEMENT",
  PREMIUM: "PREMIUM",
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  PACK: "Toutes les fonctionnalités Premium pour un événement",
  PREMIUM: "Accès illimité à toutes les fonctionnalités",
};

const PLAN_DURATION: Record<string, string> = {
  PACK: "1 événement",
  PREMIUM: "1 mois",
};

const COMMISSION_RATE: Record<string, string> = {
  PACK: "15%",
  PREMIUM: "15%",
};

function formatCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function invoiceEmailTemplate(data: InvoiceEmailData): string {
  const {
    name,
    plan,
    amount,
    invoiceNumber,
    paymentDate,
    startDate,
    endDate,
    operator,
    phoneNumber,
    fedapayReference,
    dashboardUrl,
  } = data;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Facture VoteApp #${invoiceNumber}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:#0f0a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0a1a;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- ══ HEADER ══ -->
        <tr>
          <td style="background:linear-gradient(135deg,#4c1d95 0%,#7c3aed 50%,#5b21b6 100%);border-radius:20px 20px 0 0;padding:40px 48px 44px;">

            <!-- Logo -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;padding:0 10px;">
                  <span style="font-size:22px;line-height:44px;">🗳️</span>
                </td>
                <td style="padding-left:12px;">
                  <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">VoteApp</div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase;">Votes en ligne · Afrique de l'Ouest</div>
                </td>
              </tr>
            </table>

            <!-- Confirmation -->
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.25);border-radius:50%;width:52px;height:52px;text-align:center;vertical-align:middle;padding:0;">
                  <span style="font-size:22px;line-height:52px;">✓</span>
                </td>
                <td style="padding-left:16px;">
                  <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">Paiement confirmé</div>
                  <div style="font-size:13px;color:rgba(255,255,255,0.65);margin-top:4px;">Votre abonnement est actif — merci pour votre confiance</div>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ══ BODY ══ -->
        <tr>
          <td style="background:#ffffff;padding:0 48px 48px;border-radius:0 0 20px 20px;border:1.5px solid #e9e3f5;border-top:none;">

            <!-- Greeting -->
            <div style="background:#faf8ff;border-left:3px solid #7c3aed;padding:16px 20px;margin:32px 0 28px;border-radius:0 8px 8px 0;">
              <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0;">
                Bonjour <strong style="color:#1f1035;">${name}</strong>,<br>
                Nous avons bien reçu votre paiement. Votre abonnement <strong style="color:#7c3aed;">${PLAN_LABELS[plan]}</strong> est désormais actif jusqu'au <strong style="color:#1f1035;">${endDate}</strong>. Retrouvez ci-dessous le récapitulatif de votre facture.
              </p>
            </div>

            <!-- ── Invoice Card ── -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1.5px solid #e5defa;border-radius:16px;overflow:hidden;margin-bottom:28px;">

              <!-- Card Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#f3eeff,#ede9fe);padding:18px 24px;border-bottom:1px solid #ddd6fe;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-family:Georgia,serif;font-size:15px;font-weight:600;color:#4c1d95;">Facture #${invoiceNumber}</td>
                      <td align="right">
                        <span style="font-size:12px;color:#6d28d9;font-weight:500;background:rgba(124,58,237,0.1);padding:4px 12px;border-radius:20px;">${paymentDate}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Table Header -->
              <tr style="background:#f9f5ff;">
                <td style="padding:11px 20px;font-size:11px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1px solid #ede9fe;">Description</td>
                <td style="padding:11px 20px;font-size:11px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1px solid #ede9fe;">Période</td>
                <td align="right" style="padding:11px 20px;font-size:11px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1px solid #ede9fe;">Montant</td>
              </tr>

              <!-- Row 1 — Abonnement -->
              <tr style="border-bottom:1px solid #f3f0ff;">
                <td style="padding:14px 20px;vertical-align:top;">
                  <span style="font-size:14px;font-weight:500;color:#1f2937;">Abonnement VoteApp</span>
                  <span style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:white;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;margin-left:6px;vertical-align:middle;">⭐ ${PLAN_LABELS[plan]}</span>
                  <div style="font-size:12px;color:#9ca3af;margin-top:3px;">${PLAN_DESCRIPTIONS[plan]}</div>
                </td>
                <td style="padding:14px 20px;vertical-align:top;">
                  <span style="font-size:14px;font-weight:500;color:#1f2937;">${startDate} → ${endDate}</span>
                  <div style="font-size:12px;color:#9ca3af;margin-top:3px;">${PLAN_DURATION[plan]}</div>
                </td>
                <td align="right" style="padding:14px 20px;font-size:14px;font-weight:500;color:#374151;vertical-align:top;">${formatCFA(amount)}</td>
              </tr>

              <!-- Row 2 — Commission -->
              <tr style="border-bottom:1px solid #f3f0ff;">
                <td style="padding:14px 20px;">
                  <span style="font-size:14px;font-weight:500;color:#1f2937;">Commission réduite</span>
                  <span style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:white;font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;margin-left:6px;vertical-align:middle;">${COMMISSION_RATE[plan]}</span>
                  <div style="font-size:12px;color:#9ca3af;margin-top:3px;">au lieu de 20% (plan Gratuit)</div>
                </td>
                <td style="padding:14px 20px;font-size:14px;font-weight:500;color:#1f2937;">—</td>
                <td align="right" style="padding:14px 20px;font-size:14px;font-weight:500;color:#059669;">Inclus</td>
              </tr>

              <!-- Row 3 — TVA -->
              <tr>
                <td style="padding:14px 20px;font-size:14px;color:#374151;">TVA</td>
                <td style="padding:14px 20px;font-size:14px;color:#374151;">—</td>
                <td align="right" style="padding:14px 20px;font-size:14px;color:#374151;">0 FCFA</td>
              </tr>

              <!-- Total -->
              <tr style="background:linear-gradient(135deg,#4c1d95,#7c3aed);">
                <td colspan="2" style="padding:18px 20px;font-size:15px;font-weight:600;color:#ffffff;">Total payé</td>
                <td align="right" style="padding:18px 20px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ffffff;">${formatCFA(amount)}</td>
              </tr>

            </table>

            <!-- ── Payment Info ── -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-size:24px;width:36px;vertical-align:top;padding-top:2px;">📱</td>
                      <td style="padding-left:14px;">
                        <div style="font-size:14px;font-weight:600;color:#065f46;margin-bottom:12px;">Détails du paiement Mobile Money</div>
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="padding-bottom:8px;width:50%;">
                              <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;margin-bottom:2px;">Opérateur</div>
                              <div style="font-size:13px;font-weight:500;color:#065f46;">${operator}</div>
                            </td>
                            <td style="padding-bottom:8px;">
                              <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;margin-bottom:2px;">Numéro</div>
                              <div style="font-size:13px;font-weight:500;color:#065f46;">${phoneNumber}</div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;margin-bottom:2px;">Référence FedaPay</div>
                              <div style="font-size:13px;font-weight:500;color:#065f46;">#${fedapayReference}</div>
                            </td>
                            <td>
                              <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6ee7b7;margin-bottom:2px;">Statut</div>
                              <div style="font-size:13px;font-weight:500;color:#065f46;">✓ Approuvé</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ── Features ── -->
            <div style="font-size:12px;font-weight:600;color:#4b5563;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;">Fonctionnalités incluses</div>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              <tr>
                <td width="48%" style="padding:0 6px 10px 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8ff;border:1px solid #ede9fe;border-radius:10px;">
                    <tr><td style="padding:12px 14px;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background:linear-gradient(135deg,#7c3aed,#5b21b6);border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;font-size:13px;padding:0 6px;">🗓️</td>
                          <td style="padding-left:10px;font-size:12.5px;color:#4b5563;font-weight:500;">Événements illimités</td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </td>
                <td width="48%" style="padding:0 0 10px 6px;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8ff;border:1px solid #ede9fe;border-radius:10px;">
                    <tr><td style="padding:12px 14px;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background:linear-gradient(135deg,#7c3aed,#5b21b6);border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;font-size:13px;padding:0 6px;">👥</td>
                          <td style="padding-left:10px;font-size:12.5px;color:#4b5563;font-weight:500;">Candidats illimités</td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td width="48%" style="padding:0 6px 10px 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8ff;border:1px solid #ede9fe;border-radius:10px;">
                    <tr><td style="padding:12px 14px;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background:linear-gradient(135deg,#7c3aed,#5b21b6);border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;font-size:13px;padding:0 6px;">✨</td>
                          <td style="padding-left:10px;font-size:12.5px;color:#4b5563;font-weight:500;">Constructeur IA + Puck</td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </td>
                <td width="48%" style="padding:0 0 10px 6px;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8ff;border:1px solid #ede9fe;border-radius:10px;">
                    <tr><td style="padding:12px 14px;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background:linear-gradient(135deg,#7c3aed,#5b21b6);border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;font-size:13px;padding:0 6px;">🌐</td>
                          <td style="padding-left:10px;font-size:12.5px;color:#4b5563;font-weight:500;">Domaines personnalisés</td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td width="48%" style="padding:0 6px 0 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8ff;border:1px solid #ede9fe;border-radius:10px;">
                    <tr><td style="padding:12px 14px;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background:linear-gradient(135deg,#7c3aed,#5b21b6);border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;font-size:13px;padding:0 6px;">📊</td>
                          <td style="padding-left:10px;font-size:12.5px;color:#4b5563;font-weight:500;">Analytics avancés</td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </td>
                <td width="48%" style="padding:0 0 0 6px;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8ff;border:1px solid #ede9fe;border-radius:10px;">
                    <tr><td style="padding:12px 14px;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background:linear-gradient(135deg,#7c3aed,#5b21b6);border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;font-size:13px;padding:0 6px;">💬</td>
                          <td style="padding-left:10px;font-size:12.5px;color:#4b5563;font-weight:500;">Support WhatsApp prioritaire</td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ── CTA ── -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 36px;border-radius:40px;letter-spacing:0.3px;">Accéder à mon dashboard →</a>
                  <div style="font-size:12px;color:#9ca3af;margin-top:10px;">Vos événements vous attendent sur voteapp.com</div>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e5defa,transparent);margin:0 0 24px;"></div>

            <!-- Security note -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 18px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size:16px;padding-right:10px;vertical-align:top;padding-top:2px;">🔒</td>
                      <td style="font-size:12px;color:#92400e;line-height:1.6;">VoteApp ne vous demandera jamais votre mot de passe par email. Si vous n'êtes pas à l'origine de ce paiement, contactez-nous immédiatement sur <strong>support@voteapp.com</strong></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">
                  <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#c4b5fd;margin-bottom:8px;">VoteApp</div>
                  <div style="margin-bottom:12px;">
                    <a href="${dashboardUrl}" style="font-size:12px;color:#6b7280;text-decoration:none;margin:0 10px;">Mon compte</a>
                    <a href="mailto:support@voteapp.com" style="font-size:12px;color:#6b7280;text-decoration:none;margin:0 10px;">Support</a>
                    <a href="#" style="font-size:12px;color:#6b7280;text-decoration:none;margin:0 10px;">CGU</a>
                    <a href="#" style="font-size:12px;color:#6b7280;text-decoration:none;margin:0 10px;">Confidentialité</a>
                  </div>
                  <div style="font-size:11px;color:#4b5563;line-height:1.7;">
                    VoteApp SAS · Cotonou, Bénin<br>
                    support@voteapp.com · +229 97 000 000
                  </div>
                  <div style="font-size:11px;color:#6b7280;margin-top:10px;">
                    <a href="#" style="color:#7c3aed;text-decoration:none;">Se désabonner</a> des emails de facturation
                  </div>
                </td>
              </tr>
            </table>

          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}