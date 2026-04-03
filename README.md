# 🎫 FileAttente MG — v2.0

Application de **Gestion de Files d'Attente** Cross-Platform
- **Backend** : Node.js + Express + Socket.IO + MySQL
- **Frontend Web** : React 18 + JSX + Recharts
- **Mobile** : React Native + Expo + TypeScript (TSX)

---

## ⚡ Démarrage rapide

### 1. Base de données MySQL

```bash
mysql -u root -p < backend/config/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env       # remplir DB_PASS et JWT_SECRET
npm run dev                # http://localhost:5000
npm run seed               # données de test (optionnel)
```

### 3. Frontend Web

```bash
cd frontend
npm install
cp .env.example .env
npm start                  # http://localhost:3000
```

### 4. Application Mobile (Expo)

```bash
cd mobile
npm install
# Éditer src/services/api.ts → remplacer 192.168.1.X par votre IP
npx expo start             # scanner QR avec Expo Go
```

---

## 🔑 Comptes de test

| Rôle          | Email            | Mot de passe  |
|---------------|------------------|---------------|
| Administrateur| admin@queue.mg   | password123   |
| Agent         | agent1@queue.mg  | password123   |
| Usager        | (sans compte)    | —             |

---

## 📡 API REST — Endpoints principaux

| Méthode | Route                      | Auth    | Description              |
|---------|----------------------------|---------|--------------------------|
| POST    | /api/auth/login            | Public  | Connexion JWT            |
| GET     | /api/auth/me               | Auth    | Profil utilisateur       |
| GET     | /api/services              | Public  | Liste des services       |
| POST    | /api/tickets               | Public  | Créer un ticket          |
| GET     | /api/tickets               | Auth    | Liste des tickets        |
| PATCH   | /api/tickets/:id/call      | Agent   | Appeler un ticket        |
| PATCH   | /api/tickets/:id/complete  | Agent   | Terminer un ticket       |
| PATCH   | /api/tickets/:id/absent    | Agent   | Marquer absent           |
| GET     | /api/queues/:serviceId     | Public  | État temps réel d'une file|
| GET     | /api/stats                 | Agent+  | Statistiques du jour     |
| GET     | /api/stats/history         | Admin   | Historique 7 jours       |
| GET     | /api/users                 | Admin   | Gestion des agents       |
| GET     | /api/health                | Public  | Vérification serveur     |

---

## 🗂️ Structure des fichiers

```
queue-app-v2/
├── backend/
│   ├── server.js
│   ├── config/
│   │   ├── db.js          ← Pool MySQL
│   │   ├── schema.sql     ← Tables + vue + données initiales
│   │   └── seed.js        ← Données de test
│   ├── controllers/
│   │   └── ticketController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── validateMiddleware.js
│   └── routes/
│       ├── authRoutes.js
│       ├── ticketRoutes.js
│       ├── queueRoutes.js
│       ├── serviceRoutes.js
│       ├── statsRoutes.js
│       └── userRoutes.js
├── frontend/              ← React 18 + JSX
│   └── src/
│       ├── App.jsx
│       ├── index.jsx
│       ├── context/       ← AuthContext.jsx, ToastContext.jsx
│       ├── hooks/         ← useQueue.jsx, useTickets.jsx
│       ├── services/      ← api.js (Axios)
│       ├── components/    ← Navbar.jsx, TicketForm.jsx, StatCard.jsx
│       ├── pages/         ← HomePage.jsx, TicketPage.jsx, QueueDisplay.jsx
│       │                     AgentPage.jsx, AdminPage.jsx, LoginPage.jsx
│       └── styles/        ← global.css
└── mobile/                ← React Native + Expo + TypeScript
    ├── App.tsx
    └── src/
        ├── types/         ← index.ts (interfaces TS)
        ├── context/       ← AuthContext.tsx, ToastContext.tsx
        ├── hooks/         ← useQueue.ts
        ├── services/      ← api.ts
        └── screens/
            ├── LoginScreen.tsx
            ├── HomeScreen.tsx
            ├── TicketScreen.tsx
            ├── QueueScreen.tsx
            └── AgentScreen.tsx
```

---

## 🏗️ Extensions possibles

- **Notifications SMS** : Twilio API → déclencher à `ticket:called`
- **Push Notifications** : Firebase FCM via `expo-notifications`
- **QR Code ticket** : `expo-barcode-scanner` ou `react-qr-code`
- **Redis** : cache des files pour alléger MySQL
- **Docker** : `docker-compose` avec MySQL + backend + nginx
- **Tests** : Jest + React Testing Library + Supertest
