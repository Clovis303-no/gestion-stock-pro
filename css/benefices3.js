// ============================================
// ANALYSE DES BÉNÉFICES
// Gère l'affichage des bénéfices et graphiques
// ============================================

let profitChartInstance = null;
let comparisonChartInstance = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadBeneficeStats();
    loadTotalNetProfit();
    loadTopProfitableProducts();
    loadMonthlySummary();
    loadProfitChart();
    loadComparisonChart();
});

// Charger le bénéfice net total
function loadTotalNetProfit() {
    const totalProfit = db.getTotalProfit();
    const element = document.getElementById('totalNetProfit');
    element.textContent = `${totalProfit.toFixed(2)} €`;
    
    if (totalProfit < 0) {
        element.style.color = '#fecaca';
    }
}

// Charger les statistiques des bénéfices
function loadBeneficeStats() {
    const sales = db.getSales();
    const expenses = db.getExpenses();
    
    // Calculs
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCostOfGoods = sales.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0);
    const grossProfit = totalRevenue - totalCostOfGoods;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    
    // Bénéfice du jour
    const todaySales = db.getTodaySales();
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayCostOfGoods = todaySales.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0);
    const todayGrossProfit = todayRevenue - todayCostOfGoods;
    const todayExpenses = db.getDailyExpenses();
    const todayNetProfit = todayGrossProfit - todayExpenses;
    
    // Marge moyenne
    const marginPercentage = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;
    
    // Rentabilité (bénéfice net / chiffre d'affaires)
    const profitability = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    document.getElementById('beneficeStats').innerHTML = `
        <div class="stat-card ${todayNetProfit >= 0 ? 'revenue' : 'expense'}">
            <i class="fas fa-calendar-day"></i>
            <div class="stat-label">Bénéfice du jour</div>
            <div class="stat-value">${todayNetProfit.toFixed(2)} €</div>
            <small>Aujourd'hui</small>
        </div>
        <div class="stat-card profit">
            <i class="fas fa-chart-line"></i>
            <div class="stat-label">Bénéfice brut</div>
            <div class="stat-value">${grossProfit.toFixed(2)} €</div>
            <small>Marge: ${marginPercentage.toFixed(1)}%</small>
        </div>
        <div class="stat-card expense">
            <i class="fas fa-arrow-down"></i>
            <div class="stat-label">Dépenses totales</div>
            <div class="stat-value">${totalExpenses.toFixed(2)} €</div>
            <small>Toutes catégories</small>
        </div>
        <div class="stat-card ${netProfit >= 0 ? 'revenue' : 'expense'}">
            <i class="fas fa-percentage"></i>
            <div class="stat-label">Rentabilité</div>
            <div class="stat-value">${profitability.toFixed(1)}%</div>
            <small>Bénéfice net / CA</small>
        </div>
    `;
}

