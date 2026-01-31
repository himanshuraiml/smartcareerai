import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '../schemas/auth.schema';

describe('Auth Schemas', () => {
    describe('RegisterSchema', () => {
        it('validates correct registration data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'Password123',
                name: 'John Doe',
            };

            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('validates registration without optional fields', () => {
            const validData = {
                email: 'test@example.com',
                password: 'Password123',
            };

            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('validates registration with targetJobRoleId', () => {
            const validData = {
                email: 'test@example.com',
                password: 'Password123',
                targetJobRoleId: '123e4567-e89b-12d3-a456-426614174000',
            };

            const result = RegisterSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('rejects invalid email', () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'Password123',
            };

            const result = RegisterSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toBe('Invalid email address');
            }
        });

        it('rejects password without uppercase', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'password123',
            };

            const result = RegisterSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors.some(e =>
                    e.message.includes('uppercase')
                )).toBe(true);
            }
        });

        it('rejects password without lowercase', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'PASSWORD123',
            };

            const result = RegisterSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors.some(e =>
                    e.message.includes('lowercase')
                )).toBe(true);
            }
        });

        it('rejects password without number', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'PasswordABC',
            };

            const result = RegisterSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors.some(e =>
                    e.message.includes('number')
                )).toBe(true);
            }
        });

        it('rejects password too short', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'Pass1',
            };

            const result = RegisterSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors.some(e =>
                    e.message.includes('8 characters')
                )).toBe(true);
            }
        });

        it('rejects name too short', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'Password123',
                name: 'J',
            };

            const result = RegisterSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors.some(e =>
                    e.message.includes('2 characters')
                )).toBe(true);
            }
        });

        it('rejects invalid targetJobRoleId format', () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'Password123',
                targetJobRoleId: 'not-a-uuid',
            };

            const result = RegisterSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('LoginSchema', () => {
        it('validates correct login data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'anypassword',
            };

            const result = LoginSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('rejects invalid email', () => {
            const invalidData = {
                email: 'not-an-email',
                password: 'password123',
            };

            const result = LoginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('rejects empty password', () => {
            const invalidData = {
                email: 'test@example.com',
                password: '',
            };

            const result = LoginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toBe('Password is required');
            }
        });

        it('rejects missing email', () => {
            const invalidData = {
                password: 'password123',
            };

            const result = LoginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('rejects missing password', () => {
            const invalidData = {
                email: 'test@example.com',
            };

            const result = LoginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('RefreshTokenSchema', () => {
        it('validates correct refresh token', () => {
            const validData = {
                refreshToken: 'some-refresh-token-value',
            };

            const result = RefreshTokenSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('rejects empty refresh token', () => {
            const invalidData = {
                refreshToken: '',
            };

            const result = RefreshTokenSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toBe('Refresh token is required');
            }
        });

        it('rejects missing refresh token', () => {
            const invalidData = {};

            const result = RefreshTokenSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});
