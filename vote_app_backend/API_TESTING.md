# Guide de test des endpoints — VoteApp Backend

## Configuration de base

```
BASE_URL=http://localhost:8080
```

L'authentification repose sur **Better Auth** avec des cookies de session. Après connexion, le cookie `better-auth.session_token` est automatiquement géré par votre client HTTP (Postman, Insomnia, curl avec `--cookie-jar`).

---

## 1. Santé du serveur

### GET /api/health
Vérifie que le serveur tourne.

```bash
curl http://localhost:8080/api/health
```

Réponse attendue `200` :
```json
{
  "status": "ok",
  "app": "VoteApp Backend",
  "version": "1.0.0",
  "timestamp": "2026-04-29T..."
}
```

---

## 2. Authentification (`/api/auth`)

Géré par **Better Auth**. Les routes ci-dessous sont les plus utilisées dans les tests.

### POST /api/auth/sign-up/email — Inscription
```bash
curl -c cookies.txt -X POST http://localhost:8080/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Dupont",
    "email": "jean@exemple.com",
    "password": "MotDePasse123!"
  }'
```

### POST /api/auth/sign-in/email — Connexion
```bash
curl -c cookies.txt -X POST http://localhost:8080/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean@exemple.com",
    "password": "MotDePasse123!"
  }'
```
> Sauvegarde le cookie de session dans `cookies.txt` pour les requêtes suivantes.

### POST /api/auth/forget-password — Mot de passe oublié
```bash
curl -X POST http://localhost:8080/api/auth/forget-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "jean@exemple.com" }'
```

### POST /api/auth/reset-password — Réinitialisation du mot de passe
```bash
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<token_recu_par_email>",
    "newPassword": "NouveauMotDePasse123!"
  }'
```

### GET /api/auth/session — Session courante
```bash
curl -b cookies.txt http://localhost:8080/api/auth/session
```

### POST /api/auth/sign-out — Déconnexion
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/auth/sign-out
```

---

## 3. Onboarding (`/api/onboarding`)

> Toutes les routes nécessitent une session active (`-b cookies.txt`).

### POST /api/onboarding/setup — Configurer l'organisation
Premier appel après inscription pour nommer l'organisation de l'organisateur.

```bash
curl -b cookies.txt -X POST http://localhost:8080/api/onboarding/setup \
  -H "Content-Type: application/json" \
  -d '{ "name": "Association Sport Bénin" }'
```

Réponse attendue `201`.

### POST /api/onboarding/upgrade — Passer en plan payant
Déclenche l'upgrade de plan pour l'utilisateur connecté.

```bash
curl -b cookies.txt -X POST http://localhost:8080/api/onboarding/upgrade \
  -H "Content-Type: application/json"
```

---

## 4. Événements (`/api/events`)

### Routes publiques (pas de session requise)

#### GET /api/events/public/:slug — Page publique d'un événement
```bash
curl http://localhost:8080/api/events/public/mon-evenement-2026
```
> L'événement doit être en statut `PUBLISHED` ou `LIVE` (pas `DRAFT` ni `SUSPENDED`).

#### GET /api/events/:id/ranking — Classement en temps réel
```bash
curl http://localhost:8080/api/events/clx123abc/ranking
```

---

### Routes protégées (session requise)

#### POST /api/events/create — Créer un événement
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Miss Bénin 2026",
    "description": "Concours de beauté national",
    "slug": "miss-benin-2026",
    "voteType": "PAID",
    "pricePerVote": 100,
    "startDate": "2026-06-01T08:00:00.000Z",
    "endDate": "2026-06-30T23:59:00.000Z"
  }'
```

Champs disponibles :

| Champ | Type | Requis | Valeurs possibles |
|---|---|---|---|
| `title` | string | oui | — |
| `slug` | string | oui | unique, URL-friendly |
| `voteType` | enum | non | `FREE`, `PAID` (défaut: `PAID`) |
| `pricePerVote` | number | non | en FCFA (défaut: 0) |
| `startDate` | ISO 8601 | oui | — |
| `endDate` | ISO 8601 | oui | — |
| `description` | string | non | — |
| `pageConfig` | JSON | non | personnalisation visuelle |

#### GET /api/events/myEvents — Mes événements
```bash
curl -b cookies.txt http://localhost:8080/api/events/myEvents
```

