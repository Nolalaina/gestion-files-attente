# 🗺️ Guide de Navigation par Rôles

Ce document explique ce que voit et peut faire chaque rôle utilisateur.

---

## 👨‍💼 **ADMINISTRATEUR**

### ✅ Accès Autorisé
- ✅ Tableau de bord global (statistiques)
- ✅ Tableau des utilisateurs (view-only)
- ✅ Tableau des comptes (view-only)
- ✅ Tableau des transactions (view-only)
- ✅ Tableau des logs d'activité (view-only)
- ✅ Gestion du statut utilisateur (ACTIVE/INACTIVE/BLOCKED)

### ❌ Accès Refusé
- ❌ Gestion des comptes ou transactions clients
- ❌ Page client (consulter ses comptes)
- ❌ Effectuer opérations bancaires
- ❌ Ouvrir/fermer comptes

### 📍 Navigation Web
```
Accueil / Connexion
  ↓
Tableau de Bord (Stats globales)
  ├── Utilisateurs (tableau)
  ├── Comptes (tableau)
  ├── Transactions (tableau)
  ├── Logs d'Activité (tableau)
  └── Paramètres Profil
```

### 📍 Navigation Mobile
```
Onglet Admin
  ├── Dashboard (stats)
  ├── Accounts (tableau paginé)
  └── Activity (logs)
```

### 💡 Cas d'Usage
- **Audit**: Vérifier les transactions suspectes
- **Reporting**: Générer rapports mensuels
- **Gestion**: Activer/bloquer comptes abusifs
- **Monitoring**: Suivre activités critiques

---

## 👔 **AGENT BANCAIRE**

### ✅ Accès Autorisé
- ✅ Liste de mes clients assignés
- ✅ Consulter comptes/soldes de mes clients
- ✅ Historique transactions de mes clients
- ✅ Ouvrir nouveau compte pour client
- ✅ Effectuer dépôt pour client
- ✅ Effectuer retrait pour client
- ✅ Effectuer virement pour client

### ❌ Accès Refusé
- ❌ Tableau de bord admin (stats globales)
- ❌ Voir comptes d'AUTRES agents
- ❌ Gestion des utilisateurs
- ❌ Page client (consulter ses propres comptes)
- ❌ Vue d'ensemble de toute la banque

### 📍 Navigation Web
```
Accueil / Connexion
  ↓
Espace Agent
  ├── Mes Clients (liste)
  │   └── Clic sur client
  │       ├── Voir compte & solde
  │       ├── Voir historique
  │       ├── 💸 Dépôt
  │       ├── 💵 Retrait
  │       └── 🔄 Virement
  ├── Ouvrir Nouveau Compte
  └── Mon Profil
```

### 📍 Navigation Mobile
```
Onglet Clients
  ├── Mes Clients (liste horizontale)
  │   └── Clic → Détails
  ├── Nouvelles Opérations
  │   ├── Dépôt
  │   ├── Retrait
  │   └── Virement
  └── Mon Profil
```

### 💡 Cas d'Usage
- **Opérations Quotidiennes**: Gérer transactions clients
- **Service Client**: Ouvrir comptes et aide
- **Réconciliation**: Traiter virements

---

## 👤 **CLIENT**

### ✅ Accès Autorisé
- ✅ Consulter ses comptes et soldes
- ✅ Voir historique détaillé des transactions
- ✅ Effectuer virements entre ses propres comptes
- ✅ Consulter ses détails personnels
- ✅ Télécharger RIB (futur)

### ❌ Accès Refusé
- ❌ Tableau de bord admin
- ❌ Gestion des comptes (créer/fermer)
- ❌ Voir comptes d'autres clients
- ❌ Voir informations agents/admin

### 📍 Navigation Web
```
Accueil / Connexion
  ↓
Espace Client
  ├── Mes Comptes
  │   ├── [Compte COURANT - $1,234.56]
  │   ├── [Compte ÉPARGNE - $5,000.00]
  │   └── Clic sur compte
  │       ├── Solde en temps réel
  │       ├── 💸 Virement
  │       ├── 📄 RIB
  │       └── Historique détaillé
  ├── Mon Profil
  └── Paramètres
```

