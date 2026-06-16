// ============================================
// GESTION DES CLIENTS - Version complète
// Avec menu de tri flottant et 5 options de tri
// ============================================

let editingClientId = null;
let sortMenuOpen = false;
let currentSortCriteria = 'name';

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadClientsStats();
    sortClients('name');
    
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
    
    // Fermer le menu avec la touche Échap
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && sortMenuOpen) {
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
    
    // Client le plus fidèle
    const clientPurchaseCount = {};
    sales.forEach(sale => {
        clientPurchaseCount[sale.clientId] = (clientPurchaseCount[sale.clientId] || 0) + 1;
    });
    
    const topClientEntry = Object.entries(clientPurchaseCount)
        .sort(([,a], [,b]) => b - a)[0];
    
    const topClient = topClientEntry ? db.getClientById(topClientEntry[0]) : null;

    // Moyenne d'achats par client actif
    const avgPurchases = clientsWithPurchases > 0 ? 
        (sales.length / clientsWithPurchases).toFixed(1) : '0';

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
            <small>${avgPurchases} achats/client</small>
        </div>
        <div class="stat-card profit">
            <i class="fas fa-star"></i>
            <div class="stat-label">Meilleur client</div>
            <div class="stat-value" style="font-size: 1rem;">
                ${topClient ? topClient.name : 'N/A'}
            </div>
            <small>${topClientEntry ? topClientEntry[1] + ' achats' : 'Aucun achat'}</small>
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
    const arrow = button.querySelector('.btn-sort-arrow');
    
    if (sortMenuOpen) {
        closeSortMenu();
    } else {
        dropdown.style.display = 'block';
        overlay.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
        sortMenuOpen = true;
        
        // Animation d'ouverture
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
        requestAnimationFrame(() => {
            dropdown.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            dropdown.style.opacity = '1';
            dropdown.style.transform = 'translateY(0)';
        });
        
        // Mettre en évidence l'option active
        updateActiveSortOption(currentSortCriteria);
    }
}

function closeSortMenu() {
    if (!sortMenuOpen) return;
    
    const dropdown = document.getElementById('sortDropdown');
    const overlay = document.getElementById('sortOverlay');
    const button = document.getElementById('sortMenuButton');
    const arrow = button.querySelector('.btn-sort-arrow');
    
    dropdown.style.opacity = '0';
    dropdown.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        dropdown.style.display = 'none';
        overlay.style.display = 'none';
    }, 200);
    
    arrow.style.transform = 'rotate(0deg)';
    sortMenuOpen = false;
}

