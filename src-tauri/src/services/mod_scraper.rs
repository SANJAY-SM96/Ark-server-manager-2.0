use crate::models::{ModInfo, ServerType};
use reqwest::Client;
use scraper::{Html, Selector};
use serde::Deserialize;
use std::error::Error;

const CURSEFORGE_API_URL: &str = "https://api.curseforge.com/v1";

#[derive(Debug, Deserialize)]
struct CurseForgeSearchResponse {
    data: Vec<CurseForgeMod>,
}

#[derive(Debug, Deserialize)]
struct CurseForgeMod {
    id: i32,
    name: String,
    summary: String,
    authors: Vec<CurseForgeAuthor>,
    logo: Option<CurseForgeImage>,
    links: CurseForgeLinks,
    #[serde(rename = "downloadCount")]
    download_count: f64,
}

#[derive(Debug, Deserialize)]
struct CurseForgeAuthor {
    name: String,
}

#[derive(Debug, Deserialize)]
struct CurseForgeImage {
    #[serde(rename = "thumbnailUrl")]
    thumbnail_url: String,
}

#[derive(Debug, Deserialize)]
struct CurseForgeLinks {
    #[serde(rename = "websiteUrl")]
    website_url: String,
}

pub async fn search_steam_workshop(query: &str) -> Result<Vec<ModInfo>, Box<dyn Error>> {
    let client = Client::new();
    
    // If query is generic (like 'ark') or empty, show trending instead of text search
    let url = if query.trim().is_empty() || query.len() <= 3 {
        format!(
            "https://steamcommunity.com/workshop/browse/?appid=346110&browsesort=trend&section=readytouseitems&actualsort=trend&p=1&days=365"
        )
    } else {
        format!(
            "https://steamcommunity.com/workshop/browse/?appid=346110&searchtext={}&childpublishedfileid=0&browsesort=textsearch&section=items",
            query
        )
    };

    let html = client.get(&url).send().await?.text().await?;
    let document = Html::parse_document(&html);
    
    let item_selector = Selector::parse(".workshopItem").unwrap();
    let title_selector = Selector::parse(".workshopItemTitle").unwrap();
    let author_selector = Selector::parse(".workshopItemAuthorName a").unwrap();
    let link_selector = Selector::parse("a.ugc").unwrap();
    let image_selector = Selector::parse(".workshopItemPreviewImage").unwrap();

    let mut mods = Vec::new();

    for element in document.select(&item_selector) {
        let title = element.select(&title_selector).next().map(|e| e.text().collect::<String>()).unwrap_or_default();
        let author = element.select(&author_selector).next().map(|e| e.text().collect::<String>()).unwrap_or_default();
        
        let link_element = element.select(&link_selector).next();
        let workshop_url = link_element.and_then(|e| e.value().attr("href")).unwrap_or_default().to_string();
        
        let id = workshop_url.split("id=").nth(1).and_then(|s| s.split('&').next()).unwrap_or_default().to_string();
        let thumbnail_url = element.select(&image_selector).next().and_then(|e| e.value().attr("src")).unwrap_or_default().to_string();

        if !id.is_empty() {
            mods.push(ModInfo {
                id,
                name: title,
                author: Some(author),
                version: None,
                downloads: None,
                compatible: Some(true),
                description: Some("Steam Workshop Mod".to_string()),
                thumbnail_url: Some(thumbnail_url),
                workshop_url: Some(workshop_url),
                server_type: ServerType::ASE,
                enabled: false,
                load_order: 0,
            });
        }
    }

    Ok(mods)
}

pub async fn search_curseforge(query: &str, api_key: Option<String>) -> Result<Vec<ModInfo>, Box<dyn Error>> {
    let api_key = api_key.or_else(|| std::env::var("CURSEFORGE_API_KEY").ok()).unwrap_or_default();
    let api_key = api_key.trim();
    
    if api_key.is_empty() {
        return Ok(vec![ModInfo {
            id: "0".to_string(),
            name: "API Key Missing".to_string(),
            author: Some("System".to_string()),
            version: None,
            downloads: None,
            compatible: None,
            description: Some("Please add your CurseForge API Key in Settings to search ASA mods.".to_string()),
            thumbnail_url: None,
            workshop_url: None,
            server_type: ServerType::ASA,
            enabled: false,
            load_order: 0,
        }]);
    }

    let client = Client::new();

    // SPECIAL DEBUG COMMAND:
    if query == "debug_games" {
         let url = format!("{}/games?name=ARK", CURSEFORGE_API_URL);
         let resp = client.get(&url).header("x-api-key", api_key).send().await?;
         let body_text = resp.text().await?;
         println!("Raw Games Response: {}", body_text);
         
         #[derive(Deserialize)]
         struct GameResponse { data: Vec<GameItem> }
         #[derive(Deserialize)]
         struct GameItem { id: i32, name: String }
         
         let games: GameResponse = serde_json::from_str(&body_text).unwrap_or(GameResponse { data: vec![] });
         
         return Ok(games.data.into_iter().map(|g| ModInfo {
            id: g.id.to_string(),
            name: format!("GAME: {} (ID: {})", g.name, g.id),
            author: Some("System".to_string()),
            version: None, downloads: None, compatible: None,
            description: Some(format!("Found Game ID: {}", g.id)),
            thumbnail_url: None, workshop_url: None,
            server_type: ServerType::ASA, enabled: false, load_order: 0,
         }).collect());
    }

    // ARK Survival Ascended Game ID: 951374
    let game_id = 951374; 

    let url = if query.trim().is_empty() {
        // Sort by Popularity (Rank 2 usually, or simply no filter implies popularity/featured)
        // sortField=2 (Popularity), sortOrder=desc
        format!("{}/mods/search?gameId={}&sortField=2&sortOrder=desc", CURSEFORGE_API_URL, game_id)
    } else {
        format!("{}/mods/search?gameId={}&searchFilter={}", CURSEFORGE_API_URL, game_id, query)
    };
    
    println!("  → CurseForge URL: {}", url);
    println!("  → API Key length: {}", api_key.len());
    
    // Fix: Pass api_key directly (it is &str)
    let resp = client.get(&url)
        .header("x-api-key", api_key)
        .send()
        .await?;

    // Fix: Capture status before consuming body
    let status = resp.status();
    println!("  → Response Status: {}", status);
    
    if !status.is_success() {
        if status == reqwest::StatusCode::FORBIDDEN {
             return Err("CurseForge API Key is invalid or forbidden. Please check your API Key in Settings.".into());
        }
        let error_body = resp.text().await.unwrap_or_else(|_| "Unable to read error".to_string());
        println!("  → Error Body: {}", error_body);
        return Err(format!("CurseForge API Error: {} - {}", status, error_body).into());
    }

    let body_text = resp.text().await?;
    println!("  → Raw Response: {}", body_text);
    let search_results: CurseForgeSearchResponse = serde_json::from_str(&body_text)?;
    
    let mods = search_results.data.into_iter().map(|cf_mod| {
        ModInfo {
            id: cf_mod.id.to_string(),
            name: cf_mod.name,
            author: cf_mod.authors.first().map(|a| a.name.clone()),
            version: None, // Need to parse files for version
            downloads: Some(cf_mod.download_count.to_string()),
            compatible: Some(true),
            description: Some(cf_mod.summary),
            thumbnail_url: cf_mod.logo.map(|l| l.thumbnail_url),
            workshop_url: Some(cf_mod.links.website_url),
            server_type: ServerType::ASA,
            enabled: false,
            load_order: 0,
        }
    }).collect();

    Ok(mods)
}


