import { Configuration, Value } from "@itgorillaz/configify";
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsIn,
  ValidateIf,
} from "class-validator";
import { Transform } from "class-transformer";

const toBoolean = (value: string) => ["1", "true"].includes(value);

@Configuration()
export class DatabaseConfig {
  @IsNotEmpty({ message: "Node environment should not be empty" })
  @IsString({ message: "Node environment should be a string" })
  @Value("NODE_ENV")
  nodeEnv: string;

  @IsNotEmpty({ message: "DB type should not be empty" })
  @IsString({ message: "DB type should be a string" })
  @IsIn(["mongodb", "postgres", "txt", "duckdb"], {
    message: "DB type should be one of mongodb, postgres, txt, duckdb",
  })
  @Value("DB_TYPE")
  dbType: string;

  @ValidateIf((o) => !["txt", "duckdb"].includes(o.dbType))
  @IsNotEmpty({ message: "DB host should not be empty for this database type" })
  @IsString({ message: "DB host should be a string" })
  @Value("DB_HOST")
  dbHost: string;

  @ValidateIf((o) => !["txt", "duckdb"].includes(o.dbType))
  @Value("DB_PORT")
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  })
  // @Min(1, { message: 'DB port should be at least 1' })
  // @Max(65535, { message: 'DB port should be at most 65535' })
  dbPort: number;

  @ValidateIf((o) => !["txt", "duckdb"].includes(o.dbType))
  @IsNotEmpty({ message: "DB name should not be empty for this database type" })
  @IsString({ message: "DB name should be a string" })
  @Value("DB_NAME")
  dbName: string;

  @ValidateIf((o) => ["txt", "duckdb"].includes(o.dbType))
  @IsString({ message: "DB path should be a string" })
  @IsNotEmpty({ message: "DB path should not be empty for this database type" })
  @Value("DB_PATH", { default: "./data" })
  dbPath: string = "./data";

  @ValidateIf((o) => o.dbType === "postgres")
  @IsNotEmpty({ message: "DB user should not be empty for PostgreSQL" })
  @IsString({ message: "DB user should be a string" })
  @Value("DB_USER", { default: "" })
  dbUser: string;

  @ValidateIf((o) => o.dbType === "postgres")
  @IsNotEmpty({ message: "DB password should not be empty for PostgreSQL" })
  @IsString({ message: "DB password should be a string" })
  @Value("DB_PASSWORD", { default: "" })
  dbPassword: string;

  @IsBoolean({ message: "DB sync should be a boolean" })
  @Value("DB_SYNC", { parse: toBoolean })
  dbSync: boolean;
}
