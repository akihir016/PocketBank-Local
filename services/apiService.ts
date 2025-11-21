
const API_BASE_URL = 'http://localhost:3001/api';

export const getAppState = async () => {
    const response = await fetch(`${API_BASE_URL}/state`);
    if (!response.ok) {
        throw new Error('Failed to fetch app state');
    }
    return response.json();
};

export const addTransaction = async (data: { amount: string; desc: string; category: string; }) => {
    const { amount, desc, category } = data;
    const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount,
            description: desc,
            category,
            type: 'expense',
        }),
    });
    if (!response.ok) {
        throw new Error('Failed to add transaction');
    }
    return response.json();
};

export const topUp = async (amount: string) => {
    const response = await fetch(`${API_BASE_URL}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
    });
     if (!response.ok) {
        throw new Error('Failed to top up');
    }
    return response.json();
};

export const updateBudget = async (data: { newBudgetInput: string; newCurrencyInput: string; }) => {
    const response = await fetch(`${API_BASE_URL}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update budget');
    }
    return response.json();
};

export const resetApp = async () => {
    const response = await fetch(`${API_BASE_URL}/reset`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error('Failed to reset app');
    }
    return response.json();
};
