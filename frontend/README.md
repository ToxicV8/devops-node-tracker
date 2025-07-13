# DevOps Node Tracker - Frontend

Ein modernes React-Frontend für den DevOps Node Tracker mit GraphQL-Integration.

## 🚀 Features

- **Moderne React 18** mit TypeScript
- **GraphQL Integration** mit Apollo Client
- **Responsive Design** mit Tailwind CSS
- **Authentifizierung** mit JWT
- **State Management** mit Zustand
- **Routing** mit React Router
- **Formulare** mit React Hook Form
- **Benachrichtigungen** mit React Hot Toast
- **Icons** mit Lucide React

## 📋 Voraussetzungen

- Node.js >= 18.0.0
- npm >= 8.0.0
- Backend-Server läuft auf Port 4000

## 🛠️ Installation

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

3. **Browser öffnen:**
   ```
   http://localhost:3000
   ```

## 📁 Projektstruktur

```
src/
├── components/          # React-Komponenten
│   ├── auth/           # Authentifizierung
│   ├── layout/         # Layout-Komponenten
│   ├── ui/             # Basis-UI-Komponenten
│   └── features/       # Feature-spezifische Komponenten
├── pages/              # Seiten-Komponenten
├── hooks/              # Custom Hooks
├── services/           # API Services
├── store/              # State Management
├── types/              # TypeScript Types
├── utils/              # Hilfsfunktionen
├── lib/                # Konfigurationen
└── styles/             # Globale Styles
```

## 🔧 Verfügbare Scripts

- `npm run dev` - Entwicklungsserver starten
- `npm run build` - Produktions-Build erstellen
- `npm run preview` - Produktions-Build lokal testen
- `npm run lint` - ESLint ausführen
- `npm run lint:fix` - ESLint-Fehler automatisch beheben
- `npm run type-check` - TypeScript-Typen prüfen

## 🌐 GraphQL Integration

Das Frontend ist vollständig mit der GraphQL-API des Backends integriert:

- **Apollo Client** für GraphQL-Operationen
- **Automatische Token-Verwaltung** für Authentifizierung
- **Error Handling** mit Toast-Benachrichtigungen
- **Optimistic Updates** für bessere UX

## 🎨 Design System

- **Tailwind CSS** für Styling
- **Responsive Design** für alle Bildschirmgrößen
- **Dark/Light Theme** vorbereitet
- **Konsistente Komponenten** mit wiederverwendbaren Styles

## 🔐 Authentifizierung

- **JWT-basierte Authentifizierung**
- **Geschützte Routen** mit ProtectedRoute-Komponente
- **Automatische Token-Speicherung** im localStorage
- **Logout-Funktionalität**

## 📱 Responsive Design

Das Frontend ist vollständig responsive und funktioniert auf:
- Desktop (>= 1024px)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## 🚀 Deployment

1. **Build erstellen:**
   ```bash
   npm run build
   ```

2. **Dist-Ordner deployen** auf Ihren Webserver

## 🔧 Konfiguration

Die wichtigsten Konfigurationsdateien:

- `vite.config.ts` - Vite-Konfiguration
- `tailwind.config.js` - Tailwind CSS-Konfiguration
- `tsconfig.json` - TypeScript-Konfiguration
- `src/lib/apollo.ts` - Apollo Client-Konfiguration

## 🤝 Beitragen

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. 