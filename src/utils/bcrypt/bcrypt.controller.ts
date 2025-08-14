import { Controller } from '@nestjs/common';
import { BcryptService } from './bcrypt.service';

@Controller()
export class BcryptController {
  constructor(private readonly bcryptService: BcryptService) {}
}
