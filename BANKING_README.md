# 🏦 FileAttente MG - Plateforme Bancaire Intégrée v3

Application multi-plateforme de **Gestion de Files d'Attente + Plateforme Bancaire** avec système de rôles et permissions avancé.

## 🏗️ Améliorations Implémentées

### 1. **Système de Rôles & Permissions**
- ✅ Tableau de bord ADMIN (view-only) avec statistiques globales
- ✅ Pages séparées pour Admin (comptes, transactions, utilisateurs, logs)
- ✅ Espace AGENT avec gestion des clients assignés
- ✅ Espace CLIENT autonome (solde, historique, virements simples)
- ✅ Middleware de validation des permissions par endpoint

### 2. **Tableaux Admin (View-Only)**
Chaque tableau inclut:
- Tri par colonnes
- Recherche en temps réel
- Filtrage (par rôle, statut, type, date)
- Pagination côté serveur (50 résultats par page)
- Badges de statut colorisés
- Aucun bouton de création/modification

**Tableaux disponibles:**
- 📊 Tableau des Utilisateurs (nom, email, rôle, statut, comptes)
- 🏦 Tableau des Comptes (numéro, propriétaire, solde, type, agent)
- 💳 Tableau des Transactions (référence, amount, type, statut, date)
- 📋 Tableau des Logs (action, utilisateur, statut, IP, timestamp)

### 3. **Fonctions Métier Agent**
L'agent peut:
- 👥 Voir ses clients assignés
- 💸 Effectuer dépôts, retraits, virements
- 🆕 Ouvrir un nouveau compte pour client
- 📈 Consulter historique des transactions clients

### 4. **Espace Client**
Le client peut:
- 👁️ Consulter ses comptes et soldes
- 📜 Voir historique détaillé des transactions
- 💵 Effectuer des virements entre ses propres comptes
- 📄 Télécharger son RIB (futur)

### 5. **Sécurité**
- 🔑 Authentification JWT
- ✋ 2FA par email (6 chiffres + 5 min expiration)
- 🔐 Hash bcrypt pour les mots de passe
- 📊 Audit logging de toutes les actions
- 🚫 Rate limiting (300 req/15 min)
- 🛡️ Helmet pour les en-têtes HTTP

### 6. **Expérience Utilisateur**
- 🌓 Mode Sombre/Clair avec persistence localStorage
- 📱 Design responsive (mobile-first)
- 🎨 Couleurs cohérentes et badges visuels
- ⚡ Lazy loading & pagination serveur
- 🔄 Pull-to-refresh sur mobile
- 💬 Messages d'erreur explicites

### 7. **Performance**
- Pagination côté serveur (évite de charger 10k enregistrements)
- Indexes MySQL sur colonnes clés (email, rôle, statut)
- Lazy loading des transactions
- Vues SQL optimisées pour rapports admin

---

## 🚀 Installation & Setup

### **Backend (Node.js)**

1. **Variables d'environnement** (`.env`)
```bash
PORT=5000
NODE_ENV=development

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=          # Laisser vide si pas de mot de passe

# APIs
JWT_SECRET=votre_token_secret_tres_securise
CORS_ORIGIN=http://localhost:3000

# Email 2FA
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_app_password  # Pas votre password Gmail direct!
```

2. **Initialiser la base de données**
```bash
cd backend

# Importer le schéma complet
mysql -u root -p queue_db < config/schema_banking.sql

# Vérifier les comptes de test
# Admin: admin@queue.mg / password123
# Agent: agent1@queue.mg / password123
```

3. **Installation & lancement**
```bash
npm install
npm run dev  # http://localhost:5000
```

### **Frontend (React)**

