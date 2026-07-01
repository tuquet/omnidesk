const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('Generating RSA 2048-bit key pair...');

crypto.generateKeyPair('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'der'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
}, (err, publicKey, privateKey) => {
  if (err) {
    console.error('Error generating key pair:', err);
    process.exit(1);
  }

  // The 'key' in manifest.json is the base64 encoded public key
  const manifestKey = publicKey.toString('base64');
  
  // Calculate extension ID
  // It is the first 32 characters of the SHA256 hash of the DER public key, translated from hex (0-f) to base16 (a-p)
  const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
  const extensionId = hash.slice(0, 32).split('').map(c => {
    // Translate hex character to 'a'-'p'
    return String.fromCharCode(parseInt(c, 16) + 97);
  }).join('');

  console.log('\n=== COPY THIS TO YOUR MANIFEST.JSON ===\n');
  console.log(`"key": "${manifestKey}"`);
  console.log('\n=======================================\n');
  
  console.log(`Your constant Extension ID will be: ${extensionId}\n`);
  
  const privateKeyPath = path.join(__dirname, 'extension-private-key.pem');
  fs.writeFileSync(privateKeyPath, privateKey);
  console.log(`Private key saved to: ${privateKeyPath}`);
  console.log('Keep this private key safe! You need it if you ever want to publish to the store or generate the same ID again.');
});
