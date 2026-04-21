# Configuration Cloudflare R2 pour l'upload d'images

## Étapes de configuration

### 1. Créer un bucket R2

1. Va sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Clique sur **R2** dans le menu de gauche
3. Clique sur **Create bucket**
4. Nomme ton bucket (ex: `fuki-messages`)
5. Choisis la région (ex: `EEUR` pour Europe de l'Est)
6. Clique sur **Create bucket**

### 2. Obtenir les credentials API

1. Dans la page R2, clique sur **Manage R2 API Tokens**
2. Clique sur **Create API token**
3. Donne un nom (ex: `fuki-app-upload`)
4. Permissions: **Object Read & Write**
5. Clique sur **Create API Token**
6. **IMPORTANT**: Copie immédiatement:
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint URL** (format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)

### 3. Configurer l'accès public (optionnel mais recommandé)

1. Va dans ton bucket
2. Clique sur **Settings**
3. Sous **Public access**, clique sur **Allow Access**
4. Tu peux aussi configurer un **Custom Domain** pour avoir une URL propre:
   - Clique sur **Connect Domain**
   - Entre ton domaine (ex: `cdn.fuki.com`)
   - Suis les instructions DNS

### 4. Remplir le fichier `.env`

```env
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=ton_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=ton_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=fuki-messages
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

**Notes:**
- `CLOUDFLARE_R2_ENDPOINT`: L'endpoint que tu as copié à l'étape 2
- `CLOUDFLARE_R2_ACCESS_KEY_ID`: L'Access Key ID
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`: Le Secret Access Key
- `CLOUDFLARE_R2_BUCKET_NAME`: Le nom de ton bucket (ex: `fuki-messages`)
- `CLOUDFLARE_R2_PUBLIC_URL`: 
  - Si tu as activé l'accès public: `https://pub-xxxxx.r2.dev` (fourni par Cloudflare)
  - Si tu as un custom domain: `https://cdn.fuki.com`

### 5. Installer les dépendances

```bash
pnpm install
```

### 6. Tester l'upload

1. Lance le serveur: `pnpm dev`
2. Va sur la page messages
3. Sélectionne une image
4. Clique sur envoyer
5. Vérifie la console pour voir:
   - 📸 Image reçue
   - ☁️ Upload vers R2
   - ✅ Image uploadée: [URL]

## Structure des URLs

Les images seront stockées avec ce format:
```
messages/1234567890-abc123.jpg
```

Et accessibles via:
```
https://pub-xxxxx.r2.dev/messages/1234567890-abc123.jpg
```

## Coûts

Cloudflare R2 est très économique:
- **Stockage**: $0.015/GB/mois
- **Opérations**: Gratuites (Class A et B)
- **Bande passante sortante**: **GRATUITE** (pas de frais d'egress)
- **10 GB gratuits** par mois

Pour une app de messagerie, ça devrait coûter presque rien! 🎉
