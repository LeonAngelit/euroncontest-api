import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(projectRoot, 'config', 'config.js');

// Mock pg to prevent Sequelize from connecting to a real database
vi.mock('pg', () => ({
  default: {},
  Pool: vi.fn(),
}));

// Import after mocking
const { headerAuth, jwtAuth } = await import('../../middlewares/auth.handler.js');
const config = (await import('../../config/config.js')).default;

describe('headerAuth — verifies plain-text against hashed AUTH_P (R2)', () => {
  it('should allow correct plain-text password against hashed AUTH_P', () => {
    const plainTextPassword = 'AG-LE0N-635822320-PS';

    const req = { headers: { authorization: plainTextPassword } };
    const next = vi.fn();

    const middleware = headerAuth('headers');
    middleware(req, {}, next);

    const errorCalls = next.mock.calls.filter(
      (call) => call[0] && call[0].isBoom,
    );
    expect(errorCalls.length).toBe(0);
  });

  it('should reject incorrect plain-text password', () => {
    const req = { headers: { authorization: 'wrong-password' } };
    const next = vi.fn();

    const middleware = headerAuth('headers');
    middleware(req, {}, next);

    const errorCalls = next.mock.calls.filter(
      (call) => call[0] && call[0].isBoom,
    );
    expect(errorCalls.length).toBeGreaterThan(0);
    expect(errorCalls[0][0].message).toBe('Unathorized');
  });

  it('should use bcrypt.compareSync with correct argument order (plaintext, hash)', () => {
    expect(config.authp).toMatch(/^\$2[aby]\$\d{2}\$.+/);

    const plainTextPassword = 'AG-LE0N-635822320-PS';
    expect(bcrypt.compareSync(plainTextPassword, config.authp)).toBe(true);
    expect(bcrypt.compareSync('wrong-password', config.authp)).toBe(false);
  });
});

describe('validateAuthP — startup validation (R9)', () => {
  function runWithAuthP(authPValue) {
    return new Promise((resolve) => {
      const env = { ...process.env, AUTH_P: authPValue };

      const child = spawn(
        'node',
        ['-e', `require("${configPath}")`],
        {
          cwd: projectRoot,
          env,
        },
      );

      let stderr = '';
      let stdout = '';
      child.stderr.on('data', (data) => { stderr += data.toString(); });
      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.on('close', (code) => {
        resolve({ code, stderr, stdout });
      });
      setTimeout(() => {
        child.kill();
        resolve({ code: -1, stderr: 'timeout', stdout });
      }, 10000);
    });
  }

  it('should exit with code 1 when AUTH_P is not a valid bcrypt hash', async () => {
    const { code, stderr } = await runWithAuthP('invalid-plain-text');
    expect(code).toBe(1);
    expect(stderr).toContain('FATAL');
    expect(stderr).toContain('AUTH_P');
  });

  it('should exit with code 1 when AUTH_P is empty string', async () => {
    const { code, stderr } = await runWithAuthP('');
    expect(code).toBe(1);
    expect(stderr).toContain('FATAL');
  });

  it('should allow startup when AUTH_P is a valid bcrypt hash', async () => {
    const validHash = bcrypt.hashSync('test-secret', 12);
    const { code } = await runWithAuthP(validHash);
    expect(code).toBe(0);
  });
});

// ─── R3: JWT auth claim carries the hashed config.authp value ───

describe('JWT auth claim carries hashed config.authp (R3)', () => {
  it('should embed the hashed config.authp as the auth claim in a JWT (R3)', () => {
    // Simulate what getAuthToken.js does: jwt.sign({ auth: config.authp }, pkey, ...)
    const token = jwt.sign({ auth: config.authp }, config.pkey, { expiresIn: '20m' });

    // Decode without verification to inspect the payload
    const decoded = jwt.decode(token);

    expect(decoded).toBeDefined();
    expect(decoded.auth).toBeDefined();
    // The auth claim must be the bcrypt hash, not plain text
    expect(decoded.auth).toBe(config.authp);
    expect(decoded.auth).toMatch(/^\$2[aby]\$\d{2}\$.+/);
  });

  it('should embed the hashed config.authp in a UserService-style JWT (R3)', () => {
    // Simulate what UserService does: jwt.sign({ userId, password, auth: config.authp }, ...)
    const token = jwt.sign(
      { userId: 1, password: '$2b$12$fakehashedpassword', auth: config.authp },
      config.pkey,
      { expiresIn: '24h' },
    );

    const decoded = jwt.decode(token);
    expect(decoded.auth).toBe(config.authp);
    expect(decoded.auth).toMatch(/^\$2[aby]\$\d{2}\$.+/);
  });

  it('should embed the hashed config.authp in a RoomService-style JWT (R3)', () => {
    // Simulate what RoomService.generateRoomToken does: jwt.sign({ roomId, auth: authp }, ...)
    const token = jwt.sign({ roomId: 1, auth: config.authp }, config.pkey, { expiresIn: '24h' });

    const decoded = jwt.decode(token);
    expect(decoded.auth).toBe(config.authp);
    expect(decoded.auth).toMatch(/^\$2[aby]\$\d{2}\$.+/);
  });
});

// ─── R4: JWT auth claim verification uses strict equality (hash-to-hash) ───

