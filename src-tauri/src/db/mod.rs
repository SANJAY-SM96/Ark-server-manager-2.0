use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;

        // Initialize schema
        Self::init_schema(&conn)?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    fn init_schema(conn: &Connection) -> Result<()> {
        let schema = include_str!("schema.sql");
        conn.execute_batch(schema)?;

        // MIGRATION: Attempt to add battleye_enabled column if it doesn't exist
        // This is a simple migration strategy for this MVP
        let _ = conn.execute(
            "ALTER TABLE servers ADD COLUMN battleye_enabled BOOLEAN DEFAULT 0",
            [],
        );
        let _ = conn.execute("ALTER TABLE servers ADD COLUMN multihome_ip TEXT", []);
        let _ = conn.execute(
            "ALTER TABLE servers ADD COLUMN crossplay_enabled BOOLEAN DEFAULT 0",
            [],
        );

        Ok(())
    }

    pub fn get_connection(&self) -> std::result::Result<std::sync::MutexGuard<Connection>, String> {
        self.conn.lock().map_err(|e| e.to_string())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        let mut rows = stmt.query([key])?;

        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP) 
             ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = CURRENT_TIMESTAMP",
            [key, value],
        )?;
        Ok(())
    }
}
