import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MinLength,
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from "class-validator";

export function IsPasswordsMatching(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: "isPasswordsMatching",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          if (relatedValue === undefined || relatedValue === null) {
            return true;
          }
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}

export class ChangePasswordDto {
  @ApiProperty({ example: "currentSecurePassword123" })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: "newSecurePassword456" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  newPassword: string;

  @ApiProperty({ example: "newSecurePassword456" })
  @IsString()
  @IsNotEmpty()
  @IsPasswordsMatching("newPassword", {
    message: "Confirm new password must match new password",
  })
  confirmNewPassword: string;
}
