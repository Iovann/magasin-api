import { validate } from "class-validator";
import { ChangePasswordDto } from "./change-password.dto";

describe("ChangePasswordDto", () => {
  describe("ChangePasswordDto validation", () => {
    it("should pass validation with valid data", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "newpassword";
      dto.confirmNewPassword = "newpassword";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should fail validation when currentPassword is missing", async () => {
      const dto = new ChangePasswordDto();
      dto.newPassword = "newpassword";
      dto.confirmNewPassword = "newpassword";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("currentPassword");
      expect(errors[0].constraints).toHaveProperty("isNotEmpty");
    });

    it("should fail validation when newPassword is missing", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.confirmNewPassword = "newpassword";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("isNotEmpty");
    });

    it("should fail validation when confirmNewPassword is missing", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "newpassword";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("confirmNewPassword");
      expect(errors[0].constraints).toHaveProperty("isNotEmpty");
    });

    it("should fail validation when newPassword is too short", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "short";
      dto.confirmNewPassword = "short";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("newPassword");
      expect(errors[0].constraints).toHaveProperty("minLength");
    });

    it("should fail validation when passwords do not match", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "currentPassword123";
      dto.newPassword = "newpassword1";
      dto.confirmNewPassword = "newpassword2";

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("confirmNewPassword");
      expect(errors[0].constraints).toHaveProperty("isPasswordsMatching");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty strings", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "";
      dto.newPassword = "";
      dto.confirmNewPassword = "";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should handle whitespace only", async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = "   ";
      dto.newPassword = "   ";
      dto.confirmNewPassword = "   ";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
