
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import db from './mockDatabase.js';
import { Transaction } from './types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
  },
});

app.use(express.json());

const users = new Map<string, string>();

// ===== Helper Functions =====
function getAppState() {
    const budget = db.prepare('SELECT * FROM budget WHERE id = 1').get();
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
    return {
        ...(budget as any),
        transactions,
    };
}

function broadcastState() {
    const state = getAppState();
    io.emit('banking_update', state);
}


// ===== API Endpoints for Banking =====

app.get('/api/state', (req, res) => {
    res.json(getAppState());
});

app.post('/api/transactions', (req, res) => {
    const { amount, description, category, type } = req.body;
    if (!amount || !description || !category || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const newTransaction: Transaction = {
        id: new Date().toISOString() + Math.random(),
        amount: parseFloat(amount),
        description,
        category,
        date: new Date().toISOString(),
        type,
    };

    db.prepare(
        'INSERT INTO transactions (id, amount, description, category, date, type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(newTransaction.id, newTransaction.amount, newTransaction.description, newTransaction.category, newTransaction.date, newTransaction.type);

    const balanceChange = type === 'expense' ? -newTransaction.amount : newTransaction.amount;
    db.prepare('UPDATE budget SET currentBalance = currentBalance + ? WHERE id = 1').run(balanceChange);
    
    broadcastState();
    res.status(201).json(newTransaction);
});

app.post('/api/topup', (req, res) => {
    const { amount } = req.body;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const newTransaction: Transaction = {
        id: new Date().toISOString() + Math.random(),
        amount: val,
        description: 'Emergency Top Up',
        category: 'Income',
        date: new Date().toISOString(),
        type: 'deposit'
    };

    db.prepare(
        'INSERT INTO transactions (id, amount, description, category, date, type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(newTransaction.id, newTransaction.amount, newTransaction.description, newTransaction.category, newTransaction.date, newTransaction.type);

    db.prepare('UPDATE budget SET currentBalance = currentBalance + ? WHERE id = 1').run(val);
    
    broadcastState();
    res.status(201).json(newTransaction);
});

app.put('/api/budget', (req, res) => {
    const { newBudgetInput, newCurrencyInput } = req.body;
    const val = parseFloat(newBudgetInput);
     if (isNaN(val) || val <= 0) {
        return res.status(400).json({ message: 'Invalid budget amount' });
    }

    const oldBudget = db.prepare('SELECT initialBudget FROM budget WHERE id = 1').get() as { initialBudget: number };
    const diff = val - oldBudget.initialBudget;

    db.prepare('UPDATE budget SET initialBudget = ?, currency = ?, currentBalance = currentBalance + ? WHERE id = 1').run(val, newCurrencyInput || '$', diff);

    broadcastState();
    res.status(200).json(getAppState());
});

app.post('/api/reset', (req, res) => {
    const INITIAL_BUDGET = 2000;
    const CURRENCY = '$';
    
    db.exec('DELETE FROM transactions');
    db.prepare('UPDATE budget SET initialBudget = ?, currentBalance = ?, currency = ? WHERE id = 1').run(INITIAL_BUDGET, INITIAL_BUDGET, CURRENCY);
    
    broadcastState();
    res.status(200).json({ message: 'Application reset' });
});


// ===== Socket.IO for Chat =====

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.emit('users', Array.from(users.values()));

  socket.on('set_name', (name, callback) => {
    if (typeof name === 'string' && name.trim().length > 0) {
      const oldName = users.get(socket.id);
      const newName = name.trim();
      
      users.set(socket.id, newName);
      io.emit('users', Array.from(users.values()));

      if (oldName && oldName !== newName) {
        io.emit('chat_message', { id: `${Date.now()}-${Math.random()}`, text: `${oldName} changed their name to ${newName}`, sender: 'System' });
      } else if (!oldName) {
        socket.broadcast.emit('chat_message', { id: `${Date.now()}-${Math.random()}`, text: `${newName} has joined the chat`, sender: 'System' });
      }
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Invalid name' });
    }
  });

  socket.on('chat_message', (msg) => {
    const sender = users.get(socket.id);
    if (sender) {
      io.emit('chat_message', { id: `${Date.now()}-${Math.random()}`, text: msg, sender });
    }
  });

  socket.on('disconnect', () => {
    const name = users.get(socket.id);
    if (name) {
      users.delete(socket.id);
      io.emit('users', Array.from(users.values()));
      io.emit('chat_message', { id: `${Date.now()}-${Math.random()}`, text: `${name} has left the chat`, sender: 'System' });
    }
    console.log('user disconnected', socket.id);
  });
});


// ===== Server Start =====
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
