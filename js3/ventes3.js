// ============================================
// GESTION DES VENTES - Version multi-produits
// ============================================

// Panier temporaire (stocké en mémoire)
let cart = [];

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

// Charger la liste des clients
function loadClientSelect() {
    const clients = db.getClients();
    const select = document.getElementById('saleClient');
    
    let options = '<option value="">Sélectionner un client</option>';
    clients.forEach(client => {
        options += `<option value="${client.id}">${client.name} - ${client.phone}</option>`;
    });
    
    select.innerHTML = options;
}

// Charger la liste des produits disponibles
function loadProductSelect() {
    const products = db.getProducts();
    const select = document.getElementById('saleProduct');
    
    let options = '<option value="">Choisir un produit</option>';
    products.forEach(product => {
        if (product.quantity > 0) {
            options += `<option value="${product.id}">${product.name} - ${product.sellingPrice.toFixed(2)} € (${product.quantity} dispo)</option>`;
        }
    });
    
    select.innerHTML = options;
}

// Ajouter un produit au panier
function addToCart() {
    const productId = document.getElementById('saleProduct').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 0;
    
    // Validation
    if (!productId) {
        showToast('Veuillez sélectionner un produit', 'error');
        return;
    }
    if (quantity <= 0) {
        showToast('La quantité doit être supérieure à 0', 'error');
        return;
    }
    
    const product = db.getProductById(productId);
    if (!product) {
        showToast('Produit introuvable', 'error');
        return;
    }
    
    // Vérifier le stock disponible
    const existingCartItem = cart.find(item => item.productId === productId);
    const currentQuantityInCart = existingCartItem ? existingCartItem.quantity : 0;
    const totalRequested = currentQuantityInCart + quantity;
    
    if (totalRequested > product.quantity) {
        showToast(`Stock insuffisant ! Disponible: ${product.quantity}, Déjà dans le panier: ${currentQuantityInCart}`, 'error');
        return;
    }
    
    // Ajouter ou mettre à jour le produit dans le panier
    if (existingCartItem) {
        existingCartItem.quantity += quantity;
        showToast(`${quantity} ${product.name} ajouté(s) au panier (Total: ${existingCartItem.quantity})`, 'success');
    } else {
        cart.push({
            productId: productId,
            productName: product.name,
            sellingPrice: product.sellingPrice,
            purchasePrice: product.purchasePrice,
            quantity: quantity,
            maxStock: product.quantity
        });
        showToast(`${quantity} ${product.name} ajouté(s) au panier`, 'success');
    }
    
    // Réinitialiser la sélection
    document.getElementById('saleProduct').value = '';
    document.getElementById('saleQuantity').value = '1';
    
    // Mettre à jour l'affichage du panier
    updateCartDisplay();
    loadProductSelect(); // Rafraîchir les stocks disponibles
}

