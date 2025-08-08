import { SetMetadata } from "@nestjs/common";
import { Role } from "../enum/role.enum";
import { Resource, ProductAction, UserAction } from "../enum/permission.enum";

// Interface pour une permission complète
export interface Permission {
  resource: Resource;
  actions: (ProductAction | UserAction)[];
}

// Décorateurs principaux
export const Permissions = (permission: Permission) =>
  SetMetadata("permissions", permission);

export const RequireRoles = (roles: Role[]) =>
  SetMetadata("requiredRoles", roles);

export const ExcludeRoles = (roles: Role[]) =>
  SetMetadata("excludedRoles", roles);

// Décorateurs métier spécifiques (plus lisibles)
export const SuperAdminOnly = () => RequireRoles([Role.SuperAdmin]);

export const CanManageProducts = () =>
  RequireRoles([Role.SuperAdmin, Role.Magasinier]);

export const CanSellProducts = () =>
  RequireRoles([Role.SuperAdmin, Role.Magasinier, Role.Vendeur]);

export const CanManageUsers = () => RequireRoles([Role.SuperAdmin]);

// Version avec votre syntaxe originale adaptée
export const ProductPermissions = (actions: ProductAction[]) =>
  SetMetadata("permissions", { resource: Resource.PRODUCTS, actions });

export const UserPermissions = (actions: UserAction[]) =>
  SetMetadata("permissions", { resource: Resource.USERS, actions });
