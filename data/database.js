// database.js - Financial OS Database (Versión corregida con diagnóstico)
const STORAGE_KEY = 'finanzas';

// Función para generar IDs únicos
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Verificación de localStorage
(function() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        console.log('✅ localStorage disponible');
    } catch (e) {
        console.error('❌ localStorage no disponible:', e);
        alert('Tu navegador no soporta almacenamiento local. La aplicación no funcionará correctamente.');
    }
})();

const DEFAULT_DATA = {
    user: { 
        name: 'Wander Rodriguez', 
        monthlyIncome: 85000,
        netWorth: 340000,
        freedomGoal: 1580000
    },
    transactions: [
        { 
            id: generateUniqueId(), 
            description: 'Salario', 
            amount: 85000, 
            category: 'Ingreso', 
            type: 'income', 
            date: new Date().toISOString().split('T')[0] 
        }
    ],
    budgets: [
        { category: 'Alimentación', limit: 15000, spent: 0 },
        { category: 'Transporte', limit: 5000, spent: 0 },
        { category: 'Servicios', limit: 8000, spent: 0 },
        { category: 'Ahorro', limit: 17000, spent: 0 }
    ],
    debts: [],
    goals: [],
    categories: [
        'Ingreso', 'Alimentación', 'Transporte', 'Servicios', 
        'Suscripciones', 'Entretenimiento', 'Salud', 'Deudas', 
        'Educación', 'Ropa', 'Ahorro'
    ]
};

// Datos de ejemplo precargados SOLO si es primera vez
function addSampleDataIfEmpty(data) {
    if (data.transactions.length <= 1 && data.goals.length === 0) {
        console.log('📝 Agregando datos de ejemplo...');
        
        // Agregar algunas transacciones de ejemplo
        const today = new Date();
        const thisMonth = today.toISOString().substring(0, 7);
        
        const sampleTransactions = [
            { description: 'Supermercado', amount: 3500, category: 'Alimentación', type: 'expense', date: `${thisMonth}-05` },
            { description: 'Gasolina', amount: 2000, category: 'Transporte', type: 'expense', date: `${thisMonth}-08` },
            { description: 'Internet', amount: 1500, category: 'Servicios', type: 'expense', date: `${thisMonth}-01` },
            { description: 'Netflix', amount: 500, category: 'Suscripciones', type: 'expense', date: `${thisMonth}-03` },
            { description: 'Freelance', amount: 15000, category: 'Ingreso', type: 'income', date: `${thisMonth}-15` }
        ];
        
        sampleTransactions.forEach(t => {
            data.transactions.push({
                id: generateUniqueId(),
                ...t
            });
        });
        
        // Agregar metas de ejemplo
        data.goals = [
            {
                id: generateUniqueId(),
                name: 'Vehículo nuevo',
                icon: '🚗',
                target: 22500,
                current: 10125,
                deadline: '2026-11-30',
                monthlyContribution: 1200,
                createdAt: '2025-01-01'
            },
            {
                id: generateUniqueId(),
                name: 'Viaje Europa',
                icon: '✈️',
                target: 7500,
                current: 5850,
                deadline: '2026-08-31',
                monthlyContribution: 600,
                createdAt: '2025-01-01'
            }
        ];
        
        console.log('✅ Datos de ejemplo agregados');
    }
    return data;
}