#### GET /api/events/:id/dashboard — Dashboard d'un événement
```bash
curl -b cookies.txt http://localhost:8080/api/events/clx123abc/dashboard
```

#### PUT /api/events/:id — Modifier un événement
```bash
curl -b cookies.txt -X PUT http://localhost:8080/api/events/clx123abc \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Miss Bénin 2026 — Édition Spéciale",
    "description": "Nouvelle description"
  }'
```

#### POST /api/events/:id/publish — Publier un événement
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events/clx123abc/publish
```
> L'événement passe de `DRAFT` à `PUBLISHED`.

#### POST /api/events/:id/end — Terminer un événement
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events/clx123abc/end
```
> L'événement passe à `ENDED`.

#### POST /api/events/delete — Supprimer un événement
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events/delete \
  -H "Content-Type: application/json" \
  -d '{ "id": "clx123abc" }'
```

---

## 5. Candidats (`/api/events/:eventId/candidates`)

### Route publique

#### GET /api/events/:eventId/candidates — Liste des candidats
```bash
curl http://localhost:8080/api/events/clx123abc/candidates
```

---

### Routes protégées (session requise)

#### POST /api/events/:eventId/candidates — Créer un candidat
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events/clx123abc/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Candidate Alpha",
    "bio": "Originaire de Cotonou, passionnée de mode."
  }'
```

#### POST /api/events/:eventId/candidates/bulk — Créer plusieurs candidats
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events/clx123abc/candidates/bulk \
  -H "Content-Type: application/json" \
  -d '[
    { "name": "Candidate Alpha", "bio": "Bio 1" },
    { "name": "Candidate Beta",  "bio": "Bio 2" },
    { "name": "Candidate Gamma", "bio": "Bio 3" }
  ]'
```
> Le body est un **tableau JSON** direct (pas un objet enveloppant).

#### PUT /api/events/:eventId/candidates/reorder — Réordonner les candidats
```bash
curl -b cookies.txt -X PUT http://localhost:8080/api/events/clx123abc/candidates/reorder \
  -H "Content-Type: application/json" \
  -d '{ "orderedIds": ["clxIdC", "clxIdA", "clxIdB"] }'
```

#### PUT /api/events/:eventId/candidates/:id — Modifier un candidat
```bash
curl -b cookies.txt -X PUT http://localhost:8080/api/events/clx123abc/candidates/clxIdA \
  -H "Content-Type: application/json" \
  -d '{ "name": "Candidate Alpha Updated", "bio": "Nouvelle bio" }'
```

#### DELETE /api/events/:eventId/candidates/:id — Supprimer un candidat
```bash
curl -b cookies.txt -X DELETE \
  http://localhost:8080/api/events/clx123abc/candidates/clxIdA
```
> Impossible si l'événement est en statut `LIVE`.

---

## 6. Votes (`/api/votes`)

### POST /api/votes/free — Vote gratuit (public)
Uniquement pour les événements avec `voteType: FREE`.

```bash
curl -X POST http://localhost:8080/api/votes/free \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "clx123abc",
    "candidateId": "clxIdA"
  }'
```
> Soumis à un rate-limiting strict (anti-fraude).

### GET /api/votes/:eventId/stats — Statistiques de vote (protégé)
```bash
curl -b cookies.txt http://localhost:8080/api/votes/clx123abc/stats
```

---

## 7. Paiements (`/api/payments`)

### POST /api/payments/init — Initier un paiement (vote payant)
Public mais très rate-limité. Pour les événements avec `voteType: PAID`.

```bash
curl -X POST http://localhost:8080/api/payments/init \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "clx123abc",
    "candidateId": "clxIdA",
    "quantity": 10,
    "phoneNumber": "22997000000",
    "customerName": "Jean Dupont",
    "customerEmail": "jean@exemple.com"
  }'
```

### GET /api/payments/event/:eventId — Transactions d'un événement (protégé)
```bash
curl -b cookies.txt http://localhost:8080/api/payments/event/clx123abc
```

### POST /api/payments/webhook — Webhook FedaPay (public)
Appelé automatiquement par FedaPay. Pour tester en local, simuler la signature :

```bash
# Calculer la signature HMAC-SHA256 du body
BODY='{"entity":"transaction","event":"transaction.approved","data":{"id":123}}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "votre_webhook_secret" | awk '{print $2}')

