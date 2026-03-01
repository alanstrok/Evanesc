# Evanesc

Plateforme de deals éphémères à Saint-Barthélemy. Les prestataires locaux (restaurants, hôtels, spas, activités nautiques) publient des offres flash avec des réductions importantes sur des créneaux limités. Les clients découvrent et réservent via l'application mobile.

## Architecture

```
evanesc/
├── apps/
│   ├── web/        → Next.js 15 (App Router) — Dashboard prestataire & admin
│   └── mobile/     → Expo SDK 52 (Expo Router) — App client
├── packages/
│   ├── api/        → tRPC v11 — Routeurs partagés (offers, bookings, providers, auth)
│   ├── db/         → Drizzle ORM + PostgreSQL — Schéma et migrations
│   └── ui/         → Composants et utilitaires partagés
├── docker-compose.yml        → Dev: PostgreSQL, Redis, MinIO
├── docker-compose.prod.yml   → Prod: tout-en-un pour Unraid
├── deploy.sh                 → Script de déploiement production
└── turbo.json                → Configuration Turborepo
```

## Prérequis

- **Node.js** >= 20
- **pnpm** >= 9 (`corepack enable`)
- **Docker** & Docker Compose
- **Expo Go** (iOS/Android) pour tester l'app mobile

## Installation

```bash
# 1. Cloner le repository
git clone https://github.com/your-org/evanesc.git
cd evanesc

# 2. Installer les dépendances
corepack enable
pnpm install

# 3. Copier les variables d'environnement
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env

# 4. Lancer les services Docker (PostgreSQL, Redis, MinIO)
docker-compose up -d

# 5. Pousser le schéma en base
pnpm db:push

# 6. Seeder la base avec des données de test
pnpm db:seed

# 7. Lancer tous les apps en développement
pnpm dev
```

## Variables d'environnement

### Globales (`.env`)

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://evanesc:evanesc@localhost:5432/evanesc` |
| `REDIS_URL` | URL Redis | `redis://localhost:6379` |
| `BETTER_AUTH_SECRET` | Clé secrète pour les sessions | (générer aléatoirement) |
| `BETTER_AUTH_URL` | URL de l'app web | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | |
| `APPLE_CLIENT_ID` | Apple Sign-In Client ID | |
| `APPLE_TEAM_ID` | Apple Developer Team ID | |
| `APPLE_KEY_ID` | Apple Sign-In Key ID | |
| `APPLE_PRIVATE_KEY` | Apple Sign-In private key | |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | `whsec_...` |
| `RESEND_API_KEY` | Clé API Resend pour les emails | `re_...` |
| `S3_ENDPOINT` | URL MinIO/S3 | `http://localhost:9000` |
| `S3_ACCESS_KEY` | Clé d'accès S3 | `minioadmin` |
| `S3_SECRET_KEY` | Clé secrète S3 | `minioadmin` |
| `S3_BUCKET` | Nom du bucket | `evanesc-media` |

### Mobile (`apps/mobile/.env`)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL de l'API (votre IP locale pour Expo Go) |

## Développement

```bash
# Lancer tout (web + mobile + packages)
pnpm dev

# Lancer uniquement le web
pnpm --filter @evanesc/web dev

# Lancer uniquement le mobile
pnpm --filter @evanesc/mobile dev

# Interface Drizzle Studio (explorer la BDD)
pnpm db:studio

# Générer les migrations
pnpm db:generate

# Appliquer les migrations
pnpm db:migrate
```

## Tester l'app mobile avec Expo Go

1. Installer **Expo Go** depuis l'App Store (iOS) ou le Play Store (Android)
2. Lancer `pnpm dev` dans le monorepo
3. Dans le terminal Expo, appuyer sur `s` pour passer en mode **Expo Go**
4. **Scanner le QR code** affiché dans le terminal avec :
   - **iOS** : appareil photo natif
   - **Android** : app Expo Go directement
5. Vérifier que `EXPO_PUBLIC_API_URL` pointe vers votre IP locale (pas `localhost`)
   ```
   # Trouver votre IP locale
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Mettre à jour apps/mobile/.env
   EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
   ```

## Données de test

Le script de seed (`pnpm db:seed`) crée :
- **5 prestataires** St Barth : Bonito (restaurant), Villa Ciel (villa), Siesta Spa, Blue Wave Adventures (nautique), Island Discovery Tours (excursions)
- **5 offres** avec des réductions de 30% à 37%
- **7 créneaux** répartis sur les prochains jours
- **1 admin** : admin@evanesc.com
- **1 client test** : client@test.com

