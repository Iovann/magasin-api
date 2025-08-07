export enum Resource {
  USERS = 'users',
  PRODUCTS = 'products',
}

export enum Action {
  CREATE = 'create',
  READ = 'read', 
  UPDATE = 'update',
  DELETE = 'delete',
  SELL = 'sell', // Action métier spécifique
}

// Actions métier pour plus de clarté
export enum ProductAction {
  CREATE_MODEL = 'create_model',      // Ajouter nouveau modèle
  DELETE_MODEL = 'delete_model',      // Supprimer modèle  
  SELL = 'sell',                      // Marquer comme vendu
  UPDATE_STOCK = 'update_stock',      // Modifier stock
  VIEW = 'view',                      // Consulter
}

export enum UserAction {
  CREATE = 'create',                  // Créer utilisateur
  DELETE = 'delete',                  // Supprimer utilisateur
  UPDATE = 'update',                  // Modifier utilisateur
  VIEW = 'view',                      // Consulter utilisateurs
}
