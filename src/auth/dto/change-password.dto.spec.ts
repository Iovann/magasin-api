import { validate } from "class-validator";
import { ChangePasswordDto } from "./change-password.dto";

describe("ChangePasswordDto", () => {
  describe("ChangePasswordDto validation", () => {
    it("should pass validation with valid data", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "NewPassword123!";
      dto.confirmNewPassword = "NewPassword123!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should fail validation when currentPassword is missing", async () => {
      const dto = new ChangePasswordDto();
      dto.newPassword = "NewPassword123!";
      dto.confirmNewPassword = "NewPassword123!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // Only currentPassword missing
      expect(errors[0].property).toBe("currentPassword");
      expect(errors[0].constraints).toHaveProperty("isNotEmpty");
    });

    it("should fail validation when newPassword is missing", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.confirmNewPassword = "NewPassword123!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // Only newPassword missing
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("isNotEmpty");
    });

    it("should fail validation when confirmNewPassword is missing", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "NewPassword123!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("confirmNewPassword");
      expect(errors[0].constraints).toHaveProperty("isNotEmpty");
    });

    it("should fail validation when newPassword is too short", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "Short1!";
      dto.confirmNewPassword = "Short1!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("minLength");
    });

    it("should fail validation when newPassword lacks uppercase letter", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "newpassword123!";
      dto.confirmNewPassword = "newpassword123!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("matches");
    });

    it("should fail validation when newPassword lacks lowercase letter", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "NEWPASSWORD123!";
      dto.confirmNewPassword = "NEWPASSWORD123!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("matches");
    });

    it("should fail validation when newPassword lacks number", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "NewPassword!";
      dto.confirmNewPassword = "NewPassword!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("matches");
    });

    it("should fail validation when newPassword lacks special character", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "NewPassword123";
      dto.confirmNewPassword = "NewPassword123";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("matches");
    });

    it("should pass validation with password containing various special characters", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "Test@123";
      dto.confirmNewPassword = "Test@123";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should fail validation when passwords do not match", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "NewPassword123!";
      dto.confirmNewPassword = "DifferentPassword123!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("confirmNewPassword");
      expect(errors[0].constraints).toHaveProperty("isPasswordsMatching");
    });

    it("should pass validation with complex password", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "Complex@Pass123";
      dto.confirmNewPassword = "Complex@Pass123";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle passwords with spaces", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "Password With Spaces123!";
      dto.confirmNewPassword = "Password With Spaces123!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("matches");
    });

    it("should handle unicode characters", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "Pässwörd123!";
      dto.confirmNewPassword = "Pässwörd123!";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("matches");
    });

    it("should handle empty strings", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "";
      dto.newPassword = "";
      dto.confirmNewPassword = "";

      const errors = await validate(dto);
      expect(errors).toHaveLength(3);
      expect(errors.every((error) => error.constraints.isNotEmpty)).toBe(true);
    });

    it("should handle null values", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = null as any;
      dto.newPassword = null as any;
      dto.confirmNewPassword = null as any;

      const errors = await validate(dto);
      expect(errors).toHaveLength(3);
      expect(errors.every((error) => error.constraints.isNotEmpty)).toBe(true);
    });
  });
});
