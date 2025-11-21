
import Database from 'better-sqlite3';

const db = new Database('pocketbank.db');

const INITIAL_BUDGET = 2000;
const CURRENCY = '$';

function initializeDatabase() {
  // Check for budget table
  const budgetTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='budget'").get();
  if (!budgetTable) {
    console.log('Creating budget table...');
    db.exec(`
      CREATE TABLE budget (
        id INTEGER PRIMARY KEY,
        initialBudget REAL NOT NULL,
        currentBalance REAL NOT NULL,
        currency TEXT NOT NULL
      )
    `);
    db.prepare('INSERT INTO budget (id, initialBudget, currentBalance, currency) VALUES (?, ?, ?, ?)').run(1, INITIAL_BUDGET, INITIAL_BUDGET, CURRENCY);
  }

  // Check for transactions table
  const transactionsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'").get();
  if (!transactionsTable) {
    console.log('Creating transactions table...');
    db.exec(`
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL
      )
    `);
  }
  console.log('Database initialized.');
}

initializeDatabase();

export default db;
