import { Processor, WorkerHost} from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<{ email: string; name: string }>) {
    this.logger.log(`Traitement du job commencé: ${job.id}`);
    const { email, name } = job.data;
    this.logger.log(`Envoi d'email à ${email} (${name})`);
    // Simulation d'envoi d'email
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.logger.log(`Email envoyé à ${email}`);
    return true;
  }
}