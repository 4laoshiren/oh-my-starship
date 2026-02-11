use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub theme: String,
    #[serde(default = "default_theme_color")]
    pub theme_color: String,
    pub language: String,
}

fn default_theme_color() -> String {
    "zinc".to_string()
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            theme_color: default_theme_color(),
            language: "en".to_string(),
        }
    }
}

fn get_config_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("oh-my-starship")
}

fn get_settings_path() -> PathBuf {
    get_config_dir().join("settings.json")
}

fn get_starship_config_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".config")
        .join("starship.toml")
}

#[tauri::command]
pub async fn get_settings() -> Result<Settings, String> {
    let path = get_settings_path();

    if !path.exists() {
        let settings = Settings::default();
        let dir = path.parent().unwrap();
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
        let json = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())?;
        return Ok(settings);
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let settings: Settings = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
pub async fn update_settings(payload: Settings) -> Result<(), String> {
    let path = get_settings_path();
    let dir = path.parent().unwrap();
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;

    let json = serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_starship_toml() -> Result<String, String> {
    let path = get_starship_config_path();

    if !path.exists() {
        let dir = path.parent().unwrap();
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
        fs::write(&path, "").map_err(|e| e.to_string())?;
        return Ok(String::new());
    }

    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_starship_toml(content: String) -> Result<(), String> {
    let path = get_starship_config_path();
    let dir = path.parent().unwrap();
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn apply_preset(toml_content: String) -> Result<(), String> {
    let path = get_starship_config_path();
    let dir = path.parent().unwrap();
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    fs::write(&path, toml_content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_backup_list() -> Result<Vec<String>, String> {
    let backup_dir = get_config_dir().join("backups");

    if !backup_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups = Vec::new();
    let entries = fs::read_dir(&backup_dir).map_err(|e| e.to_string())?;

    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(name) = entry.file_name().to_str() {
                if name.ends_with(".toml") {
                    backups.push(entry.path().to_string_lossy().to_string());
                }
            }
        }
    }

    backups.sort_by(|a, b| b.cmp(a));
    Ok(backups)
}

#[tauri::command]
pub async fn restore_from_backup(backup_path: String) -> Result<(), String> {
    let starship_path = get_starship_config_path();
    let dir = starship_path.parent().unwrap();
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    fs::copy(&backup_path, &starship_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_backup(backup_path: String) -> Result<(), String> {
    let path = PathBuf::from(&backup_path);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn create_starship_backup() -> Result<String, String> {
    let starship_path = get_starship_config_path();
    if !starship_path.exists() {
        return Err("No starship config to backup".to_string());
    }

    let backup_dir = get_config_dir().join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!("starship_{}.toml", timestamp);
    let backup_path = backup_dir.join(&backup_name);

    fs::copy(&starship_path, &backup_path).map_err(|e| e.to_string())?;

    Ok(backup_path.to_string_lossy().to_string())
}

// Copied from cc-switch/src-tauri/src/commands.rs
// https://github.com/farion1231/cc-switch
// Open external link
// 打开外部链接
#[tauri::command]
pub async fn open_external(app: AppHandle, url: String) -> Result<bool, String> {
    let url = if url.starts_with("http://") || url.starts_with("https://") {
        url
    } else {
        format!("https://{url}")
    };

    app.opener()
        .open_url(&url, None::<String>)
        .map_err(|e| format!("打开链接失败: {e}"))?;

    Ok(true)
}
