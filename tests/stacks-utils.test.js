/**
 * Tests for the shared Stacks utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dotenv before importing the module
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('stacks-utils', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    
    // Set up environment variables for tests
    process.env.STACKS_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    process.env.STACKS_NETWORK = 'testnet';
    process.env.STACKS_API_URL = 'https://api.testnet.hiro.so';
    process.env.STACKS_DEFAULT_FEE = '100000';
  });

  afterEach(() => {
    delete process.env.STACKS_MNEMONIC;
    delete process.env.STACKS_NETWORK;
    delete process.env.STACKS_API_URL;
    delete process.env.STACKS_DEFAULT_FEE;
  });

  describe('config', () => {
    it('should load configuration from environment variables', async () => {
      const { config } = await import('../lib/stacks-utils.js');
      
      expect(config.mnemonic).toBe('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
      expect(config.network).toBe('testnet');
      expect(config.apiUrl).toBe('https://api.testnet.hiro.so');
      expect(config.defaultFee).toBe(BigInt(100000));
    });
  });

  describe('validateConfig', () => {
    it('should throw error when mnemonic is not set', async () => {
      delete process.env.STACKS_MNEMONIC;
      vi.resetModules();
      
      const { validateConfig } = await import('../lib/stacks-utils.js');
      
      expect(() => validateConfig()).toThrow('STACKS_MNEMONIC not set');
    });

    it('should throw error when mnemonic is invalid placeholder', async () => {
      process.env.STACKS_MNEMONIC = 'your_24_word_mnemonic_here';
      vi.resetModules();
      
      const { validateConfig } = await import('../lib/stacks-utils.js');
      
      expect(() => validateConfig()).toThrow('STACKS_MNEMONIC appears invalid');
    });
  });

  describe('getNetwork', () => {
    it('should return testnet when network is testnet', async () => {
      const { getNetwork } = await import('../lib/stacks-utils.js');
      const network = getNetwork();
      
      // STACKS_TESTNET has specific properties
      expect(network).toBeDefined();
    });

    it('should return mainnet when network is mainnet', async () => {
      process.env.STACKS_NETWORK = 'mainnet';
      vi.resetModules();
      
      const { getNetwork } = await import('../lib/stacks-utils.js');
      const network = getNetwork();
      
      expect(network).toBeDefined();
    });
  });

  describe('getAccountNonce', () => {
    it('should fetch and return nonce from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ possible_next_nonce: 42 }),
      });

      const { getAccountNonce } = await import('../lib/stacks-utils.js');
      const nonce = await getAccountNonce('SP123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.testnet.hiro.so/extended/v1/address/SP123/nonces'
      );
      expect(nonce).toBe(BigInt(42));
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { getAccountNonce } = await import('../lib/stacks-utils.js');
      
      await expect(getAccountNonce('SP123')).rejects.toThrow('HTTP 500');
    });
  });

  describe('getAccountBalance', () => {
    it('should fetch and return balance from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          balance: '1000000',
          locked: '0',
          total_sent: '500000',
          total_received: '1500000',
        }),
      });

      const { getAccountBalance } = await import('../lib/stacks-utils.js');
      const balance = await getAccountBalance('SP123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.testnet.hiro.so/extended/v1/address/SP123/stx'
      );
      expect(balance.balance).toBe(BigInt(1000000));
      expect(balance.locked).toBe(BigInt(0));
    });
  });

  describe('broadcastTransaction', () => {
    it('should broadcast transaction and return txid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('"0x123abc"'),
      });

      const mockTransaction = {
        serialize: () => '00112233',
      };

      const { broadcastTransaction } = await import('../lib/stacks-utils.js');
      const result = await broadcastTransaction(mockTransaction, 'test-tx');

      expect(result.txid).toBe('0x123abc');
      expect(result.explorerUrl).toContain('0x123abc');
    });

    it('should throw error on broadcast failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ error: 'insufficient funds' })),
      });

      const mockTransaction = {
        serialize: () => '00112233',
      };

      const { broadcastTransaction } = await import('../lib/stacks-utils.js');
      
      await expect(broadcastTransaction(mockTransaction, 'test-tx')).rejects.toThrow('test-tx failed');
    });
  });
});
