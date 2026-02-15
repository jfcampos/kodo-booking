import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock next-intl/server for server action tests
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockImplementation(async () => {
    // Return a function that returns the key, optionally interpolating params
    return (key: string, params?: Record<string, unknown>) => {
      if (params) {
        let result = key;
        for (const [k, v] of Object.entries(params)) {
          result += ` ${k}=${v}`;
        }
        return result;
      }
      return key;
    };
  }),
  getLocale: vi.fn().mockResolvedValue("es"),
  getMessages: vi.fn().mockResolvedValue({}),
}));
