# MagasinX Project

Ce projet est une application de gestion de stock pour un magasin de pistolets à eau, développée avec [NestJS](https://nestjs.com/). Elle permet de gérer les produits et les utilisateurs, avec différents niveaux d'accès basés sur les rôles.

## Fonctionnalités

*   **Gestion des produits :** Créer, lire, mettre à jour et supprimer des modèles de pistolets à eau.
*   **Gestion des stocks :** Suivre la quantité de chaque modèle de pistolet.
*   **Ventes :** Enregistrer les ventes et mettre à jour le stock automatiquement.
*   **Gestion des utilisateurs :** Créer, lire et supprimer des utilisateurs.
*   **Contrôle d'accès basé sur les rôles (RBAC) :**
    *   **SuperAdmin :** Accès complet à toutes les fonctionnalités.
    *   **Magasinier :** Peut gérer les produits et les stocks.
    *   **Vendeur :** Peut consulter les produits et enregistrer les ventes.
*   **Support multi-bases de données :** L'application peut être configurée pour utiliser PostgreSQL, MongoDB ou un système de fichiers simple pour le stockage des données.

## Prérequis

*   [Node.js](https://nodejs.org/) (version 16 ou supérieure)
*   [pnpm](https://pnpm.io/)
*   Une instance de [PostgreSQL](https://www.postgresql.org/) ou [MongoDB](https://www.mongodb.com/) (facultatif, selon la configuration)

## Installation

1.  Clonez le dépôt :
    ```bash
    git clone <URL_DU_DEPOT>
    cd magasinxproject
    ```

2.  Installez les dépendances :
    ```bash
    pnpm install
    ```

## Configuration

L'application est configurée à l'aide de variables d'environnement. Créez un fichier `.env` à la racine du projet et ajoutez les variables suivantes :

```
# Configuration de la base de données
# DB_TYPE peut être 'postgres', 'mongodb', ou 'txt'
DB_TYPE=postgres

# Pour PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=magasinx
DB_SYNC=true

# Pour MongoDB
# DB_HOST=localhost
# DB_PORT=27017
# DB_NAME=magasinx
# DB_USER= (facultatif)
# DB_PASSWORD= (facultatif)

# Pour TXT
# DB_TYPE=txt
# DB_NAME=magasinx


# Configuration de l'application
PORT=3000

```

## Utilisation

### Lancement de l'application

*   **Mode développement :**
    ```bash
    pnpm run start:dev
    ```
    L'application sera disponible à l'adresse `http://localhost:3000`.


### Endpoints de l'API

La documentation complète de l'API est disponible via Swagger à l'adresse `http://localhost:3000/api/docs` lorsque l'application est en cours d'exécution.

#### Produits

*   `POST /products` : Crée un nouveau modèle de pistolet.
*   `GET /products` : Récupère la liste de tous les pistolets.
*   `GET /products/stock` : Récupère le stock total de tous les pistolets.
*   `GET /products/:id` : Récupère un pistolet par son ID.
*   `PUT /products/:id` : Met à jour la quantité de stock d'un pistolet.
*   `DELETE /products/:id` : Supprime un modèle de pistolet.
*   `POST /products/:id/sell` : Enregistre la vente d'un pistolet.

#### Utilisateurs

*   `POST /users` : Crée un nouvel utilisateur.
*   `GET /users` : Récupère la liste de tous les utilisateurs.
*   `GET /users/stats` : Récupère les statistiques sur les utilisateurs.
*   `GET /users/:id` : Récupère un utilisateur par son ID.
*   `DELETE /users/:id` : Supprime un utilisateur.

## Scripts disponibles

*   `pnpm run build` : Compile l'application.
*   `pnpm run format` : Formate le code avec Prettier.
*   `pnpm run start` : Démarre l'application.
*   `pnpm run start:dev` : Démarre l'application en mode développement avec rechargement automatique.
*   `pnpm run start:prod` : Démarre l'application en mode production.
*   `pnpm run lint` : Analyse le code avec ESLint.
*   `pnpm run test` : Lance les tests unitaires.
*   `pnpm run test:watch` : Lance les tests unitaires en mode "watch".
*   `pnpm run test:cov` : Lance les tests unitaires et génère un rapport de couverture.
*   `pnpm run test:debug` : Lance les tests unitaires en mode débogage.
