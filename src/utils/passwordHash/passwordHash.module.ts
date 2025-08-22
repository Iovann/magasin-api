import { Module } from "@nestjs/common";
import { passwordHash } from "./passwordHash.service";

@Module({
  providers: [passwordHash],
  exports: [passwordHash],
})
export class passwordHashModule {}
