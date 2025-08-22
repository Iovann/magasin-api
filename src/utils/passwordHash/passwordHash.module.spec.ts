import { Test, TestingModule } from '@nestjs/testing';
import { passwordHashModule } from './passwordHash.module';
import { passwordHash } from './passwordHash.service';

describe('passwordHashModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [passwordHashModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide passwordHash service', () => {
    const service = module.get<passwordHash>(passwordHash);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(passwordHash);
  });

  it('should export passwordHash service', () => {
    const exportedService = module.get<passwordHash>(passwordHash);
    expect(exportedService).toBeDefined();
    expect(exportedService).toBeInstanceOf(passwordHash);
  });
});