curl -X POST http://localhost:8080/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-fedapay-signature: $SIG" \
  -d "$BODY"
```

---

## 8. Uploads (`/api/upload`)

> Session requise + `Content-Type: multipart/form-data`.

### POST /api/upload/event/:eventId/banner — Bannière d'un événement
```bash
curl -b cookies.txt -X POST \
  http://localhost:8080/api/upload/event/clx123abc/banner \
  -F "file=@/chemin/vers/banniere.jpg"
```

### POST /api/upload/event/:eventId/candidate/:candidateId/photo — Photo d'un candidat
```bash
curl -b cookies.txt -X POST \
  http://localhost:8080/api/upload/event/clx123abc/candidate/clxIdA/photo \
  -F "file=@/chemin/vers/photo.jpg"
```

---

## 9. Abonnements (`/api/subscriptions`)

### GET /api/subscriptions/me — Mon plan actuel (protégé)
```bash
curl -b cookies.txt http://localhost:8080/api/subscriptions/me
```

### POST /api/subscriptions/init — Initier un paiement d'abonnement (protégé)
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/subscriptions/init \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "PACK",
    "phoneNumber": "22997000000",
    "customerName": "Jean Dupont",
    "customerEmail": "jean@exemple.com"
  }'
```

Valeurs de `plan` : `PACK` ou `PREMIUM`.

### DELETE /api/subscriptions/cancel — Annuler l'abonnement (protégé)
```bash
curl -b cookies.txt -X DELETE http://localhost:8080/api/subscriptions/cancel
```

### POST /api/subscriptions/webhook — Webhook abonnement FedaPay (public)
Même mécanique que le webhook paiements (signature HMAC-SHA256).

### GET /api/subscriptions — Liste complète (admin uniquement)
```bash
curl -b cookies.txt "http://localhost:8080/api/subscriptions?page=1"
```

---

## 10. Domaines custom (`/api/domains`)

### GET /api/domains/check — Vérifier la disponibilité (public)
```bash
curl "http://localhost:8080/api/domains/check?domain=vote.monassociation.bj"
```

### GET /api/domains/resolve — Résoudre un domaine (public)
```bash
curl "http://localhost:8080/api/domains/resolve?domain=vote.monassociation.bj"
```

### POST /api/domains/attach — Attacher un domaine custom (protégé)
```bash
curl -b cookies.txt -X POST http://localhost:8080/api/domains/attach \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "clx123abc",
    "domain": "vote.monassociation.bj"
  }'
```

### DELETE /api/domains/:eventId — Détacher un domaine custom (protégé)
```bash
curl -b cookies.txt -X DELETE http://localhost:8080/api/domains/clx123abc
```

---

## 11. Administration (`/api/admin`)

> Toutes les routes requièrent un utilisateur avec `role: "admin"`.

### GET /api/admin/stats — Statistiques globales
```bash
curl -b cookies_admin.txt http://localhost:8080/api/admin/stats
```

### GET /api/admin/organizers — Liste des organisateurs
```bash
curl -b cookies_admin.txt "http://localhost:8080/api/admin/organizers?page=1"
```

### GET /api/admin/events — Liste des événements
```bash
curl -b cookies_admin.txt "http://localhost:8080/api/admin/events?page=1&status=LIVE"
```
Valeurs de `status` : `DRAFT`, `PUBLISHED`, `LIVE`, `ENDED`, `SUSPENDED`.

### PATCH /api/admin/events/:id/suspend — Suspendre un événement
```bash
curl -b cookies_admin.txt -X PATCH \
  http://localhost:8080/api/admin/events/clx123abc/suspend \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Contenu non conforme aux CGU" }'
```

### PATCH /api/admin/events/:id/restore — Restaurer un événement
```bash
curl -b cookies_admin.txt -X PATCH \
  http://localhost:8080/api/admin/events/clx123abc/restore
```

### PATCH /api/admin/users/:id/block — Bloquer un utilisateur
```bash
curl -b cookies_admin.txt -X PATCH \
  http://localhost:8080/api/admin/users/clxUserId/block
```

### GET /api/admin/transactions — Toutes les transactions
```bash
curl -b cookies_admin.txt "http://localhost:8080/api/admin/transactions?page=1"
```

