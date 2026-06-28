use rsa::{
    pkcs8::{EncodePrivateKey, EncodePublicKey, DecodePrivateKey, LineEnding},
    RsaPrivateKey, RsaPublicKey,
    Pkcs1v15Encrypt,
};
use rsa::pkcs1v15::SigningKey;
use rsa::signature::{Signer, SignatureEncoding};
use rsa::sha2::Sha256;
use rand::rngs::OsRng;
use keyring::Entry;
use base64::{engine::general_purpose::STANDARD as b64, Engine};
use crate::error::AppError;

const KEYRING_SERVICE: &str = "omnidesk-kernel";

pub fn get_or_generate_keypair(user_id: &str) -> Result<(RsaPrivateKey, RsaPublicKey), AppError> {
    let entry = Entry::new(KEYRING_SERVICE, user_id)
        .map_err(|e| AppError::Internal(format!("Keyring init failed: {}", e)))?;

    match entry.get_password() {
        Ok(priv_pem) => {
            let priv_key = RsaPrivateKey::from_pkcs8_pem(&priv_pem)
                .map_err(|e| AppError::Internal(format!("Failed to parse private key: {}", e)))?;
            let pub_key = RsaPublicKey::from(&priv_key);
            Ok((priv_key, pub_key))
        }
        Err(_) => {
            // Generate new
            let mut rng = OsRng;
            let priv_key = RsaPrivateKey::new(&mut rng, 2048)
                .map_err(|e| AppError::Internal(format!("Failed to generate RSA key: {}", e)))?;
            let pub_key = RsaPublicKey::from(&priv_key);

            let priv_pem = priv_key.to_pkcs8_pem(LineEnding::LF)
                .map_err(|e| AppError::Internal(format!("Failed to PEM encode private key: {}", e)))?;
            
            entry.set_password(priv_pem.as_str())
                .map_err(|e| AppError::Internal(format!("Failed to save to keyring: {}", e)))?;

            Ok((priv_key, pub_key))
        }
    }
}

pub fn encrypt_payload(pub_key: &RsaPublicKey, payload: &str) -> Result<String, AppError> {
    let mut rng = OsRng;
    let enc_data = pub_key.encrypt(&mut rng, Pkcs1v15Encrypt, payload.as_bytes())
        .map_err(|e| AppError::Internal(format!("Encryption failed: {}", e)))?;
    Ok(b64.encode(enc_data))
}

pub fn decrypt_payload(priv_key: &RsaPrivateKey, encrypted_b64: &str) -> Result<String, AppError> {
    let enc_data = b64.decode(encrypted_b64)
        .map_err(|e| AppError::Internal(format!("Base64 decode failed: {}", e)))?;
    let dec_data = priv_key.decrypt(Pkcs1v15Encrypt, &enc_data)
        .map_err(|e| AppError::Internal(format!("Decryption failed: {}", e)))?;
    let payload = String::from_utf8(dec_data)
        .map_err(|e| AppError::Internal(format!("UTF8 conversion failed: {}", e)))?;
    Ok(payload)
}

pub fn sign_payload(priv_key: &RsaPrivateKey, payload: &str) -> Result<String, AppError> {
    let signing_key = SigningKey::<Sha256>::new(priv_key.clone());
    let signature = signing_key.sign(payload.as_bytes());
    
    // rsa::signature::Signature trait requires `.to_bytes()` or similar, depending on crate version.
    // Let's use `rsa::signature::SignatureEncoding` trait implicitly by calling `to_bytes`? 
    // Actually, `rsa::pkcs1v15::Signature` implements `AsRef<[u8]>`.
    Ok(b64.encode(signature.to_bytes()))
}

pub fn get_public_key_pem(pub_key: &RsaPublicKey) -> Result<String, AppError> {
    pub_key.to_public_key_pem(LineEnding::LF)
        .map_err(|e| AppError::Internal(format!("Failed to PEM encode public key: {}", e)))
}
