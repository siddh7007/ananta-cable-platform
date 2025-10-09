import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isFlagOn,
  enableFlag,
  disableFlag,
  getEnabledFlags,
  clearLocalFlags
} from '../lib/flags';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Feature Flags', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  describe('isFlagOn', () => {
    it('returns false for invalid input', () => {
      expect(isFlagOn('')).toBe(false);
      expect(isFlagOn(null as any)).toBe(false);
      expect(isFlagOn(undefined as any)).toBe(false);
    });

    it('returns false when flag is not enabled', () => {
      expect(isFlagOn('test-flag')).toBe(false);
    });

    it('returns true when flag is enabled in environment', () => {
      vi.stubEnv('VITE_FLAGS', 'test-flag,other-flag');
      expect(isFlagOn('test-flag')).toBe(true);
      expect(isFlagOn('other-flag')).toBe(true);
      expect(isFlagOn('missing-flag')).toBe(false);
    });

    it('returns true when flag is enabled in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('test-flag,other-flag');
      expect(isFlagOn('test-flag')).toBe(true);
      expect(isFlagOn('other-flag')).toBe(true);
      expect(isFlagOn('missing-flag')).toBe(false);
    });

    it('prioritizes localStorage over environment', () => {
      vi.stubEnv('VITE_FLAGS', 'env-flag');
      localStorageMock.getItem.mockReturnValue('storage-flag');

      expect(isFlagOn('env-flag')).toBe(true); // from env
      expect(isFlagOn('storage-flag')).toBe(true); // from storage
      expect(isFlagOn('both-flag')).toBe(false); // not in either
    });

    it('handles whitespace and empty values in CSV', () => {
      vi.stubEnv('VITE_FLAGS', ' flag1 , , flag2 ');
      expect(isFlagOn('flag1')).toBe(true);
      expect(isFlagOn('flag2')).toBe(true);
      expect(isFlagOn('')).toBe(false);
    });
  });

  describe('enableFlag', () => {
    it('does nothing for invalid input', () => {
      enableFlag('');
      enableFlag(null as any);
      enableFlag(undefined as any);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('adds flag to empty localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      enableFlag('new-flag');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flags', 'new-flag');
    });

    it('adds flag to existing localStorage', () => {
      localStorageMock.getItem.mockReturnValue('existing-flag');
      enableFlag('new-flag');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flags', 'existing-flag,new-flag');
    });

    it('does not duplicate existing flags', () => {
      localStorageMock.getItem.mockReturnValue('existing-flag');
      enableFlag('existing-flag');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flags', 'existing-flag');
    });

    it('trims whitespace from flag name', () => {
      localStorageMock.getItem.mockReturnValue(null);
      enableFlag('  spaced-flag  ');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flags', 'spaced-flag');
    });
  });

  describe('disableFlag', () => {
    it('does nothing for invalid input', () => {
      disableFlag('');
      disableFlag(null as any);
      disableFlag(undefined as any);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('removes flag from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('flag1,flag2,flag3');
      disableFlag('flag2');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flags', 'flag1,flag3');
    });

    it('removes entire localStorage key when no flags remain', () => {
      localStorageMock.getItem.mockReturnValue('only-flag');
      disableFlag('only-flag');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('flags');
    });

    it('handles non-existent flags gracefully', () => {
      localStorageMock.getItem.mockReturnValue('flag1,flag2');
      disableFlag('non-existent');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flags', 'flag1,flag2');
    });

    it('trims whitespace from flag name', () => {
      localStorageMock.getItem.mockReturnValue('flag1,spaced-flag,flag2');
      disableFlag('  spaced-flag  ');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('flags', 'flag1,flag2');
    });
  });

  describe('getEnabledFlags', () => {
    it('returns empty set when no flags are enabled', () => {
      const flags = getEnabledFlags();
      expect(flags).toEqual(new Set());
    });

    it('combines environment and localStorage flags', () => {
      vi.stubEnv('VITE_FLAGS', 'env-flag1,env-flag2');
      localStorageMock.getItem.mockReturnValue('storage-flag1,storage-flag2');

      const flags = getEnabledFlags();
      expect(flags).toEqual(new Set([
        'env-flag1',
        'env-flag2',
        'storage-flag1',
        'storage-flag2'
      ]));
    });

    it('returns a new set instance', () => {
      const flags1 = getEnabledFlags();
      const flags2 = getEnabledFlags();
      expect(flags1).not.toBe(flags2);
      expect(flags1).toEqual(flags2);
    });
  });

  describe('clearLocalFlags', () => {
    it('removes the flags key from localStorage', () => {
      clearLocalFlags();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('flags');
    });
  });
});