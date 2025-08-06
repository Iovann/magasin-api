import { Configuration, Value } from '@itgorillaz/configify';
import {
    IsNotEmpty,
    IsString,
    IsBoolean,
    IsIn,
    ValidateIf,
    Min,
    Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

const toBoolean = (value: string) => ['1', 'true'].includes(value);

@Configuration()
export class DatabaseConfig {
    @IsNotEmpty({ message: 'Node environment should not be empty' })
    @IsString({ message: 'Node environment should be a string' })
    @Value('NODE_ENV')
    nodeEnv: string;

    @IsNotEmpty({ message: 'DB type should not be empty' })
    @IsString({ message: 'DB type should be a string' })
    @IsIn(['mongodb', 'postgres', 'txt'], {
        message: 'DB type should be one of mongodb, postgres, txt',
    })
    @Value('DB_TYPE')
    dbType: string;

    @ValidateIf(o => o.dbType !== 'txt' )
    @IsNotEmpty({ message: 'DB host should not be empty' })
    @IsString({ message: 'DB host should be a string' })
    @Value('DB_HOST')
    dbHost: string;

    @ValidateIf(o => o.dbType !== 'txt' )
    @IsNotEmpty({ message: 'DB port should not be empty' })
    @Transform(({ value }) => parseInt(value, 10))
    @Min(1, { message: 'DB port should be at least 1' })
    @Max(65535, { message: 'DB port should be at most 65535' })
    @Value('DB_PORT')
    dbPort: number;

    @ValidateIf(o => o.dbType !== 'txt' )
    @IsNotEmpty({ message: 'DB name should not be empty' })
    @IsString({ message: 'DB name should be a string' })
    @Value('DB_NAME')
    dbName: string;

    @ValidateIf(o => o.dbType === 'txt' )
    @IsString({ message: 'DB path should be a string' })
    @Value('DB_PATH', { default: './data' })
    dbPath: string = './data';

    @ValidateIf(o => o.dbType !== 'txt' )
    @IsNotEmpty({ message: 'DB user should not be empty' })
    @IsString({ message: 'DB user should be a string' })
    @Value('DB_USER')
    dbUser: string;

    @ValidateIf(o => o.dbType !== 'txt' )
    @IsNotEmpty({ message: 'DB password should not be empty' })
    @IsString({ message: 'DB password should be a string' })
    @Value('DB_PASSWORD')
    dbPassword: string;

    @IsBoolean({ message: 'DB sync should be a boolean' })
    @Value('DB_SYNC', { parse: toBoolean })
    dbSync: boolean;
}