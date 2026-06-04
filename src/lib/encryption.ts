import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_32_byte_fallback_key_for_dev_only!!!';
const IV_LENGTH = 16;

export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  if (!text.includes(':')) return text; // Fallback for unencrypted dev data
  const textParts = text.split(':');
  const ivHex = textParts.shift();
  if (!ivHex) return text;
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  try {
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
}
