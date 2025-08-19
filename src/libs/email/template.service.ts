import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import { join } from 'path';
import { readFileSync } from 'fs';

@Injectable()
export class TemplateService {
  private readonly templateDir = join(__dirname, '..', '..', 'utils', 'templates');

  async render(templateName: string, data: Record<string, any>): Promise<string> {
    const templatePath = join(this.templateDir, `${templateName}.ejs`);
    const template = readFileSync(templatePath, 'utf-8');
    return ejs.render(template, data);
  }
}