### POST /api/admin/payouts — Créer un versement organisateur
```bash
curl -b cookies_admin.txt -X POST http://localhost:8080/api/admin/payouts \
  -H "Content-Type: application/json" \
  -d '{
    "organizerId": "clxUserId",
    "eventId": "clx123abc",
    "amount": 50000,
    "phoneNumber": "22997000000",
    "notes": "Versement Miss Bénin 2026"
  }'
```

### PATCH /api/admin/payouts/:id/status — Mettre à jour le statut d'un versement
```bash
curl -b cookies_admin.txt -X PATCH \
  http://localhost:8080/api/admin/payouts/clxPayoutId/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "COMPLETED" }'
```
Valeurs de `status` : `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.

---

## 12. Webhooks (`/api/webhooks`)

### POST /api/webhooks/fedapay — Webhook FedaPay général
```bash
BODY='{"entity":"transaction","event":"transaction.approved","data":{"id":456}}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "votre_webhook_secret" | awk '{print $2}')

curl -X POST http://localhost:8080/api/webhooks/fedapay \
  -H "Content-Type: application/json" \
  -H "x-fedapay-signature: $SIG" \
  -d "$BODY"
```

---

## Scénario de test complet (flux principal)

```bash
# 1. Inscription
curl -c cookies.txt -X POST http://localhost:8080/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Org","email":"test@test.com","password":"Test1234!"}'

# 2. Onboarding
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/onboarding/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Mon Association"}'

# 3. Créer un événement (voteType FREE pour tester sans paiement)
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/events/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","slug":"test-event-2026","voteType":"FREE","pricePerVote":0,"startDate":"2026-05-01T00:00:00Z","endDate":"2026-12-31T23:59:00Z"}' \
  | tee /tmp/event.json

# Extraire l'ID (nécessite jq)
EVENT_ID=$(cat /tmp/event.json | jq -r '.data.id')

# 4. Ajouter des candidats
curl -b cookies.txt -X POST http://localhost:8080/api/events/$EVENT_ID/candidates \
  -H "Content-Type: application/json" \
  -d '{"name":"Candidat A","bio":"Bio de A"}'

curl -b cookies.txt -X POST http://localhost:8080/api/events/$EVENT_ID/candidates \
  -H "Content-Type: application/json" \
  -d '{"name":"Candidat B","bio":"Bio de B"}'

# 5. Publier l'événement
curl -b cookies.txt -X POST http://localhost:8080/api/events/$EVENT_ID/publish

# 6. Vérifier la page publique
curl http://localhost:8080/api/events/public/test-event-2026

# 7. Voter (gratuit)
CANDIDATE_ID=$(curl http://localhost:8080/api/events/$EVENT_ID/candidates | jq -r '.data[0].id')
curl -X POST http://localhost:8080/api/votes/free \
  -H "Content-Type: application/json" \
  -d "{\"eventId\":\"$EVENT_ID\",\"candidateId\":\"$CANDIDATE_ID\"}"

# 8. Voir les stats
curl -b cookies.txt http://localhost:8080/api/votes/$EVENT_ID/stats

# 9. Voir le classement
curl http://localhost:8080/api/events/$EVENT_ID/ranking

# 10. Terminer l'événement
curl -b cookies.txt -X POST http://localhost:8080/api/events/$EVENT_ID/end
```

---

## Codes de réponse attendus

| Code | Signification |
|---|---|
| `200` | Succès |
| `201` | Ressource créée |
| `400` | Données invalides / erreur métier |
| `401` | Non authentifié |
| `403` | Accès refusé (pas le bon rôle / pas le bon organisateur) |
| `404` | Ressource introuvable |
| `429` | Rate limit dépassé (Arcjet) |
| `500` | Erreur interne du serveur |

---

## Outils recommandés

- **[Postman](https://postman.com)** : importer les requêtes curl, gérer les cookies automatiquement.
- **[Insomnia](https://insomnia.rest)** : alternative légère, bonne gestion des cookies de session.
- **[Bruno](https://usebruno.com)** : collection locale en fichiers, idéal pour versionner dans Git.
- **curl + jq** : pour les tests en CLI comme dans les exemples ci-dessus.

> Pour Postman/Insomnia, activer l'option **"Send cookies"** et **"Store cookies"** afin que la session Better Auth soit maintenue entre les requêtes.
