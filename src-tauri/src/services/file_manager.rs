use anyhow::{Context, Result};
use std::fs;
use std::io::{self, Cursor, Read, Write};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use zip::write::FileOptions;

#[derive(serde::Serialize, Clone)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: Option<u64>,
}

pub struct FileManager;

impl FileManager {
    pub fn list_directory(path: &Path) -> Result<Vec<FileInfo>> {
        let mut files = Vec::new();
        if path.exists() && path.is_dir() {
            for entry in fs::read_dir(path)? {
                let entry = entry?;
                let path = entry.path();
                let metadata = entry.metadata()?;

                let modified = metadata
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs());

                files.push(FileInfo {
                    name: entry.file_name().to_string_lossy().to_string(),
                    path: path.to_string_lossy().to_string(),
                    is_dir: metadata.is_dir(),
                    size: metadata.len(),
                    modified,
                });
            }
        }
        // Sort: directories first, then files
        files.sort_by(|a, b| {
            if a.is_dir == b.is_dir {
                a.name.cmp(&b.name)
            } else {
                b.is_dir.cmp(&a.is_dir)
            }
        });
        Ok(files)
    }

    pub fn read_file(path: &Path) -> Result<String> {
        // Limit file size to avoid crashing?
        // For now, assume reasonable text files for config/logs.
        fs::read_to_string(path).context("Failed to read file")
    }

    pub fn write_file(path: &Path, content: &str) -> Result<()> {
        fs::write(path, content).context("Failed to write file")
    }

    pub fn delete_path(path: &Path) -> Result<()> {
        if path.is_dir() {
            fs::remove_dir_all(path).context("Failed to remove directory")
        } else {
            fs::remove_file(path).context("Failed to remove file")
        }
    }

    pub fn create_zip(source_dir: &Path, output_path: &Path) -> Result<()> {
        if !source_dir.exists() {
            return Err(anyhow::anyhow!("Source directory does not exist"));
        }

        let file = fs::File::create(output_path)?;
        let mut zip = zip::ZipWriter::new(file);
        let options = FileOptions::<()>::default()
            .compression_method(zip::CompressionMethod::Deflated)
            .unix_permissions(0o755);

        let walkdir = WalkDir::new(source_dir);
        let it = walkdir.into_iter();

        for entry in it.filter_map(|e| e.ok()) {
            let path = entry.path();
            let name = path.strip_prefix(source_dir)?;

            if path.is_file() {
                zip.start_file(name.to_string_lossy(), options)?;
                let mut f = fs::File::open(path)?;
                let mut buffer = Vec::new();
                f.read_to_end(&mut buffer)?;
                zip.write_all(&buffer)?;
            } else if !name.as_os_str().is_empty() {
                // Adding directory is optional but good for empty dirs
                zip.add_directory(name.to_string_lossy(), options)?;
            }
        }
        zip.finish()?;
        Ok(())
    }

    pub fn extract_zip(zip_path: &Path, output_dir: &Path) -> Result<()> {
        let file = fs::File::open(zip_path)?;
        let mut archive = zip::ZipArchive::new(file)?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let outpath = match file.enclosed_name() {
                Some(path) => output_dir.join(path),
                None => continue,
            };

            if (*file.name()).ends_with('/') {
                fs::create_dir_all(&outpath)?;
            } else {
                if let Some(p) = outpath.parent() {
                    if !p.exists() {
                        fs::create_dir_all(p)?;
                    }
                }
                let mut outfile = fs::File::create(&outpath)?;
                io::copy(&mut file, &mut outfile)?;
            }
        }
        Ok(())
    }
}
