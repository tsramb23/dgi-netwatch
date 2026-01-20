# ⚡ Commandes Rapides - DGI-NetWatch

## 🚀 Tester en 2 Minutes

```bash
# Vérifier que tout tourne
kubectl get pods -n production

# Si OK → Accéder au frontend
kubectl port-forward svc/dgi-netwatch-frontend-service 8080:80 -n production

# Ouvrir http://localhost:8080 dans le navigateur
```

---

## 🔍 Diagnostic Rapide

### Pods Status
```bash
kubectl get pods -n production -o wide
```

### Logs Récents (dernière erreur)
```bash
# Backend
kubectl logs -n production -l app=dgi-netwatch-backend --tail=20

# Frontend
kubectl logs -n production -l app=dgi-netwatch-frontend --tail=20

# Tout pod
kubectl logs -n production --all-containers=true --tail=50
```

### Services et Endpoints
```bash
kubectl get svc,endpoints -n production
```

### Décription complète d'un pod
```bash
kubectl describe pod $(kubectl get pod -n production -l app=dgi-netwatch-backend -o jsonpath='{.items[0].metadata.name}') -n production
```

---

## 🧪 Test End-to-End

### Terminal 1: Frontend
```bash
kubectl port-forward svc/dgi-netwatch-frontend-service 8080:80 -n production
```

### Terminal 2: Backend
```bash
kubectl port-forward svc/dgi-netwatch-backend 3001:3001 -n production
```

### Terminal 3: Tester
```bash
# Frontend accessible?
curl http://localhost:8080 | head -5

# Backend accessible?
curl http://localhost:3001/api/sante

# Pod-to-pod connectivity?
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n production -- curl http://dgi-netwatch-backend:3001/api/sante
```

---

## 📊 Monitoring

### Utilisation Ressources
```bash
kubectl top pods -n production
kubectl top nodes
```

### Événements (derniers 10)
```bash
kubectl get events -n production --sort-by='.lastTimestamp' | tail -10
```

### Vérifier Health Checks
```bash
# Liveness + Readiness status
kubectl get pods -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[*].ready}{"\n"}{end}'
```

### Logs streaming temps réel
```bash
kubectl logs -f -n production -l app=dgi-netwatch-backend
```

---

## 🔧 Terraform

### Vérifier état
```bash
cd terraform
terraform state list
terraform state show kubernetes_namespace.production
```

### Plan (voir changements)
```bash
cd terraform
terraform plan
```

### Appliquer changements
```bash
cd terraform
terraform apply -auto-approve
```

### Détruire tout (test)
```bash
cd terraform
terraform destroy -auto-approve
```

---

## 🐛 Troubleshooting Rapide

### Pod ne démarre pas?
```bash
# Voir raison
kubectl describe pod <POD_NAME> -n production

# Voir logs
kubectl logs <POD_NAME> -n production
```

### Service inaccessible?
```bash
# Vérifier endpoints
kubectl get endpoints -n production

# Vérifier résolution DNS
kubectl run -it --rm debug --image=busybox --restart=Never -n production -- nslookup dgi-netwatch-backend
```

### High CPU/RAM?
```bash
# Utilisation actuelle
kubectl top pods -n production

# Limite configurée
kubectl describe pod <POD> -n production | grep -A 5 "Requests\|Limits"
```

### Logs manquent?
```bash
# Vérifier GCS logs (Cloud Logging)
gcloud logging read "resource.type=k8s_pod AND resource.labels.namespace_name=production" --limit=50 --format=json

# Ou via GCP console:
# Cloud Logging > Logs Explorer
```

---

## 🌍 Accès et URLs

### Frontend local (dev)
```
http://localhost:8080
```

### Backend local (dev)
```
http://localhost:3001/api/sante
```

### Production (si Cloudflare activé futur)
```
https://app.yourdomain.com
```

### GCP Console
```
Cloud Logging: https://console.cloud.google.com/logs/query
GKE Clusters: https://console.cloud.google.com/kubernetes/workload
GHCR Registry: https://console.cloud.google.com/gcr
```

