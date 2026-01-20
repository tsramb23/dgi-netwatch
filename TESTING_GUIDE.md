# Guide de Test Complet - DGI-NetWatch

## 📋 Prérequis et Contexte d'Exécution

### Où Exécuter les Commandes?

| Contexte | Où | Accès Requis | Rôle |
|----------|-----|-------------|------|
| **Commandes kubectl** | **Votre machine locale OU runner GitHub Actions** | Kubeconfig configuré | Developer/Admin cluster |
| **Port-forward** | **Votre machine locale uniquement** | Kubectl + Pod access | Developer |
| **Exec dans pods** | **Votre machine locale OU runner GitHub** | Kubectl + Pod exec | Developer |
| **Terraform** | **Votre machine locale OU runner GitHub** | GCP credentials | GCP Project Editor |

### Configuration Locale Requise

```bash
# Vérifier kubectl est installé et configuré
kubectl version --client

# Vérifier la connexion au cluster
kubectl cluster-info

# Vérifier votre contexte actuel
kubectl config current-context

# Vérifier que vous avez accès au namespace production
kubectl auth can-i get namespaces --namespace=production
kubectl auth can-i get pods --namespace=production
```

### Variables d'Environnement à Connaître

```bash
# GCP/GKE
export GCP_PROJECT_ID="dgi-cosmic-20251210-1542"
export GKE_CLUSTER_NAME="dgi-cluster"
export GKE_REGION="us-central1"

# Kubernetes
export K8S_NAMESPACE="production"
export BACKEND_SERVICE="dgi-netwatch-backend"
export FRONTEND_SERVICE="dgi-netwatch-frontend-service"
```

---

## 1. Vérifier les Ressources Kubernetes

**Où exécuter:** Machine locale (terminal avec kubectl configuré) ou GitHub Actions runner
**Accès requis:** Lecture sur namespace production

```bash
# Vérifier que le namespace existe
kubectl get namespace production

# Vérifier les déploiements
kubectl get deployments -n production
kubectl describe deployment dgi-netwatch-backend -n production
kubectl describe deployment dgi-netwatch-frontend -n production

# Vérifier les pods
kubectl get pods -n production
kubectl describe pods -n production
```

## 2. Vérifier l'État des Pods

**Où exécuter:** Machine locale (terminal avec kubectl) ou GitHub Actions
**Accès requis:** Lecture logs des pods
**Rôle:** Developer minimum

```bash
# Voir les logs du backend
kubectl logs -n production -l app=dgi-netwatch-backend --tail=50

# Voir les logs du frontend (nginx)
kubectl logs -n production -l app=dgi-netwatch-frontend --tail=50

# Streaming des logs en temps réel
kubectl logs -f -n production -l app=dgi-netwatch-backend

# Si un pod a plusieurs conteneurs:
kubectl logs <POD_NAME> -n production -c backend
```

**Qu'attendre:** Pas d'erreurs critiques dans les logs

## 3. Vérifier les Services et Réseau

**Où exécuter:** Machine locale avec kubectl ou GitHub Actions
**Accès requis:** Lecture sur services/endpoints
**Rôle:** Developer minimum

```bash
# Vérifier les services
kubectl get svc -n production

# Format personnalisé pour voir les détails
kubectl get svc -n production -o wide

# Voir les endpoints (pods réellement accessibles)
kubectl get endpoints -n production

# Détails d'un service
kubectl describe svc dgi-netwatch-backend -n production
kubectl describe svc dgi-netwatch-frontend-service -n production
```

**Qu'attendre:** 
- Backend service en ClusterIP sur port 3001
- Frontend service en ClusterIP sur port 80
- Endpoints montrent les IPs des pods

## 4. Accéder au Frontend Localement

**Où exécuter:** Machine locale UNIQUEMENT (port-forward ne fonctionne que localement)
**Accès requis:** Exec sur pods + port-forward
**Rôle:** Developer minimum

```bash
# Terminal 1: Configurer le port-forward
kubectl port-forward svc/dgi-netwatch-frontend-service 8080:80 -n production

# Output attendu:
# Forwarding from 127.0.0.1:8080 -> 80
# Forwarding from [::1]:8080 -> 80

# Terminal 2: Ouvrir le navigateur
# URL: http://localhost:8080
```

**Qu'attendre:**
- Le port 8080 local redirige vers le service frontend
- Page HTML charge (frontend Vite/React)
- Pas d'erreurs CORS ou de connectivité

**Troubleshooting:**
- Si le port 8080 est déjà utilisé: `kubectl port-forward svc/dgi-netwatch-frontend-service 8081:80 -n production`

## 5. Tester la Connectivité Backend

**Où exécuter:** Machine locale (terminal séparé pour port-forward)
**Accès requis:** Exec et port-forward
**Rôle:** Developer

```bash
# Terminal 1: Port-forward le backend
kubectl port-forward svc/dgi-netwatch-backend 3001:3001 -n production

# Terminal 2: Tester l'endpoint de santé
curl http://localhost:3001/api/sante

# Tester les autres endpoints (adapter selon votre API)
curl http://localhost:3001/api/status
curl http://localhost:3001/health

# Avec verbose pour debug
curl -v http://localhost:3001/api/sante
```