1. **.env.example** → **.env**
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JWT_STORAGE_KEY=token
```

2. **Lancement**
```bash
cd frontend
npm install
npm start  # http://localhost:3000
```

### **Mobile (React Native)**

1. **Adapter IP backend** dans `src/services/api.ts`
```typescript
const API_URL = 'http://192.168.x.x:5000/api';  // Remplacer par votre IP locale
```

2. **Lancement**
```bash
cd mobile
npm install
npx expo start  # Scanner QR avec Expo Go
```

---

## 📡 API Endpoints

### **Authentification**
```
POST   /api/auth/login          # { email, password }
POST   /api/auth/verify-2fa      # { code } - Code 6 chiffres
GET    /api/auth/me              # Profil utilisateur
```

### **Banking - Client**
```
GET    /api/bank/accounts                    # Tous les comptes de l'utilisateur
GET    /api/bank/accounts/:id                # Détails compte
GET    /api/bank/accounts/:id/transactions   # Historique

POST   /api/bank/accounts/:id/deposit        # { amount, description }
POST   /api/bank/accounts/:id/withdraw       # { amount, description }
POST   /api/bank/accounts/:id/transfer       # { toAccountId, amount, description }
```

### **Banking - Agent**
```
GET    /api/bank/agent/clients               # Clients assignés
POST   /api/bank/agent/accounts/open         # { clientId, accountType }
```

### **Admin - Tableaux de Bord**
```
GET    /api/bank/admin/dashboard                    # Stats globales
GET    /api/bank/admin/users?limit=50&offset=0      # Tableau utilisateurs (filtres: role_id, status, search)
GET    /api/bank/admin/accounts?limit=50&offset=0   # Tableau comptes (filtres: type, status, search)
GET    /api/bank/admin/transactions                 # Tableau transactions (filtres: type, status, dateFrom, dateTo)
GET    /api/bank/admin/logs                         # Tableau logs (filtres: action, user_id, dateFrom, dateTo)

PATCH  /api/bank/admin/users/:id/status     # { status: 'ACTIVE'|'INACTIVE'|'BLOCKED' }
```

---

## 🗄️ Structure Base de Données

### **Tables Principales**

**users**
```
id, email, password_hash, first_name, last_name, phone
role_id (FK -> roles), status (ACTIVE/INACTIVE/BLOCKED)
two_fa_enabled, two_fa_token, two_fa_token_expires_at
is_verified, email_verification_token, email_verified_at
last_login, login_attempts, locked_until
```

**bank_accounts**
```
id, user_id (FK), account_number (unique)
account_type (CURRENT/SAVING/FIXED_DEPOSIT)
balance, currency, status (ACTIVE/FROZEN/CLOSED)
agent_id (FK), iban, swift_code, created_at
```

**bank_transactions**
```
id, from_account_id, to_account_id
transaction_type (DEPOSIT/WITHDRAWAL/TRANSFER/FEE/INTEREST)
amount, status (PENDING/COMPLETED/FAILED/CANCELLED)
reference_number, description, initiated_by_user_id, processed_by_agent_id
failure_reason, created_at, completed_at
```

**roles & permissions**
```
roles: id, code (ADMIN/AGENT/CLIENT/SERVICE_MGR), name, description
permissions: id, code (ADMIN.VIEW_USERS, AGENT.DEPOSIT...), module
role_permissions: role_id, permission_id (many-to-many)
```

**activity_logs**
```
id, user_id, action, entity_type, entity_id
ip_address, user_agent, description
status (SUCCESS/FAILURE), error_message, created_at
```

---

## 🧠 Système de Permissions

### **Rôles & Permissions**

| Permission Code | Description | Rôles |
|---|---|---|
| ADMIN.VIEW_DASHBOARD | Voir tableau de bord | ADMIN |
| ADMIN.VIEW_USERS | Voir tous utilisateurs | ADMIN |
| ADMIN.VIEW_ACCOUNTS | Voir tous comptes | ADMIN |
| ADMIN.VIEW_TRANSACTIONS | Voir toutes transactions | ADMIN |
| ADMIN.VIEW_LOGS | Voir logs d'activité | ADMIN |
| AGENT.VIEW_CLIENTS | Voir clients assignés | AGENT |
| AGENT.DEPOSIT | Faire dépôt | AGENT |
| AGENT.WITHDRAW | Faire retrait | AGENT |
| AGENT.TRANSFER | Faire virement | AGENT |
| AGENT.OPEN_ACCOUNT | Ouvrir compte client | AGENT |
| CLIENT.VIEW_BALANCE | Voir solde | CLIENT |
| CLIENT.VIEW_HISTORY | Voir historique | CLIENT |
| CLIENT.TRANSFER | Faire virement | CLIENT |

---

## 🔐 2FA par Email

### **Flux**
1. Utilisateur se connecte (email + password)
2. Si 2FA activé → Code 6 chiffres envoyé par email
3. Utilisateur saisit le code (délai 5 min)
4. Si correct → JWT issué

### **Configuration Gmail**
```
1. Activer 2-step verification sur votre compte Gmail
2. Générer "App Password" (16 caractères)
3. Utiliser dans .env: EMAIL_PASS=xxxx xxxx xxxx xxxx
```

---

## 🎨 Compostants React Réutilisables

### **AdminTable.jsx**
```jsx
<AdminTable
  title="Utilisateurs"
  endpoint="/api/bank/admin/users"
  columns={[
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Statut', type: 'badge' },
  ]}
  filters={[
    { name: 'role_id', label: 'Rôle', options: [...] },
  ]}
  searchPlaceholder="Rechercher..."
