// ============================================
// GESTION DES RAPPORTS
// Génération de rapports journaliers, hebdomadaires et mensuels
// ============================================

let reportChartInstance = null;
let currentReportType = 'daily';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Générer le rapport journalier par défaut
    generateReport('daily');
    
    // Mettre en évidence le bouton actif
    document.getElementById('btnDaily').style.opacity = '1';
    document.getElementById('btnWeekly').style.opacity = '0.7';
    document.getElementById('btnMonthly').style.opacity = '0.7';
});

// Générer un rapport selon la période
function generateReport(type) {
    currentReportType = type;
    
    // Mettre à jour l'apparence des boutons
    document.getElementById('btnDaily').style.opacity = type === 'daily' ? '1' : '0.7';
    document.getElementById('btnWeekly').style.opacity = type === 'weekly' ? '1' : '0.7';
    document.getElementById('btnMonthly').style.opacity = type === 'monthly' ? '1' : '0.7';
    
    // Définir la période
    const now = new Date();
    let startDate, endDate, reportTitle, dateDisplay;
    
    switch(type) {
        case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            reportTitle = 'Rapport Journalier';
            dateDisplay = now.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            break;
            
        case 'weekly':
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate = new Date(now.getFullYear(), now.getMonth(), diff);
            endDate = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59);
            reportTitle = 'Rapport Hebdomadaire';
            dateDisplay = `Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
            break;
            
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            reportTitle = 'Rapport Mensuel';
            dateDisplay = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            break;
    }
    
    // Mettre à jour l'en-tête
    document.getElementById('reportTitle').textContent = reportTitle;
    document.getElementById('reportDate').textContent = dateDisplay;
    
    // Charger les données du rapport
    loadReportSummary(startDate, endDate);
    loadReportSales(startDate, endDate);
    loadReportExpenses(startDate, endDate);
    loadReportNewClients(startDate, endDate);
    loadReportChart(startDate, endDate, type);
    loadFinancialSummary(startDate, endDate);
    
    // Afficher le contenu
    document.getElementById('reportContent').style.display = 'block';
    document.getElementById('noData').style.display = 'none';
    
    // Vérifier s'il y a des données
    checkIfDataExists(startDate, endDate);
}

// Vérifier si des données existent pour la période
function checkIfDataExists(startDate, endDate) {
    const sales = db.getSales();
    const expenses = db.getExpenses();
    
    const periodSales = sales.filter(s => {
        const date = new Date(s.createdAt);
        return date >= startDate && date <= endDate;
    });
    
    const periodExpenses = expenses.filter(e => {
        const date = new Date(e.createdAt);
        return date >= startDate && date <= endDate;
    });
    
    if (periodSales.length === 0 && periodExpenses.length === 0) {
        document.getElementById('reportContent').style.display = 'none';
        document.getElementById('noData').style.display = 'block';
    }
}

// Charger le résumé du rapport
function loadReportSummary(startDate, endDate) {
    const sales = db.getSales();
    const expenses = db.getExpenses();
    const clients = db.getClients();
    
    // Filtrer par période
    const periodSales = sales.filter(s => {
        const date = new Date(s.createdAt);
        return date >= startDate && date <= endDate;
    });
    
    const periodExpenses = expenses.filter(e => {
        const date = new Date(e.createdAt);
        return date >= startDate && date <= endDate;
    });
    
    const periodClients = clients.filter(c => {
        const date = new Date(c.createdAt);
        return date >= startDate && date <= endDate;
    });
    
    // Calculs
    const revenue = periodSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const costOfGoods = periodSales.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0);
    const grossProfit = revenue - costOfGoods;
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const totalTransactions = periodSales.length;
    const averageTicket = totalTransactions > 0 ? revenue / totalTransactions : 0;
    
    // Produits vendus
    const productsSold = periodSales.reduce((sum, s) => sum + s.quantity, 0);
    
    // Marge moyenne
    const marginPercentage = revenue > 0 ? ((grossProfit / revenue) * 100) : 0;
    
    document.getElementById('reportSummary').innerHTML = `
        <div class="stat-card revenue">
            <i class="fas fa-euro-sign"></i>
            <div class="stat-label">Chiffre d'affaires</div>
            <div class="stat-value">${revenue.toFixed(2)} €</div>
            <small>${totalTransactions} transactions</small>
        </div>
        <div class="stat-card profit">
            <i class="fas fa-chart-line"></i>
            <div class="stat-label">Bénéfice brut</div>
            <div class="stat-value">${grossProfit.toFixed(2)} €</div>
            <small>Marge: ${marginPercentage.toFixed(1)}%</small>
        </div>
        <div class="stat-card expense">
            <i class="fas fa-arrow-down"></i>
            <div class="stat-label">Dépenses</div>
            <div class="stat-value">${totalExpenses.toFixed(2)} €</div>
            <small>${periodExpenses.length} dépenses</small>
        </div>
        <div class="stat-card ${netProfit >= 0 ? 'revenue' : 'expense'}">
            <i class="fas fa-balance-scale"></i>
            <div class="stat-label">Bénéfice net</div>
            <div class="stat-value">${netProfit.toFixed(2)} €</div>
            <small>Après dépenses</small>
        </div>
        <div class="stat-card">
            <i class="fas fa-shopping-bag"></i>
            <div class="stat-label">Produits vendus</div>
            <div class="stat-value">${productsSold}</div>
            <small>Unités</small>
        </div>
        <div class="stat-card profit">
            <i class="fas fa-receipt"></i>
            <div class="stat-label">Panier moyen</div>
            <div class="stat-value">${averageTicket.toFixed(2)} €</div>
            <small>Par transaction</small>
        </div>
        <div class="stat-card">
            <i class="fas fa-user-plus"></i>
            <div class="stat-label">Nouveaux clients</div>
            <div class="stat-value">${periodClients.length}</div>
            <small>Sur la période</small>
        </div>
        <div class="stat-card revenue">
            <i class="fas fa-calculator"></i>
            <div class="stat-label">Coût produits</div>
            <div class="stat-value">${costOfGoods.toFixed(2)} €</div>
            <small>Prix d'achat total</small>
        </div>
    `;
}

// Charger les ventes du rapport
function loadReportSales(startDate, endDate) {
    const sales = db.getSales();
    
    const periodSales = sales.filter(s => {
        const date = new Date(s.createdAt);
        return date >= startDate && date <= endDate;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const tbody = document.getElementById('reportSales');
    const noSales = document.getElementById('noReportSales');
    
    if (periodSales.length === 0) {
        tbody.innerHTML = '';
        noSales.style.display = 'block';
        return;
    }
    
    noSales.style.display = 'none';
    let html = '';
    
    periodSales.forEach(sale => {
        const product = db.getProductById(sale.productId);
        const client = db.getClientById(sale.clientId);
        const date = new Date(sale.createdAt);
        
        html += `
            <tr>
                <td>
                    <small>${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</small>
                </td>
                <td>${client ? client.name : '<span style="color: var(--text-secondary);">Inconnu</span>'}</td>
                <td>${product ? product.name : '<span style="color: var(--text-secondary);">Supprimé</span>'}</td>
                <td><span class="badge badge-info">${sale.quantity}</span></td>
                <td><strong>${sale.totalAmount.toFixed(2)} €</strong></td>
                <td><span class="badge ${sale.profit >= 0 ? 'badge-success' : 'badge-danger'}">${sale.profit.toFixed(2)} €</span></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Charger les dépenses du rapport
function loadReportExpenses(startDate, endDate) {
    const expenses = db.getExpenses();
    
    const periodExpenses = expenses.filter(e => {
        const date = new Date(e.createdAt);
        return date >= startDate && date <= endDate;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const tbody = document.getElementById('reportExpenses');
    const noExpenses = document.getElementById('noReportExpenses');
    
    if (periodExpenses.length === 0) {
        tbody.innerHTML = '';
        noExpenses.style.display = 'block';
        return;
    }
    
    noExpenses.style.display = 'none';
    let html = '';
    
    const categoryIcons = {
        'Transport': '🚗',
        'Loyer': '🏠',
        'Publicité': '📢',
        'Électricité': '💡',
        'Internet': '🌐',
        'Fournitures': '📦',
        'Maintenance': '🔧',
        'Salaires': '👥',
        'Impôts': '📋',
        'Autres': '📌'
    };
    
    periodExpenses.forEach(expense => {
        const date = new Date(expense.createdAt);
        const icon = categoryIcons[expense.category] || '📌';
        
        html += `
            <tr>
                <td>${date.toLocaleDateString('fr-FR')}</td>
                <td><span class="badge badge-info">${icon} ${expense.category}</span></td>
                <td>${expense.description}</td>
                <td><strong style="color: var(--danger-color);">-${expense.amount.toFixed(2)} €</strong></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Charger les nouveaux clients
function loadReportNewClients(startDate, endDate) {
    const clients = db.getClients();
    
    const newClients = clients.filter(c => {
        const date = new Date(c.createdAt);
        return date >= startDate && date <= endDate;
    });
    
    const container = document.getElementById('reportNewClients');
    
    if (newClients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-plus"></i>
                <p>Aucun nouveau client sur cette période</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    newClients.forEach(client => {
        const date = new Date(client.createdAt);
        html += `
            <div style="display: flex; align-items: center; padding: 10px; margin-bottom: 8px; background: var(--light-bg); border-radius: 8px;">
                <div style="width: 35px; height: 35px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">
                    ${client.name.charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.9rem;">${client.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        <i class="fas fa-phone"></i> ${client.phone} • 
                        Inscrit le ${date.toLocaleDateString('fr-FR')}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Charger le graphique du rapport
function loadReportChart(startDate, endDate, type) {
    const ctx = document.getElementById('reportChart').getContext('2d');
    const sales = db.getSales();
    const expenses = db.getExpenses();
    
    let labels = [];
    let revenueData = [];
    let expenseData = [];
    let profitData = [];
    
    switch(type) {
        case 'daily':
            // Graphique par heure pour le jour
            for (let i = 0; i < 24; i += 2) {
                const hourStart = new Date(startDate);
                hourStart.setHours(i, 0, 0);
                const hourEnd = new Date(startDate);
                hourEnd.setHours(i + 1, 59, 59);
                
                const hourSales = sales.filter(s => {
                    const date = new Date(s.createdAt);
                    return date >= hourStart && date <= hourEnd;
                });
                
                const hourExpenses = expenses.filter(e => {
                    const date = new Date(e.createdAt);
                    return date >= hourStart && date <= hourEnd;
                });
                
                labels.push(`${i}h-${i+2}h`);
                revenueData.push(hourSales.reduce((sum, s) => sum + s.totalAmount, 0));
                expenseData.push(hourExpenses.reduce((sum, e) => sum + e.amount, 0));
                profitData.push(
                    hourSales.reduce((sum, s) => sum + s.profit, 0) - 
                    hourExpenses.reduce((sum, e) => sum + e.amount, 0)
                );
            }
            break;
            
        case 'weekly':
            // Graphique par jour pour la semaine
            for (let i = 0; i < 7; i++) {
                const dayStart = new Date(startDate);
                dayStart.setDate(startDate.getDate() + i);
                dayStart.setHours(0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59);
                
                const daySales = sales.filter(s => {
                    const date = new Date(s.createdAt);
                    return date >= dayStart && date <= dayEnd;
                });
                
                const dayExpenses = expenses.filter(e => {
                    const date = new Date(e.createdAt);
                    return date >= dayStart && date <= dayEnd;
                });
                
                labels.push(dayStart.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
                revenueData.push(daySales.reduce((sum, s) => sum + s.totalAmount, 0));
                expenseData.push(dayExpenses.reduce((sum, e) => sum + e.amount, 0));
                profitData.push(
                    daySales.reduce((sum, s) => sum + s.profit, 0) - 
                    dayExpenses.reduce((sum, e) => sum + e.amount, 0)
                );
            }
            break;
            
        case 'monthly':
            // Graphique par semaine pour le mois
            for (let i = 0; i < 4; i++) {
                const weekStart = new Date(startDate);
                weekStart.setDate(startDate.getDate() + (i * 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59);
                
                const weekSales = sales.filter(s => {
                    const date = new Date(s.createdAt);
                    return date >= weekStart && date <= weekEnd;
                });
                
                const weekExpenses = expenses.filter(e => {
                    const date = new Date(e.createdAt);
                    return date >= weekStart && date <= weekEnd;
                });
                
                labels.push(`Semaine ${i + 1}`);
                revenueData.push(weekSales.reduce((sum, s) => sum + s.totalAmount, 0));
                expenseData.push(weekExpenses.reduce((sum, e) => sum + e.amount, 0));
                profitData.push(
                    weekSales.reduce((sum, s) => sum + s.profit, 0) - 
                    weekExpenses.reduce((sum, e) => sum + e.amount, 0)
                );
            }
            break;
    }
    
    // Détruire le graphique existant
    if (reportChartInstance) {
        reportChartInstance.destroy();
    }
    
    reportChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenus',
                    data: revenueData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Dépenses',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Bénéfice net',
                    data: profitData,
                    type: 'line',
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6'
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
                        padding: 15,
                        font: {
                            size: 11
                        }
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

// Charger le résumé financier
function loadFinancialSummary(startDate, endDate) {
    const sales = db.getSales();
    const expenses = db.getExpenses();
    
    const periodSales = sales.filter(s => {
        const date = new Date(s.createdAt);
        return date >= startDate && date <= endDate;
    });
    
    const periodExpenses = expenses.filter(e => {
        const date = new Date(e.createdAt);
        return date >= startDate && date <= endDate;
    });
    
    const totalRevenue = periodSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCostOfGoods = periodSales.reduce((sum, s) => sum + (s.purchasePrice * s.quantity), 0);
    const grossProfit = totalRevenue - totalCostOfGoods;
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    
    // Regrouper les dépenses par catégorie
    const expensesByCategory = {};
    periodExpenses.forEach(e => {
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });
    
    let categoryBreakdown = '';
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
        const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
        categoryBreakdown += `
            <div class="report-item">
                <span class="report-label">${category}</span>
                <span class="report-value">${amount.toFixed(2)} € (${percentage}%)</span>
            </div>
        `;
    });
    
    const container = document.getElementById('financialSummary');
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: var(--primary-color);">
                <i class="fas fa-chart-pie"></i> Synthèse
            </h4>
            <div class="report-item">
                <span class="report-label">Chiffre d'affaires total</span>
                <span class="report-value positive">+${totalRevenue.toFixed(2)} €</span>
            </div>
            <div class="report-item">
                <span class="report-label">Coût d'achat des produits</span>
                <span class="report-value negative">-${totalCostOfGoods.toFixed(2)} €</span>
            </div>
            <div class="report-item">
                <span class="report-label">Bénéfice brut</span>
                <span class="report-value ${grossProfit >= 0 ? 'positive' : 'negative'}">
                    ${grossProfit.toFixed(2)} €
                </span>
            </div>
            <div class="report-item">
                <span class="report-label">Total des dépenses</span>
                <span class="report-value negative">-${totalExpenses.toFixed(2)} €</span>
            </div>
            <div class="report-item" style="border-top: 2px solid var(--border-color); padding-top: 15px; margin-top: 10px;">
                <span class="report-label" style="font-weight: 700; font-size: 1.1rem;">BÉNÉFICE NET</span>
                <span class="report-value ${netProfit >= 0 ? 'positive' : 'negative'}" 
                      style="font-weight: 700; font-size: 1.2rem;">
                    ${netProfit.toFixed(2)} €
                </span>
            </div>
        </div>
        
        ${Object.keys(expensesByCategory).length > 0 ? `
            <div>
                <h4 style="margin-bottom: 10px; color: var(--primary-color);">
                    <i class="fas fa-tags"></i> Dépenses par catégorie
                </h4>
                ${categoryBreakdown}
            </div>
        ` : ''}
        
        <div style="margin-top: 20px; padding: 15px; background: var(--light-bg); border-radius: 8px;">
            <h4 style="margin-bottom: 10px; font-size: 0.9rem;">
                <i class="fas fa-info-circle"></i> Informations
            </h4>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
                <div>📊 Nombre de transactions: ${periodSales.length}</div>
                <div>📦 Produits vendus: ${periodSales.reduce((sum, s) => sum + s.quantity, 0)} unités</div>
                <div>💰 Panier moyen: ${periodSales.length > 0 ? (totalRevenue / periodSales.length).toFixed(2) : '0.00'} €</div>
                <div>📈 Marge brute: ${totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%</div>
                <div>🎯 Rentabilité: ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%</div>
            </div>
        </div>
    `;
}

// Imprimer le rapport
function printReport() {
    // Sauvegarder le titre original
    const originalTitle = document.title;
    document.title = `Rapport ${currentReportType} - ${new Date().toLocaleDateString('fr-FR')}`;
    
    // Imprimer
    window.print();
    
    // Restaurer le titre
    document.title = originalTitle;
    
    // Notification
    showToast('Rapport envoyé à l\'imprimante', 'success');
}

// Fonction toast
function showToast(message, type = 'success') {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" 
               style="color: ${type === 'success' ? 'var(--secondary-color)' : 'var(--danger-color)'};"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Thème
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
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