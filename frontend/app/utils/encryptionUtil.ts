/**
 * Utilities for client-side encryption/decryption
 * 
 * Note: This is for additional security and is complementary to
 * server-side encryption. Sensitive data is encrypted before
 * transmission and stored encrypted on the server.
 */

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';

/**
 * Generate a random initialization vector
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Convert an ArrayBuffer to a Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * Convert a Base64 string to an ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt data using AES-GCM
 * 
 * @param data The data to encrypt (string or object)
 * @returns Encrypted data and IV as a single base64 string
 */
export async function encryptData(data: string | object): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key is not available');
  }
  
  // Convert object to string if needed
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Convert data and key to ArrayBuffer
  const dataBuffer = new TextEncoder().encode(dataString);
  const keyBuffer = new TextEncoder().encode(ENCRYPTION_KEY);
  
  // Generate IV
  const iv = generateIV();
  
  // Import the key
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );
  
  // Combine IV and encrypted data
  const combinedBuffer = new Uint8Array(iv.length + new Uint8Array(encryptedBuffer).length);
  combinedBuffer.set(iv);
  combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);
  
  // Return as base64
  return arrayBufferToBase64(combinedBuffer);
}

/**
 * Decrypt data using AES-GCM
 * 
 * @param encryptedData Encrypted data as a base64 string
 * @param returnObj Whether to parse the decrypted data as JSON
 * @returns Decrypted data as a string or object
 */
export async function decryptData(encryptedData: string, returnObj = false): Promise<string | object> {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key is not available');
  }
  
  // Convert base64 to ArrayBuffer
  const combinedBuffer = base64ToArrayBuffer(encryptedData);
  
  // Extract IV and encrypted data
  const iv = new Uint8Array(combinedBuffer, 0, 12);
  const encryptedBuffer = new Uint8Array(combinedBuffer, 12);
  
  // Import the key
  const keyBuffer = new TextEncoder().encode(ENCRYPTION_KEY);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBuffer
  );
  
  // Convert to string
  const decryptedString = new TextDecoder().decode(decryptedBuffer);
  
  // Return as string or object
  if (returnObj) {
    try {
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Error parsing decrypted data as JSON', error);
      return decryptedString;
    }
  }
  
  return decryptedString;
} 