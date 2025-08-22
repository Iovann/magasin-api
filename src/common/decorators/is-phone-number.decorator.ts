import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { PhoneNumberUtil } from "google-libphonenumber";

@ValidatorConstraint({ async: false })
export class IsPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phoneNumber: any ) {
    if (typeof phoneNumber !== "string") {
      return false;
    }
    const phoneUtil = PhoneNumberUtil.getInstance();
    try {
      const parsedNumber = phoneUtil.parse(phoneNumber);
      return phoneUtil.isValidNumber(parsedNumber);
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return "Phone number ($value) is not valid.";
  }
}

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneNumberConstraint,
    });
  };
}