Mot de passe de tous les comptes seed : `password123`

## Production — Déploiement Unraid

### Prérequis serveur

- Unraid avec Docker installé
- Docker Compose plugin
- Port 3000 disponible (ou configurer le reverse proxy)

### Mise en place

```bash
# 1. Cloner sur le serveur Unraid
git clone https://github.com/your-org/evanesc.git /mnt/user/appdata/evanesc
cd /mnt/user/appdata/evanesc

# 2. Configurer les variables d'environnement
cp .env.example .env
nano .env  # Renseigner toutes les variables de production

# 3. Lancer le stack complet
docker compose -f docker-compose.prod.yml up -d

# 4. Vérifier les services
docker compose -f docker-compose.prod.yml ps
```

### Variables de production requises

```env
# OBLIGATOIRES
DATABASE_URL=postgresql://evanesc:MOT_DE_PASSE_FORT@postgres:5432/evanesc
POSTGRES_PASSWORD=MOT_DE_PASSE_FORT
BETTER_AUTH_SECRET=CLE_SECRETE_ALEATOIRE_64_CHARS
BETTER_AUTH_URL=https://votre-domaine.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

### Déploiement / Mise à jour

```bash
# Déploiement automatique avec zero downtime
./deploy.sh
```

Le script :
1. Pull les dernières modifications depuis GitHub
2. Build la nouvelle image Docker
3. Lance les migrations Drizzle
4. Redémarre le container web sans interruption
5. Nettoie les anciennes images

### Configuration reverse proxy (HAProxy)

Ajouter dans la configuration HAProxy de votre Unraid :

```haproxy
frontend https
    bind *:443 ssl crt /etc/ssl/certs/evanesc.pem
    acl is_evanesc hdr(host) -i evanesc.votre-domaine.com
    use_backend evanesc_backend if is_evanesc

backend evanesc_backend
    server web1 127.0.0.1:3000 check
```

Ou avec Traefik (docker labels dans `docker-compose.prod.yml`) :

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.evanesc.rule=Host(`evanesc.votre-domaine.com`)"
  - "traefik.http.routers.evanesc.tls.certresolver=letsencrypt"
  - "traefik.http.services.evanesc.loadbalancer.server.port=3000"
```

### Services Docker

| Service | Port interne | Description |
|---|---|---|
| `web` | 3000 | Next.js (seul port exposé) |
| `postgres` | 5432 | PostgreSQL 16 |
| `redis` | 6379 | Redis 7 |
| `minio` | 9000/9001 | MinIO (S3 compatible) |

## Publication mobile (App Store / TestFlight)

Une fois le développement terminé avec Expo Go, pour publier l'app :

### Prérequis

- Compte Apple Developer ($99/an)
- Compte Google Play Developer ($25 une fois)
- EAS CLI : `npm install -g eas-cli`

### Étapes

```bash
# 1. Se connecter à EAS
eas login

# 2. Configurer le projet
cd apps/mobile
eas build:configure

# 3. Build iOS pour TestFlight
eas build --platform ios --profile production

# 4. Soumettre à TestFlight
eas submit --platform ios

# 5. Build Android pour Play Store
eas build --platform android --profile production

# 6. Soumettre au Play Store
eas submit --platform android
```

### Différences Expo Go vs Production Build

| Fonctionnalité | Expo Go | Production |
|---|---|---|
| Stripe | WebView checkout | SDK natif (optionnel) |
| Apple Sign-In | Simulé | Natif complet |
| Push notifications | Non | Oui (expo-notifications) |
| Deep links | Limité | Complet |

## Stack technique

- **Monorepo** : Turborepo + pnpm workspaces
- **Web** : Next.js 15, App Router, Tailwind CSS v4, shadcn/ui
- **Mobile** : Expo SDK 52, Expo Router, React Native Reanimated
- **API** : tRPC v11 (type-safe end-to-end)
- **Base de données** : PostgreSQL 16 + Drizzle ORM
- **Auth** : Better Auth (email/password + Google + Apple)
- **Paiements** : Stripe Connect
- **Emails** : Resend
- **Storage** : MinIO (S3-compatible)
- **Cache** : Redis 7
- **Déploiement** : Docker Compose sur Unraid

## Licence

Privé — Tous droits réservés.