/>
```

### **Hooks**
- **useTheme()** - Mode sombre/clair + persistence
- **useQueue()** - Gestion du contexte queue management
- **useTickets()** - CRUD tickets

---

## 📱 Mobile React Native

### **Screens Disponibles**
- AdminDashboardScreen.tsx → Stats globales + transactions récentes
- AdminAccountsScreen.tsx → Tableau comptes avec pagination
- ClientAccountsScreen.tsx → Mes comptes + transactions

### **Responsive Design**
- Layout horizontal pour comptes (carrousel)
- Layout vertical pour tableaux (FlatList)
- Touch-friendly buttons (48px min)
- Dark mode natif via `@react-navigation/native`

---

## ✅ Checklist Implémentation

- [x] Schema SQL bancaire avec rôles/permissions
- [x] Middleware 2FA email
- [x] Middleware permissions par endpoint
- [x] Controllers banking (comptes, transactions)  
- [x] Controllers admin (tableaux + gestion)
- [x] Routes API sécurisées
- [x] Pages React Admin (Dashboard + 4 tableaux)
- [x] Page React Client (comptes + historique)
- [x] CSS responsive (mobile + desktop)
- [x] Hook useTheme avec dark mode
- [x] Screens React Native (3 écrans)
- [x] Pagination serveur + lazy loading
- [x] Audit logging toutes actions
- [ ] Tests unitaires (Jest + Supertest)
- [ ] Documentation Swagger/OpenAPI
- [ ] Docker (docker-compose MySQL + backend)
- [ ] SMS 2FA via Twilio (optionnel)
- [ ] QR code tickets (optionnel)
- [ ] Redis cache (optionnel)

---

## 🐛 Troubleshooting

### **"Access denied for user 'root'@'localhost'"**
```bash
# Vérifier .env
DB_PASS=          # Laisser vide si pas de password
```

### **2FA email ne s'envoie pas**
```bash
# Vérifier Gmail credentials
# "Less secure apps" → ON (ou utiliser App Password)
# Port 587 (TLS) en priorité
```

### **Token JWT expiré**
```bash
# Implémenter refresh token flow (future)
POST /api/auth/refresh { refreshToken }
```

---

## 📚 Ressources

- [Express.js](https://expressjs.com)
- [React 18](https://react.dev)
- [React Native](https://reactnative.dev)
- [MySQL Documentation](https://dev.mysql.com/doc)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

---

**Version**: 3.0 | **Dernière mise à jour**: 2026-04-03
