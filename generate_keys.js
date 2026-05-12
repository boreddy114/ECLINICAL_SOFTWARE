const crypto = require('crypto');
const fs = require('fs');

// Generate an RSA key pair
crypto.generateKeyPair('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
}, (err, publicKey, privateKey) => {
  if (err) {
    console.error('Error generating key pair:', err);
    return;
  }

  // Save private key for later use
  fs.writeFileSync('private_key.pem', privateKey);

  // Convert Public Key to JWK
  const pubKeyObject = crypto.createPublicKey(publicKey);
  const jwk = pubKeyObject.export({ format: 'jwk' });
  
  // As per eCW documentation, they need this format:
  const jwks = {
    keys: [
      {
        kty: jwk.kty,
        alg: "RS384",
        n: jwk.n,
        e: jwk.e,
        use: "sig",
        key_ops: ["verify"],
        ext: true,
        kid: "spine-west-key-1"
      }
    ]
  };

  fs.writeFileSync('public/jwks.json', JSON.stringify(jwks, null, 2));
  console.log('Successfully generated private_key.pem and public/jwks.json');
});
