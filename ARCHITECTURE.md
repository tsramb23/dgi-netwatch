# 🏗️ Architecture Actuelle - DGI-NetWatch

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    GKE Cluster (us-central1)                │
│                                                             │
│  ┌────────────────────── Namespace: production ──────────┐  │
│  │                                                       │  │
│  │  ┌──────────────┐         ┌──────────────┐           │  │
│  │  │  Frontend    │         │  Backend     │           │  │
│  │  │  (nginx)     │         │  (Node.js)   │           │  │
│  │  │  Port: 80    │         │  Port: 3001  │           │  │
│  │  └──────┬───────┘         └──────┬───────┘           │  │
│  │         │                        │                    │  │
│  │         └────────┬───────────────┘                    │  │
│  │                  │                                    │  │
│  │         ┌────────▼──────────┐                        │  │
│  │         │  ClusterIP        │                        │  │
│  │         │  Services         │                        │  │
│  │         │  (intra-cluster)  │                        │  │
│  │         └───────────────────┘                        │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
          ┌─────▼─────┐        ┌─────▼──────┐
          │  kubectl  │        │  Terraform │
          │ port-forward      │  State     │
          └───────────┘        └────────────┘
```

---

## 🔧 Stack Technologique Actuel

### Infrastructure Hosting
| Composant | Technologie | Détails |
|-----------|-------------|---------|
| **Orchestration** | GKE (Google Kubernetes Engine) | Autopilot mode |
| **Région** | us-central1 | Réduit frais réseau |
| **Cluster** | dgi-cluster | 1 nœud worker |

### Déploiement
| Composant | Technologie | Détails |
|-----------|-------------|---------|
| **IaC** | Terraform | Hashicorp Kubernetes provider |
| **Registry Images** | GHCR (GitHub Container Registry) | ghcr.io/tsramb23 |
| **CI/CD** | GitHub Actions | Workflows déclenchés sur push |

### Frontend
| Aspect | Technologie | Détails |
|--------|-------------|---------|
| **Framework** | Vite + React | Build léger |
| **Serveur** | Nginx Alpine | Image 40MB |
| **Port** | 80 | HTTP uniquement |
| **Proxy API** | Nginx proxy_pass | Vers backend:3001 |
| **Ressources** | 100m CPU, 128Mi RAM | Requests uniquement |

### Backend
| Aspect | Technologie | Détails |
|--------|-------------|---------|
| **Runtime** | Node.js 18 Alpine | Image léger (~200MB) |
| **Framework** | Custom Node.js | Pas de Express/Nest.js visible |
| **Port** | 3001 | TCP |
| **BD** | SQLite | Fichier /app/db/surveillance.db |
| **Stockage** | emptyDir | Éphémère, perdu à chaque restart |
| **Ressources** | 100m CPU, 128Mi RAM | Requests uniquement |

### Networking
| Composant | Type | Détails |
|-----------|------|---------|
| **Frontend Service** | ClusterIP | Port 80, intra-cluster |
| **Backend Service** | ClusterIP | Port 3001, intra-cluster |
| **Ingress** | Aucun | Pas d'accès externe (gratuit) |
| **DNS Intra-cluster** | CoreDNS Kubernetes | Service DNS natif |

### Volumes
| Volume | Type | Utilisé par | Détails |
|--------|------|------------|---------|
| **db-volume** | emptyDir | Backend | Éphémère, reset au redémarrage |

---

## 📦 Déploiements & Réplicas Actuels

```
Namespace: production

Deployments:
├── dgi-netwatch-frontend
│   ├── Replicas: 1
│   ├── Pod: frontend-xxxxx
│   │   └── Container: nginx (ghcr.io/tsramb23/dgi-netwatch-frontend:latest)
│   ├── Service: dgi-netwatch-frontend-service (ClusterIP:80)
│   └── Health Checks:
│       ├── Liveness: TCP:80 (delay=10s, period=10s)
│       └── Readiness: TCP:80 (delay=5s, period=5s)
│
└── dgi-netwatch-backend
    ├── Replicas: 1
    ├── Pod: backend-xxxxx
    │   └── Container: node.js (ghcr.io/tsramb23/dgi-netwatch-backend:latest)
    ├── Service: dgi-netwatch-backend (ClusterIP:3001)
    ├── Volumes: emptyDir at /app/db
    ├── Env:
    │   ├── NODE_ENV: production
    │   └── DB_PATH: /app/db/surveillance.db
    └── Health Checks:
        ├── Liveness: TCP:3001 (delay=10s, period=10s)
        └── Readiness: TCP:3001 (delay=5s, period=5s)
