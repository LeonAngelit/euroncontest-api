import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';

// Mock pg to prevent Sequelize from connecting to a real database
vi.mock('pg', () => ({
  default: {},
  Pool: vi.fn(),
}));

// Now import the service and models — no real DB connection
const { models } = await import('../lib/sequelize');
const RoomServiceModule = await import('../services/rooms.service.js');
const RoomService = RoomServiceModule.default || RoomServiceModule;

describe('RoomService — bcrypt password handling', () => {
  let roomService;

  beforeEach(() => {
    roomService = new RoomService();
    // Reset all model methods to vi.fn() before each test
    models.Room.findOne = vi.fn();
    models.Room.findByPk = vi.fn();
    models.Room.create = vi.fn();
    models.Room.findAll = vi.fn();
    models.RoomUser.findOne = vi.fn();
    models.RoomUser.create = vi.fn();
    models.User.findByPk = vi.fn();
  });

  // ─── T1/T2: create() stores a bcrypt hash, not plain text (R1, R5) ───

  describe('create() — password hashing on creation', () => {
    it('should hash the password with bcrypt before storing the room (R1)', async () => {
      const plainPassword = 'myRoomPassword123';

      // No existing room with this name
      models.Room.findOne.mockResolvedValue(null);
      // Mock the created room
      const mockNewRoom = {
        id: 1,
        password: '',
        adminId: 10,
      };
      models.Room.create.mockImplementation(async (data) => {
        mockNewRoom.password = data.password;
        mockNewRoom.id = 1;
        return mockNewRoom;
      });
      // Mock addUser to avoid Sequelize resolution in findOne
      roomService.addUser = vi.fn().mockResolvedValue({ room: { id: 1 }, user: { id: 10 } });

      await roomService.create({
        name: 'testroom',
        password: plainPassword,
        adminId: 10,
      });

      const createCallArgs = models.Room.create.mock.calls[0][0];

      // The password passed to models.Room.create should be a bcrypt hash, not plain text
      expect(createCallArgs.password).not.toBe(plainPassword);
      expect(createCallArgs.password).toMatch(/^\$2[aby]\$/);
    });

    it('should produce a hash verifiable with bcrypt.compareSync (R5)', async () => {
      const plainPassword = 'verifyMe456';

      models.Room.findOne.mockResolvedValue(null);
      const mockNewRoom = {
        id: 2,
        password: '',
        adminId: 10,
      };
      models.Room.create.mockImplementation(async (data) => {
        mockNewRoom.password = data.password;
        return mockNewRoom;
      });
      roomService.addUser = vi.fn().mockResolvedValue({ room: { id: 2 }, user: { id: 10 } });

      await roomService.create({
        name: 'testroom2',
        password: plainPassword,
        adminId: 10,
      });

      const createCallArgs = models.Room.create.mock.calls[0][0];

      // Verify that bcrypt.compareSync(plainPassword, hash) returns true
      expect(bcrypt.compareSync(plainPassword, createCallArgs.password)).toBe(true);
    });
  });

  // ─── T4: loginByRoomName() authenticates with correct password (R3, R6) ───

  describe('loginByRoomName() — password authentication', () => {
    it('should authenticate with correct plain-text password against stored hash (R3)', async () => {
      const plainPassword = 'roomPass789';
      const hashedPassword = bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12));

      const mockRoom = {
        id: 1,
        name: 'testroom',
        password: hashedPassword,
      };
      models.Room.findOne.mockResolvedValue(mockRoom);
      // Mock addUser to avoid deep Sequelize resolution
      roomService.addUser = vi.fn().mockResolvedValue({ room: mockRoom, user: { id: 10 } });

      const result = await roomService.loginByRoomName({
        roomName: 'testroom',
        password: plainPassword,
        userId: 10,
      });

      expect(result).toBeDefined();
    });

    it('should reject an incorrect password (R3)', async () => {
      const plainPassword = 'roomPass789';
      const hashedPassword = bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12));

      const mockRoom = {
        id: 1,
        name: 'testroom',
        password: hashedPassword,
      };
      models.Room.findOne.mockResolvedValue(mockRoom);

      await expect(
        roomService.loginByRoomName({
          roomName: 'testroom',
          password: 'wrongPassword',
          userId: 10,
        })
      ).rejects.toThrow('Incorrect room name or password');
    });

    it('should authenticate with correct plain-text password against stored plain text (backward compat, R6)', async () => {
      const plainPassword = 'legacyPassword';

      // Simulate a room with plain-text password (pre-bcrypt)
      const mockRoom = {
        id: 2,
        name: 'legacyroom',
        password: plainPassword,
      };
      models.Room.findOne.mockResolvedValue(mockRoom);
      roomService.addUser = vi.fn().mockResolvedValue({ room: mockRoom, user: { id: 20 } });

      const result = await roomService.loginByRoomName({
        roomName: 'legacyroom',
        password: plainPassword,
        userId: 20,
      });

      expect(result).toBeDefined();
    });
  });

  // ─── T5: loginById() authenticates without password reversal (R4, R6) ───

  describe('loginById() — password authentication without reversal', () => {
    it('should authenticate with correct plain-text password against stored hash (no reversal, R4)', async () => {
      const plainPassword = 'idPass123';
      const hashedPassword = bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12));

      const mockRoom = {
        id: 3,
        password: hashedPassword,
      };
      models.Room.findByPk.mockResolvedValue(mockRoom);
      roomService.addUser = vi.fn().mockResolvedValue({ room: mockRoom, user: { id: 30 } });

      const result = await roomService.loginById(3, plainPassword, 30);

      expect(result).toBeDefined();
    });

    it('should reject an incorrect password (R4)', async () => {
      const plainPassword = 'idPass123';
      const hashedPassword = bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(12));

      const mockRoom = {
        id: 3,
        password: hashedPassword,
      };
      models.Room.findByPk.mockResolvedValue(mockRoom);

      await expect(
        roomService.loginById(3, 'wrongPassword', 30)
      ).rejects.toThrow('Incorrect room name or password');
    });

    it('should authenticate with correct plain-text password against stored plain text (backward compat, R6)', async () => {
      const plainPassword = 'legacyIdPass';

      // Simulate a room with plain-text password (pre-bcrypt)
      const mockRoom = {
        id: 4,
        password: plainPassword,
      };
      models.Room.findByPk.mockResolvedValue(mockRoom);
      roomService.addUser = vi.fn().mockResolvedValue({ room: mockRoom, user: { id: 40 } });

      const result = await roomService.loginById(4, plainPassword, 40);

      expect(result).toBeDefined();
    });
  });

  // ─── T3: update() hashes password when provided (R2, R9) ───

  describe('update() — password hashing on update', () => {
    it('should hash password when provided and does not modify other fields (R2)', async () => {
      const newPassword = 'updatedPass456';

      const mockRoom = {
        id: 5,
        name: 'updateroom',
        password: bcrypt.hashSync('oldPass', bcrypt.genSaltSync(12)),
        adminId: 50,
        update: vi.fn().mockImplementation(async (data) => {
          return { ...mockRoom, ...data };
        }),
      };
      models.Room.findOne.mockResolvedValue(null); // no name conflict
      // Mock the internal findOne call (which returns room with users)
      roomService.findOne = vi.fn().mockResolvedValue(mockRoom);

      await roomService.update(5, { password: newPassword, name: 'newname' });

      const updateCallArgs = mockRoom.update.mock.calls[0][0];

      // The password should be a bcrypt hash, not plain text
      expect(updateCallArgs.password).not.toBe(newPassword);
      expect(updateCallArgs.password).toMatch(/^\$2[aby]\$/);
      // Verify that bcrypt.compareSync(newPassword, hash) returns true
      expect(bcrypt.compareSync(newPassword, updateCallArgs.password)).toBe(true);
      // Other fields should pass through unchanged
      expect(updateCallArgs.name).toBe('newname');
    });

    it('should not hash when password field is absent from update payload (R9)', async () => {
      const mockRoom = {
        id: 6,
        name: 'noroom',
        password: bcrypt.hashSync('existingPass', bcrypt.genSaltSync(12)),
        adminId: 60,
        update: vi.fn().mockImplementation(async (data) => {
          return { ...mockRoom, ...data };
        }),
      };
      models.Room.findOne.mockResolvedValue(null);
      roomService.findOne = vi.fn().mockResolvedValue(mockRoom);

      await roomService.update(6, { name: 'updatedname' });

      const updateCallArgs = mockRoom.update.mock.calls[0][0];

      // Password should not be present in the update data
      expect(updateCallArgs.password).toBeUndefined();
      expect(updateCallArgs.name).toBe('updatedname');
    });
  });
});