### 📍 Navigation Mobile (Responsive)
```
Onglet Accueil
  ├── Mes Comptes (carrousel horizontal)
  │   ├── Swipe pour voir autres comptes
  │   └── Clic pour sélectionner
  ├── Solde du compte sélectionné
  ├── Actions rapides
  │   ├── 💸 Virement
  │   ├── 📥 Dépôt
  │   ├── 📤 Retrait
  │   └── 📄 RIB
  └── Historique (scroll vertical)

Onglet Mon Profil
  ├── Informations personnelles
  ├── Sécurité (2FA)
  └── Préférences (mode sombre)
```

### 💡 Cas d'Usage
- **Consultation**: Vérifier solde et historique
- **Transactions**: Virements entre comptes personnels
- **Gestion**: Mettre à jour profil

---

## 🔐 **Respecter les Permissions**

### Vérification Côté Frontend
```javascript
// Vérifier si utilisateur a permission
const hasPermission = userPermissions.includes('ADMIN.VIEW_USERS');
if (!hasPermission) {
  return <NoAccess />;
}
```

### Vérification Côté Backend
```javascript
router.get(
  '/admin/users',
  checkRole('ADMIN'),  // ← Vérifier rôle
  checkPermission('ADMIN.VIEW_USERS'),  // ← Vérifier permission
  adminController.getUsersTable
);
```

---

## 🔄 **Flux de Navigation Recommandé**

### 👨‍💼 Admin
```
1. Se connecter (email + password)
2. Saisir code 2FA (email)
3. Dashboard → voir stats
4. Naviguer tableaux selon besoin
5. Cliquer user dans tableau → voir détails
6. Se déconnecter
```

### 👔 Agent
```
1. Se connecter (email + password)
2. Saisir code 2FA (email)
3. Voir liste clients
4. Cliquer client → voir comptes
5. Cliquer compte → transactions
6. Actions (Dépôt/Retrait/Virement)
7. Se déconnecter
```

### 👤 Client
```
1. S'inscrire (ou se connecter)
2. Voir mes comptes (carrousel)
3. Cliquer compte → détails
4. Virement inter-comptes
5. Voir historique
6. Mode sombre/clair (préférence)
7. Se déconnecter
```

---

## ⚠️ **Points Importants**

1. **Aucun Bouton de Modification pour Admin**
   - Admin peut VOIR mais PAS MODIFIER opérations
   - Seule exception: gel/déblocage de comptes

2. **Agent = Exécutant**
   - Ne peut pas voir NI autres agents NI stats globales
   - Mais a accès complet à ses clients assignés

3. **Client = Autonome Limité**
   - Peut VOIR mais pas créer comptes
   - Virements uniquement entre SES comptes

4. **Audit Trail Complète**
   - Chaque action est loggée (user, timestamp, IP)
   - Admin peut consulter tous les logs

5. **2FA Obligatoire**
   - Acteurs sensibles (Admin, Agent) : 2FA requis
   - Client : 2FA optionnel (futur)

---

## 🧪 **Test des Accès**

### Comptes de Test Fournis
```
Admin
  Email: admin@queue.mg
  Password: password123
  
Agent
  Email: agent1@queue.mg
  Password: password123
  
Client (créer via inscription)
  Email: john@example.com
  Password: password123
```

### Tester Restrictions
```bash
# 1. Se connecter comme admin
# 2. Essayer accéder /agent/clients
#    → 403 "Accès refusé"

# 3. Se connecter comme agent
# 4. Essayer accéder /admin/users
#    → 403 "Accès refusé"

# 5. Se connecter comme client
# 6. Essayer voir profil autre utilisateur
#    → 403 "Accès refusé"
```

---

## 🚀 **Prochaines Étapes**

- [ ] Implémenter formulaire inscription client
- [ ] Ajouter email de bienvenue
- [ ] SMS notifications transactions
- [ ] Export PDF tableaux admin
- [ ] Graphiques historiques transactions
- [ ] Notifications en temps réel (WebSocket)
- [ ] Tests d'intégration E2E
- [ ] Documentation API Swagger