// Charger les produits les plus rentables
function loadTopProfitableProducts() {
    const sales = db.getSales();
    const productProfits = {};
    
    sales.forEach(sale => {
        if (!productProfits[sale.productId]) {
            const product = db.getProductById(sale.productId);
            productProfits[sale.productId] = {
                name: product ? product.name : 'Produit supprimé',
                totalProfit: 0,
                totalRevenue: 0,
                quantity: 0
            };
        }
        productProfits[sale.productId].totalProfit += sale.profit;
        productProfits[sale.productId].totalRevenue += sale.totalAmount;
        productProfits[sale.productId].quantity += sale.quantity;
    });
    
    const sortedProducts = Object.values(productProfits)
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 5);
    
    const container = document.getElementById('topProfitableProducts');
    
    if (sortedProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <p>Aucune vente enregistrée</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    sortedProducts.forEach((product, index) => {
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        const profitMargin = product.totalRevenue > 0 ? 
            ((product.totalProfit / product.totalRevenue) * 100).toFixed(1) : 0;
        
        html += `
            <div style="display: flex; align-items: center; margin-bottom: 12px; padding: 12px; background: var(--light-bg); border-radius: 8px; border-left: 4px solid var(--secondary-color);">
                <div style="font-size: 1.5rem; margin-right: 12px;">${medals[index]}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.9rem;">${product.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        ${product.quantity} vendus • CA: ${product.totalRevenue.toFixed(2)} €
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                        <span class="badge badge-success">Bénéfice: ${product.totalProfit.toFixed(2)} €</span>
                        <span class="badge badge-info">Marge: ${profitMargin}%</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Charger le résumé mensuel
function loadMonthlySummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const sales = db.getSales();
    const expenses = db.getExpenses();
    
    const monthlySales = sales.filter(s => new Date(s.createdAt) >= startOfMonth);
    const monthlyExpenses = expenses.filter(e => new Date(e.createdAt) >= startOfMonth);
    
    const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const monthlyCostOfGoods = monthlySales.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0);
    const monthlyGrossProfit = monthlyRevenue - monthlyCostOfGoods;
    const monthlyExpensesTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyNetProfit = monthlyGrossProfit - monthlyExpensesTotal;
    
    const container = document.getElementById('monthlySummary');
    
    container.innerHTML = `
        <div class="report-item">
            <span class="report-label">Chiffre d'affaires</span>
            <span class="report-value">${monthlyRevenue.toFixed(2)} €</span>
        </div>
        <div class="report-item">
            <span class="report-label">Coût des produits vendus</span>
            <span class="report-value negative">-${monthlyCostOfGoods.toFixed(2)} €</span>
        </div>
        <div class="report-item">
            <span class="report-label">Bénéfice brut</span>
            <span class="report-value ${monthlyGrossProfit >= 0 ? 'positive' : 'negative'}">
                ${monthlyGrossProfit.toFixed(2)} €
            </span>
        </div>
        <div class="report-item">
            <span class="report-label">Dépenses</span>
            <span class="report-value negative">-${monthlyExpensesTotal.toFixed(2)} €</span>
        </div>
        <div class="report-item" style="border-top: 2px solid var(--border-color); padding-top: 15px; margin-top: 10px;">
            <span class="report-label" style="font-weight: 700;">BÉNÉFICE NET</span>
            <span class="report-value ${monthlyNetProfit >= 0 ? 'positive' : 'negative'}" style="font-weight: 700; font-size: 1.1rem;">
                ${monthlyNetProfit.toFixed(2)} €
            </span>
        </div>
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--border-color);">
            <small style="color: var(--text-secondary);">
                Période: du ${startOfMonth.toLocaleDateString('fr-FR')} au ${now.toLocaleDateString('fr-FR')}
            </small>
        </div>
    `;
}

// Charger le graphique d'évolution des bénéfices
function loadProfitChart() {
    const ctx = document.getElementById('profitChart').getContext('2d');
    const sales = db.getSales();
    const expenses = db.getExpenses();
    
    // Calculer les bénéfices des 30 derniers jours
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        
        const daySales = sales.filter(s => 
            new Date(s.createdAt).toDateString() === dateString
        );
        const dayExpenses = expenses.filter(e => 
            new Date(e.createdAt).toDateString() === dateString
        );
        
        const revenue = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
        const costOfGoods = daySales.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0);
        const grossProfit = revenue - costOfGoods;
        const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = grossProfit - totalExpenses;
        
        last30Days.push({
            date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            profit: netProfit,
            revenue: revenue
        });
    }

    // Détruire le graphique existant
    if (profitChartInstance) {
        profitChartInstance.destroy();
    }

    profitChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days.map(d => d.date),
            datasets: [{
                label: 'Bénéfice net',
                data: last30Days.map(d => d.profit),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return value + ' €';
                        }
                    }
                }
            }
        }
    });
}

// Charger le graphique comparatif Revenus vs Dépenses
function loadComparisonChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const sales = db.getSales();
    const expenses = db.getExpenses();
    
    // Calculer par semaine du mois
    const weeks = [
        { label: 'Semaine 1', revenue: 0, expenses: 0 },
        { label: 'Semaine 2', revenue: 0, expenses: 0 },
        { label: 'Semaine 3', revenue: 0, expenses: 0 },
        { label: 'Semaine 4', revenue: 0, expenses: 0 }
    ];
    
    sales.forEach(sale => {
        const saleDate = new Date(sale.createdAt);
        if (saleDate >= startOfMonth) {
            const weekIndex = Math.floor((saleDate.getDate() - 1) / 7);
            if (weekIndex < 4) {
                weeks[weekIndex].revenue += sale.totalAmount;
            }
        }
    });
    
    expenses.forEach(expense => {
        const expenseDate = new Date(expense.createdAt);
        if (expenseDate >= startOfMonth) {
            const weekIndex = Math.floor((expenseDate.getDate() - 1) / 7);
            if (weekIndex < 4) {
                weeks[weekIndex].expenses += expense.amount;
            }
        }
    });

    // Détruire le graphique existant
    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
    }

    comparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeks.map(w => w.label),
            datasets: [
                {
                    label: 'Revenus',
                    data: weeks.map(w => w.revenue),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 8
                },
                {
                    label: 'Dépenses',
                    data: weeks.map(w => w.expenses),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' €';
                        }
                    }
                }
            }
        }
    });
}

// Thème
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
})();

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    localStorage.setItem('theme', newTheme);
}