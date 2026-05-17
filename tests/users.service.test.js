import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';

// Mock pg to prevent Sequelize from connecting to a real database
vi.mock('pg', () => ({
  default: {},
  Pool: vi.fn(),
}));

// Now import the service and models — no real DB connection
const { models } = await import('../../lib/sequelize');
const UserServiceModule = await import('../../services/users.service.js');
const UserService = UserServiceModule.default;
const { OAuth2Client } = await import('google-auth-library');

describe('UserService — bcrypt password handling', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    // Reset all model methods to vi.fn() before each test
    models.User.findOne = vi.fn();
    models.User.findByPk = vi.fn();
    models.User.create = vi.fn();
    models.User.findAll = vi.fn();
    models.Updatable.findByPk = vi.fn();
    models.UserCountry.findAll = vi.fn();
    models.UserCountry.findOne = vi.fn();
    models.UserCountry.create = vi.fn();
    models.UserCountry.destroy = vi.fn();
    models.Country.findByPk = vi.fn();
    models.Country.findAll = vi.fn();
  });

  // ─── T8: create() stores a bcrypt hash, not plain-text password (R1, R2) ───

  describe('create() — password hashing on creation', () => {
    it('should hash the password with bcrypt before storing the user (R1, R2)', async () => {
      const plainPassword = 'mySecretPassword123';

      // Allow user creation
      models.Updatable.findByPk.mockResolvedValue({ updatable_user: true });
      // No existing user with this email or username
      models.User.findOne
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // username check
      // Mock the created user
      const mockNewUser = {
        id: 1,
        password: '',
        update: vi.fn().mockResolvedValue({ id: 1 }),
      };
      models.User.create.mockImplementation(async (data) => {
        mockNewUser.password = data.password;
        mockNewUser.id = 1;
        return mockNewUser;
      });
      // Mock findByPk for the final findOne call
      models.User.findByPk.mockResolvedValue({ id: 1, username: 'testuser' });

      try {
        await userService.create({
          email: 'test@example.com',
          username: 'testuser',
          password: plainPassword,
        });
      } catch (e) {
        // Email sending may fail in test env — that's fine, we already captured create()
      }

      const createCallArgs = models.User.create.mock.calls[0][0];

      // The password passed to models.User.create should be a bcrypt hash, not plaintext
      expect(createCallArgs.password).not.toBe(plainPassword);
      expect(createCallArgs.password).toMatch(/^\$2[aby]\$/);
      // Verify that bcrypt.compareSync(plainPassword, hash) returns true
      expect(bcrypt.compareSync(plainPassword, createCallArgs.password)).toBe(true);
    });
  });

  // ─── T9: loginByEmail() authenticates with plain-text password (R3) ───

  describe('loginByEmail() — plain-text password comparison', () => {
    it('should authenticate with a plain-text password against the stored bcrypt hash (R3)', async () => {
      const plainPassword = 'mySecretPassword123';
      const reversedPassword = plainPassword.split('').reverse().join('');
      const hashedPassword = bcrypt.hashSync(reversedPassword, bcrypt.genSaltSync(12));

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        update: vi.fn().mockResolvedValue({ id: 1 }),
      };
      models.User.findOne.mockResolvedValue(mockUser);
      models.User.findByPk.mockResolvedValue({ id: 1, username: 'testuser' });

      const result = await userService.loginByEmail('test@example.com', plainPassword);
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should reject an incorrect plain-text password (R3)', async () => {
      const plainPassword = 'mySecretPassword123';
      const reversedPassword = plainPassword.split('').reverse().join('');
      const hashedPassword = bcrypt.hashSync(reversedPassword, bcrypt.genSaltSync(12));

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
      };
      models.User.findOne.mockResolvedValue(mockUser);

      await expect(
        userService.loginByEmail('test@example.com', 'wrongPassword')
      ).rejects.toThrow('Incorrect email or password');
    });
  });

  // ─── T10: loginByName() authenticates with plain-text password (R4) ───

  describe('loginByName() — plain-text password comparison', () => {
    it('should authenticate with a plain-text password against the stored bcrypt hash (R4)', async () => {
      const plainPassword = 'mySecretPassword123';
      const reversedPassword = plainPassword.split('').reverse().join('');
      const hashedPassword = bcrypt.hashSync(reversedPassword, bcrypt.genSaltSync(12));

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        update: vi.fn().mockResolvedValue({ id: 1 }),
      };
      models.User.findOne.mockResolvedValue(mockUser);
      models.User.findByPk.mockResolvedValue({ id: 1, username: 'testuser' });

      const result = await userService.loginByName('testuser', plainPassword);
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should reject an incorrect plain-text password (R4)', async () => {
      const plainPassword = 'mySecretPassword123';
      const reversedPassword = plainPassword.split('').reverse().join('');
      const hashedPassword = bcrypt.hashSync(reversedPassword, bcrypt.genSaltSync(12));

      const mockUser = {
        id: 1,
        username: 'testuser',
        password: hashedPassword,
      };
      models.User.findOne.mockResolvedValue(mockUser);

      await expect(
        userService.loginByName('testuser', 'wrongPassword')
      ).rejects.toThrow('Incorrect username or password');
    });
  });

  // ─── T11: Password reversal/transformation applied (R5) ───

  describe('Password reversal or transformation (R5)', () => {
    it('should reverse or transform the password before comparison — plain text is reversed (R5)', async () => {
      const plainPassword = 'abc123';
      const reversedPassword = plainPassword.split('').reverse().join('');
      // Store a hash of the reversed password
      const hashedPassword = bcrypt.hashSync(reversedPassword, bcrypt.genSaltSync(12));

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        update: vi.fn().mockResolvedValue({ id: 1 }),
      };
      models.User.findOne.mockResolvedValue(mockUser);
      models.User.findByPk.mockResolvedValue({ id: 1, username: 'testuser' });

      // loginByEmail should succeed with the plain-text password
      const result = await userService.loginByEmail('test@example.com', plainPassword);
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();

      // Verify that the reversed password directly does NOT work (because it gets reversed back)
      models.User.findOne.mockResolvedValue({
        ...mockUser,
        update: vi.fn().mockResolvedValue({ id: 1 }),
      });

      await expect(
        userService.loginByEmail('test@example.com', reversedPassword)
      ).rejects.toThrow('Incorrect email or password');
    });
  });

  // ─── T12: update() hashes new password with bcrypt (R6) ───

  describe('update() — password hashing on update', () => {
    it('should hash the new password with bcrypt before updating the user (R6)', async () => {
      const newPassword = 'newSecretPassword456';

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: bcrypt.hashSync('oldPassword', bcrypt.genSaltSync(12)),
        update: vi.fn().mockImplementation(async (data) => {
          return { ...mockUser, ...data, id: 1 };
        }),
      };
      models.User.findOne.mockResolvedValue(mockUser);
      models.User.findByPk.mockResolvedValue({ id: 1, username: 'testuser' });

      await userService.update(1, { password: newPassword });

      // The password passed to user.update should be a bcrypt hash
      const updateCallArgs = mockUser.update.mock.calls[0][0];
      expect(updateCallArgs.password).not.toBe(newPassword);
      expect(updateCallArgs.password).toMatch(/^\$2[aby]\$/);
      // Verify that bcrypt.compareSync(newPassword, hash) returns true
      expect(bcrypt.compareSync(newPassword, updateCallArgs.password)).toBe(true);
    });

    it('should not modify other fields when updating password (R6)', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: bcrypt.hashSync('oldPassword', bcrypt.genSaltSync(12)),
        update: vi.fn().mockImplementation(async (data) => {
          return { ...mockUser, ...data, id: 1 };
        }),
      };
      models.User.findOne.mockResolvedValue(mockUser);
      models.User.findByPk.mockResolvedValue({ id: 1, username: 'testuser' });

      await userService.update(1, { password: 'newPass', username: 'newname' });

      const updateCallArgs = mockUser.update.mock.calls[0][0];
      expect(updateCallArgs.username).toBe('newname');
      expect(updateCallArgs.password).not.toBe('newPass');
      expect(updateCallArgs.password).toMatch(/^\$2[aby]\$/);
    });

    it('should not hash the password field when it is not provided in the update data', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        update: vi.fn().mockImplementation(async (data) => {
          return { ...mockUser, ...data, id: 1 };
        }),
      };
      models.User.findOne.mockResolvedValue(mockUser);
      models.User.findByPk.mockResolvedValue({ id: 1, username: 'testuser' });

      await userService.update(1, { username: 'newname' });

      const updateCallArgs = mockUser.update.mock.calls[0][0];
      expect(updateCallArgs.password).toBeUndefined();
    });
  });

  // ─── accessWithGoogle() generates bcrypt-hashed password for new Google users (R7) ───

  describe('accessWithGoogle() — bcrypt password generation for new Google users (R7)', () => {
    let verifyIdTokenSpy;

    beforeEach(() => {
      // Spy on OAuth2Client.prototype.verifyIdToken to intercept Google OAuth
      // without mocking the entire google-auth-library module (which doesn't
      // work reliably for CJS require in the service file).
      verifyIdTokenSpy = vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({
          sub: '1234567890',
          email: 'testuser@gmail.com',
          name: 'Test User',
          picture: 'https://example.com/photo.jpg',
        }),
      });
    });

    afterEach(() => {
      verifyIdTokenSpy.mockRestore();
    });

    it('should generate and store a bcrypt-hashed password when creating a new Google user (R7)', async () => {
      // These values must match the mock verifyIdToken payload
      const sub = '1234567890';
      const name = 'Test User';

      // New user — not found by email
      models.User.findOne.mockResolvedValue(null);

      // Mock User.create to capture stored data
      const mockCreatedUser = {
        id: 42,
        password: '',
      };
      models.User.create.mockImplementation(async (data) => {
        mockCreatedUser.password = data.password;
        return mockCreatedUser;
      });

      // Mock findByPk for this.findOne() called after creation
      models.User.findByPk.mockResolvedValue({ id: 42, username: 'testuser' });

      // Compute the expected normalized name (same logic as the service)
      const normalizedName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replaceAll(/['"`]/g, '')
        .replaceAll(' ', '');

      try {
        await userService.accessWithGoogle({ credential: 'mock-google-credential' });
      } catch (e) {
        // JWT signing or findOne may fail without full DB/models — that's fine,
        // we already captured the create() call data
      }

      // Verify User.create was called
      expect(models.User.create).toHaveBeenCalled();
      const createCallArgs = models.User.create.mock.calls[0][0];

      // The password stored should be a bcrypt hash, not plain-text
      expect(createCallArgs.password).not.toBe(sub + normalizedName);
      expect(createCallArgs.password).toMatch(/^\$2[aby]\$/);

      // Verify that bcrypt.compareSync(sub + normalizedName + config.authp, hash) returns true
      const config = (await import('../../config/config')).default;
      const expectedPlaintext = sub + normalizedName + config.authp;
      expect(bcrypt.compareSync(expectedPlaintext, createCallArgs.password)).toBe(true);
    });
  });
});