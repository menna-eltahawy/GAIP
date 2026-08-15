import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Leaflet as it requires a browser DOM structure that doesn't fully exist in jsdom
vi.mock('leaflet', () => {
  return {
    default: {
      icon: vi.fn().mockReturnValue({}),
      Marker: {
        prototype: {
          options: {
            icon: {}
          }
        }
      }
    },
    icon: vi.fn().mockReturnValue({}),
    Marker: {
      prototype: {
        options: {
          icon: {}
        }
      }
    }
  };
});
