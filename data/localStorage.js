// ============================================
// GESTION DU STOCKAGE LOCAL
// Système de persistance des données
// ============================================

class LocalStorageDB {
    constructor() {
        this.keys = {
            products: 'gestion_stock_pro_products',
            sales: 'gestion_stock_pro_sales',
            clients: 'gestion_stock_pro_clients',
            expenses: 'gestion_stock_pro_expenses'
        };
        this.initializeDatabase();
    }

    // Initialiser la base de données avec des données par défaut si vide
    initializeDatabase() {
        if (!this.getData(this.keys.products)) {
            this.saveData(this.keys.products, []);
        }
        if (!this.getData(this.keys.sales)) {
            this.saveData(this.keys.sales, []);
        }
        if (!this.getData(this.keys.clients)) {
            this.saveData(this.keys.clients, []);
        }
        if (!this.getData(this.keys.expenses)) {
            this.saveData(this.keys.expenses, []);
        }
    }

    // Sauvegarder des données
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            return false;
        }
    }

    // Récupérer des données
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erreur de récupération:', error);
            return null;
        }
    }

    // ============================================
    // GESTION DES PRODUITS
    // ============================================
    
    getProducts() {
        return this.getData(this.keys.products) || [];
    }

    saveProducts(products) {
        return this.saveData(this.keys.products, products);
    }

    addProduct(product) {
        const products = this.getProducts();
        product.id = Date.now().toString();
        product.createdAt = new Date().toISOString();
        products.push(product);
        return this.saveProducts(products);
    }

    updateProduct(id, updatedProduct) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedProduct };
            return this.saveProducts(products);
        }
        return false;
    }

    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id !== id);
        return this.saveProducts(filtered);
    }

    getProductById(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id) || null;
    }

    updateProductQuantity(id, quantity) {
        const product = this.getProductById(id);
        if (product) {
            product.quantity = quantity;
            return this.updateProduct(id, product);
        }
        return false;
    }

    // ============================================
    // GESTION DES VENTES
    // ============================================

    getSales() {
        return this.getData(this.keys.sales) || [];
    }

    saveSales(sales) {
        return this.saveData(this.keys.sales, sales);
    }

    addSale(sale) {
        const sales = this.getSales();
        sale.id = Date.now().toString();
        sale.createdAt = new Date().toISOString();
        
        // Calculer le bénéfice
        const product = this.getProductById(sale.productId);
        if (product) {
            sale.purchasePrice = product.purchasePrice;
            sale.sellingPrice = product.sellingPrice;
            sale.profit = (product.sellingPrice - product.purchasePrice) * sale.quantity;
            sale.totalAmount = product.sellingPrice * sale.quantity;
            
            // Mettre à jour le stock
            const newQuantity = product.quantity - sale.quantity;
            this.updateProductQuantity(product.id, newQuantity);
        }
        
        sales.push(sale);
        return this.saveSales(sales);
    }

    getTodaySales() {
        const sales = this.getSales();
        const today = new Date().toDateString();
        return sales.filter(s => new Date(s.createdAt).toDateString() === today);
    }

    getSalesByDateRange(startDate, endDate) {
        const sales = this.getSales();
        return sales.filter(s => {
            const date = new Date(s.createdAt);
            return date >= startDate && date <= endDate;
        });
    }

    // ============================================
    // GESTION DES CLIENTS
    // ============================================

    getClients() {
        return this.getData(this.keys.clients) || [];
    }

    saveClients(clients) {
        return this.saveData(this.keys.clients, clients);
    }

    addClient(client) {
        const clients = this.getClients();
        client.id = Date.now().toString();
        client.createdAt = new Date().toISOString();
        client.purchaseHistory = [];
        clients.push(client);
        return this.saveClients(clients);
    }

    updateClient(id, updatedClient) {
        const clients = this.getClients();
        const index = clients.findIndex(c => c.id === id);
        if (index !== -1) {
            clients[index] = { ...clients[index], ...updatedClient };
            return this.saveClients(clients);
        }
        return false;
    }

    deleteClient(id) {
        const clients = this.getClients();
        const filtered = clients.filter(c => c.id !== id);
        return this.saveClients(filtered);
    }

    getClientById(id) {
        const clients = this.getClients();
        return clients.find(c => c.id === id) || null;
    }

    // ============================================
    // GESTION DES DÉPENSES
    // ============================================

    getExpenses() {
        return this.getData(this.keys.expenses) || [];
    }

    saveExpenses(expenses) {
        return this.saveData(this.keys.expenses, expenses);
    }

    addExpense(expense) {
        const expenses = this.getExpenses();
        expense.id = Date.now().toString();
        expense.createdAt = new Date().toISOString();
        expenses.push(expense);
        return this.saveExpenses(expenses);
    }

    deleteExpense(id) {
        const expenses = this.getExpenses();
        const filtered = expenses.filter(e => e.id !== id);
        return this.saveExpenses(filtered);
    }

    getTodayExpenses() {
        const expenses = this.getExpenses();
        const today = new Date().toDateString();
        return expenses.filter(e => new Date(e.createdAt).toDateString() === today);
    }

    // ============================================
    // CALCULS FINANCIERS
    // ============================================

    getDailyRevenue() {
        const todaySales = this.getTodaySales();
        return todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    }

    getDailyProfit() {
        const todaySales = this.getTodaySales();
        const totalProfit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
        const todayExpenses = this.getTodayExpenses();
        const totalExpenses = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        return totalProfit - totalExpenses;
    }

    getDailyExpenses() {
        const todayExpenses = this.getTodayExpenses();
        return todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }

    getTotalRevenue() {
        const sales = this.getSales();
        return sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    }

    getTotalProfit() {
        const sales = this.getSales();
        const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
        const expenses = this.getExpenses();
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        return totalProfit - totalExpenses;
    }

    getBestSellingProducts() {
        const sales = this.getSales();
        const productSales = {};
        
        sales.forEach(sale => {
            if (!productSales[sale.productId]) {
                const product = this.getProductById(sale.productId);
                productSales[sale.productId] = {
                    name: product ? product.name : 'Inconnu',
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[sale.productId].quantity += sale.quantity;
            productSales[sale.productId].revenue += sale.totalAmount;
        });
        
        return Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }

    getNewClientsToday() {
        const clients = this.getClients();
        const today = new Date().toDateString();
        return clients.filter(c => new Date(c.createdAt).toDateString() === today).length;
    }
}

// Instance globale de la base de données
const db = new LocalStorageDB();