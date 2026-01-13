import { Database } from '../src/db';

// Mock pg module
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('Database Layer', () => {
  let db: Database;
  let mockPool: any;

  beforeEach(() => {
    // Reset environment
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    
    // Get mock pool
    const { Pool } = require('pg');
    db = new Database({ connectionString: process.env.DATABASE_URL });
    mockPool = new Pool();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Pool Creation', () => {
    test('should create pool with provided configuration', () => {
      const { Pool } = require('pg');
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: 'postgresql://test:test@localhost:5432/test',
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        })
      );
    });

    test('should register error handler on pool', () => {
      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Query Execution', () => {
    test('should execute query successfully', async () => {
      const mockResult = {
        rows: [{ id: 1, name: 'test' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPool.query.mockResolvedValue(mockResult);

      const result = await db.query('SELECT * FROM test');

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);
      expect(result).toEqual(mockResult);
    });

    test('should execute query with parameters', async () => {
      const mockResult = {
        rows: [{ id: 1 }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPool.query.mockResolvedValue(mockResult);

      const params = ['test-id'];
      await db.query('SELECT * FROM test WHERE id = $1', params);

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM test WHERE id = $1',
        params
      );
    });

    test('should handle query errors', async () => {
      const error = new Error('Query failed');
      mockPool.query.mockRejectedValue(error);

      await expect(db.query('SELECT * FROM test')).rejects.toThrow('Query failed');
    });
  });

  describe('Client Management', () => {
    test('should get client from pool', async () => {
      const mockClient = { query: jest.fn(), release: jest.fn() };
      mockPool.connect.mockResolvedValue(mockClient);

      const client = await db.getClient();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });

    test('should handle client connection errors', async () => {
      const error = new Error('Connection failed');
      mockPool.connect.mockRejectedValue(error);

      await expect(db.getClient()).rejects.toThrow('Connection failed');
    });
  });

  describe('Pool Closure', () => {
    test('should close pool successfully', async () => {
      mockPool.end.mockResolvedValue(undefined);

      await db.close();

      expect(mockPool.end).toHaveBeenCalled();
    });

    test('should handle pool closure errors', async () => {
      const error = new Error('Close failed');
      mockPool.end.mockRejectedValue(error);

      await expect(db.close()).rejects.toThrow('Close failed');
    });
  });

  describe('Connection Testing', () => {
    test('should return true for successful connection test', async () => {
      const mockResult = {
        rows: [{ now: new Date() }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
      mockPool.query.mockResolvedValue(mockResult);

      const isConnected = await db.testConnection();

      expect(isConnected).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT NOW()', undefined);
    });

    test('should return false for failed connection test', async () => {
      mockPool.query.mockRejectedValue(new Error('Connection failed'));

      const isConnected = await db.testConnection();

      expect(isConnected).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    test('should throw error if DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL;

      expect(() => Database.getInstance()).toThrow(
        'DATABASE_URL environment variable is not set'
      );
    });
  });
});
