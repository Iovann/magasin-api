import { Role } from '../../../common/enum/role.enum';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  roles: Role;
  createdAt: Date;
}