pub async fn get_steam_mod_details(ids: Vec<String>) -> Result<Vec<ModInfo>, Box<dyn Error>> {
    // Steam Workshop doesn't have a clean batch API without key, so we'll scrape individually or use a query
    // Optimally, we use the "searchtext" with the ID, but that returns search results.
    // For now, we'll iterate. Parallel requests would be better but keeping it simple.
    
    let client = Client::new();
    let mut mods = Vec::new();

    for id in ids {
        let url = format!("https://steamcommunity.com/sharedfiles/filedetails/?id={}", id);
        let resp = client.get(&url).send().await;
        if let Ok(resp) = resp {
             if let Ok(html) = resp.text().await {
                 let document = Html::parse_document(&html);
                 let title_selector = Selector::parse(".workshopItemTitle").unwrap();
                 let image_selector = Selector::parse("#previewImageMain").unwrap();
                 
                 let title = document.select(&title_selector).next().map(|e| e.text().collect::<String>()).unwrap_or(format!("Mod {}", id));
                 let thumbnail = document.select(&image_selector).next().and_then(|e| e.value().attr("src")).unwrap_or_default().to_string();
                 
                 mods.push(ModInfo {
                    id: id.clone(),
                    name: title,
                    author: None, // scraping author from details page is slightly different selector
                    version: None,
                    downloads: None,
                    compatible: Some(true),
                    description: Some("Installed Mod".to_string()),
                    thumbnail_url: Some(thumbnail),
                    workshop_url: Some(url),
                    server_type: ServerType::ASE,
                    enabled: true,
                    load_order: 0,
                 });
             }
        }
    }

    Ok(mods)
}

pub async fn get_curseforge_mod_details(ids: Vec<String>, api_key: Option<String>) -> Result<Vec<ModInfo>, Box<dyn Error>> {
    let api_key = api_key.or_else(|| std::env::var("CURSEFORGE_API_KEY").ok()).unwrap_or_default();
    
    if api_key.is_empty() || ids.is_empty() {
        return Ok(vec![]);
    }

    let client = Client::new();
    
    // CF allows batch fetch via POST /v1/mods
    let url = format!("{}/mods", CURSEFORGE_API_URL);
    
    let mod_ids: Vec<i32> = ids.iter().filter_map(|s| s.parse().ok()).collect();
    let body = serde_json::json!({
        "modIds": mod_ids
    });

    let resp = client.post(&url)
        .header("x-api-key", api_key)
        .header("Content-Type", "application/json")
        .body(body.to_string())
        .send()
        .await?;

    if !resp.status().is_success() {
        return Err(format!("CF API Error: {}", resp.status()).into());
    }

    let search_results: CurseForgeSearchResponse = resp.json().await?;
    
    let mods = search_results.data.into_iter().map(|cf_mod| {
        ModInfo {
            id: cf_mod.id.to_string(),
            name: cf_mod.name,
            author: cf_mod.authors.first().map(|a| a.name.clone()),
            version: None,
            downloads: Some(cf_mod.download_count.to_string()),
            compatible: Some(true),
            description: Some(cf_mod.summary),
            thumbnail_url: cf_mod.logo.map(|l| l.thumbnail_url),
            workshop_url: Some(cf_mod.links.website_url),
            server_type: ServerType::ASA,
            enabled: true,
            load_order: 0,
        }
    }).collect();

    Ok(mods)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_search_steam_workshop() {
        let results = search_steam_workshop("Structure").await;
        assert!(results.is_ok());
        let mods = results.unwrap();
        assert!(!mods.is_empty());
    }
}
