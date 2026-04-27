# Configuration eBay OAuth

## Étapes de configuration dans le Developer Portal eBay

### 1. Accéder aux paramètres OAuth
- Allez sur https://developer.ebay.com/my/keys
- Sélectionnez votre application (Fuki-S)
- Cliquez sur "User Tokens" ou "OAuth"

### 2. Configurer les URLs de redirection

Dans la section **OAuth Redirect URIs**, ajoutez :

#### Pour le développement local (Sandbox) :
- **Auth accepted URL** : `http://localhost:3000/api/ebay/callback`
- **Auth declined URL** : `http://localhost:3000/dashboard/connections?error=ebay_denied`

#### Pour la production :
- **Auth accepted URL** : `https://votre-domaine.com/api/ebay/callback`
- **Auth declined URL** : `https://votre-domaine.com/dashboard/connections?error=ebay_denied`

### 3. Vérifier les Scopes OAuth

Assurez-vous que votre application a accès aux scopes suivants :
- `https://api.ebay.com/oauth/api_scope/sell.account`
- `https://api.ebay.com/oauth/api_scope/sell.inventory`

Pour ajouter des scopes supplémentaires (optionnel) :
- `https://api.ebay.com/oauth/api_scope/commerce.identity.readonly`
- `https://api.ebay.com/oauth/api_scope/sell.marketing`

### 4. Vérifier les variables d'environnement

Dans votre fichier `.env`, assurez-vous d'avoir :

```env
# eBay Sandbox
EBAY_CLIENT_ID="your-sandbox-client-id"
EBAY_CLIENT_SECRET="your-sandbox-client-secret"
EBAY_REDIRECT_URI="http://localhost:3000/api/ebay/callback"
```

**Important** : L'URL dans `EBAY_REDIRECT_URI` doit correspondre EXACTEMENT à celle configurée dans le Developer Portal.

### 5. Tester la connexion

1. Démarrez votre serveur : `npm run dev`
2. Connectez-vous à votre application
3. Allez sur `/dashboard/connections`
4. Cliquez sur "Connecter eBay"
5. Vous serez redirigé vers eBay pour autoriser l'application
6. Après autorisation, vous serez redirigé vers votre callback

## Erreurs courantes

### "invalid_request" (400)
- Vérifiez que `EBAY_REDIRECT_URI` correspond exactement à l'URL configurée dans eBay
- Vérifiez que les scopes demandés sont autorisés pour votre application
- Assurez-vous que `client_id` est correct

### "invalid_scope"
- Certains scopes ne sont pas disponibles en sandbox
- Vérifiez que votre application a accès aux scopes demandés dans le Developer Portal

### "unauthorized_client"
- Vérifiez que `EBAY_CLIENT_ID` et `EBAY_CLIENT_SECRET` sont corrects
- Assurez-vous d'utiliser les credentials Sandbox pour le sandbox

## Passer en Production

Quand vous êtes prêt pour la production :

1. Obtenez vos credentials de production depuis le Developer Portal
2. Mettez à jour votre `.env` :
```env
EBAY_CLIENT_ID="your-production-client-id"
EBAY_CLIENT_SECRET="your-production-client-secret"
EBAY_REDIRECT_URI="https://votre-domaine.com/api/ebay/callback"
```

3. Changez les URLs dans le code :
   - `https://auth.sandbox.ebay.com` → `https://auth.ebay.com`
   - `https://api.sandbox.ebay.com` → `https://api.ebay.com`

4. Configurez les redirect URIs de production dans le Developer Portal
