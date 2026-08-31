/**
 * Production Clock and IdGenerator adapters.
 */

import { randomUUID } from "expo-crypto";

import type { Clock, IdGenerator } from "./index";

export const systemClock: Clock = {
  now(): string {
    return new Date().toISOString();
  },
};

/**
 * Cryptographically random identifiers. Used for recording filenames, so the
 * value must not be guessable and must carry no interview metadata.
 */
export const cryptoIdGenerator: IdGenerator = {
  generate(): string {
    return randomUUID().replace(/-/g, "");
  },
};
