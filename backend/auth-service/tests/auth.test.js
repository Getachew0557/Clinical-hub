import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../src/routes/authRoutes.js';
import sequelize, { ensureDatabaseExists } from '../src/config/database.js';
import User from '../src/models/User.js';

// Setup app for testing
const app = express();
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);

describe('Auth Service Integration Tests', () => {
    let testUser = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Patient'
    };

    let authToken = '';

    beforeAll(async () => {
        // Ensure database exists for testing
        await ensureDatabaseExists();
        // Sync database before tests
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('User Registration', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', testUser.email);
        });

        it('should not register a user with an existing email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('message', 'User already exists');
        });
    });

    describe('User Login', () => {
        it('should login an existing user and return a token', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            authToken = res.body.token;
        });

        it('should not login with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('message', 'Invalid email or password');
        });
    });

    describe('Get Current User (Me)', () => {
        it('should get profile with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('email', testUser.email);
        });

        it('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer invalidtoken`);

            expect(res.statusCode).toEqual(401);
        });
    });
});
