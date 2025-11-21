
const INITIAL_BUDGET = 2000;
const CURRENCY = '$';

let budget: {
  id: number;
  initialBudget: number;
  currentBalance: number;
  currency: string;
} = {
  id: 1,
  initialBudget: INITIAL_BUDGET,
  currentBalance: INITIAL_BUDGET,
  currency: CURRENCY,
};

let transactions: any[] = [];

class MockStatement {
  private query: string;

  constructor(query: string) {
    this.query = query;
  }

  get() {
    if (this.query.includes('SELECT * FROM budget')) {
      return budget;
    }
    if (this.query.includes('SELECT initialBudget FROM budget')) {
        return { initialBudget: budget.initialBudget };
    }
    return undefined;
  }

  all() {
    if (this.query.includes('SELECT * FROM transactions')) {
        // return a copy and sort it
        return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [];
  }

  run(...params: any[]) {
    if (this.query.includes('INSERT INTO transactions')) {
        const [id, amount, description, category, date, type] = params;
        transactions.push({ id, amount, description, category, date, type });
    } else if (this.query.includes('UPDATE budget SET currentBalance = currentBalance + ?')) {
        const [balanceChange] = params;
        budget.currentBalance += balanceChange;
    } else if (this.query.includes('UPDATE budget SET initialBudget = ?, currency = ?, currentBalance = currentBalance + ?')) {
        const [newBudget, newCurrency, diff] = params;
        budget.initialBudget = newBudget;
        budget.currency = newCurrency;
        budget.currentBalance += diff;
    } else if (this.query.includes('UPDATE budget SET initialBudget = ?, currentBalance = ?, currency = ?')) {
        const [initialBudget, currentBalance, currency] = params;
        budget.initialBudget = initialBudget;
        budget.currentBalance = currentBalance;
        budget.currency = currency;
    }
    return { changes: 1 };
  }
}

class MockDatabase {
  prepare(query: string) {
    return new MockStatement(query);
  }

  exec(query: string) {
    if (query.includes('DELETE FROM transactions')) {
        transactions = [];
    }
  }
}

const db = new MockDatabase();

export default db;
