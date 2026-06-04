// ============================================
// GESTION DES DÉPENSES
// Gère l'ajout et le suivi des dépenses
// ============================================

let expensesChartInstance = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDate();
    loadExpensesStats();
    loadExpensesHistory();
    loadExpensesChart();
});

// Définir la date du jour par défaut
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
}

// Charger les statistiques des dépenses
function loadExpensesStats() {
    const expenses = db.getExpenses();
    const todayExpenses = db.getTodayExpenses();
    const dailyExpensesAmount = db.getDailyExpenses();
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Dépenses de ce mois
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyExpenses = expenses.filter(e => new Date(e.createdAt) >= startOfMonth);
    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Catégorie la plus dépensée
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    
    const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0];

    document.getElementById('expensesStats').innerHTML = `
        <div class="stat-card expense">
            <i class="fas fa-calendar-day"></i>
            <div class="stat-label">Aujourd'hui</div>
            <div class="stat-value">${dailyExpensesAmount.toFixed(2)} €</div>
            <small>${todayExpenses.length} dépenses</small>
        </div>
        <div class="stat-card">
            <i class="fas fa-calendar"></i>
            <div class="stat-label">Ce mois</div>
            <div class="stat-value">${monthlyTotal.toFixed(2)} €</div>
            <small>${monthlyExpenses.length} dépenses</small>
        </div>
        <div class="stat-card expense">
            <i class="fas fa-chart-bar"></i>
            <div class="stat-label">Total</div>
            <div class="stat-value">${totalExpenses.toFixed(2)} €</div>
            <small>Toutes dépenses</small>
        </div>
        <div class="stat-card">
            <i class="fas fa-tag"></i>
            <div class="stat-label">Top catégorie</div>
            <div class="stat-value" style="font-size: 1rem;">
                ${topCategory ? topCategory[0] : 'N/A'}
            </div>
            <small>${topCategory ? topCategory[1].toFixed(2) + ' €' : ''}</small>
        </div>
    `;
}

// Ajouter une dépense
function addExpense(event) {
    event.preventDefault();

    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const description = document.getElementById('expenseDescription').value.trim();
    const date = document.getElementById('expenseDate').value;

    // Validations
    if (!category) {
        showToast('Veuillez sélectionner une catégorie', 'error');
        return;
    }
    if (!amount || amount <= 0) {
        showToast('Le montant doit être supérieur à 0', 'error');
        return;
    }
    if (!date) {
        showToast('Veuillez sélectionner une date', 'error');
        return;
    }

    const expense = {
        category: category,
        amount: amount,
        description: description || 'Sans description',
        date: date
    };

    if (db.addExpense(expense)) {
        showToast('Dépense enregistrée avec succès', 'success');
        
        // Réinitialiser le formulaire
        document.getElementById('expenseForm').reset();
        setDefaultDate();
        document.getElementById('expenseCategory').value = '';
        
        // Rafraîchir les données
        loadExpensesStats();
        loadExpensesHistory();
        loadExpensesChart();
    } else {
        showToast('Erreur lors de l\'enregistrement', 'error');
    }
}

// Charger l'historique des dépenses
function loadExpensesHistory() {
    const expenses = db.getExpenses();
    const sortedExpenses = expenses.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    const tbody = document.getElementById('expensesList');
    const noExpenses = document.getElementById('noExpenses');

    if (sortedExpenses.length === 0) {
        tbody.innerHTML = '';
        noExpenses.style.display = 'block';
        return;
    }

    noExpenses.style.display = 'none';
    let html = '';
    
    // Icônes pour les catégories
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

    sortedExpenses.forEach(expense => {
        const date = new Date(expense.createdAt);
        const icon = categoryIcons[expense.category] || '📌';
        
        html += `
            <tr>
                <td>
                    <div style="font-size: 0.85rem;">${date.toLocaleDateString('fr-FR')}</div>
                </td>
                <td>
                    <span class="badge badge-info">${icon} ${expense.category}</span>
                </td>
                <td>
                    <div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${expense.description}
                    </div>
                </td>
                <td><strong style="color: var(--danger-color);">-${expense.amount.toFixed(2)} €</strong></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteExpense('${expense.id}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Supprimer une dépense
function deleteExpense(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
        if (db.deleteExpense(id)) {
            showToast('Dépense supprimée avec succès', 'success');
            loadExpensesStats();
            loadExpensesHistory();
            loadExpensesChart();
        } else {
            showToast('Erreur lors de la suppression', 'error');
        }
    }
}

// Charger le graphique des dépenses
function loadExpensesChart() {
    const ctx = document.getElementById('expensesChart').getContext('2d');
    const expenses = db.getExpenses();
    
    // Regrouper par catégorie
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    
    // Couleurs pour le graphique
    const colors = [
        '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
        '#f97316', '#6366f1'
    ];

    // Détruire le graphique existant
    if (expensesChartInstance) {
        expensesChartInstance.destroy();
    }

    if (categories.length === 0) {
        return;
    }

    expensesChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, categories.length),
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return ` ${context.label}: ${context.parsed.toFixed(2)} € (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
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