const finDB = {
    getData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            console.log('🔍 Obteniendo datos del storage...');
            
            if (saved) {
                const data = JSON.parse(saved);
                
                // Validar estructura mínima
                if (!data.transactions || !data.budgets || !data.categories) {
                    throw new Error('Estructura de datos inválida');
                }
                
                console.log('✅ Datos cargados:', {
                    transacciones: data.transactions.length,
                    presupuestos: data.budgets.length,
                    deudas: (data.debts || []).length,
                    metas: (data.goals || []).length
                });
                
                return addSampleDataIfEmpty(data);
            }
        } catch (error) {
            console.warn('⚠️ Datos corruptos:', error.message);
            localStorage.removeItem(STORAGE_KEY);
        }
        
        console.log('📦 Usando datos por defecto');
        const defaultData = JSON.parse(JSON.stringify(DEFAULT_DATA));
        return addSampleDataIfEmpty(defaultData);
    },
    
    saveData(data) {
        try {
            // Validar antes de guardar
            if (!data || typeof data !== 'object') {
                throw new Error('Datos inválidos para guardar');
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            console.log('💾 Datos guardados exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al guardar:', error.message);
            return false;
        }
    },
    
    getTransactions() {
        const data = this.getData();
        return data.transactions || [];
    },
    
    addTransaction(tx) {
        try {
            console.log('➕ Agregando transacción:', tx);
            const data = this.getData();
            
            // Validar transacción
            if (!tx.description || !tx.amount || tx.amount <= 0) {
                throw new Error('Transacción inválida');
            }
            
            tx.id = generateUniqueId();
            tx.date = tx.date || new Date().toISOString().split('T')[0];
            tx.amount = parseFloat(tx.amount);
            
            // Asegurar que la categoría existe
            if (tx.category && !data.categories.includes(tx.category)) {
                data.categories.push(tx.category);
                console.log('📁 Nueva categoría agregada:', tx.category);
            }
            
            data.transactions.unshift(tx);
            const saved = this.saveData(data);
            
            if (saved) {
                console.log('✅ Transacción agregada:', tx);
                return tx;
            }
            throw new Error('No se pudo guardar');
        } catch (error) {
            console.error('❌ Error al agregar transacción:', error.message);
            throw error;
        }
    },
    
    deleteTransaction(id) {
        const data = this.getData();
        const before = data.transactions.length;
        data.transactions = data.transactions.filter(t => t.id != id);
        if (data.transactions.length === before) {
            console.warn('⚠️ Transacción no encontrada:', id);
        } else {
            console.log('🗑️ Transacción eliminada:', id);
        }
        this.saveData(data);
    },
    
    updateTransaction(id, updated) {
        const data = this.getData();
        const index = data.transactions.findIndex(t => t.id == id);
        if (index !== -1) {
            data.transactions[index] = { 
                ...data.transactions[index], 
                ...updated, 
                id: data.transactions[index].id,
                amount: parseFloat(updated.amount) || data.transactions[index].amount
            };
            this.saveData(data);
            console.log('✏️ Transacción actualizada:', id);
            return true;
        }
        console.warn('⚠️ Transacción no encontrada para actualizar:', id);
        return false;
    },
    
    getBudgets() {
        return this.getData().budgets || [];
    },
    
    updateBudgetLimit(category, newLimit) {
        const data = this.getData();
        const budget = data.budgets.find(b => b.category === category);
        if (budget) {
            budget.limit = Math.max(0, parseFloat(newLimit));
            this.saveData(data);
            console.log('💰 Presupuesto actualizado:', category, '->', budget.limit);
            return true;
        }
        console.warn('⚠️ Categoría no encontrada:', category);
        return false;
    },
    
    deleteBudgetCategory(category) {
        const data = this.getData();
        data.budgets = data.budgets.filter(b => b.category !== category);
        this.saveData(data);
        console.log('🗑️ Categoría eliminada:', category);
    },
    
    addBudgetCategory(category, limit) {
        const data = this.getData();
        if (data.budgets.some(b => b.category === category)) {
            console.warn('⚠️ La categoría ya existe:', category);
            return false;
        }
        data.budgets.push({ 
            category, 
            limit: Math.max(0, parseFloat(limit) || 0), 
            spent: 0 
        });
        if (!data.categories.includes(category)) {
            data.categories.push(category);
        }
        this.saveData(data);
        console.log('➕ Categoría agregada:', category);
        return true;
    },
    
    recalculateBudgetSpent() {
        try {
            console.log('🔄 Recalculando presupuestos...');
            const data = this.getData();
            const currentMonth = new Date().toISOString().substring(0, 7);
            
            console.log('📅 Mes actual:', currentMonth);
            
            const monthlyExpenses = data.transactions.filter(t => 
                t.type === 'expense' && t.date && t.date.startsWith(currentMonth)
            );
            
            console.log('💸 Gastos del mes:', monthlyExpenses.length);
            
            data.budgets.forEach(budget => {
                const oldSpent = budget.spent;
                budget.spent = monthlyExpenses
                    .filter(t => t.category === budget.category)
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                
                if (oldSpent !== budget.spent) {
                    console.log(`📊 ${budget.category}: ${oldSpent} -> ${budget.spent}`);
                }
            });
            
            this.saveData(data);
            console.log('✅ Presupuestos recalculados');
        } catch (error) {
            console.error('❌ Error al recalcular:', error);
        }
    },
    
    getMonthlyStats(month) {
        try {
            console.log('📊 Calculando estadísticas para:', month);
            const transactions = this.getTransactions();
            const monthly = transactions.filter(t => t.date && t.date.startsWith(month));
            
            console.log('Transacciones del mes:', monthly.length);
            
            const income = monthly
                .filter(t => t.type === 'income')
                .reduce((s, t) => s + (t.amount || 0), 0);
            
            const expenses = monthly
                .filter(t => t.type === 'expense')
                .reduce((s, t) => s + (t.amount || 0), 0);
            
            const balance = income - expenses;
            const savingsRate = income > 0 ? (balance / income) * 100 : 0;
            
            console.log('Estadísticas:', { income, expenses, balance, savingsRate: savingsRate.toFixed(1) + '%' });
            
            return { income, expenses, balance, savingsRate };
        } catch (error) {
            console.error('❌ Error en getMonthlyStats:', error);
            return { income: 0, expenses: 0, balance: 0, savingsRate: 0 };
        }
    },
    
    getDebts() {
        return this.getData().debts || [];
    },
    
    addDebt(debt) {
        try {
            const data = this.getData();
            debt.id = generateUniqueId();
            debt.paid = debt.paid || 0;
            debt.total = parseFloat(debt.total);
            debt.interest = parseFloat(debt.interest);
            debt.monthlyPayment = parseFloat(debt.monthlyPayment);
            data.debts.push(debt);
            this.saveData(data);
            console.log('💳 Deuda agregada:', debt);
            return debt;
        } catch (error) {
            console.error('❌ Error al agregar deuda:', error);
            throw error;
        }
    },
    
    makePayment(debtId, amount) {
        const data = this.getData();
        const debt = data.debts.find(d => d.id == debtId);
        if (debt && amount > 0 && amount <= (debt.total - (debt.paid || 0))) {
            debt.paid = (debt.paid || 0) + parseFloat(amount);
            this.saveData(data);
            console.log('💰 Pago realizado:', amount, '-', debt.name);
            return true;
        }
        console.warn('⚠️ No se pudo realizar el pago');
        return false;
    },
    
    getGoals() {
        return this.getData().goals || [];
    },
    
    addGoal(goal) {
        try {
            const data = this.getData();
            if (!data.goals) data.goals = [];
            goal.id = generateUniqueId();
            goal.current = parseFloat(goal.current) || 0;
            goal.target = parseFloat(goal.target);
            goal.createdAt = new Date().toISOString();
            data.goals.push(goal);
            this.saveData(data);
            console.log('🎯 Meta agregada:', goal);
            return goal;
        } catch (error) {
            console.error('❌ Error al agregar meta:', error);
            throw error;
        }
    },
    
    updateGoal(id, updates) {
        const data = this.getData();
        const index = data.goals.findIndex(g => g.id == id);
        if (index !== -1) {
            data.goals[index] = { 
                ...data.goals[index], 
                ...updates, 
                id: data.goals[index].id,
                target: parseFloat(updates.target) || data.goals[index].target,
                current: parseFloat(updates.current) || data.goals[index].current
            };
            this.saveData(data);
            console.log('✏️ Meta actualizada:', id);
            return true;
        }
        console.warn('⚠️ Meta no encontrada:', id);
        return false;
    },
    
    deleteGoal(id) {
        const data = this.getData();
        const before = data.goals.length;
        data.goals = data.goals.filter(g => g.id != id);
        const deleted = data.goals.length < before;
        if (deleted) {
            this.saveData(data);
            console.log('🗑️ Meta eliminada:', id);
        }
        return deleted;
    },
    
    addGoalContribution(goalId, amount) {
        try {
            const data = this.getData();
            const goal = data.goals.find(g => g.id == goalId);
            if (goal && amount > 0) {
                goal.current = (goal.current || 0) + parseFloat(amount);
                
                // Registrar como transacción
                this.addTransaction({
                    description: `Ahorro para: ${goal.name}`,
                    amount: parseFloat(amount),
                    category: 'Ahorro',
                    type: 'expense',
                    date: new Date().toISOString().split('T')[0]
                });
                
                this.saveData(data);
                console.log('💰 Contribución a meta:', amount, '-', goal.name);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error en contribución:', error);
            return false;
        }
    }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.finDB = finDB;
    console.log('✅ Financial OS Database v2.0 cargado correctamente');
    console.log('📊 Datos iniciales:', finDB.getData());
}