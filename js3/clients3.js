// ============================================
// GESTION DES CLIENTS
// Gère l'ajout, modification et suppression des clients
// Avec menu de tri flottant
// ============================================

let editingClientId = null;
let sortMenuOpen = false;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadClientsStats();
    sortClients('name'); // Tri par défaut : Nom
    
    // Fermer le menu si on clique en dehors
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('sortDropdown');
        const button = document.getElementById('sortMenuButton');
        
        if (sortMenuOpen && dropdown && button && 
            !dropdown.contains(event.target) && 
            !button.contains(event.target)) {
            closeSortMenu();
        }
    });
});

// ============================================
// STATISTIQUES DES CLIENTS
// ============================================

function loadClientsStats() {
    const clients = db.getClients();
    const totalClients = clients.length;
    const newClientsToday = db.getNewClientsToday();
    
    const sales = db.getSales();
    const clientsWithPurchases = new Set(sales.map(s => s.clientId)).size;
    
    const clientPurchaseCount = {};
    sales.forEach(sale => {
        clientPurchaseCount[sale.clientId] = (clientPurchaseCount[sale.clientId] || 0) + 1;
    });
    
    const topClientId = Object.entries(clientPurchaseCount)
        .sort(([,a], [,b]) => b - a)[0];
    
    const topClient = topClientId ? db.getClientById(topClientId[0]) : null;

    document.getElementById('clientsStats').innerHTML = `
        <div class="stat-card">
            <i class="fas fa-users"></i>
            <div class="stat-label">Total clients</div>
            <div class="stat-value">${totalClients}</div>
            <small>+${newClientsToday} aujourd'hui</small>
        </div>
        <div class="stat-card revenue">
            <i class="fas fa-shopping-bag"></i>
            <div class="stat-label">Clients actifs</div>
            <div class="stat-value">${clientsWithPurchases}</div>
            <small>Avec achats</small>
        </div>
        <div class="stat-card profit">
            <i class="fas fa-star"></i>
            <div class="stat-label">Meilleur client</div>
            <div class="stat-value" style="font-size: 1rem;">
                ${topClient ? topClient.name : 'N/A'}
            </div>
            <small>${topClientId ? topClientId[1] + ' achats' : 'Aucun achat'}</small>
        </div>
        <div class="stat-card">
            <i class="fas fa-calendar-check"></i>
            <div class="stat-label">Taux de retour</div>
            <div class="stat-value">
                ${totalClients > 0 ? ((clientsWithPurchases / totalClients) * 100).toFixed(1) : 0}%
            </div>
            <small>Clients avec achats</small>
        </div>
    `;
}

// ============================================
// MENU DE TRI FLOTTANT
// ============================================

function toggleSortMenu() {
    const dropdown = document.getElementById('sortDropdown');
    const overlay = document.getElementById('sortOverlay');
    const button = document.getElementById('sortMenuButton');
    
    if (sortMenuOpen) {
        // Fermer le menu
        dropdown.style.display = 'none';
        overlay.style.display = 'none';
        button.querySelector('.fa-chevron-down').style.transform = 'rotate(0deg)';
        sortMenuOpen = false;
    } else {
        // Ouvrir le menu avec animation
        dropdown.style.display = 'block';
        overlay.style.display = 'block';
        button.querySelector('.fa-chevron-down').style.transform = 'rotate(180deg)';
        sortMenuOpen = true;
        
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            dropdown.style.transition = 'all 0.3s ease';
            dropdown.style.opacity = '1';
            dropdown.style.transform = 'translateY(0)';
        }, 10);
    }
}

function closeSortMenu() {
    if (sortMenuOpen) {
        toggleSortMenu();
    }
}

function selectSortOption(sortType, label) {
    // Mettre à jour le label du bouton
    document.getElementById('sortMenuLabel').textContent = 'Trier par : ' + label;
    
    // Mettre à jour les icônes de check
    document.querySelectorAll('.sort-option').forEach(option => {
        const checkIcon = option.querySelector('.fa-check');
        if (option.dataset.sort === sortType) {
            checkIcon.style.display = 'block';
            option.style.background = 'var(--light-bg)';
        } else {
            checkIcon.style.display = 'none';
            option.style.background = 'transparent';
        }
    });
    
    // Fermer le menu
    closeSortMenu();
    
    // Appliquer le tri
    sortClients(sortType);
}

