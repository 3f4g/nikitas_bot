import Database from 'better-sqlite3';

const db = new Database('bot.db');

// Создание таблицы пользователей
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    expiresAt INTEGER
  );
`);

export default db;