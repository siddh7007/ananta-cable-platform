/**
 * Vitest test setup
 */

// Mock localStorage for testing
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

// Mock import.meta.env for testing
vi.stubGlobal('import', {
  meta: {
    env: {},
  },
});