import type { CookieConfig, SupportedBrowser, Keyring } from "visual-insights";

type CookieConfigOptions = Readonly<{
  cookiesFile?: string;
  cookiesFromBrowser?: SupportedBrowser;
  browserProfile?: string;
  keyring?: Keyring;
}>;

export const createCookieConfig = (options: CookieConfigOptions): CookieConfig => {
  if (options.cookiesFile) {
    return { type: "file", path: options.cookiesFile };
  }
  if (options.cookiesFromBrowser) {
    return {
      type: "browser",
      browser: options.cookiesFromBrowser,
      profile: options.browserProfile,
      keyring: options.keyring,
    };
  }
  return undefined;
};