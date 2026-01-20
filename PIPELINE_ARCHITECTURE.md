# Architecture Pipeline CI/CD - DGI-NetWatch

## Vue d'ensemble

La pipeline suit une architecture **propre et séparation des responsabilités** :

```
Developer push to main
    │
    ├─ Trigger: build-push.yml (image building)
    │  └─ Build & push Docker images to GHCR
    │
    ├─ Trigger: terraform.yml (Kubernetes deployment)
    │  └─ Deploy to GKE using Terraform
    │
    └─ Trigger: deploy-k8s.yml (verification)
       └─ Verify pods are running
```

## Workflow 1: build-push.yml

**Responsabilité:** Construire et pousser les images Docker

### Trigger
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'frontend/**'
      - 'Dockerfile.*'
```

### Étapes
1. Checkout code
2. Login to GHCR
3. Build backend image with tag `commit-sha` et `latest`
4. Push backend image
5. Build frontend image with tag `commit-sha` et `latest`
6. Push frontend image

### Résultat
- 2 images Docker dans GHCR
- Backend: `ghcr.io/tsramb23/dgi-netwatch-backend:${{ github.sha }}`
- Frontend: `ghcr.io/tsramb23/dgi-netwatch-frontend:${{ github.sha }}`

### Temps: ~5-8 minutes

---

## Workflow 2: terraform.yml

**Responsabilité:** Déployer sur GKE via Terraform

### Important
⚠️ **Terraform gère UNIQUEMENT les déploiements K8s**, pas le cluster GKE lui-même.

Le cluster GKE doit exister et être configuré avant.

### Trigger
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'
      - 'backend/**'
      - 'frontend/**'
```

### Étapes
1. Checkout code
2. Authenticate to GCP via service account
3. Setup gcloud CLI
4. Get credentials for existing GKE cluster
5. Setup Terraform
6. `terraform init` - init providers
7. `terraform validate` - validate syntax
8. `terraform plan` - generate plan
9. `terraform apply` (uniquement sur `main` branch)
10. Display deployment status

### Ressources Terraform gérées
- ✅ Namespace `production`
- ✅ Deployment `backend`
- ✅ Deployment `frontend`
- ✅ Service `backend` (ClusterIP)
- ✅ Service `frontend` (LoadBalancer)

### Ressources Terraform **NOT** gérées
- ❌ GKE cluster
- ❌ VPC
- ❌ Firewall rules
- ❌ Node pools

### Terraform Code Structure

```hcl
# terraform/providers.tf
provider "kubernetes" {
  config_path = "~/.kube/config"
  # ✅ Connecte à cluster EXISTANT
  # ❌ Ne crée pas le cluster
}

# terraform/main.tf
# Uniquement ressources K8s:
resource "kubernetes_namespace" "production" { ... }
resource "kubernetes_deployment" "backend" { ... }
resource "kubernetes_deployment" "frontend" { ... }
resource "kubernetes_service" "backend" { ... }
resource "kubernetes_service" "frontend" { ... }
```

### Temps: ~2-3 minutes

---

## Workflow 3: deploy-k8s.yml

**Responsabilité:** Vérifier le déploiement

### Trigger
```yaml
on:
  workflow_run:
    workflows: ["Terraform Deploy to Kubernetes"]
    types:
      - completed
```

S'exécute **après** terraform.yml, uniquement si succès

### Étapes
1. Checkout code
2. Authenticate to GCP
3. Setup gcloud CLI
4. Get cluster credentials
5. Wait for backend rollout (5 min timeout)
6. Wait for frontend rollout (5 min timeout)
7. Verify all pods running
8. Display services

### Sortie
```
✅ All pods running!
NAME                                    READY   STATUS    RESTARTS   AGE
dgi-netwatch-backend-xxxx              1/1     Running   0          30s
dgi-netwatch-frontend-xxxx             1/1     Running   0          25s
```

### Temps: ~2-3 minutes

---

## Configuration requise

### 1. Cluster GKE pré-existant
```bash
# Doit exister AVANT pipeline
gcloud container clusters create dgi-netwatch-cluster \
  --region us-central1 \
  --project dgi-cosmic-20251210-1542
```

