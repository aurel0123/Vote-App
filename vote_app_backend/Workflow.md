Voici le workflow complet du projet basé sur ce que je vois dans ton code (models, services, routes   
  existants) :                           
                                                                                                        
  ---
  Les 2 acteurs                                                                                         
                                                            
  Organisateur — crée et gère les événements de vote
  Votant — vote publiquement sur un événement

  ---
  Workflow Organisateur

  1. INSCRIPTION
     POST /api/auth/sign-up/email
     → User créé + email de vérification envoyé

  2. VÉRIFICATION EMAIL
     GET /api/auth/verify-email?token=...
     → emailVerified = true

  3. ONBOARDING
     POST /api/onboarding/setup
     → Organisation créée + Subscription FREE créée

  4. (OPTIONNEL) UPGRADE PREMIUM
     → Initier paiement FedaPay
     → Webhook reçu → Subscription PREMIUM activée

  5. CRÉER UN ÉVÉNEMENT
     POST /api/events
     → Statut DRAFT

  6. AJOUTER DES CANDIDATS
     POST /api/events/:id/candidates
     → Min. 2 candidats requis

  7. PUBLIER L'ÉVÉNEMENT
     POST /api/events/:id/publish
     → Statut DRAFT → PUBLISHED

  8. LANCER L'ÉVÉNEMENT
     POST /api/events/:id/live   (ou automatique à startDate)
     → Statut PUBLISHED → LIVE

  9. SUIVRE EN TEMPS RÉEL
     Socket.io → classement live des votes

  10. TERMINER L'ÉVÉNEMENT
      POST /api/events/:id/end
      → Statut LIVE → ENDED

  11. RETRAIT DES GAINS
      POST /api/payouts/request
      → Payout PENDING → traitement FedaPay

  ---
  Workflow Votant

  1. VOIR L'ÉVÉNEMENT (page publique)
     GET /api/events/public/:slug
     → Infos + liste candidats

  2. VOTER
     POST /api/events/:id/vote
     Body: { candidateId, quantity }
     → Si voteType = PAID → initier Transaction FedaPay
     → Si voteType = FREE → vote enregistré directement

  3. (SI PAYANT) PAIEMENT
     → Redirect FedaPay
     → Webhook reçu → Transaction APPROVED → Vote enregistré

  4. VOIR LE CLASSEMENT
     GET /api/events/:id/ranking
     → Classement temps réel via Socket.io

  ---
  Ce qui est fait vs à faire

  FAIT
  ├── Auth (sign-up, login, reset password)
  ├── Onboarding (org + subscription FREE)
  ├── Créer un événement
  ├── Publier / Terminer un événement
  └── Classement (service)

  À FAIRE
  ├── Candidats (CRUD)
  ├── Vote (FREE et PAYANT)
  ├── Transactions + webhook FedaPay votes
  ├── Upgrade PREMIUM + webhook FedaPay subscription
  ├── Payouts (retrait gains)
  ├── Page publique événement
  └── Socket.io classement temps réel

  ---
  Par où tu veux commencer ?

────────────────────────────────────────────────────────────────────────────────────────────────────────
❯  
────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle)
                                                                                                        
     → Webhook reçu → Transaction APPROVED → Vote enregistré

  4. VOIR LE CLASSEMENT
     GET /api/events/:id/ranking
     → Classement temps réel via Socket.io

  ---
  Ce qui est fait vs à faire

  FAIT
  ├── Auth (sign-up, login, reset password)
  ├── Onboarding (org + subscription FREE)
  ├── Créer un événement
  ├── Publier / Terminer un événement
  └── Classement (service)

  À FAIRE
  ├── Candidats (CRUD)
  ├── Vote (FREE et PAYANT)
  ├── Transactions + webhook FedaPay votes
  ├── Upgrade PREMIUM + webhook FedaPay subscription
  ├── Payouts (retrait gains)
  ├── Page publique événement
  └── Socket.io classement temps réel

  ---
  Par où tu veux commencer ?

