// ============================================
// GESTION DU STOCK
// Gère l'ajout, modification et suppression des produits
// ============================================

// État de l'application
let editingProductId = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadStockStats();
    loadProducts();
    updateClientAndProductSelects();
});

// Charger les statistiques du stock
function loadStockStats() {
    const products = db.getProducts();
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const lowStock = products.filter(p => p.quantity < 10).length;

    document.getElementById('stockStats').innerHTML = `
        <div class="stat-card">
            <i class="fas fa-boxes"></i>
            <div class="stat-label">Total produits</div>
            <div class="stat-value">${totalProducts}</div>
        </div>
        <div class="stat-card revenue">
            <i class="fas fa-layer-group"></i>
            <div class="stat-label">En stock</div>
            <div class="stat-value">${totalStock}</div>
        </div>
        <div class="stat-card profit">
            <i class="fas fa-euro-sign"></i>
            <div class="stat-label">Valeur stock</div>
            <div class="stat-value">${totalValue.toFixed(2)} €</div>
        </div>
        <div class="stat-card ${lowStock > 0 ? 'expense' : ''}">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="stat-label">Stock faible</div>
            <div class="stat-value">${lowStock}</div>
        </div>
    `;
}

// Charger la liste des produits
function loadProducts(filter = '') {
    const products = db.getProducts();
    const filteredProducts = filter ? 
        products.filter(p => 
            p.name.toLowerCase().includes(filter.toLowerCase()) ||
            p.category.toLowerCase().includes(filter.toLowerCase())
        ) : products;

    const tbody = document.getElementById('productsList');
    const noProducts = document.getElementById('noProducts');

    if (filteredProducts.length === 0) {
        tbody.innerHTML = '';
        noProducts.style.display = 'block';
        return;
    }

    noProducts.style.display = 'none';
    let html = '';
    
    filteredProducts.forEach(product => {
        const stockStatus = product.quantity === 0 ? 'badge-danger' : 
                           product.quantity < 10 ? 'badge-warning' : 'badge-success';
        const stockText = product.quantity === 0 ? 'Rupture' : 
                         product.quantity < 10 ? 'Faible' : 'Disponible';
        
        html += `
            <tr>
                <td>
                    <div style="font-weight: 600;">${product.name}</div>
                    <small style="color: var(--text-secondary);">${product.category}</small>
                </td>
                <td><span class="badge badge-info">${product.category}</span></td>
                <td><strong>${product.sellingPrice.toFixed(2)} €</strong></td>
                <td>
                    <span class="badge ${stockStatus}">${product.quantity} (${stockText})</span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-sm btn-secondary" onclick="editProduct('${product.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Filtrer les produits
function filterProducts() {
    const searchTerm = document.getElementById('searchProduct').value;
    loadProducts(searchTerm);
}

// Afficher le modal d'ajout
function showAddProductModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Ajouter un produit';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.add('active');
}

// Modifier un produit
function editProduct(id) {
    const product = db.getProductById(id);
    if (!product) return;

    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'Modifier le produit';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('purchasePrice').value = product.purchasePrice;
    document.getElementById('sellingPrice').value = product.sellingPrice;
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productModal').classList.add('active');
}

// Fermer le modal
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    editingProductId = null;
}

// Sauvegarder un produit
function saveProduct(event) {
    event.preventDefault();

    const productData = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value,
        purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
        sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
        quantity: parseInt(document.getElementById('productQuantity').value)
    };

    // Validation
    if (!productData.name) {
        showToast('Le nom du produit est requis', 'error');
        return;
    }
    if (productData.purchasePrice < 0 || productData.sellingPrice < 0) {
        showToast('Les prix doivent être positifs', 'error');
        return;
    }
    if (productData.sellingPrice < productData.purchasePrice) {
        showToast('Le prix de vente doit être supérieur au prix d\'achat', 'error');
        return;
    }
    if (productData.quantity < 0) {
        showToast('La quantité doit être positive', 'error');
        return;
    }

    if (editingProductId) {
        // Modification
        if (db.updateProduct(editingProductId, productData)) {
            showToast('Produit modifié avec succès', 'success');
        } else {
            showToast('Erreur lors de la modification', 'error');
        }
    } else {
        // Ajout
        if (db.addProduct(productData)) {
            showToast('Produit ajouté avec succès', 'success');
        } else {
            showToast('Erreur lors de l\'ajout', 'error');
        }
    }

    closeProductModal();
    loadStockStats();
    loadProducts();
}

// Supprimer un produit
function deleteProduct(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        if (db.deleteProduct(id)) {
            showToast('Produit supprimé avec succès', 'success');
            loadStockStats();
            loadProducts();
        } else {
            showToast('Erreur lors de la suppression', 'error');
        }
    }
}

// Mettre à jour les sélecteurs de clients et produits (utilisé par d'autres pages)
function updateClientAndProductSelects() {
    // Cette fonction sera utilisée par la page des ventes
    // pour remplir les listes déroulantes
}

// Afficher une notification toast
function showToast(message, type = 'success') {
    // Supprimer les toasts existants
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
    
    // Animation de disparition
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Fermer le modal si on clique en dehors
document.addEventListener('click', function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeProductModal();
    }
});

// Appliquer le thème sauvegardé
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
})();

// Fonction de basculement du thème
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