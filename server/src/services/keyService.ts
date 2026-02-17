import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEYS_DIR = path.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private-key.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public-key.pem');

class KeyService {
  /**
   * Ensure the EC key pair exists. Generate if missing.
   * Tesla requires a secp256r1 (prime256v1) EC key.
   */
  ensureKeyPair(): void {
    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
      console.log('🔑 EC key pair already exists');
      return;
    }

    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    console.log('🔑 Generating EC key pair (secp256r1/prime256v1)...');

    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, 'utf-8');
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, 'utf-8');

    console.log('✅ EC key pair generated and saved');
  }

  getPublicKey(): string {
    this.ensureKeyPair();
    return fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8');
  }
}

export default new KeyService();