────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ 
────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle)
     → Webhook reçu → Transaction APPROVED → Vote enregistré

  4. VOIR LE CLASSEMENT
     GET /api/events/:id/ranking
     → Classement temps réel via Socket.io

  ---
  Ce qui est fait vs à faire

  FAIT
  ├── Auth (sign-up, login, reset password)
  ├── Onboarding (org + subscription FREE)
  ├── Créer un événement
  ├── Publier / Terminer un événement
  └── Classement (service)

  À FAIRE
  ├── Candidats (CRUD)
  ├── Vote (FREE et PAYANT)
  ├── Transactions + webhook FedaPay votes
  ├── Upgrade PREMIUM + webhook FedaPay subscription
  ├── Payouts (retrait gains)
  ├── Page publique événement
  └── Socket.io classement temps réel

  ---
  Par où tu veux commencer ?*


 Auth Endpoints — better-auth                                                                          
                                                            
  1. Inscription

  POST /api/auth/sign-up/email
  Content-Type: application/json

  {
    "email": "user@example.com",
    "password": "12345678",
    "name": "John Doe"
  }

  2. Connexion

  POST /api/auth/sign-in/email
  Content-Type: application/json

  {
    "email": "user@example.com",
    "password": "12345678"
  }

  ▎ Retourne un cookie de session automatiquement.

  3. Déconnexion

  POST /api/auth/sign-out

  4. Session en cours

  GET /api/auth/get-session

  5. Renvoyer l'email de vérification

  POST /api/auth/send-verification-email
  Content-Type: application/json

  {
    "email": "user@example.com",
    "callbackURL": "http://localhost:3000/dashboard"
  }

  6. Vérifier l'email (lien reçu par mail)

  GET /api/auth/verify-email?token=TOKEN&callbackURL=http://localhost:3000

  7. Mot de passe oublié

  POST /api/auth/forget-password
  Content-Type: application/json

  {
    "email": "user@example.com",
    "redirectTo": "http://localhost:3000/reset-password"
  }

  8. Réinitialiser le mot de passe

  POST /api/auth/reset-password
  Content-Type: application/json

  {
    "token": "TOKEN_RECU_PAR_EMAIL",
    "newPassword": "nouveauMotDePasse"
  }

  ---
  Onboarding Endpoints (custom)

  9. Créer organisation + subscription FREE

  POST /api/onboarding/setup
  Content-Type: application/json
  (cookie de session requis)

  {
    "name": "Mon Organisation"
  }

  10. Initier upgrade PREMIUM

  POST /api/onboarding/upgrade
  (cookie de session requis)

  ▎ Retourne { paymentUrl, transactionId }

  ---
  Tips Postman

  - Active "Send cookies" dans Postman pour que la session soit conservée entre les requêtes.
  - Après /sign-in, le cookie better-auth.session_token est automatiquement stocké et envoyé sur les
  requêtes suivantes.

────────────────────────────────────────────────────────────────────────────────────────────────────────
❯  
────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle)

  ---
  Onboarding Endpoints (custom)

  9. Créer organisation + subscription FREE

  POST /api/onboarding/setup
  Content-Type: application/json
  (cookie de session requis)

  {
    "name": "Mon Organisation"
  }

  10. Initier upgrade PREMIUM

  POST /api/onboarding/upgrade
  (cookie de session requis)

  ▎ Retourne { paymentUrl, transactionId }

  ---
  Tips Postman

  - Active "Send cookies" dans Postman pour que la session soit conservée entre les requêtes.
  - Après /sign-in, le cookie better-auth.session_token est automatiquement stocké et envoyé sur les
  requêtes suivantes.

❯ ou l'activer                                                                                          
                 
● Dans Postman :                                                                                        
                                         
  1. Cookie jar (par requête)                                                                           
  En haut à droite de la requête → clique sur Cookies → assure-toi que le domaine localhost est présent.
                                                                                                        
  2. Activer l'envoi automatique des cookies                
  Settings (icône engrenage en haut à droite)
  → General
  → "Automatically follow redirects" → ON
  → "Send cookies" → ON

  3. Le plus simple — utiliser Postman Cookie Manager

  Après avoir fait /sign-in, clique sur Cookies (sous le bouton Send) → tu verras le cookie
  better-auth.session_token stocké automatiquement pour localhost. Il sera envoyé sur toutes les
  requêtes suivantes vers le même domaine.

  ---
  Si tu utilises une Collection Postman, tu peux aussi stocker le token dans une variable
  d'environnement via un script "Tests" après le sign-in :

  // Onglet "Tests" de la requête sign-in
  const cookie = pm.cookies.get('better-auth.session_token');
  pm.environment.set('session_token', cookie);

  Puis sur les requêtes protégées, ajoute dans l'onglet Headers :
  Cookie: better-auth.session_token={{session_token}}

────────────────────────────────────────────────────────────────────────────────────────────────────────
❯  

7. BONUS (idées puissantes)
QR code pour voter
partage WhatsApp
leaderboard public
API publique