---

## 🔐 Secrets et Credentials

### Voir les secrets K8s
```bash
kubectl get secrets -n production
kubectl describe secret ghcr-secret -n production
```

### Ajouter nouveau secret
```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<USERNAME> \
  --docker-password=<PAT_TOKEN> \
  -n production
```

### Variables d'environnement
```bash
# Backend
kubectl exec $(kubectl get pod -n production -l app=dgi-netwatch-backend -o jsonpath='{.items[0].metadata.name}') -n production -- env | grep -E "NODE_ENV|DB_PATH"

# Frontend
kubectl exec $(kubectl get pod -n production -l app=dgi-netwatch-frontend -o jsonpath='{.items[0].metadata.name}') -n production -- env | grep REACT_APP
```

---

## 📈 Scaling

### Vérifier replicas actuels
```bash
kubectl get deployment -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.replicas}{"\n"}{end}'
```

### Scaler manuellement
```bash
kubectl scale deployment dgi-netwatch-backend --replicas=3 -n production
```

### Voir historique scaling
```bash
kubectl describe deployment dgi-netwatch-backend -n production | grep -A 10 "Events"
```

---

## 🔄 Redéployment

### Force redéploiement (restart pods)
```bash
kubectl rollout restart deployment/dgi-netwatch-backend -n production
kubectl rollout restart deployment/dgi-netwatch-frontend -n production
```

### Attendre que rollout finisse
```bash
kubectl rollout status deployment/dgi-netwatch-backend -n production
```

### Voir historique
```bash
kubectl rollout history deployment/dgi-netwatch-backend -n production
```

---

## 🗑️ Nettoyage

### Supprimer un pod (recréé automatiquement)
```bash
kubectl delete pod <POD_NAME> -n production
```

### Supprimer tous les pods d'un label
```bash
kubectl delete pods -n production -l app=dgi-netwatch-backend
```

### Supprimer les old pods lors d'un update
```bash
kubectl delete pods -n production --field-selector status.phase=Failed
kubectl delete pods -n production --field-selector status.phase=Unknown
```

---

## 📋 Check-list Quotidienne

```bash
# ✅ Tout va bien?
check() {
  echo "=== Pods Status ==="
  kubectl get pods -n production
  
  echo -e "\n=== Logs (dernières erreurs) ==="
  kubectl logs -n production --all-containers=true --tail=5 | grep -i error
  
  echo -e "\n=== Ressources ==="
  kubectl top pods -n production
  
  echo -e "\n=== Events (derniers) ==="
  kubectl get events -n production --sort-by='.lastTimestamp' | tail -3
}

check
```

---

## 🆘 SOS - Emergency Commands

### Restaurer état précédent
```bash
cd terraform
terraform destroy -auto-approve
terraform apply -auto-approve
```

### Nettoyer complètement
```bash
kubectl delete namespace production
# Recreated via Terraform
```

### Reset kubeconfig
```bash
gcloud container clusters get-credentials dgi-cluster --region us-central1 --project dgi-cosmic-20251210-1542
```

### Voir l'utilisation du projet GCP
```bash
gcloud compute project-info describe --project=dgi-cosmic-20251210-1542 --format="value(quotas[name='CPUS'].usage)"
```

---

## 📱 Format Utiles pour Scripts

### Get pod names
```bash
kubectl get pod -n production -o jsonpath='{.items[*].metadata.name}'
```

### Get pod images
```bash
kubectl get pods -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'
```

### Loop through pods
```bash
for pod in $(kubectl get pod -n production -o jsonpath='{.items[*].metadata.name}'); do
  echo "Pod: $pod"
  kubectl logs $pod -n production --tail=1
done
```

---

**⚡ Conseil:** Copier les commandes utiles dans un alias bash
```bash
alias kgp='kubectl get pods -n production'
alias klogs='kubectl logs -n production -l app=dgi-netwatch-backend --tail=50'
alias kpf='kubectl port-forward'
```
