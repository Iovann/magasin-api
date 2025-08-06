import { Role } from '../../../common/enum/role.enum';

export class User {
  id: string;
  email: string;
  passwordHash: string; // Important: ne jamais stocker le mot de passe en clair
  roles: Role[];
  createdAt: Date;
}
