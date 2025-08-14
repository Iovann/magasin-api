# Système de Révocation des Tokens JWT

## Vue d'ensemble

Ce document explique comment le système de révocation des tokens JWT fonctionne dans l'application MagasinX.

## Problème initial

Par défaut, les JWT (JSON Web Tokens) sont **stateless** (sans état), ce qui signifie qu'une fois émis, ils restent valides jusqu'à leur expiration. Il n'est pas possible de les révoquer avant leur expiration naturelle.

## Solutions implémentées

### 1. Token Versioning (Versioning des Tokens)

**Principe :** Chaque utilisateur a un numéro de version de token qui est incrémenté à chaque action de révocation.

**Avantages :**
- Invalide instantanément tous les tokens existants d'un utilisateur
- Pas besoin de stocker chaque token individuellement
- Performance optimale

**Implémentation :**
```typescript
// Dans l'entité User
tokenVersion?: number;

// Dans AuthService
async incrementTokenVersion(userId: string): Promise<User> {
  const user = await this.userRepository.findById(userId);
  const currentVersion = user.tokenVersion || 0;
  return this.userRepository.update(userId, {
    tokenVersion: currentVersion + 1,
  });
}
```

### 2. Token Blacklist (Liste Noire)

**Principe :** Stockage des tokens révoqués dans une liste noire avec expiration automatique.

**Avantages :**
- Révocation granulaire (token par token)
- Nettoyage automatique des tokens expirés
- Flexibilité maximale

**Implémentation :**
```typescript
// Dans TokenBlacklistService
private blacklistedTokens = new Map<string, number>();

addToBlacklist(token: string, expirationTime: number): void {
  const expirationTimestamp = Date.now() + (expirationTime * 1000);
  this.blacklistedTokens.set(token, expirationTimestamp);
}

isBlacklisted(token: string): boolean {
  const expirationTimestamp = this.blacklistedTokens.get(token);
  return expirationTimestamp && Date.now() <= expirationTimestamp;
}
```

### 3. Token Type Validation

**Principe :** Chaque token contient un champ `type` pour distinguer les access tokens des refresh tokens.

**Avantages :**
- Sécurité renforcée
- Prévention d'utilisation incorrecte des tokens

## Endpoints disponibles

### 1. Logout standard
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Actions :**
- Ajoute le token actuel à la liste noire
- Incrémente la version des tokens de l'utilisateur
- Supprime le refresh token de la base de données

### 2. Force logout toutes les sessions
```http
POST /auth/force-logout-all
Authorization: Bearer <access_token>
```

**Actions :**
- Incrémente la version des tokens de l'utilisateur
- Invalide tous les tokens existants (access et refresh)
- Supprime le refresh token de la base de données

### 3. Changement de mot de passe
```http
POST /auth/change-password
Authorization: Bearer <access_token>
Body: { currentPassword, newPassword }
```

**Actions :**
- Change le mot de passe
- Incrémente automatiquement la version des tokens
- Invalide toutes les sessions existantes

## Vérification des tokens

### 1. Interceptor de révocation
```typescript
@Injectable()
export class TokenRevocationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    
    if (this.authService.isTokenRevoked(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }
    
    return next.handle();
  }
}
```

### 2. Stratégie JWT
```typescript
async validate(payload: any) {
  // Vérifier le type de token
  if (payload.type !== 'access') {
    throw new UnauthorizedException('Invalid token type');
  }
  
  // Vérifier la version du token
  const user = await this.usersService.findOne(payload.sub);
  if (payload.tokenVersion !== user.tokenVersion) {
    throw new UnauthorizedException('Token version mismatch');
  }
  
  return user;
}
```

## Configuration recommandée

### Variables d'environnement
```env
# Durée de vie des tokens
JWT_EXPIRATION_TIME=15m          # Access token: 15 minutes
JWT_REFRESH_EXPIRATION_TIME=7d   # Refresh token: 7 jours

# Secrets
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

### Durées de vie recommandées
- **Access Token :** 15-30 minutes
- **Refresh Token :** 7-30 jours
- **Nettoyage de la blacklist :** Toutes les minutes

## Améliorations pour la production

### 1. Utilisation de Redis
```typescript
// Au lieu de Map en mémoire
@Injectable()
export class RedisTokenBlacklistService {
  constructor(private readonly redisService: RedisService) {}
  
  async addToBlacklist(token: string, expirationTime: number): Promise<void> {
    await this.redisService.setex(token, expirationTime, 'revoked');
  }
  
  async isBlacklisted(token: string): Promise<boolean> {
    return await this.redisService.exists(token) === 1;
  }
}
```

### 2. Monitoring et métriques
```typescript
// Ajouter des métriques
@Injectable()
export class TokenMetricsService {
  incrementRevokedTokens() {
    // Envoyer métrique à Prometheus/Grafana
  }
  
  trackTokenUsage(tokenType: 'access' | 'refresh') {
    // Suivre l'utilisation des tokens
  }
}
```

### 3. Rate limiting
```typescript
// Limiter les tentatives de refresh
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 tentatives par minute
@Post('refresh')
async refresh() {
  // ...
}
```

## Sécurité

### Bonnes pratiques
1. **Toujours utiliser HTTPS** en production
2. **Stockage sécurisé** des secrets JWT
3. **Rotation régulière** des secrets
4. **Monitoring** des tentatives d'accès non autorisées
5. **Logs d'audit** pour toutes les actions de révocation

### Gestion des erreurs
```typescript
// Messages d'erreur sécurisés
throw new UnauthorizedException('Invalid credentials'); // Au lieu de "Token expired"
```

## Tests

### Tests unitaires
```typescript
describe('TokenRevocation', () => {
  it('should revoke access token on logout', async () => {
    // Test de révocation
  });
  
  it('should invalidate all tokens on force logout', async () => {
    // Test de force logout
  });
});
```

### Tests d'intégration
```typescript
describe('Auth Flow', () => {
  it('should handle complete auth flow with revocation', async () => {
    // Test du flux complet
  });
});
```

## Conclusion

Ce système de révocation des tokens offre :
- **Sécurité renforcée** avec invalidation immédiate
- **Performance optimale** avec versioning des tokens
- **Flexibilité** avec liste noire granulaire
- **Scalabilité** avec possibilité d'utilisation de Redis

La combinaison de ces approches garantit une gestion robuste et sécurisée des sessions utilisateur.
