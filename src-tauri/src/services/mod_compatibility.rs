use serde::Serialize;
use std::collections::HashSet;

#[derive(Clone, Serialize)]
pub struct ModConflict {
    pub mod_id_a: String,
    pub mod_id_b: String,
    pub reason: String,
    pub severity: String, // "warning" or "critical"
}

pub struct ModCompatibilityService;

impl ModCompatibilityService {
    // Known conflicts database (MVP: Hardcoded)
    fn get_known_conflicts() -> Vec<ModConflict> {
        vec![
            ModConflict {
                mod_id_a: "731604991".to_string(), // S+
                mod_id_b: "1999447172".to_string(), // Super Structures
                reason: "Both mods modify structure placement and core structures. Using both crashes the server.".to_string(),
                severity: "critical".to_string(),
            },
            ModConflict {
                mod_id_a: "1404697612".to_string(), // Awesome SpyGlass
                mod_id_b: "1404697612".to_string(), // Duplicate check example
                reason: "Duplicate mod ID logic (not a real conflict but example)".to_string(),
                severity: "warning".to_string(),
            }
            // Add more known conflicts here
        ]
    }

    pub fn check_conflicts(active_mod_ids: &[String]) -> Vec<ModConflict> {
        let conflicts_db = Self::get_known_conflicts();
        let mut found_conflicts = Vec::new();
        let active_set: HashSet<&String> = active_mod_ids.iter().collect();

        for conflict in conflicts_db {
            if active_set.contains(&conflict.mod_id_a) && active_set.contains(&conflict.mod_id_b) {
                found_conflicts.push(conflict);
            }
        }

        found_conflicts
    }
}
