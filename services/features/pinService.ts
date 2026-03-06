/**
 * Consolidated PIN Service using BaseService pattern with security features
 * Replaces legacy pinService.ts with improved architecture and caching
 */

import { BaseService } from '../core/BaseService.ts';
import { gitHubClient } from '../core/GitHubClient.ts';
import { GIST_TOKEN } from '../../config/gistConfig.ts';
import type { User } from '../../types.ts';

export interface UserPins {
  Aaron?: string; // Hashed PIN
  Electra?: string; // Hashed PIN
}

export class PinService extends BaseService<UserPins> {
  private static readonly GIST_PINS_FILENAME = 'pins.json';

  constructor() {
    super(PinService.GIST_PINS_FILENAME, 5 * 60 * 1000); // 5 minutes TTL
  }

  protected parseContent(content: string | undefined): UserPins {
    if (!content) {
      return {};
    }

    try {
      return JSON.parse(content) as UserPins;
    } catch (parseError) {
      console.error('Error parsing PIN file:', parseError);
      return {};
    }
  }

  /**
   * Generates a secure PBKDF2 hash for a PIN.
   * Format: pbkdf2:iterations:salt:hash
   */
  async secureHashPin(pin: string, saltInput: string | null = null): Promise<string> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    let salt: Uint8Array;
    if (saltInput) {
      // Decode hex salt
      const matches = saltInput.match(/.{1,2}/g);
      if (!matches) throw new Error('Invalid salt format');
      salt = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
    } else {
      salt = crypto.getRandomValues(new Uint8Array(16));
    }

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'HMAC', hash: 'SHA-256', length: 256 },
      true,
      ['sign', 'verify']
    );

    const exported = await crypto.subtle.exportKey('raw', key);
    const hashHex = Array.from(new Uint8Array(exported))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return `pbkdf2:100000:${saltHex}:${hashHex}`;
  }

  /**
   * Verifies a PIN against a secure hash.
   */
  async verifySecurePin(pin: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const saltHex = parts[2];

    // Re-hash with the same salt and compare
    const computedHashFull = await this.secureHashPin(pin, saltHex);
    return computedHashFull === storedHash;
  }

  /**
   * Fetch pins with direct API call (bypassing cache for security)
   */
  async fetchPinsDirect(cache: RequestCache = 'default'): Promise<UserPins> {
    const gist = await gitHubClient.fetchDirect(cache);
    const fileContent = gist.files?.[PinService.GIST_PINS_FILENAME]?.content as string | undefined;
    return this.parseContent(fileContent);
  }

  /**
   * Get pins from cache or fetch fresh
   */
  async getPins(): Promise<UserPins> {
    return this.fetch();
  }

  /**
   * Save pins to gist
   */
  async savePins(pins: UserPins): Promise<boolean> {
    try {
      await this.save(pins);
      return true;
    } catch (error) {
      console.error('Error saving PINs:', error);
      return false;
    }
  }

  /**
   * Sets or updates a PIN for a user.
   */
  async setPin(user: User, pin: string): Promise<boolean> {
    try {
      const freshPins = await this.fetchPinsDirect('no-cache');
      freshPins[user] = await this.secureHashPin(pin);
      return await this.savePins(freshPins);
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  }

  /**
   * Removes a PIN for a user.
   */
  async removePin(user: User): Promise<boolean> {
    try {
      const freshPins = await this.fetchPinsDirect('no-cache');
      delete freshPins[user];
      return await this.savePins(freshPins);
    } catch (error) {
      console.error('Error removing PIN:', error);
      return false;
    }
  }

  /**
   * Verifies a PIN for a user.
   */
  async verifyPin(user: User, pin: string): Promise<boolean> {
    let pins: UserPins;
    try {
      pins = await this.getPins();
    } catch (error) {
      // Fail closed on fetch errors so PIN protection can't be bypassed.
      console.error('PIN verification failed while loading PINs:', error);
      return false;
    }

    const storedHash = pins[user];

    if (!storedHash) {
      return true; // No PIN set, allow access
    }

    // Check for new secure format
    if (storedHash.startsWith('pbkdf2:')) {
      return this.verifySecurePin(pin, storedHash);
    }

    // Legacy format is no longer supported for security reasons.
    // Users with legacy hashes must have their PINs reset.
    return false;
  }

  /**
   * Checks if a user has a PIN set.
   */
  async hasPin(user: User): Promise<boolean> {
    const pins = await this.getPins();
    return !!pins[user];
  }
}

// Export singleton instance
export const pinService = new PinService();
