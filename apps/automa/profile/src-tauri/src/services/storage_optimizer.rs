use std::path::Path;
use std::fs::File;
use std::io::{Read, Write};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use crate::error::AppError;

pub struct StorageOptimizer;

impl StorageOptimizer {
    /// Safely deletes heavy cache folders inside a browser profile directory.
    pub fn clean_storage(profile_dir: &Path) -> Result<(), AppError> {
        let items_to_clean = vec![
            "Default/Cache",
            "Default/Code Cache",
            "Default/GPUCache",
            "Default/Service Worker/CacheStorage",
            "Default/Service Worker/ScriptCache",
            "GrShaderCache",
            "ShaderCache",
            "Crashpad",
        ];

        for item in items_to_clean {
            let p = profile_dir.join(item);
            if p.exists() {
                log::info!("Cleaning storage: Removing {:?}", p);
                if p.is_dir() {
                    let _ = std::fs::remove_dir_all(&p);
                } else {
                    let _ = std::fs::remove_file(&p);
                }
            }
        }
        Ok(())
    }

    /// Zips a directory into a zip file.
    pub fn zip_dir(src_dir: &Path, dest_zip: &Path) -> Result<(), AppError> {
        if !src_dir.exists() {
            return Ok(());
        }
        
        let file = File::create(dest_zip)
            .map_err(|e| AppError::Internal(format!("Failed to create zip file: {}", e)))?;
        
        let mut zip = zip::ZipWriter::new(file);
        let options = SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);
            
        let mut buffer = Vec::new();

        for entry in WalkDir::new(src_dir) {
            let entry = entry.map_err(|e| AppError::Internal(format!("Walkdir error: {}", e)))?;
            let path = entry.path();
            let name = path.strip_prefix(src_dir)
                .map_err(|e| AppError::Internal(format!("Prefix error: {}", e)))?;
                
            let name_str = name.to_string_lossy().replace("\\", "/");
            
            if path.is_file() {
                zip.start_file(name_str, options)
                    .map_err(|e| AppError::Internal(format!("Zip start_file error: {}", e)))?;
                let mut f = File::open(path)
                    .map_err(|e| AppError::Internal(format!("Failed to open file for zipping: {}", e)))?;
                f.read_to_end(&mut buffer)
                    .map_err(|e| AppError::Internal(format!("Failed to read file: {}", e)))?;
                zip.write_all(&buffer)
                    .map_err(|e| AppError::Internal(format!("Failed to write to zip: {}", e)))?;
                buffer.clear();
            } else if !name.as_os_str().is_empty() {
                zip.add_directory(name_str, options)
                    .map_err(|e| AppError::Internal(format!("Zip add_directory error: {}", e)))?;
            }
        }
        
        zip.finish()
            .map_err(|e| AppError::Internal(format!("Failed to finish zip: {}", e)))?;
            
        Ok(())
    }

    /// Unzips a zip file to a destination directory.
    pub fn unzip_dir(src_zip: &Path, dest_dir: &Path) -> Result<(), AppError> {
        let file = File::open(src_zip)
            .map_err(|e| AppError::Internal(format!("Failed to open zip file: {}", e)))?;
            
        let mut archive = zip::ZipArchive::new(file)
            .map_err(|e| AppError::Internal(format!("Failed to read zip archive: {}", e)))?;
            
        archive.extract(dest_dir)
            .map_err(|e| AppError::Internal(format!("Failed to extract zip archive: {}", e)))?;
            
        Ok(())
    }
}
