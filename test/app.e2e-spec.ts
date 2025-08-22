import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import request from "supertest";
import { PostgresUser } from "../src/core/users/entities/postgres-user.entity";
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await dataSource.synchronize(true);
    
    // Créer un utilisateur de test
    const userRepository = dataSource.getRepository(PostgresUser);
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await userRepository.save({
      email: 'test@example.com',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
    });
  });

  it("/auth/login (POST) - should return tokens on successful login", async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it("/auth/login (POST) - should return 401 for invalid credentials", async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginData)
      .expect(401);
  });

  it("/auth/login (POST) - should return 400 for invalid email format", async () => {
    const loginData = {
      email: 'invalid-email',
      password: 'password123'
    };

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginData)
      .expect(401);
  });
});
