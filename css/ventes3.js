// ============================================
// GESTION DES VENTES
// Gère l'enregistrement et l'historique des ventes
// ============================================

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadSalesStats();
    loadClientSelect();
    loadProductSelect();
    loadSalesHistory();
});

// Charger les statistiques des ventes
function loadSalesStats() {
    const todaySales = db.getTodaySales();
    const dailyRevenue = db.getDailyRevenue();
    const dailyProfit = db.getDailyProfit();
    const totalSales = db.getSales().length;
    const totalRevenue = db.getTotalRevenue();

    document.getElementById('salesStats').innerHTML = `
        <div class="stat-card revenue">
            <i class="fas fa-euro-sign"></i>
            <div class="stat-label">CA du jour</div>
            <div class="stat-value">${dailyRevenue.toFixed(2)} €</div>
            <small>${todaySales.length} ventes</small>
        </div>
        <div class="stat-card profit">
            <i class="fas fa-chart-line"></i>
            <div class="stat-label">Bénéfice jour</div>
            <div class="stat-value">${dailyProfit.toFixed(2)} €</div>
        </div>
        <div class="stat-card">
            <i class="fas fa-shopping-cart"></i>
            <div class="stat-label">Total ventes</div>
            <div class="stat-value">${totalSales}</div>
        </div>
        <div class="stat-card revenue">
            <i class="fas fa-trophy"></i>
            <div class="stat-label">CA total</div>
            <div class="stat-value">${totalRevenue.toFixed(2)} €</div>
        </div>
    `;
}

// Charger la liste des clients dans le sélecteur
function loadClientSelect() {
    const clients = db.getClients();
    const select = document.getElementById('saleClient');
    
    let options = '<option value="">Sélectionner un client</option>';
    clients.forEach(client => {
        options += `<option value="${client.id}">${client.name} - ${client.phone}</option>`;
    });
    
    select.innerHTML = options;
}

// Charger la liste des produits dans le sélecteur
function loadProductSelect() {
    const products = db.getProducts();
    const select = document.getElementById('saleProduct');
    
    let options = '<option value="">Sélectionner un produit</option>';
    products.forEach(product => {
        if (product.quantity > 0) {
            options += `<option value="${product.id}">${product.name} - ${product.sellingPrice.toFixed(2)} € (Stock: ${product.quantity})</option>`;
        }
    });
    
    select.innerHTML = options;
}

// Mettre à jour les informations du produit sélectionné
function updateProductInfo() {
    const productId = document.getElementById('saleProduct').value;
    const productInfo = document.getElementById('productInfo');
    
    if (!productId) {
        productInfo.style.display = 'none';
        document.getElementById('saleTotal').style.display = 'none';
        return;
    }

    const product = db.getProductById(productId);
    if (!product) return;

    productInfo.style.display = 'block';
    document.getElementById('infoPrice').textContent = `${product.sellingPrice.toFixed(2)} €`;
    document.getElementById('infoStock').textContent = `${product.quantity} unités`;
    
    const profitPerUnit = product.sellingPrice - product.purchasePrice;
    document.getElementById('infoProfit').textContent = `${profitPerUnit.toFixed(2)} €`;
    
    calculateTotal();
}

// Calculer le total de la vente
function calculateTotal() {
    const productId = document.getElementById('saleProduct').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 0;
    const saleTotal = document.getElementById('saleTotal');
    
    if (!productId || quantity <= 0) {
        saleTotal.style.display = 'none';
        return;
    }

    const product = db.getProductById(productId);
    if (!product) return;

    // Vérifier le stock
    if (quantity > product.quantity) {
        showToast('Stock insuffisant !', 'error');
        document.getElementById('saleQuantity').value = product.quantity;
        return;
    }

    const totalAmount = product.sellingPrice * quantity;
    const profit = (product.sellingPrice - product.purchasePrice) * quantity;
    
    saleTotal.style.display = 'block';
    document.getElementById('totalAmount').textContent = `${totalAmount.toFixed(2)} €`;
    document.getElementById('estimatedProfit').textContent = `${profit.toFixed(2)} €`;
}

// Traiter la vente
function processSale(event) {
    event.preventDefault();

    const clientId = document.getElementById('saleClient').value;
    const productId = document.getElementById('saleProduct').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value);

    // Validations
    if (!clientId) {
        showToast('Veuillez sélectionner un client', 'error');
        return;
    }
    if (!productId) {
        showToast('Veuillez sélectionner un produit', 'error');
        return;
    }
    if (!quantity || quantity <= 0) {
        showToast('La quantité doit être supérieure à 0', 'error');
        return;
    }

    const product = db.getProductById(productId);
    if (!product) {
        showToast('Produit introuvable', 'error');
        return;
    }
    if (quantity > product.quantity) {
        showToast(`Stock insuffisant ! Disponible: ${product.quantity}`, 'error');
        return;
    }

    // Créer la vente
    const sale = {
        clientId: clientId,
        productId: productId,
        quantity: quantity,
        totalAmount: product.sellingPrice * quantity,
        profit: (product.sellingPrice - product.purchasePrice) * quantity,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice
    };

    if (db.addSale(sale)) {
        const client = db.getClientById(clientId);
        showToast(`Vente de ${quantity} ${product.name} à ${client.name} enregistrée !`, 'success');
        
        // Réinitialiser le formulaire
        document.getElementById('saleForm').reset();
        document.getElementById('productInfo').style.display = 'none';
        document.getElementById('saleTotal').style.display = 'none';
        
        // Rafraîchir les données
        loadSalesStats();
        loadProductSelect();
        loadSalesHistory();
        
        // Notification spéciale si stock faible
        const updatedProduct = db.getProductById(productId);
        if (updatedProduct && updatedProduct.quantity < 10) {
            setTimeout(() => {
                showToast(`⚠️ Stock faible pour ${updatedProduct.name}: ${updatedProduct.quantity} restants`, 'error');
            }, 2000);
        }
    } else {
        showToast('Erreur lors de l\'enregistrement de la vente', 'error');
    }
}

// Charger l'historique des ventes
function loadSalesHistory(filter = '') {
    const sales = db.getSales();
    const filteredSales = filter ? 
        sales.filter(s => {
            const product = db.getProductById(s.productId);
            const client = db.getClientById(s.clientId);
            return (product && product.name.toLowerCase().includes(filter.toLowerCase())) ||
                   (client && client.name.toLowerCase().includes(filter.toLowerCase()));
        }) : sales;
    
    const sortedSales = filteredSales.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    const tbody = document.getElementById('salesList');
    const noSales = document.getElementById('noSales');

    if (sortedSales.length === 0) {
        tbody.innerHTML = '';
        noSales.style.display = 'block';
        return;
    }

    noSales.style.display = 'none';
    let html = '';
    
    sortedSales.forEach(sale => {
        const product = db.getProductById(sale.productId);
        const client = db.getClientById(sale.clientId);
        const date = new Date(sale.createdAt);
        
        html += `
            <tr>
                <td>
                    <div style="font-size: 0.85rem;">${date.toLocaleDateString('fr-FR')}</div>
                    <small style="color: var(--text-secondary);">${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</small>
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

// Filtrer les ventes
function filterSales() {
    const searchTerm = document.getElementById('searchSale').value;
    loadSalesHistory(searchTerm);
}

// Fonction utilitaire pour les notifications toast
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

// Appliquer le thème
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