**Qu'attendre:**
- Réponse 200 OK sur /api/sante
- JSON valide en réponse
- Headers Content-Type: application/json

## 6. Tester depuis à l'Intérieur d'un Pod (Pod-to-Pod)

**Où exécuter:** Machine locale avec kubectl (exec accède au pod)
**Accès requis:** Exec sur pods
**Rôle:** Developer

```bash
# Méthode 1: Lancer un pod temporaire de debug
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n production -- sh

# À l'intérieur du pod:
# Tester la connectivité vers le backend depuis n'importe où dans le cluster
curl http://dgi-netwatch-backend:3001/api/sante

# Tester la résolution DNS
nslookup dgi-netwatch-backend
nslookup dgi-netwatch-backend.production.svc.cluster.local

# Quitter avec: exit

# Méthode 2: Exec dans un pod existant
POD_BACKEND=$(kubectl get pod -n production -l app=dgi-netwatch-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $POD_BACKEND -n production -- curl http://localhost:3001/api/sante
```

**Qu'attendre:**
- DNS résout correctement les noms de service
- La connectivité pod-to-pod fonctionne sans proxy

## 7. Vérifier les Health Checks

**Où exécuter:** Machine locale avec kubectl
**Accès requis:** Lecture sur pods
**Rôle:** Developer

```bash
# Voir rapidement si tous les pods sont ready
kubectl get pods -n production

# Format détaillé avec status
kubectl get pods -n production -o wide

# Voir l'état des probes (Liveness/Readiness)
kubectl get pods -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[*].ready}{"\n"}{end}'

# Voir les détails complets d'un pod
kubectl describe pod <POD_NAME> -n production
# Chercher les sections:
# - "Liveness probe": Status=Success ou Failed
# - "Readiness probe": Status=Success ou Failed
# - "Events": Montre les restarts ou erreurs récentes
```

**Qu'attendre:**
- Tous les pods affichent "Ready 1/1"
- Status "Running"
- Pas d'événements d'erreur récents

## 8. Vérifier les Images et Versions

**Où exécuter:** Machine locale avec kubectl + gcloud CLI
**Accès requis:** Lecture GHCR registry
**Rôle:** Developer

```bash
# Voir les images utilisées dans le cluster
kubectl get pods -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'

# Vérifier que les images existent sur GHCR
gcloud container images describe ghcr.io/tsramb23/dgi-netwatch-backend:latest --show-tags
gcloud container images describe ghcr.io/tsramb23/dgi-netwatch-frontend:latest --show-tags

# Lister tous les tags disponibles
gcloud container images list-tags ghcr.io/tsramb23/dgi-netwatch-backend
gcloud container images list-tags ghcr.io/tsramb23/dgi-netwatch-frontend
```

**Qu'attendre:**
- Images existent sur GHCR
- Tags "latest" pointent vers les bonnes versions
- Pas d'erreurs d'authentification (si publiques)

## 9. Test End-to-End Complet

**Où exécuter:** Machine locale avec 3 terminaux
**Accès requis:** Port-forward + kubectl
**Rôle:** Developer

```bash
# ===== TERMINAL 1: Frontend =====
kubectl port-forward svc/dgi-netwatch-frontend-service 8080:80 -n production
# Attend: "Forwarding from 127.0.0.1:8080 -> 80"

# ===== TERMINAL 2: Backend =====
kubectl port-forward svc/dgi-netwatch-backend 3001:3001 -n production
# Attend: "Forwarding from 127.0.0.1:3001 -> 3001"

# ===== TERMINAL 3: Tests =====
# 1. Vérifier que le frontend répond
curl -s http://localhost:8080 | head -20

# 2. Vérifier que le backend répond
curl -s http://localhost:3001/api/sante

# 3. Ouvrir dans le navigateur
# URL: http://localhost:8080

# 4. Depuis le navigateur, vérifier que les requêtes API passent
# (Ouvrir les DevTools F12 > Console et Network)
```

**Qu'attendre:**
- Frontend charge le HTML/CSS/JS
- Backend répond aux requêtes
- Pas d'erreurs CORS dans la console
- Les requêtes API affichent status 200

## 10. Vérifier les Volumes et Stockage

**Où exécuter:** Machine locale avec kubectl + exec
**Accès requis:** Exec sur pods
**Rôle:** Developer

```bash
# Voir les volumes attachés au cluster
kubectl get pvc -n production
kubectl get pv

# Pour le backend qui utilise emptyDir, vérifier qu'il peut écrire
BACKEND_POD=$(kubectl get pod -n production -l app=dgi-netwatch-backend -o jsonpath='{.items[0].metadata.name}')

# Exec dans le pod et vérifier le répertoire
kubectl exec -it $BACKEND_POD -n production -- sh

# À l'intérieur du pod:
ls -la /app/db/
du -sh /app/db/
touch /app/db/test.txt && rm /app/db/test.txt
exit
```