1. C'est quoi "leaderboard public" (pas "leadnord") ?                                                       
                                                                                                              
  Dans ton Workflow.md ligne 324, c'est "leaderboard public" — c'est le classement public visible par tout le 
  monde sans connexion. C'est simplement la page qui affiche les candidats triés par nombre de votes en temps
  réel via Socket.io. C'est dans la liste des bonus/idées.

  ---
  2. QR Code pour voter — ce qu'il faut faire

  Concept

  Le QR code encode une URL vers la page de vote d'un candidat ou d'un événement. Quand le votant scanne, il
  arrive directement sur la page de vote frontend.

  Deux approches possibles :
  - QR par événement → redirige vers la page publique de l'événement (/events/public/:slug)
  - QR par candidat → redirige directement sur la page de vote pré-sélectionnant le candidat

  ---
  Modifications tables (Prisma schema)

  Aucune modification de table n'est strictement nécessaire. Voici pourquoi :

  - L'Event a déjà un slug — l'URL de vote est déjà constructible : https://ton-app.com/vote/:slug
  - Le Candidate a déjà un id — l'URL candidat : https://ton-app.com/vote/:slug?candidateId=xxx

  Option si tu veux stocker le QR code généré (recommandé pour performance) :

  // Sur le modèle Event — ajouter :
  qrCodeUrl  String?   // URL de l'image QR stockée (ex: Cloudflare R2 ou base64)

  // Sur le modèle Candidate — ajouter (optionnel) :
  qrCodeUrl  String?   // QR code spécifique au candidat

  Mais si tu génères le QR à la volée côté backend ou frontend, zéro modification de table.

  ---
  Ce que tu fais côté backend

  Un seul nouvel endpoint :

  GET /api/events/:id/qrcode
  → Retourne l'image QR (PNG base64 ou URL) de la page de vote de l'événement

  GET /api/events/:id/candidates/:candidateId/qrcode
  → QR code pré-sélectionnant un candidat (optionnel)

  Package à installer :
  npm install qrcode
  npm install -D @types/qrcode

  La logique : récupère le slug de l'event, construit l'URL publique, génère le QR avec qrcode, renvoie le PNG
   en base64 ou en buffer.

  ---
  Ce que tu fais côté frontend

  ┌────────────────────────────────┬──────────────────────────────────────────────────────────────────────┐
  │             Écran              │                                Action                                │
  ├────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Dashboard organisateur →       │ Bouton "Télécharger QR code" → appelle GET /api/events/:id/qrcode →  │
  │ détail événement               │ affiche/télécharge l'image                                           │
  ├────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Page publique de l'événement   │ Afficher le QR code de chaque candidat (optionnel, pour imprimer)    │
  ├────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Page de vote                   │ Si URL contient ?candidateId=xxx, pré-sélectionner ce candidat       │
  │                                │ automatiquement                                                      │
  └────────────────────────────────┴──────────────────────────────────────────────────────────────────────┘

  Package frontend (si tu génères côté client) :
  npm install qrcode.react   # pour React

  ---
  Résumé des priorités

  Backend :
  1. npm install qrcode
  2. Ajouter GET /api/events/:id/qrcode dans event.route.ts
  3. Implémenter dans eventController.ts → générer QR de l'URL publique

  Frontend :
  1. Dashboard : bouton télécharger QR de l'événement
  2. Page vote : lire ?candidateId dans l'URL pour pré-sélection
  3. (Optionnel) QR par candidat pour affichage/impression

  Aucune migration de base de données requise si tu ne stockes pas le QR. Tu veux que je code directement le
  endpoint backend ?

✻ Cooked for 52s                                      
                                                                                          
──────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯                                                                                                             
──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ? for shortcuts                                                                                             
                                                                                                              
  ├────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Page publique de l'événement   │ Afficher le QR code de chaque candidat (optionnel, pour imprimer)    │
  ├────────────────────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ Page de vote                   │ Si URL contient ?candidateId=xxx, pré-sélectionner ce candidat       │
  │                                │ automatiquement                                                      │
  └────────────────────────────────┴──────────────────────────────────────────────────────────────────────┘

  Package frontend (si tu génères côté client) :
  npm install qrcode.react   # pour React

  ---
  Résumé des priorités

  Backend :
  1. npm install qrcode
  2. Ajouter GET /api/events/:id/qrcode dans event.route.ts
  3. Implémenter dans eventController.ts → générer QR de l'URL publique

  Frontend :
  1. Dashboard : bouton télécharger QR de l'événement
  2. Page vote : lire ?candidateId dans l'URL pour pré-sélection
  3. (Optionnel) QR par candidat pour affichage/impression

  Aucune migration de base de données requise si tu ne stockes pas le QR. Tu veux que je code directement le
  endpoint backend ?