### 2. GitHub Secrets configurés
- `GCP_SA_KEY` : Clé JSON du service account GCP
- `GCP_PROJECT_ID` : `dgi-cosmic-20251210-1542`

### 3. Service Account GCP avec permissions
```
- container.clusters.get
- container.clusters.getCredentials
- container.operations.*
- logging.*
```

### 4. kubeconfig accessible
```bash
gcloud container clusters get-credentials dgi-netwatch-cluster \
  --region us-central1 \
  --project dgi-cosmic-20251210-1542
```

---

## Flux complet (exemple)

```
21:00 - Developer pushes code to main
    │
21:01 - GitHub triggers build-push.yml
    ├─ Build backend image
    ├─ Build frontend image
    └─ Push to GHCR ✓
    │
21:10 - build-push SUCCESS
    │
21:11 - GitHub triggers terraform.yml
    ├─ Connect to GKE cluster
    ├─ terraform plan
    ├─ terraform apply
    │  ├─ Create namespace
    │  ├─ Create deployments
    │  └─ Create services
    └─ ✓
    │
21:14 - terraform SUCCESS
    │
21:15 - GitHub triggers deploy-k8s.yml
    ├─ Wait for backend pod ready
    ├─ Wait for frontend pod ready
    └─ Verify ✓
    │
21:18 - Application LIVE in production ✅
```

---

## Sécurité

### Image Tags
- **Commit SHA** : `ghcr.io/tsramb23/dgi-netwatch-backend:a1b2c3d...`
  - Traçabilité complète
  - Rollback facile
  - Immutable

- **Latest** : `ghcr.io/tsramb23/dgi-netwatch-backend:latest`
  - Référence actuelle
  - Peut changer

### Secrets
- Tous les secrets dans GitHub Secrets (encrypted)
- Jamais dans code, logs, ou artifacts
- Token GITHUB_TOKEN auto-géré par GitHub

### RBAC
Terraform peut configurer Kubernetes RBAC:
```hcl
resource "kubernetes_service_account" "app" {
  metadata {
    name = "app-sa"
    namespace = "production"
  }
}

resource "kubernetes_role" "app" {
  metadata {
    name = "app-role"
    namespace = "production"
  }
  
  rule {
    api_groups = [""]
    resources = ["pods"]
    verbs = ["get", "list"]
  }
}

resource "kubernetes_role_binding" "app" {
  metadata {
    name = "app-rb"
    namespace = "production"
  }
  
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind = "Role"
    name = "app-role"
  }
  
  subject {
    kind = "ServiceAccount"
    name = "app-sa"
    namespace = "production"
  }
}
```

---

## Troubleshooting

### ❌ Terraform Apply échoue avec "resource already exists"

**Cause:** Ressource créée manuellement ou par ancien workflow

**Solution:**
```bash
# Option 1: Importer dans l'état Terraform
terraform import kubernetes_deployment.backend production/dgi-netwatch-backend

# Option 2: Ajouter lifecycle ignore_changes
lifecycle {
  ignore_changes = [spec]
}
```

### ❌ Pod ne démarre pas

**Debug:**
```bash
# Voir logs
kubectl logs deployment/dgi-netwatch-backend -n production

# Voir événements
kubectl describe deployment dgi-netwatch-backend -n production

# Voir état du pod
kubectl get pods -n production -o wide
```

### ❌ Image pas trouvée dans GHCR

**Cause:** Build workflow n'a pas poussé l'image

**Vérifier:**
1. GitHub Actions -> build-push.yml -> check logs
2. Vérifier secret GITHUB_TOKEN
3. Vérifier permissions du repo

---

## Prochaines étapes

### Court terme
- [ ] Ajouter tests unitaires dans build
- [ ] Ajouter health checks plus robustes
- [ ] Configurer notifications Slack

### Moyen terme
- [ ] GitOps avec ArgoCD
- [ ] Automated testing (Jest, Cypress)
- [ ] Security scanning (Trivy)

### Long terme
- [ ] Multi-region deployment
- [ ] Service mesh (Istio)
- [ ] Canary deployments