**Qu'attendre:**
- Le répertoire /app/db existe
- Pas d'erreurs de permission
- Écriture/lecture fonctionne

## 11. Vérifier les Variables d'Environnement

**Où exécuter:** Machine locale avec kubectl + exec
**Accès requis:** Exec sur pods
**Rôle:** Developer

```bash
# Backend - Variables spécifiques
BACKEND_POD=$(kubectl get pod -n production -l app=dgi-netwatch-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec $BACKEND_POD -n production -- env | grep -E "NODE_ENV|DB_PATH|PORT"

# Frontend - Variables spécifiques
FRONTEND_POD=$(kubectl get pod -n production -l app=dgi-netwatch-frontend -o jsonpath='{.items[0].metadata.name}')
kubectl exec $FRONTEND_POD -n production -- env | grep -E "REACT_APP_API_URL"

# Toutes les variables
kubectl exec $BACKEND_POD -n production -- env | sort
```

**Qu'attendre:**
- NODE_ENV=production
- DB_PATH=/app/db/surveillance.db
- REACT_APP_API_URL=http://dgi-netwatch-backend:3001

## 12. Tester la Résilience

**Où exécuter:** Machine locale avec kubectl
**Accès requis:** Supprimer/créer pods
**Rôle:** Developer

```bash
# 1. Vérifier l'état initial
kubectl get pods -n production

# 2. Supprimer un pod backend (Kubernetes le recréera)
BACKEND_POD=$(kubectl get pod -n production -l app=dgi-netwatch-backend -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod $BACKEND_POD -n production

# 3. Observer la recréation (en direct)
kubectl get pods -n production --watch

# 4. Vérifier qu'un nouveau pod est créé
kubectl get pods -n production

# 5. Voir les événements
kubectl describe deployment dgi-netwatch-backend -n production
# Chercher "Events" pour voir Pod créations/suppressions
```

**Qu'attendre:**
- Pod supprimé immédiatement recréé
- Nouveau pod en status "Running" dans quelques secondes
- Déploiement maintient toujours 1 replique

## 13. Vérifier les Ressources

**Où exécuter:** Machine locale avec kubectl
**Accès requis:** Lecture metrics
**Rôle:** Developer

```bash
# Utilisation actuelle des nœuds
kubectl top nodes

# Utilisation actuelle des pods
kubectl top pods -n production

# Requests et limits définis dans les configs
kubectl get pods -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{.spec.containers[*].resources}{"\n\n"}{end}'

# Plus lisible:
kubectl describe pod $(kubectl get pod -n production -l app=dgi-netwatch-backend -o jsonpath='{.items[0].metadata.name}') -n production | grep -A 5 "Requests\|Limits"
```

**Qu'attendre:**
- Backend: CPU 100m, RAM 128Mi (requests)
- Frontend: CPU 100m, RAM 128Mi (requests)
- Utilisation réelle < requests configurées

## 14. Nettoyer et Tester le Redéploiement

**Où exécuter:** Machine locale (terminal + kubectl)
**Accès requis:** Terraform destroy + kubectl delete
**Rôle:** Admin/Developer

```bash
# Optionnel: Supprimer tout et redéployer (test destructif)

# 1. Vérifier l'état actuel
kubectl get all -n production

# 2. Supprimer via Terraform
cd terraform
terraform plan -destroy -out=tfplan-destroy

# 3. Examiner le plan
cat tfplan-destroy

# 4. Appliquer la destruction
terraform apply tfplan-destroy

# 5. Vérifier que tout est supprimé
kubectl get namespace production
kubectl get all -n production

# 6. Redéployer
terraform apply -auto-approve

# 7. Vérifier la recréation
kubectl get pods -n production --watch
```

**Qu'attendre:**
- Tous les pods supprimés avec `terraform destroy`
- Tous les pods recréés avec `terraform apply`
- État identique avant/après le cycle

## Checklist de Test Rapide

- [ ] Pods sont tous en status "Running"
- [ ] Health checks (Liveness/Readiness) passent
- [ ] Frontend accessible via port-forward
- [ ] Backend répond à /api/sante
- [ ] Frontend peut communiquer avec Backend
- [ ] Logs ne montrent pas d'erreurs
- [ ] Images Docker sont les bonnes versions
- [ ] Variables d'environnement sont correctes
- [ ] Volumes et stockage fonctionnent
- [ ] Services sont correctement connectés
- [ ] Tests end-to-end réussissent

## Troubleshooting Rapide

| Problème | Commande |
|----------|----------|
| Pod crashe | `kubectl logs <POD> -n production` |
| Pod ne démarre pas | `kubectl describe pod <POD> -n production` |
| Backend inaccessible | `kubectl get svc -n production` |
| Frontend blanc | `kubectl logs <FRONTEND_POD> -n production` |
| Pas de connectivité | `kubectl exec <POD> -n production -- nslookup dgi-netwatch-backend` |
