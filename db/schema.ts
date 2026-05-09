import * as SQLite from 'expo-sqlite'
import {
  DEFAULT_RECIPE_CATEGORIES,
  DEFAULT_INGREDIENT_CATEGORIES,
} from '../constants/categories'

const DB_NAME = 'gelato.db'

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME)
  }
  return dbPromise
}

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base_category TEXT NOT NULL,
  batch_size REAL NOT NULL,
  memo TEXT,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS recipe_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  version_no INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  memo TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  package_price REAL NOT NULL,
  package_amount REAL NOT NULL,
  price_per_g REAL NOT NULL,
  stock_count REAL DEFAULT 0,
  stock_unit TEXT DEFAULT '개',
  supplier_id INTEGER,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL,
  package_price REAL NOT NULL,
  package_amount REAL NOT NULL,
  recorded_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS daily_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  batch_size REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  completed_at TEXT,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

CREATE TABLE IF NOT EXISTS recipe_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ingredient_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
`

export async function seedDefaultCategories(
  conn: SQLite.SQLiteDatabase,
): Promise<void> {
  const rc = await conn.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM recipe_categories',
  )
  if ((rc?.count ?? 0) === 0) {
    for (const name of DEFAULT_RECIPE_CATEGORIES) {
      await conn.runAsync(
        'INSERT OR IGNORE INTO recipe_categories (name) VALUES (?)',
        name,
      )
    }
  }

  const ic = await conn.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM ingredient_categories',
  )
  if ((ic?.count ?? 0) === 0) {
    for (const name of DEFAULT_INGREDIENT_CATEGORIES) {
      await conn.runAsync(
        'INSERT OR IGNORE INTO ingredient_categories (name) VALUES (?)',
        name,
      )
    }
  }
}

export async function initDB(): Promise<void> {
  const conn = await getDB()
  await conn.execAsync(SCHEMA_SQL)
  await seedDefaultCategories(conn)
}
