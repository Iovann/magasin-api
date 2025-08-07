import { Role } from '../../../common/enum/role.enum';

export interface User {
  id: string;
  email: string;
  passwordHash?: string; // Optional pour éviter son envoi dans les réponses
  role: Role;
  createdAt: Date;
}
