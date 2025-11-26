
import { getDb } from './mongoConnection.js';
import { Transaction } from './types';

const INITIAL_BUDGET = 2000;
const CURRENCY = '$';

export async function getAppState() {
    const db = getDb();
    const budget = await db.collection('budget').findOne({ id: 1 });
    const transactions = await db.collection('transactions').find().sort({ date: -1 }).toArray();

    if (budget) {
        delete (budget as any)._id;
    }

    transactions.forEach(t => {
        delete (t as any)._id;
    });

    return {
        ...(budget as any),
        transactions,
    };
}

export async function addTransaction(transaction: Transaction) {
    const db = getDb();
    await db.collection('transactions').insertOne(transaction);
}

export async function updateBalance(balanceChange: number) {
    const db = getDb();
    await db.collection('budget').updateOne({ id: 1 }, { $inc: { currentBalance: balanceChange } });
}

export async function getInitialBudget(): Promise<{ initialBudget: number }> {
    const db = getDb();
    const budget = await db.collection('budget').findOne({ id: 1 });
    return { initialBudget: budget ? budget.initialBudget : 0 };
}

export async function updateBudget(newBudget: number, newCurrency: string, diff: number) {
    const db = getDb();
    await db.collection('budget').updateOne(
        { id: 1 },
        {
            $set: { initialBudget: newBudget, currency: newCurrency },
            $inc: { currentBalance: diff }
        }
    );
}

export async function resetApp() {
    const db = getDb();
    await db.collection('transactions').deleteMany({});
    await db.collection('budget').updateOne({ id: 1 }, {
        $set: {
            initialBudget: INITIAL_BUDGET,
            currentBalance: INITIAL_BUDGET,
            currency: CURRENCY
        }
    });
}