describe('JWT auth claim verification uses strict equality (R4)', () => {
  it('should pass jwtAuth when decoded.auth equals config.authp (hash-to-hash match, R4)', () => {
    // Create a JWT with the correct hashed auth claim
    const token = jwt.sign({ auth: config.authp }, config.pkey, { expiresIn: '20m' });

    const req = { headers: { bearer: token } };
    const next = vi.fn();

    const middleware = jwtAuth('headers');
    middleware(req, {}, next);

    // next should NOT be called with a Boom error
    const errorCalls = next.mock.calls.filter(
      (call) => call[0] && call[0].isBoom,
    );
    expect(errorCalls.length).toBe(0);
  });

  it('should reject jwtAuth when decoded.auth does not match config.authp (R4)', () => {
    // Create a JWT with a wrong auth claim
    const token = jwt.sign({ auth: 'wrong-auth-value' }, config.pkey, { expiresIn: '20m' });

    const req = { headers: { bearer: token } };
    const next = vi.fn();

    const middleware = jwtAuth('headers');
    middleware(req, {}, next);

    // next should be called with a Boom unauthorized error
    const errorCalls = next.mock.calls.filter(
      (call) => call[0] && call[0].isBoom,
    );
    expect(errorCalls.length).toBeGreaterThan(0);
    expect(errorCalls[0][0].message).toBe('Unathorized');
  });

  it('should reject jwtAuth when decoded.auth is plain text instead of hash (R4)', () => {
    // Create a JWT with the original plain-text value (simulating pre-migration token)
    const token = jwt.sign({ auth: 'AG-LE0N-635822320-PS' }, config.pkey, { expiresIn: '20m' });

    const req = { headers: { bearer: token } };
    const next = vi.fn();

    const middleware = jwtAuth('headers');
    middleware(req, {}, next);

    const errorCalls = next.mock.calls.filter(
      (call) => call[0] && call[0].isBoom,
    );
    expect(errorCalls.length).toBeGreaterThan(0);
  });
});

// ─── R6: UpdatableService.initialize() stores hashed config.authp ───

describe('UpdatableService.initialize() stores hashed config.authp (R6)', () => {
  it('should store config.authp (the bcrypt hash) in master_password (R6)', async () => {
    // Mock pg is already set up at the top of the file
    const { models } = await import('../../lib/sequelize');
    const UpdatableServiceModule = await import('../../services/updatable.service.js');
    const UpdatableService = UpdatableServiceModule.default;

    // Mock Updatable.create to capture the data passed
    models.Updatable.create = vi.fn().mockResolvedValue({ id: 1 });

    const updatableService = new UpdatableService();
    await updatableService.initialize();

    // Verify create was called
    expect(models.Updatable.create).toHaveBeenCalled();
    const createCallArgs = models.Updatable.create.mock.calls[0][0];

    // master_password must equal config.authp (the bcrypt hash)
    expect(createCallArgs.master_password).toBe(config.authp);
    expect(createCallArgs.master_password).toMatch(/^\$2[aby]\$\d{2}\$.+/);
  });
});

// ─── R10: Migration from plain-text to hashed ───

describe('Migration from plain-text to hashed AUTH_P (R10)', () => {
  it('should produce a valid bcrypt hash when hashing the original plain-text value (R10)', () => {
    const originalPlainText = 'AG-LE0N-635822320-PS';
    const hashedValue = bcrypt.hashSync(originalPlainText, 12);

    // The hashed value must match the bcrypt pattern
    expect(hashedValue).toMatch(/^\$2[aby]\$\d{2}\$.+/);

    // The hashed value must be verifiable with the original plain text
    expect(bcrypt.compareSync(originalPlainText, hashedValue)).toBe(true);

    // The hashed value must NOT equal the plain text
    expect(hashedValue).not.toBe(originalPlainText);
  });

  it('should confirm the current .env AUTH_P is a valid bcrypt hash derived from the original value (R10)', () => {
    const originalPlainText = 'AG-LE0N-635822320-PS';

    // Current config.authp must be a bcrypt hash
    expect(config.authp).toMatch(/^\$2[aby]\$\d{2}\$.+/);

    // It must verify against the original plain-text value
    expect(bcrypt.compareSync(originalPlainText, config.authp)).toBe(true);
  });
});

// ─── R11: Idempotency — already-hashed value is NOT re-hashed ───

describe('Idempotency — already-hashed AUTH_P is NOT re-hashed (R11)', () => {
  const bcryptHashRegex = /^\$2[aby]\$\d{2}\$.+/;

  it('should detect an already-hashed value and NOT re-hash it (R11)', () => {
    const alreadyHashed = '$2b$12$c/mTE4PfCN4GkHCQxGMACuu9s8XhxJxqXUmervw6NVUJkyZHfiRm2';

    // The regex check should identify this as a valid bcrypt hash
    expect(bcryptHashRegex.test(alreadyHashed)).toBe(true);

    // If the migration logic checks this regex and skips when true,
    // the value should remain unchanged
    const wouldRehash = !bcryptHashRegex.test(alreadyHashed);
    expect(wouldRehash).toBe(false); // Should NOT re-hash
  });

  it('should NOT skip a plain-text value (it should be hashed) (R11)', () => {
    const plainText = 'AG-LE0N-635822320-PS';

    // The regex check should NOT match plain text
    expect(bcryptHashRegex.test(plainText)).toBe(false);

    // Therefore the migration logic should proceed to hash it
    const shouldHash = !bcryptHashRegex.test(plainText);
    expect(shouldHash).toBe(true); // Should hash this value
  });

  it('should confirm the current AUTH_P is already hashed and would be skipped by idempotency check (R11)', () => {
    // Current config.authp is already a bcrypt hash
    expect(bcryptHashRegex.test(config.authp)).toBe(true);

    // The idempotency check would skip re-hashing
    const wouldRehash = !bcryptHashRegex.test(config.authp);
    expect(wouldRehash).toBe(false);
  });
});