function updateActiveSortOption(sortType) {
    document.querySelectorAll('.sort-option').forEach(option => {
        const checkIcon = option.querySelector('.fa-check');
        if (option.dataset.sort === sortType) {
            checkIcon.style.display = 'block';
            option.style.background = 'var(--light-bg)';
        } else {
            checkIcon.style.display = 'none';
            option.style.background = 'transparent';
        }
    });
}

// ============================================
// SYSTÈME DE TRI DES CLIENTS
// ============================================

function sortClients(criteria) {
    // Mettre à jour le menu de tri
    updateActiveSortOption(criteria);
    
    // Récupérer tous les clients
    const clients = db.getClients();
    const sales = db.getSales();
    
    // Créer un tableau avec les statistiques de chaque client
    const clientsWithStats = clients.map(client => {
        const clientSales = sales.filter(s => s.clientId === client.id);
        const totalPurchases = clientSales.length;
        const totalSpent = clientSales.reduce((sum, s) => sum + s.totalAmount, 0);
        const lastPurchase = clientSales.length > 0 ? 
            new Date(Math.max(...clientSales.map(s => new Date(s.createdAt)))) : null;
        
        return {
            ...client,
            totalPurchases,
            totalSpent,
            lastPurchase
        };
    });
    
    // Trier selon le critère choisi
    switch(criteria) {
        case 'name':
            clientsWithStats.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
            break;
        case 'purchases':
            clientsWithStats.sort((a, b) => b.totalPurchases - a.totalPurchases);
            break;
        case 'total':
            clientsWithStats.sort((a, b) => b.totalSpent - a.totalSpent);
            break;
        case 'date':
            clientsWithStats.sort((a, b) => {
                const dateA = a.lastPurchase ? new Date(a.lastPurchase) : new Date(0);
                const dateB = b.lastPurchase ? new Date(b.lastPurchase) : new Date(0);
                return dateB - dateA;
            });
            break;
        default:
            clientsWithStats.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }
    
    // Afficher les clients triés
    displaySortedClients(clientsWithStats, criteria);
}

