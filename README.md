# DGI-NetWatch

## Description

**DGI-NetWatch** est une application de surveillance d'infrastructure réseau développée pour la Direction Générale des Impôts de Madagascar. Cette application permet de monitorer en temps réel l'état de disponibilité des équipements critiques de l'infrastructure informatique.

### Fonctionnalités principales

- **Surveillance en temps réel** : Vérification de la disponibilité des équipements via ping ICMP
- **Rafraîchissement automatique** : Mise à jour des statuts toutes les 30 secondes
- **Interface responsive** : Design moderne et adapté à tous les appareils
- **Statistiques globales** : Affichage du nombre d'équipements en ligne/hors ligne
- **Gestion des erreurs** : Messages clairs en cas de problème de connexion
- **Architecture modulaire** : Backend et frontend séparés pour une meilleure maintenabilité

### Équipements surveillés

Par défaut, l'application surveille les équipements suivants :

| Nom | Adresse IP | Emplacement |
|-----|-----------|------------|
| Serveur de Fichiers DGI | 192.168.1.10 | Datacenter Principal |
| Routeur MikroTik RB4011 | 192.168.1.1 | Division Système et Réseau |
| Firewall Cisco ASA 5510 | 192.168.1.2 | Périmètre de Sécurité |
| Switch D-Link 16 ports | 192.168.1.3 | Couche d'Accès |

## Pré-requis

### Pour le développement local

- **Node.js** : version 16 ou supérieure
- **npm** ou **yarn** : gestionnaire de paquets
- **Git** : pour le contrôle de version

### Pour le déploiement avec Docker

- **Docker** : version 20.10 ou supérieure
- **Docker Compose** : version 1.29 ou supérieure

## Installation

### Option 1 : Installation sans Docker (Développement)

#### 1. Cloner ou télécharger le projet

```bash
cd dgi-netwatch
```

#### 2. Installer les dépendances du backend

```bash
cd backend
npm install
cd ..
```

#### 3. Installer les dépendances du frontend

```bash
cd frontend
npm install
cd ..
```

## Démarrage

### Mode développement (sans Docker)

#### Terminal 1 - Démarrer le backend

```bash
cd backend
npm run dev
```

Le serveur backend sera disponible à `http://localhost:3001`

#### Terminal 2 - Démarrer le frontend

```bash
cd frontend
npm run dev
```

L'application frontend sera disponible à `http://localhost:5173`

### Mode production avec Docker

#### 1. Construire les images Docker

```bash
docker-compose build
```

#### 2. Démarrer les services

```bash
docker-compose up -d
```

L'application sera disponible à `http://localhost`

#### 3. Vérifier le statut des services

```bash
docker-compose ps
```

#### 4. Consulter les logs

```bash
# Logs du backend
docker-compose logs backend

# Logs du frontend
docker-compose logs frontend

# Tous les logs
docker-compose logs -f
```

#### 5. Arrêter les services

```bash
docker-compose down
```

## Configuration

### Modifier les équipements à surveiller

Pour ajouter, modifier ou supprimer des équipements, éditez le fichier `backend/server.js` :

```javascript
const equipements = [
  { nom: "Nom de l'équipement", ip: "192.168.1.X", emplacement: "Localisation" },
  // Ajouter d'autres équipements selon vos besoins
];
```

Après modification, redémarrez le backend :

```bash
# Mode développement
npm run dev

# Mode Docker
docker-compose restart backend
```

### Variables d'environnement

#### Backend (.env)

```
PORT=3001
NODE_ENV=development
```

#### Frontend (vite.config.js)

```javascript
VITE_API_URL=http://localhost:3001
```

Pour le déploiement en production, modifiez l'URL de l'API selon votre domaine.

## Structure du projet

```
dgi-netwatch/
├── backend/
│   ├── server.js           # Serveur Express principal
│   ├── package.json        # Dépendances backend
│   └── .env                # Variables d'environnement
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Composant principal React
│   │   ├── App.css         # Styles de l'application
│   │   ├── main.jsx        # Point d'entrée React
│   │   └── index.html      # Template HTML
│   ├── package.json        # Dépendances frontend
│   └── vite.config.js      # Configuration Vite
├── docker-compose.yml      # Configuration Docker Compose
├── Dockerfile.backend      # Image Docker du backend
├── Dockerfile.frontend     # Image Docker du frontend
└── README.md              # Ce fichier
```

## Architecture technique

### Backend

- **Framework** : Express.js
- **Port** : 3001
- **Endpoints** :
  - `GET /api/status` : Récupère le statut de tous les équipements
  - `GET /api/equipements` : Liste les équipements configurés
  - `GET /api/sante` : Vérifie la santé du serveur

### Frontend

- **Framework** : React 18
- **Build tool** : Vite
- **Port** : 5173 (développement) / 80 (production)
- **Styling** : CSS3 avec variables CSS

### Communication

- **Protocole** : HTTP REST
- **CORS** : Activé pour permettre les requêtes du frontend
- **Rafraîchissement** : Automatique toutes les 30 secondes

## Dépannage

### Le backend ne démarre pas

```bash
# Vérifier que le port 3001 n'est pas utilisé
lsof -i :3001

# Tuer le processus si nécessaire
kill -9 <PID>
```

### Le frontend ne peut pas se connecter au backend

1. Vérifiez que le backend est en cours d'exécution
2. Vérifiez l'URL de l'API dans la configuration
3. Vérifiez les logs du navigateur (F12)
4. Vérifiez que CORS est correctement configuré

### Les équipements ne répondent pas au ping

1. Vérifiez que les adresses IP sont correctes
2. Vérifiez la connectivité réseau
3. Vérifiez que les équipements acceptent les requêtes ping
4. Consultez les logs du backend pour plus de détails

### Problèmes avec Docker

```bash
# Reconstruire les images
docker-compose build --no-cache

# Supprimer les conteneurs et volumes
docker-compose down -v

# Relancer les services
docker-compose up -d
```

## Performance et optimisation

- **Caching** : Les résultats de ping sont mis en cache pendant 30 secondes
- **Timeouts** : Timeout de 2 secondes pour chaque requête ping
- **Parallélisation** : Les vérifications de ping sont effectuées en parallèle
- **Compression** : Gzip activé pour les réponses HTTP

## Sécurité

- **CORS** : Configuré pour accepter les requêtes du frontend
- **Validation** : Entrées validées côté serveur
- **HTTPS** : À configurer en production avec un reverse proxy
- **Variables sensibles** : À stocker dans des variables d'environnement

## Maintenance

### Logs

Les logs du backend sont affichés dans la console. Pour les conserver, configurez un service de logging externe.

### Mises à jour

Pour mettre à jour les dépendances :

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

## Licence

MIT

## Support

Pour toute question ou problème, veuillez consulter la documentation ou contacter l'équipe informatique de la DGI.

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Environnement** : Production
