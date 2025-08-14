import { Module, Global } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import { ErrorHandlingService } from "./error-handling";

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'info',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
  providers: [ErrorHandlingService],
  exports: [ErrorHandlingService],
})
export class ErrorHandlingModule {}