function displaySortedClients(clients, sortCriteria) {
    const container = document.getElementById('clientsList');
    const noClients = document.getElementById('noClients');
    const searchTerm = document.getElementById('searchClient')?.value || '';
    
    // Filtrer si une recherche est active
    let filteredClients = clients;
    if (searchTerm) {
        filteredClients = clients.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    if (filteredClients.length === 0) {
        container.innerHTML = '';
        noClients.style.display = 'block';
        return;
    }
    
    noClients.style.display = 'none';
    let html = '';
    
    // Badge pour indiquer le critère de tri
    const criteriaLabels = {
        'name': 'Trié par nom',
        'purchases': 'Trié par nombre d\'achats',
        'total': 'Trié par total dépensé',
        'date': 'Trié par dernier achat'
    };
    
    html += `
        <div style="margin-bottom: 15px; padding: 8px 12px; background: var(--light-bg); border-radius: 8px; font-size: 0.85rem; color: var(--text-secondary);">
            <i class="fas fa-info-circle"></i> ${criteriaLabels[sortCriteria] || 'Trié par défaut'} 
            (${filteredClients.length} client${filteredClients.length > 1 ? 's' : ''})
        </div>
    `;
    
    filteredClients.forEach((client, index) => {
        const rank = index + 1;
        let rankBadge = '';
        
        if (rank <= 3 && sortCriteria !== 'name') {
            const medals = ['🥇', '🥈', '🥉'];
            rankBadge = `<span style="font-size: 1.2rem; margin-right: 8px;">${medals[rank - 1]}</span>`;
        }
        
        const lastPurchase = client.lastPurchase;
        const lastPurchaseDate = lastPurchase ? 
            lastPurchase.toLocaleDateString('fr-FR') : 'Aucun achat';
        
        // Calculer le niveau du client
        let clientLevel = '';
        let levelColor = '';
        if (client.totalSpent > 1000) {
            clientLevel = 'VIP';
            levelColor = '#f59e0b';
        } else if (client.totalSpent > 500) {
            clientLevel = 'Fidèle';
            levelColor = '#8b5cf6';
        } else if (client.totalPurchases > 0) {
            clientLevel = 'Régulier';
            levelColor = '#3b82f6';
        } else {
            clientLevel = 'Nouveau';
            levelColor = '#10b981';
        }
        
        html += `
            <div class="client-card" style="background: var(--light-bg); border-radius: 12px; padding: 15px; margin-bottom: 15px; 
                        border: 1px solid var(--border-color); transition: all 0.3s ease; opacity: 0; transform: translateY(20px);"
                 onmouseover="this.style.transform='translateX(5px)'" 
                 onmouseout="this.style.transform='translateX(0)'">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            ${rankBadge}
                            <div style="width: 45px; height: 45px; background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); 
                                        color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                                        font-weight: bold; font-size: 1.1rem; position: relative;">
                                ${client.name.charAt(0).toUpperCase()}
                                <span style="position: absolute; bottom: -5px; right: -5px; background: ${levelColor}; 
                                            color: white; border-radius: 50%; width: 20px; height: 20px; 
                                            display: flex; align-items: center; justify-content: center; font-size: 0.6rem; 
                                            border: 2px solid white;">
                                    ${rank <= 3 ? '⭐' : ''}
                                </span>
                            </div>
                            <div>
                                <div style="font-weight: 600; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                                    ${client.name}
                                    <span style="font-size: 0.7rem; background: ${levelColor}; color: white; 
                                                padding: 2px 8px; border-radius: 10px;">${clientLevel}</span>
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                                    <i class="fas fa-phone"></i> ${client.phone}
                                </div>
                            </div>
                        </div>
                        
                        ${client.address ? `
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px; margin-left: ${rank <= 3 ? '28px' : '0px'};">
                                <i class="fas fa-map-marker-alt"></i> ${client.address}
                            </div>
                        ` : ''}
                        
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.8rem; margin-left: ${rank <= 3 ? '28px' : '0px'};">
                            <span class="badge badge-info">
                                <i class="fas fa-shopping-cart"></i> ${client.totalPurchases || 0} achat${client.totalPurchases > 1 ? 's' : ''}
                            </span>
                            <span class="badge badge-success">
                                <i class="fas fa-euro-sign"></i> ${(client.totalSpent || 0).toFixed(2)} €
                            </span>
                            <span class="badge badge-info">
                                <i class="fas fa-clock"></i> ${lastPurchaseDate}
                            </span>
                        </div>
                        
                        ${client.totalSpent > 0 ? `
                            <div style="margin-top: 10px; margin-left: ${rank <= 3 ? '28px' : '0px'};">
                                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 3px;">
                                    <span>Niveau client</span>
                                    <span>${clientLevel}</span>
                                </div>
                                <div style="width: 100%; height: 4px; background: var(--border-color); border-radius: 2px; overflow: hidden;">
                                    <div style="width: ${Math.min((client.totalSpent / 1000) * 100, 100)}%; height: 100%; 
                                                background: linear-gradient(90deg, var(--primary-color), ${levelColor}); 
                                                border-radius: 2px; transition: width 1s ease;"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="display: flex; gap: 5px; flex-direction: column;">
                        <button class="btn btn-sm btn-secondary" onclick="editClient('${client.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteClient('${client.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Animation d'entrée pour les cartes
    const cards = container.querySelectorAll('.client-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// ============================================
// GESTION DES CLIENTS (CRUD)
// ============================================

function filterClients() {
    const searchTerm = document.getElementById('searchClient').value;
    
    // Utiliser le tri actuel avec le filtre
    const sortLabel = document.getElementById('sortMenuLabel').textContent;
    let currentSort = 'name';
    
    if (sortLabel.includes('achats')) currentSort = 'purchases';
    else if (sortLabel.includes('dépensé')) currentSort = 'total';
    else if (sortLabel.includes('Dernier')) currentSort = 'date';
    
    sortClients(currentSort);
}

function showAddClientModal() {
    editingClientId = null;
    document.getElementById('clientModalTitle').textContent = 'Ajouter un client';
    document.getElementById('clientForm').reset();
    document.getElementById('clientId').value = '';
    document.getElementById('clientModal').classList.add('active');
}

function editClient(id) {
    const client = db.getClientById(id);
    if (!client) return;

    editingClientId = id;
    document.getElementById('clientModalTitle').textContent = 'Modifier le client';
    document.getElementById('clientId').value = client.id;
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientPhone').value = client.phone;
    document.getElementById('clientAddress').value = client.address || '';
    document.getElementById('clientModal').classList.add('active');
}

function closeClientModal() {
    document.getElementById('clientModal').classList.remove('active');
    editingClientId = null;
}

function saveClient(event) {
    event.preventDefault();

    const clientData = {
        name: document.getElementById('clientName').value.trim(),
        phone: document.getElementById('clientPhone').value.trim(),
        address: document.getElementById('clientAddress').value.trim()
    };

    if (!clientData.name) {
        showToast('Le nom du client est requis', 'error');
        return;
    }
    if (!clientData.phone) {
        showToast('Le numéro de téléphone est requis', 'error');
        return;
    }

    const clients = db.getClients();
    const duplicatePhone = clients.find(c => 
        c.phone === clientData.phone && c.id !== editingClientId
    );
    
    if (duplicatePhone) {
        showToast('Ce numéro de téléphone est déjà utilisé', 'error');
        return;
    }

    if (editingClientId) {
        if (db.updateClient(editingClientId, clientData)) {
            showToast('Client modifié avec succès', 'success');
        } else {
            showToast('Erreur lors de la modification', 'error');
            return;
        }
    } else {
        if (db.addClient(clientData)) {
            showToast('Client ajouté avec succès', 'success');
        } else {
            showToast('Erreur lors de l\'ajout', 'error');
            return;
        }
    }

    closeClientModal();
    loadClientsStats();
    
    // Maintenir le tri actuel
    const sortLabel = document.getElementById('sortMenuLabel').textContent;
    let currentSort = 'name';
    if (sortLabel.includes('achats')) currentSort = 'purchases';
    else if (sortLabel.includes('dépensé')) currentSort = 'total';
    else if (sortLabel.includes('Dernier')) currentSort = 'date';
    
    sortClients(currentSort);
}

function deleteClient(id) {
    const client = db.getClientById(id);
    if (!client) return;

    const sales = db.getSales();
    const clientSales = sales.filter(s => s.clientId === id);
    
    if (clientSales.length > 0) {
        if (!confirm(`Ce client a ${clientSales.length} achat(s). Voulez-vous vraiment le supprimer ? Les ventes seront conservées mais le client apparaîtra comme "Inconnu".`)) {
            return;
        }
    } else {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${client.name} ?`)) {
            return;
        }
    }

    if (db.deleteClient(id)) {
        showToast('Client supprimé avec succès', 'success');
        loadClientsStats();
        
        // Maintenir le tri actuel
        const sortLabel = document.getElementById('sortMenuLabel').textContent;
        let currentSort = 'name';
        if (sortLabel.includes('achats')) currentSort = 'purchases';
        else if (sortLabel.includes('dépensé')) currentSort = 'total';
        else if (sortLabel.includes('Dernier')) currentSort = 'date';
        
        sortClients(currentSort);
    } else {
        showToast('Erreur lors de la suppression', 'error');
    }
}

// ============================================
// UTILITAIRES
// ============================================

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

// Fermer le modal en cliquant en dehors
document.addEventListener('click', function(event) {
    const modal = document.getElementById('clientModal');
    if (event.target === modal) {
        closeClientModal();
    }
});

// ============================================
// THÈME
// ============================================

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