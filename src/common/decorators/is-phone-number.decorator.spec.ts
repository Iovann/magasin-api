import { Test, TestingModule } from '@nestjs/testing';
import { IsPhoneNumber } from './is-phone-number.decorator';
import { validate } from 'class-validator';

class TestPhoneNumberDto {
  @IsPhoneNumber()
  phoneNumber: string;
}

describe('IsPhoneNumber Decorator', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should validate a valid phone number', async () => {
    const dto = new TestPhoneNumberDto();
    dto.phoneNumber = '+2290191323202';
    
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate a non-string value', async () => {
    const dto = new TestPhoneNumberDto();
    dto.phoneNumber = 12345 as any; // TypeScript ignore car on teste un cas d'erreur
    
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('IsPhoneNumberConstraint');
  });

  it('should invalidate an invalid phone number', async () => {
    const dto = new TestPhoneNumberDto();
    dto.phoneNumber = 'not a phone number';
    
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('IsPhoneNumberConstraint');
  });

  it('should validate with country code', async () => {
    const dto = new TestPhoneNumberDto();
    dto.phoneNumber = '+1 650 253 0000';
    
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
