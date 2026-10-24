import {DatabaseSync} from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, "data");

// Ensure the data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.METATRUTH_DB_PATH || path.join(dbDir, "metatruth.db");
export const db = new DatabaseSync(dbPath);

db.exec(`PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL,name TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token_hash TEXT UNIQUE NOT NULL,expires_at TEXT NOT NULL,revoked_at TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY,title TEXT NOT NULL,query TEXT NOT NULL,case_type TEXT NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL,created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,decision_json TEXT,correction_json TEXT);
CREATE TABLE IF NOT EXISTS evidence(id TEXT PRIMARY KEY,case_id TEXT NOT NULL,title TEXT NOT NULL,source_url TEXT,excerpt TEXT,captured_at TEXT,content_hash TEXT,status TEXT,retrieval TEXT,created_by TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS appeals(id TEXT PRIMARY KEY,case_id TEXT NOT NULL,status TEXT NOT NULL,reason TEXT,requested_correction TEXT,created_by TEXT NOT NULL,created_at TEXT NOT NULL,review_json TEXT);
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,case_id TEXT,status TEXT NOT NULL,source_url TEXT,recipient TEXT,correction TEXT,report_text TEXT,delivery_channel TEXT,submitted_by TEXT NOT NULL,created_at TEXT NOT NULL,sent_at TEXT,ack_at TEXT,response_text TEXT,closed_at TEXT);
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,timestamp TEXT NOT NULL,action TEXT NOT NULL,user_id TEXT,payload_json TEXT,previous_hash TEXT,hash TEXT NOT NULL);`);