// Mettre à jour l'affichage du panier
function updateCartDisplay() {
    const cartContainer = document.getElementById('cartContainer');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    
    if (cart.length === 0) {
        cartContainer.style.display = 'none';
        cartEmpty.style.display = 'block';
        return;
    }
    
    cartContainer.style.display = 'block';
    cartEmpty.style.display = 'none';
    
    // Mettre à jour le compteur
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = `(${totalItems} produit${totalItems > 1 ? 's' : ''})`;
    
    // Afficher les articles du panier
    let html = '';
    cart.forEach((item, index) => {
        const subtotal = item.sellingPrice * item.quantity;
        const profit = (item.sellingPrice - item.purchasePrice) * item.quantity;
        
        html += `
            <div style="display: flex; align-items: center; padding: 10px; margin-bottom: 8px; 
                        background: var(--light-bg); border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.9rem;">${item.productName}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        ${item.sellingPrice.toFixed(2)} € x ${item.quantity} = <strong>${subtotal.toFixed(2)} €</strong>
                        <br><small>Bénéfice: ${profit.toFixed(2)} €</small>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <button type="button" class="btn btn-sm" onclick="updateCartItemQuantity(${index}, -1)" 
                            style="padding: 5px 10px; min-width: 30px; background: var(--border-color);">-</button>
                    <span style="font-weight: 600; min-width: 25px; text-align: center;">${item.quantity}</span>
                    <button type="button" class="btn btn-sm" onclick="updateCartItemQuantity(${index}, 1)" 
                            style="padding: 5px 10px; min-width: 30px; background: var(--border-color);">+</button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeFromCart(${index})" 
                            style="margin-left: 5px;" title="Retirer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    cartItems.innerHTML = html;
    
    // Calculer et afficher les totaux
    const total = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    const totalProfit = cart.reduce((sum, item) => sum + ((item.sellingPrice - item.purchasePrice) * item.quantity), 0);
    
    document.getElementById('cartTotal').textContent = `${total.toFixed(2)} €`;
    document.getElementById('cartProfit').textContent = `${totalProfit.toFixed(2)} €`;
}

// Modifier la quantité d'un article dans le panier
function updateCartItemQuantity(index, change) {
    const item = cart[index];
    const newQuantity = item.quantity + change;
    
    // Vérifier les limites
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > item.maxStock) {
        showToast(`Stock maximum disponible: ${item.maxStock}`, 'error');
        return;
    }
    
    item.quantity = newQuantity;
    updateCartDisplay();
}

// Retirer un article du panier
function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    showToast(`${item.productName} retiré du panier`, 'success');
    updateCartDisplay();
    loadProductSelect();
}

// Traiter la vente (finaliser le panier)
function processSale(event) {
    event.preventDefault();
    
    const clientId = document.getElementById('saleClient').value;
    
    // Validations
    if (!clientId) {
        showToast('Veuillez sélectionner un client', 'error');
        return;
    }
    if (cart.length === 0) {
        showToast('Ajoutez au moins un produit au panier', 'error');
        return;
    }
    
    // Vérifier les stocks une dernière fois
    for (const item of cart) {
        const product = db.getProductById(item.productId);
        if (!product) {
            showToast(`Le produit "${item.productName}" n'existe plus`, 'error');
            return;
        }
        if (item.quantity > product.quantity) {
            showToast(`Stock insuffisant pour "${item.productName}" ! Disponible: ${product.quantity}`, 'error');
            return;
        }
    }
    
    // Traiter chaque article du panier comme une vente séparée
    let allSuccess = true;
    const client = db.getClientById(clientId);
    
    for (const item of cart) {
        const sale = {
            clientId: clientId,
            productId: item.productId,
            quantity: item.quantity,
            totalAmount: item.sellingPrice * item.quantity,
            profit: (item.sellingPrice - item.purchasePrice) * item.quantity,
            purchasePrice: item.purchasePrice,
            sellingPrice: item.sellingPrice
        };
        
        if (!db.addSale(sale)) {
            allSuccess = false;
            break;
        }
    }
    
    if (allSuccess) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
        
        showToast(`Vente de ${totalItems} produit(s) pour ${totalAmount.toFixed(2)} € à ${client.name} réussie !`, 'success');
        
        // Vider le panier
        cart = [];
        updateCartDisplay();
        
        // Réinitialiser le formulaire
        document.getElementById('saleForm').reset();
        document.getElementById('saleClient').value = '';
        
        // Rafraîchir
        loadSalesStats();
        loadProductSelect();
        loadSalesHistory();
        
        // Vérifier les stocks faibles
        checkLowStock();
    } else {
        showToast('Erreur lors de l\'enregistrement de la vente', 'error');
    }
}

// Vérifier les stocks faibles après la vente
function checkLowStock() {
    const products = db.getProducts();
    const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity < 10);
    
    if (lowStockProducts.length > 0) {
        setTimeout(() => {
            const names = lowStockProducts.map(p => `${p.name} (${p.quantity})`).join(', ');
            showToast(`⚠️ Stocks faibles: ${names}`, 'error');
        }, 2000);
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

// Afficher une notification toast
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