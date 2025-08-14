# Exemple d'utilisation du système de révocation des tokens

## Scénario : Gestion des sessions utilisateur

### 1. Connexion utilisateur

```bash
# 1. L'utilisateur se connecte
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gunshop.com",
    "password": "password123"
  }'
```

**Réponse :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Actions côté serveur :**
- Génération des tokens avec `tokenVersion: 0`
- Stockage du refresh token hashé en base
- `tokenVersion` de l'utilisateur reste à 0

### 2. Utilisation normale des tokens

```bash
# 2. L'utilisateur accède à une ressource protégée
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Vérifications côté serveur :**
- Token valide (signature, expiration)
- Type = 'access'
- `tokenVersion` dans le payload = `tokenVersion` en base (0)
- Token non révoqué

### 3. Logout utilisateur

```bash
# 3. L'utilisateur se déconnecte
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Actions côté serveur :**
- Token ajouté à la blacklist
- `tokenVersion` incrémenté de 0 à 1
- Refresh token supprimé de la base

### 4. Tentative d'accès avec token révoqué

```bash
# 4. Tentative d'accès avec l'ancien token
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse :**
```json
{
  "statusCode": 401,
  "message": "Token has been revoked"
}
```

**Vérifications côté serveur :**
- Token trouvé dans la blacklist → **REJETÉ**

### 5. Tentative de refresh avec ancien token

```bash
# 5. Tentative de refresh avec l'ancien refresh token
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse :**
```json
{
  "statusCode": 401,
  "message": "Token version mismatch - user has been logged out"
}
```

**Vérifications côté serveur :**
- `tokenVersion` dans le payload (0) ≠ `tokenVersion` en base (1) → **REJETÉ**

## Scénario : Force logout toutes les sessions

### 1. Utilisateur connecté sur plusieurs appareils

```bash
# L'utilisateur est connecté sur :
# - Ordinateur de bureau (token A)
# - Mobile (token B)
# - Tablette (token C)
```

### 2. Force logout depuis l'ordinateur

```bash
curl -X POST http://localhost:3000/auth/force-logout-all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse :**
```json
{
  "message": "All sessions have been terminated successfully."
}
```

**Actions côté serveur :**
- `tokenVersion` incrémenté de 1 à 2
- Refresh token supprimé de la base

### 3. Toutes les sessions sont invalidées

```bash
# Tentative d'accès depuis mobile (token B)
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Tentative d'accès depuis tablette (token C)
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponses :**
```json
{
  "statusCode": 401,
  "message": "Token version mismatch - user has been logged out"
}
```

## Scénario : Changement de mot de passe

### 1. Changement de mot de passe

```bash
curl -X POST http://localhost:3000/auth/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword456"
  }'
```

**Réponse :**
```json
{
  "message": "Password changed successfully. All sessions have been terminated."
}
```

**Actions côté serveur :**
- Mot de passe mis à jour
- `tokenVersion` incrémenté
- Toutes les sessions invalidées

### 2. Toutes les sessions précédentes sont invalidées

```bash
# Tentative d'accès avec l'ancien token
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Réponse :**
```json
{
  "statusCode": 401,
  "message": "Token version mismatch - user has been logged out"
}
```

## Scénario : Gestion des erreurs

### 1. Token expiré

```bash
# Token expiré (après 15 minutes)
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer expired_token_here"
```

**Réponse :**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 2. Token malformé

```bash
# Token malformé
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer invalid_token"
```

**Réponse :**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 3. Utilisation d'un refresh token comme access token

```bash
# Tentative d'utiliser un refresh token comme access token
curl -X GET http://localhost:3000/products \
  -H "Authorization: Bearer refresh_token_here"
```

**Réponse :**
```json
{
  "statusCode": 401,
  "message": "Invalid token type"
}
```

## Monitoring et logs

### Logs de révocation

```typescript
// Dans les logs de l'application
{
  "level": "info",
  "message": "Token added to blacklist, expires at 2024-01-15T10:30:00.000Z",
  "timestamp": "2024-01-15T10:15:00.000Z"
}

{
  "level": "info",
  "message": "Token version incremented for user 507f1f77bcf86cd799439011",
  "newVersion": 2,
  "timestamp": "2024-01-15T10:15:00.000Z"
}
```

### Métriques recommandées

```typescript
// Métriques à suivre
{
  "tokens_revoked_total": 150,
  "force_logouts_total": 25,
  "blacklist_size": 45,
  "token_version_updates": 75
}
```

## Tests automatisés

### Test de révocation

```typescript
describe('Token Revocation', () => {
  it('should revoke token on logout', async () => {
    // 1. Login
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    const { accessToken } = loginResponse.body;
    
    // 2. Access protected resource
    await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    
    // 3. Logout
    await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    
    // 4. Try to access with revoked token
    await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });
});
```

## Conclusion

Ce système de révocation offre :

1. **Sécurité immédiate** : Les tokens sont invalidés instantanément
2. **Flexibilité** : Logout simple ou force logout global
3. **Performance** : Vérifications rapides avec versioning
4. **Robustesse** : Gestion des erreurs et monitoring
5. **Scalabilité** : Prêt pour la production avec Redis

La combinaison du versioning des tokens et de la liste noire garantit une sécurité maximale tout en maintenant de bonnes performances.
