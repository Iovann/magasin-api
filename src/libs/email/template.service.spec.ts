import { Test, TestingModule } from "@nestjs/testing";
import { TemplateService } from "./template.service";
import * as fs from "fs";
import * as ejs from "ejs";
import { join } from "path";

// Mock fs.readFileSync
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

// Mock ejs.render
jest.mock("ejs", () => ({
  render: jest.fn(),
}));

describe("TemplateService", () => {
  let service: TemplateService;

  let module: TestingModule;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [TemplateService],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  afterEach(() => {
    module.close();
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("render", () => {
    const templateName = "welcome";
    const mockData = { name: "Test User", email: "test@example.com" };
    const mockTemplateContent = "Hello <%= name %>";
    const mockRenderedHtml = "Hello Test User";

    beforeEach(() => {
      (fs.readFileSync as jest.Mock).mockReturnValue(mockTemplateContent);
      (ejs.render as jest.Mock).mockReturnValue(mockRenderedHtml);
    });

    it("should read the template file from the correct path", async () => {
      await service.render(templateName, mockData);

      // Calculate the expected path based on the service's logic
      // This assumes the test file is in the same directory structure as the service
      const expectedPath = join(
        __dirname,
        "..",
        "..",
        "utils",
        "templates",
        `${templateName}.ejs`,
      );

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, "utf-8");
    });

    it("should render the template with provided data", async () => {
      const result = await service.render(templateName, mockData);

      expect(ejs.render).toHaveBeenCalledTimes(1);
      expect(ejs.render).toHaveBeenCalledWith(mockTemplateContent, mockData);
      expect(result).toBe(mockRenderedHtml);
    });

    it("should throw an error if template file cannot be read", async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error("File not found");
      });

      await expect(service.render(templateName, mockData)).rejects.toThrow(
        "File not found",
      );
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(ejs.render).not.toHaveBeenCalled();
    });

    it("should throw an error if ejs rendering fails", async () => {
      (ejs.render as jest.Mock).mockImplementation(() => {
        throw new Error("EJS render error");
      });

      await expect(service.render(templateName, mockData)).rejects.toThrow(
        "EJS render error",
      );
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(ejs.render).toHaveBeenCalledTimes(1);
    });
  });
});