function selectSortOption(sortType, label) {
    currentSortCriteria = sortType;
    
    // Mettre à jour le label du bouton
    document.getElementById('sortMenuLabel').textContent = label;
    
    // Mettre à jour les options actives
    updateActiveSortOption(sortType);
    
    // Fermer le menu
    closeSortMenu();
    
    // Appliquer le tri
    sortClients(sortType);
    
    // Feedback haptique si disponible
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

function updateActiveSortOption(sortType) {
    document.querySelectorAll('.sort-option').forEach(option => {
        const checkIcon = option.querySelector('.sort-option-check');
        if (option.dataset.sort === sortType) {
            option.classList.add('active');
            if (checkIcon) checkIcon.style.display = 'block';
        } else {
            option.classList.remove('active');
            if (checkIcon) checkIcon.style.display = 'none';
        }
    });
}

// ============================================
// SYSTÈME DE TRI DES CLIENTS
// ============================================

function sortClients(criteria) {
    currentSortCriteria = criteria;
    
    // Mettre à jour le menu de tri
    updateActiveSortOption(criteria);
    
    const clients = db.getClients();
    const sales = db.getSales();
    
    // Enrichir les clients avec leurs statistiques
    const clientsWithStats = clients.map(client => {
        const clientSales = sales.filter(s => s.clientId === client.id);
        const totalPurchases = clientSales.length;
        const totalSpent = clientSales.reduce((sum, s) => sum + s.totalAmount, 0);
        
        // Dernier achat
        const lastPurchase = clientSales.length > 0 ? 
            new Date(Math.max(...clientSales.map(s => new Date(s.createdAt)))) : null;
        
        // Date d'ajout du client
        const addedDate = client.createdAt ? new Date(client.createdAt) : new Date(0);
        
        return {
            ...client,
            totalPurchases,
            totalSpent,
            lastPurchase,
            addedDate
        };
    });
    
    // Appliquer le tri
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
            
        case 'added':
            clientsWithStats.sort((a, b) => {
                const dateA = a.addedDate ? new Date(a.addedDate) : new Date(0);
                const dateB = b.addedDate ? new Date(b.addedDate) : new Date(0);
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
    const searchTerm = document.getElementById('searchClient')?.value?.toLowerCase() || '';
    
    // Filtrer si recherche active
    let filteredClients = clients;
    if (searchTerm) {
        filteredClients = clients.filter(c => 
            c.name.toLowerCase().includes(searchTerm) ||
            c.phone.includes(searchTerm) ||
            (c.address && c.address.toLowerCase().includes(searchTerm))
        );
    }
    
    // État vide
    if (filteredClients.length === 0) {
        container.innerHTML = '';
        noClients.style.display = 'block';
        return;
    }
    
    noClients.style.display = 'none';
    
    // Labels pour chaque critère de tri
    const criteriaLabels = {
        'name': 'Trié par nom (A-Z)',
        'purchases': 'Trié par nombre d\'achats',
        'total': 'Trié par total dépensé',
        'date': 'Trié par dernier achat',
        'added': 'Trié par date d\'ajout'
    };
    
    const criteriaIcons = {
        'name': 'fa-user',
        'purchases': 'fa-shopping-cart',
        'total': 'fa-euro-sign',
        'date': 'fa-calendar-check',
        'added': 'fa-user-plus'
    };
    
    // Barre d'information du tri
    let html = `
        <div class="sort-info-bar">
            <i class="fas ${criteriaIcons[sortCriteria] || 'fa-sort'}"></i>
            ${criteriaLabels[sortCriteria] || 'Trié par défaut'}
            <span class="count">${filteredClients.length} client${filteredClients.length > 1 ? 's' : ''}</span>
        </div>
    `;
    
    // Générer les cartes clients
    filteredClients.forEach((client, index) => {
        const rank = index + 1;
        
        // Médaille pour le top 3 (sauf pour le tri par nom)
        let rankBadge = '';
        if (rank <= 3 && sortCriteria !== 'name') {
            const medals = ['🥇', '🥈', '🥉'];
            rankBadge = `<span class="rank-medal">${medals[rank - 1]}</span>`;
        }
        
        // Date du dernier achat
        const lastPurchase = client.lastPurchase;
        const lastPurchaseDate = lastPurchase ? 
            lastPurchase.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 
            'Aucun achat';
        
        // Date d'ajout
        const addedDate = client.addedDate && client.addedDate.getTime() > 0 ? 
            client.addedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 
            'Inconnue';
        
        // Niveau client
        let clientLevel, levelClass;
        if (client.totalSpent > 1000) {
            clientLevel = 'VIP';
            levelClass = 'level-vip';
        } else if (client.totalSpent > 500) {
            clientLevel = 'Fidèle';
            levelClass = 'level-fidele';
        } else if (client.totalPurchases > 0) {
            clientLevel = 'Régulier';
            levelClass = 'level-regulier';
        } else {
            clientLevel = 'Nouveau';
            levelClass = 'level-nouveau';
        }
        
        // Couleur de la barre de progression
        let progressColor;
        switch(clientLevel) {
            case 'VIP': progressColor = '#f59e0b'; break;
            case 'Fidèle': progressColor = '#8b5cf6'; break;
            case 'Régulier': progressColor = '#3b82f6'; break;
            default: progressColor = '#10b981';
        }
        
        // Icône de statut d'activité
        const isActive = client.totalPurchases > 0;
        const lastPurchaseDays = lastPurchase ? 
            Math.floor((new Date() - lastPurchase) / (1000 * 60 * 60 * 24)) : 999;
        
        let activityIcon, activityColor;
        if (!isActive) {
            activityIcon = 'fa-circle';
            activityColor = '#d1d5db';
        } else if (lastPurchaseDays <= 7) {
            activityIcon = 'fa-circle';
            activityColor = '#10b981';
        } else if (lastPurchaseDays <= 30) {
            activityIcon = 'fa-circle';
            activityColor = '#f59e0b';
        } else {
            activityIcon = 'fa-circle';
            activityColor = '#ef4444';
        }
        
        html += `
            <div class="client-card animate-in" style="animation-delay: ${index * 0.05}s;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <div style="flex: 1; min-width: 0;">
                        <!-- En-tête avec avatar -->
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            ${rankBadge}
                            <div class="client-avatar">
                                ${client.name.charAt(0).toUpperCase()}
                                <div class="level-badge" style="background: ${progressColor};">
                                    ${isActive ? '⭐' : '○'}
                                </div>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                    <span style="font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${client.name}
                                    </span>
                                    <span class="${levelClass}">${clientLevel}</span>
                                    <span style="font-size: 0.6rem; color: ${activityColor};" title="${isActive ? 'Actif il y a ' + lastPurchaseDays + ' jours' : 'Jamais actif'}">
                                        <i class="fas ${activityIcon}"></i>
                                    </span>
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                                    <i class="fas fa-phone"></i> ${client.phone}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Adresse -->
                        ${client.address ? `
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px; padding-left: ${rank <= 3 ? '28px' : '0px'};">
                                <i class="fas fa-map-marker-alt"></i> ${client.address}
                            </div>
                        ` : ''}
                        
                        <!-- Statistiques -->
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; padding-left: ${rank <= 3 ? '28px' : '0px'};">
                            <span class="badge badge-info" style="font-size: 0.7rem;">
                                <i class="fas fa-shopping-cart"></i> ${client.totalPurchases} achat${client.totalPurchases > 1 ? 's' : ''}
                            </span>
                            <span class="badge badge-success" style="font-size: 0.7rem;">
                                <i class="fas fa-euro-sign"></i> ${(client.totalSpent || 0).toFixed(0)} €
                            </span>
                            ${lastPurchase ? `
                                <span class="badge" style="font-size: 0.7rem; background: #eff6ff; color: #1e40af;">
                                    <i class="fas fa-clock"></i> ${lastPurchaseDate}
                                </span>
                            ` : ''}
                            <span class="badge" style="font-size: 0.7rem; background: #f0fdf4; color: #065f46;">
                                <i class="fas fa-user-plus"></i> ${addedDate}
                            </span>
                        </div>
                        
                        <!-- Barre de progression -->
                        ${client.totalSpent > 0 ? `
                            <div style="padding-left: ${rank <= 3 ? '28px' : '0px'};">
                                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 4px;">
                                    <span style="color: var(--text-secondary);">Progression ${clientLevel}</span>
                                    <span style="font-weight: 600; color: ${progressColor};">${Math.min((client.totalSpent / 1000) * 100, 100).toFixed(0)}%</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: ${Math.min((client.totalSpent / 1000) * 100, 100)}%; background: linear-gradient(90deg, var(--primary-color), ${progressColor});"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Boutons d'action -->
                    <div class="client-actions">
                        <button class="btn btn-edit" onclick="editClient('${client.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-delete" onclick="deleteClient('${client.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// FILTRE ET RECHERCHE
// ============================================

function filterClients() {
    // Maintenir le tri actuel avec le filtre
    sortClients(currentSortCriteria);
}

// ============================================
// GESTION DES CLIENTS (CRUD)
// ============================================

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

    // Validation
    if (!clientData.name) {
        showToast('Le nom du client est requis', 'error');
        return;
    }
    if (!clientData.phone) {
        showToast('Le numéro de téléphone est requis', 'error');
        return;
    }

    // Vérifier les doublons de téléphone
    const clients = db.getClients();
    const duplicatePhone = clients.find(c => 
        c.phone === clientData.phone && c.id !== editingClientId
    );
    
    if (duplicatePhone) {
        showToast('Ce numéro de téléphone est déjà utilisé', 'error');
        return;
    }

    let success;
    if (editingClientId) {
        success = db.updateClient(editingClientId, clientData);
        if (success) showToast('Client modifié avec succès', 'success');
        else showToast('Erreur lors de la modification', 'error');
    } else {
        success = db.addClient(clientData);
        if (success) showToast('Client ajouté avec succès', 'success');
        else showToast('Erreur lors de l\'ajout', 'error');
    }

    if (success) {
        closeClientModal();
        loadClientsStats();
        sortClients(currentSortCriteria);
    }
}

function deleteClient(id) {
    const client = db.getClientById(id);
    if (!client) return;

    const sales = db.getSales();
    const clientSales = sales.filter(s => s.clientId === id);
    
    let message;
    if (clientSales.length > 0) {
        message = `Ce client a ${clientSales.length} achat(s) et un historique de vente.\n\nLes ventes seront conservées mais le client apparaîtra comme "Inconnu".\n\nSupprimer ${client.name} ?`;
    } else {
        message = `Supprimer définitivement ${client.name} ?`;
    }

    if (confirm(message)) {
        if (db.deleteClient(id)) {
            showToast('Client supprimé avec succès', 'success');
            loadClientsStats();
            sortClients(currentSortCriteria);
        } else {
            showToast('Erreur lors de la suppression', 'error');
        }
    }
}

// ============================================
// UTILITAIRES
// ============================================

function showToast(message, type = 'success') {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(t => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(100%)';
        setTimeout(() => t.remove(), 300);
    });

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    const color = type === 'success' ? 'var(--secondary-color)' : 'var(--danger-color)';
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${icon}" style="color: ${color}; font-size: 1.2rem;"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animation d'entrée
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });
    
    // Disparition automatique
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