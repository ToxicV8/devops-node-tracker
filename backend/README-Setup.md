# 🚀 Issue Tracker Backend Setup

Dieses Dokument beschreibt das Setup des Issue Tracker Backends auf verschiedenen Betriebssystemen.

## 📋 Voraussetzungen

- **Node.js** 18+ 
- **npm** 8+
- **Docker** & **Docker Compose**
- **Git**

## 🔧 Plattform-spezifisches Setup

### 🐧 Linux / macOS (Bash/Zsh)

```bash
# 1. Repository klonen
git clone <repository-url>
cd backend

# 2. Dependencies installieren
npm install

# 3. Secrets und .env generieren
npm run setup

# 4. Docker Services starten
npm run docker:run

# 5. Prisma Migrations
npm run prisma:migrate
```


### 🪟 Windows (PowerShell) - Empfohlen

```powershell
# 1. Repository klonen
git clone <repository-url>
cd backend

# 2. Dependencies installieren
npm install

# 3. Secrets und .env generieren
npm run setup:powershell

# Optional: Mit Force Parameter
powershell -ExecutionPolicy Bypass -File setup-secrets.ps1 -Force

# 4. Docker Services starten
npm run docker:run

# 5. Prisma Migrations
npm run prisma:migrate
```

## 🔒 Generierte Dateien

Das Setup erstellt folgende Dateien:

```
backend/
├── .env                    # Umgebungsvariablen
├── secrets/
│   ├── db_password.txt     # Datenbank-Passwort
│   └── jwt_secret.txt      # JWT Secret
└── ...
```

**⚠️ WICHTIG:** Fügen Sie diese zu `.gitignore` hinzu:

```gitignore
# Environment
.env
.env.*

# Secrets
secrets/
```

## 🌐 Services nach dem Start

Nach erfolgreichem Setup sind folgende Services verfügbar:

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **Backend API** | http://localhost:4000 | GraphQL API |
| **GraphiQL** | http://localhost:4000/graphiql | GraphQL Playground |
| **Health Check** | http://localhost:4000/health | Server Status |
| **PostgreSQL** | localhost:5432 | Datenbank |
| **Adminer** | http://localhost:8080 | DB Management |
| **Redis** | localhost:6379 | Cache (optional) |

## 🛠️ Verfügbare NPM Scripts

### Development
```bash
npm run dev                 # Entwicklungsserver (Hot Reload)
npm run start:dev          # Direkt mit tsx starten
npm run build              # TypeScript kompilieren
npm run start              # Production Server starten
```

### Prisma/Database
```bash
npm run prisma:generate    # Prisma Client generieren
npm run prisma:push        # Schema zur DB pushen
npm run prisma:migrate     # Migration erstellen/ausführen
npm run prisma:studio      # Prisma Studio öffnen
npm run prisma:reset       # Datenbank zurücksetzen
```

### Docker
```bash
npm run docker:build       # Docker Image bauen
npm run docker:run         # Services starten
npm run docker:stop        # Services stoppen
npm run docker:logs        # Backend Logs anzeigen
npm run docker:prod        # Production Deployment
```

### Setup
```bash
npm run setup              # Linux/macOS Setup
npm run setup:powershell   # Windows PowerShell Setup
```

### Testing & Quality
```bash
npm run test               # Tests ausführen
npm run test:watch         # Tests im Watch Mode
npm run test:coverage      # Test Coverage
npm run lint               # ESLint ausführen
npm run lint:fix           # ESLint mit Auto-Fix
npm run type-check         # TypeScript Prüfung
```

## 🔧 Konfiguration

### Umgebungsvariablen

Die wichtigsten Variablen in `.env`:

```bash
# Server
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://issuetracker:PASSWORD@localhost:5432/issuetracker_db"

# Security
JWT_SECRET=your_jwt_secret_here
BCRYPT_ROUNDS=12

# Features
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

### Docker Compose Override

Für lokale Anpassungen erstellen Sie `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  backend:
    environment:
      - LOG_LEVEL=debug
    volumes:
      - ./src:/app/src  # Hot Reload für Development
```

## 🚨 Troubleshooting

### Port bereits belegt
```bash
# Prüfen welcher Prozess Port 4000 verwendet
netstat -tulpn | grep 4000  # Linux
netstat -ano | findstr 4000 # Windows

# Port im .env ändern
PORT=4001
```

### PowerShell Execution Policy (Windows)
```powershell
# Temporär erlauben
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Oder direkt ausführen
powershell -ExecutionPolicy Bypass -File setup-secrets.ps1
```

### Docker Berechtigungsfehler (Linux)
```bash
# User zur docker Gruppe hinzufügen
sudo usermod -aG docker $USER
# Neuanmeldung erforderlich
```

### Prisma Verbindungsfehler
```bash
# Datenbank-Container prüfen
docker-compose logs postgres

# Connection String in .env prüfen
# Sicherstellen dass Container läuft
docker-compose ps
```

## 📚 Weitere Ressourcen

- [Docker Documentation](https://docs.docker.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Fastify Documentation](https://www.fastify.io/docs/)

## 🤝 Support

Bei Problemen:

1. Prüfen Sie die Logs: `npm run docker:logs`
2. Services neustarten: `npm run docker:stop && npm run docker:run`
3. Clean Setup: Löschen Sie `.env`, `secrets/` und führen Sie Setup erneut aus 