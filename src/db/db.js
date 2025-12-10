import Database from 'better-sqlite3';

const db = new Database('bot.db');

// Создание таблицы пользователей
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    expiresAt INTEGER
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
  );
`);

// --- таблица вопросов ---
// db.exec(`
//   CREATE TABLE IF NOT EXISTS test_questions (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     testId INTEGER NOT NULL,
//     frontText TEXT,
//     backText TEXT,
//     FOREIGN KEY(testId) REFERENCES tests(id)
//   );
// `);

db.exec(`
  CREATE TABLE IF NOT EXISTS test_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    testId INTEGER NOT NULL,

    frontText TEXT,
    frontImageId TEXT,   -- ← новая колонка

    backText TEXT,
    backImageId TEXT,    -- ← новая колонка

    FOREIGN KEY(testId) REFERENCES tests(id)
  );
`);


// ====== Мягкая миграция (ничего не ломает, просто создаёт недостающие поля) ======
try { db.exec(`ALTER TABLE test_questions ADD COLUMN frontImageId TEXT`); } catch {}
try { db.exec(`ALTER TABLE test_questions ADD COLUMN backImageId TEXT`); } catch {}

export default db;