```

---

## 📉 Coûts Actuels (Mode Gratuit)

✅ **Coût effectif: $0/mois**

### Ce qui est GRATUIT:
- ✅ GKE Autopilot: 1 cluster gratuit
- ✅ Services ClusterIP: Pas d'IP externe = pas de charge
- ✅ Stockage emptyDir: Éphémère, pas de frais
- ✅ 1 nœud worker: Réduit (e2-medium équivalent)
- ✅ GitHub Actions: 2000 minutes/mois gratuites
- ✅ GHCR: Stockage images gratuit

### ⚠️ À ÉVITER (créerait des frais):
- ❌ Service LoadBalancer: ~$15-20/mois IP externe
- ❌ Persistent Volumes (PV/PVC): ~$0.15/GB/mois
- ❌ 2+ nœuds: Double les frais
- ❌ Cloud Load Balancer: ~$18/mois
- ❌ Ingress: ~$18/mois
- ❌ Dépasser 2000 minutes GitHub Actions/mois

---

## 🔄 Pipeline CI/CD Actuel

```
1. Push vers GitHub main
          ↓
2. GitHub Actions déclenche:
   ├─ docker-build.yml (if exists)
   │  ├─ Build backend image
   │  ├─ Build frontend image
   │  └─ Push vers GHCR
   │
   └─ deploy-k8s.yml (triggered on docker-build success)
      ├─ Authenticate to GCP (GCP_SA_KEY)
      ├─ Setup gcloud
      ├─ Install gke-gcloud-auth-plugin
      ├─ Get credentials pour dgi-cluster
      ├─ Terraform init
      ├─ Terraform import namespace production
      ├─ Terraform plan
      └─ Terraform apply
          ↓
3. Kubernetes déploie les nouveaux pods
          ↓
4. Rollout status attendus
```

---

## 🔐 Accès et Authentification

| Composant | Authentification | Détails |
|-----------|-----------------|---------|
| **GCP/GKE** | Service Account (GCP_SA_KEY) | JSON key stocké en GitHub secret |
| **GHCR** | ghcr-secret | K8s secret pour pull images |
| **Kubectl** | kubeconfig | Géré par gcloud CLI |
| **Frontend** | Aucune | Stateless, accès public si exposé |
| **Backend** | Aucune | Pas d'auth API visible |

---

## 📊 Métriques et Monitoring Actuels

**Monitoring:** Minimal/Aucun configuré
- ❌ Prometheus: Non installé
- ❌ Grafana: Non installé
- ❌ ELK Stack: Non installé
- ❌ Logging centralisé: Non configuré

**Logs disponibles:**
- ✅ kubectl logs: Oui (stdout/stderr pods)
- ✅ GKE Cloud Logging: Oui (inclus Autopilot)

---

## 🚀 Points de Performance Actuels

| Aspect | Valeur | Status |
|--------|--------|--------|
| **Temps démarrage Backend** | ~2-3s | ✅ Rapide (Node.js léger) |
| **Temps démarrage Frontend** | ~1-2s | ✅ Rapide (Nginx) |
| **Latence pod-to-pod** | <10ms | ✅ Excellent |
| **CPU utilisé** | ~5-10m | ✅ Très peu |
| **RAM utilisé** | ~40-60Mi | ✅ Très peu |

---

## 🔌 Connectivité Actuelle

```
                    Internet
                       ↑
                       │
                   (AUCUNE)
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    │     Port-forward │                  │
    │     (local only)  │              Blocked
    │                  │              (ClusterIP)
    ▼                  ▼                  ▼
Localhost:8080    Localhost:3001    Cluster External
(Dev testing)     (Dev testing)      (NO ACCESS)
    │                  │
    └──────────┬───────┘
               │
        ┌──────▼──────┐
        │ GKE Cluster │
        │ (Isolated)  │
        └─────────────┘
```

---

## 📝 État du Code et Configurations

### Fichiers Clés
- ✅ `backend/package.json` - Dépendances backend
- ✅ `backend/server.js` - Serveur Node.js
- ✅ `frontend/vite.config.js` - Config Vite
- ✅ `frontend/src/App.jsx` - App React principale
- ✅ `Dockerfile.backend` - Build backend
- ✅ `Dockerfile.backend.optimized` - Build optimisé backend
- ✅ `Dockerfile.frontend` - Build frontend
- ✅ `Dockerfile.frontend.optimized` - Build optimisé frontend
- ✅ `terraform/main.tf` - Déploiements Kubernetes
- ✅ `terraform/providers.tf` - Config Terraform
- ✅ `terraform/variables.tf` - Variables
- ✅ `.github/workflows/deploy-k8s.yml` - Pipeline déploiement

### Limites Actuelles
- ⚠️ Pas de Ingress (requiert IP externe)
- ⚠️ BD SQLite éphémère (perte données à redémarrage)
- ⚠️ Pas de backup de BD
- ⚠️ Pas de monitoring/logging centralisé
- ⚠️ Pas de HTTPS/TLS
- ⚠️ Pas d'autoscaling

---

## 🔧 Commandes Utiles

```bash
# Vérifier l'état global
kubectl get all -n production

# Voir les Terraform resources
cd terraform
terraform state list

# Vérifier les images
kubectl get pods -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'

# Détails complets du cluster
kubectl cluster-info
gcloud container clusters describe dgi-cluster --region us-central1
```

---

**Dernière mise à jour:** 10 Janvier 2026
**Schéma:** GKE Autopilot minimal gratuit
**Réplicas:** 1 pod par service
**Coût:** $0 (dans les limites gratuites)
