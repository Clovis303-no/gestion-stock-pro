// ============================================
// DASHBOARD - Tableau de bord principal
// Gère l'affichage des statistiques en temps réel
// ============================================

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    setInterval(refreshDashboard, 30000); // Rafraîchir toutes les 30 secondes
});

// Mettre à jour la date et l'heure
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('fr-FR', options);
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('fr-FR');
}

// Initialiser le tableau de bord
function initializeDashboard() {
    loadStatistics();
    loadTopProducts();
    loadRecentSales();
    loadSalesChart();
}

// Rafraîchir le tableau de bord
function refreshDashboard() {
    loadStatistics();
    loadTopProducts();
    loadRecentSales();
}

// Charger les statistiques principales
function loadStatistics() {
    const products = db.getProducts();
    const todaySales = db.getTodaySales();
    const todayExpenses = db.getTodayExpenses();
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const dailyRevenue = db.getDailyRevenue();
    const dailyProfit = db.getDailyProfit();
    const dailyExpenses = db.getDailyExpenses();
    const newClientsToday = db.getNewClientsToday();

    const statsHTML = `
        <div class="stat-card">
            <i class="fas fa-boxes"></i>
            <div class="stat-label">Produits</div>
            <div class="stat-value">${products.length}</div>
            <small style="color: var(--text-secondary);">Stock: ${totalStock} unités</small>
        </div>
        <div class="stat-card revenue">
            <i class="fas fa-euro-sign"></i>
            <div class="stat-label">CA du jour</div>
            <div class="stat-value">${dailyRevenue.toFixed(2)} €</div>
            <small style="color: var(--text-secondary);">${todaySales.length} ventes</small>
        </div>
        <div class="stat-card expense">
            <i class="fas fa-arrow-down"></i>
            <div class="stat-label">Dépenses</div>
            <div class="stat-value">${dailyExpenses.toFixed(2)} €</div>
            <small style="color: var(--text-secondary);">${todayExpenses.length} dépenses</small>
        </div>
        <div class="stat-card profit">
            <i class="fas fa-chart-line"></i>
            <div class="stat-label">Bénéfice net</div>
            <div class="stat-value" style="color: ${dailyProfit >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)'}">
                ${dailyProfit.toFixed(2)} €
            </div>
            <small style="color: var(--text-secondary);">Aujourd'hui</small>
        </div>
        <div class="stat-card">
            <i class="fas fa-users"></i>
            <div class="stat-label">Clients</div>
            <div class="stat-value">${db.getClients().length}</div>
            <small style="color: var(--text-secondary);">+${newClientsToday} aujourd'hui</small>
        </div>
        <div class="stat-card revenue">
            <i class="fas fa-shopping-cart"></i>
            <div class="stat-label">Ventes totales</div>
            <div class="stat-value">${db.getSales().length}</div>
            <small style="color: var(--text-secondary);">Depuis le début</small>
        </div>
    `;

    document.getElementById('statsGrid').innerHTML = statsHTML;
}

// Charger les produits les plus vendus
function loadTopProducts() {
    const topProducts = db.getBestSellingProducts();
    const container = document.getElementById('topProducts');

    if (topProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>Aucune vente enregistrée</p>
            </div>
        `;
        return;
    }

    let html = '';
    topProducts.forEach((product, index) => {
        const percentage = topProducts.length > 0 ? 
            ((product.quantity / topProducts[0].quantity) * 100).toFixed(0) : 0;
        
        html += `
            <div style="display: flex; align-items: center; margin-bottom: 12px; padding: 10px; background: var(--light-bg); border-radius: 8px;">
                <div style="width: 30px; height: 30px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; font-size: 0.9rem;">
                    ${index + 1}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.9rem;">${product.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${product.quantity} vendus • ${product.revenue.toFixed(2)} €</div>
                    <div style="width: 100%; height: 4px; background: var(--border-color); border-radius: 2px; margin-top: 5px;">
                        <div style="width: ${percentage}%; height: 100%; background: var(--primary-color); border-radius: 2px; transition: width 1s ease;"></div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Charger les dernières ventes
function loadRecentSales() {
    const sales = db.getSales();
    const recentSales = sales.slice(-5).reverse();
    const container = document.getElementById('recentSales');

    if (recentSales.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>Aucune vente récente</p>
            </div>
        `;
        return;
    }

    let html = '';
    recentSales.forEach(sale => {
        const product = db.getProductById(sale.productId);
        const client = db.getClientById(sale.clientId);
        const date = new Date(sale.createdAt);
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">
                        ${product ? product.name : 'Produit supprimé'}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        ${client ? client.name : 'Client anonyme'} • ${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; color: var(--secondary-color);">
                        +${sale.totalAmount.toFixed(2)} €
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        Qté: ${sale.quantity}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Charger le graphique des ventes
function loadSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const sales = db.getSales();
    
    // Calculer les ventes des 7 derniers jours
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        
        const daySales = sales.filter(s => 
            new Date(s.createdAt).toDateString() === dateString
        );
        
        const total = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
        
        last7Days.push({
            date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
            total: total
        });
    }

    // Détruire le graphique existant s'il existe
    if (window.salesChartInstance) {
        window.salesChartInstance.destroy();
    }

    window.salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days.map(d => d.date),
            datasets: [{
                label: 'Ventes (€)',
                data: last7Days.map(d => d.total),
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 2,
                borderRadius: 8,
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

// Fonction utilitaire pour basculer le thème
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// Appliquer le thème sauvegardé
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
})();