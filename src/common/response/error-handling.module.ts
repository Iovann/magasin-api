import { Module, Global } from "@nestjs/common";
import { ErrorHandlingService } from "./error-handling";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
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
