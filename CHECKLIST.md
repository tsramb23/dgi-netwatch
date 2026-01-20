# ✅ Checklist de Démarrage - DGI-NetWatch

## 🎯 Avant Toute Action

### Accès & Configuration
- [ ] Vous avez kubectl installé: `kubectl version --client`
- [ ] Kubeconfig configuré: `kubectl cluster-info`
- [ ] Contexte correct: `kubectl config current-context`
- [ ] Accès au namespace: `kubectl get namespace production`
- [ ] Vous êtes dans le répertoire du projet

### Documents
- [ ] Vous avez lu [GETTING_STARTED.md](GETTING_STARTED.md)
- [ ] Vous avez repéré [QUICK_COMMANDS.md](QUICK_COMMANDS.md)
- [ ] Vous savez où est [TESTING_GUIDE.md](TESTING_GUIDE.md)
- [ ] Vous connaissez [ARCHITECTURE.md](ARCHITECTURE.md)
- [ ] Vous avez vu [IMPROVEMENTS.md](IMPROVEMENTS.md)

---

## 🟢 Phase 1: Vérification Basique (5 min)

### Étape 1: Vérifier l'état des ressources
```bash
kubectl get pods -n production
```
**Attendu:** 
- [ ] 2 pods affichés
- [ ] Column "STATUS" = "Running" pour tous
- [ ] Column "READY" = "1/1" pour tous

### Étape 2: Vérifier les logs (pas d'erreurs)
```bash
kubectl logs -n production --all-containers=true --tail=20 | grep -i error
```
**Attendu:**
- [ ] Pas d'output (ou peu d'erreurs mineurs)
- [ ] Pas d'erreurs critiques type "FATAL", "PANIC"

### Étape 3: Vérifier les services
```bash
kubectl get svc -n production
```
**Attendu:**
- [ ] 2 services affichés
- [ ] Tous en "ClusterIP"
- [ ] Ports corrects (80, 3001)

---

## 🟡 Phase 2: Test Frontend (10 min)

### Étape 1: Lancer port-forward
```bash
kubectl port-forward svc/dgi-netwatch-frontend-service 8080:80 -n production
```
**Attendu:**
- [ ] Message: "Forwarding from 127.0.0.1:8080 -> 80"
- [ ] Pas d'erreur, terminal bloqué (normal)

### Étape 2: Ouvrir dans navigateur
```
http://localhost:8080
```
**Attendu:**
- [ ] Page charge (pas blank/timeout)
- [ ] Vous voyez du HTML (inspecteur F12)
- [ ] Pas d'erreur CSS/JS majeure (console F12)
- [ ] Images/assets chargent

### Étape 3: Vérifier console navigateur
- [ ] Ouvrir DevTools: `F12` ou `Right-click > Inspect`
- [ ] Aller à "Console"
- [ ] Voir si erreurs réseau (CORS, 404, etc.)

**Actions à ce stade:**
- [ ] Frontend fonctionne ✅
- [ ] Prendre screenshot pour référence

---

## 🔵 Phase 3: Test Backend (5 min)

### Étape 1: Nouveau terminal, lancer port-forward backend
```bash
kubectl port-forward svc/dgi-netwatch-backend 3001:3001 -n production
```
**Attendu:**
- [ ] Message: "Forwarding from 127.0.0.1:3001 -> 3001"

### Étape 2: Tester endpoint de santé
```bash
curl http://localhost:3001/api/sante
```
**Attendu:**
- [ ] Réponse HTTP 200
- [ ] JSON valide en réponse
- [ ] Pas d'erreur réseau

### Étape 3: Inspecter réponse
```bash
curl -v http://localhost:3001/api/sante
```
**Attendu:**
- [ ] Status: 200 OK
- [ ] Content-Type: application/json
- [ ] Body: JSON object/string

**Actions à ce stade:**
- [ ] Backend répond ✅
- [ ] Communication fonctionne ✅

---

## 🔴 Phase 4: Test Pod-to-Pod (5 min)

### Étape 1: Créer pod de test
```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n production -- curl http://dgi-netwatch-backend:3001/api/sante
```
**Attendu:**
- [ ] Réponse HTTP 200
- [ ] JSON affiché
- [ ] Pod exit automatiquement

### Étape 2: DNS test
```bash
kubectl run -it --rm debug --image=busybox --restart=Never -n production -- nslookup dgi-netwatch-backend
```
**Attendu:**
- [ ] DNS résout correctement
- [ ] IP affichée (10.x.x.x)

**Actions à ce stade:**
- [ ] Réseau intra-cluster fonctionne ✅
- [ ] Service discovery fonctionne ✅

---

## 📊 Phase 5: Inspection Détaillée (10 min)

### Étape 1: Détails deployment backend
```bash
kubectl describe deployment dgi-netwatch-backend -n production
```
**À vérifier:**
- [ ] Replicas: 1/1 (ou plus si HPA)
- [ ] Image: ghcr.io/tsramb23/dgi-netwatch-backend:latest
- [ ] Conditions: Available=True, Progressing=True
- [ ] Pas d'événements d'erreur récents

### Étape 2: Détails deployment frontend
```bash
kubectl describe deployment dgi-netwatch-frontend -n production
```
**À vérifier:**
- [ ] Replicas: 1/1
- [ ] Image: ghcr.io/tsramb23/dgi-netwatch-frontend:latest
- [ ] Conditions OK
- [ ] Pods Ready

### Étape 3: Vérifier ressources
```bash
kubectl top pods -n production
```
**À vérifier:**
- [ ] CPU < 100m par pod
- [ ] RAM < 128Mi par pod
- [ ] Bien dans les requests configurées

### Étape 4: Vérifier probes
```bash
kubectl get pods -n production -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[*].ready}{"\n"}{end}'
```
**À vérifier:**
- [ ] Tous les pods: "true"
- [ ] Pas de "false"

---

## 🚀 Phase 6: Validation Complète (Checklist)

### Fonctionnalité
- [ ] Frontend accessible sur http://localhost:8080
- [ ] Frontend affiche une page (pas blank)
- [ ] Backend accessible sur http://localhost:3001/api/sante
- [ ] Backend retourne JSON 200 OK
- [ ] Pods communiquent entre eux
- [ ] DNS résout noms services correctement

### Performance
- [ ] Temps démarrage pods: <10 secondes
- [ ] CPU utilisé: <50m par pod
- [ ] RAM utilisé: <100Mi par pod
- [ ] Pas de crashloops ou redémarrages

### Logs & Observabilité
- [ ] Pas d'erreurs critiques dans logs
- [ ] Pas de warnings graves
- [ ] Logs accessible via kubectl logs
- [ ] Timestamps corrects

### Sécurité
- [ ] ClusterIP services (pas d'IP externe)
- [ ] Services secrets configurés (GHCR)
- [ ] Pas de credentials en clair dans env
- [ ] Pods non-root (si configuré)

### Infrastructure
- [ ] Terraform state coherent
- [ ] Namespace production isolé
- [ ] Volumes montés correctement
- [ ] Ressources limites respectées

---

## 📋 État Finalisation

### Si TOUT ✅ OK:
```
🟢 STATUT: OPÉRATIONNEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Infrastructure prête
✅ Déploiements fonctionnels
✅ Tests réussis
✅ Performance acceptable
✅ Prêt pour développement

Prochaine étape: Lire IMPROVEMENTS.md
```

### Si ERREURS trouvées:
1. **Noter l'erreur exacte** (copier-coller)
2. **Vérifier dans [TESTING_GUIDE.md](TESTING_GUIDE.md) section Troubleshooting**
3. **Voir logs détaillés:** `kubectl describe pod <POD> -n production`
4. **Chercher pattern:** `kubectl logs -n production --all-containers=true | grep ERROR`
5. **Reset si nécessaire:**
   ```bash
   cd terraform
   terraform destroy -auto-approve
   terraform apply -auto-approve
   ```

---

## 🎯 Prochaines Actions (Ordre de Priorité)

### Immédiatement (Fin Jour 1)
- [ ] Complétez cette checklist ✅
- [ ] Notez les résultats des tests
- [ ] Prenez des screenshots de succès
- [ ] Lisez [QUICK_COMMANDS.md](QUICK_COMMANDS.md)

### Jour 2-3 (Semaine 1)
- [ ] Lire [TESTING_GUIDE.md](TESTING_GUIDE.md) complet
- [ ] Faire les tests End-to-End section 9
- [ ] Valider monitoring logs
- [ ] Tester redéploiement

### Semaine 1-2
- [ ] Lire [IMPROVEMENTS.md](IMPROVEMENTS.md)
- [ ] Choisir 3 améliorations prioritaires
- [ ] Planifier implémentation
- [ ] Démarrer amélioratio #1 (Persistance BD)

### Semaine 2-4
- [ ] Implémenter améliorations selon roadmap
- [ ] Tester chaque changement
- [ ] Monitorer performance
- [ ] Documenter modifications

---

## 💾 Sauvegarde & Référence

### Commandes à Sauvegarder
```bash
# Copier dans ~/.bashrc ou ~/.zshrc

# Alias utiles
alias kgp='kubectl get pods -n production'
alias klogs='kubectl logs -n production -l app=dgi-netwatch-backend --tail=50'
alias kpf-fe='kubectl port-forward svc/dgi-netwatch-frontend-service 8080:80 -n production'
alias kpf-be='kubectl port-forward svc/dgi-netwatch-backend 3001:3001 -n production'
alias k-check='kubectl get all -n production && echo "---" && kubectl top pods -n production'

# Functions
k-logs-live() {
  kubectl logs -f -n production -l app=dgi-netwatch-$1
}
```

### URLs à Sauvegarder
```
Frontend (local): http://localhost:8080
Backend (local):  http://localhost:3001/api/sante
GCP Console:      https://console.cloud.google.com
GHCR Registry:    https://console.cloud.google.com/gcr
```

### Fichiers Clés du Projet
```
Documentation:
- GETTING_STARTED.md          ← Vous êtes ici
- QUICK_COMMANDS.md           ← Commandes rapides
- TESTING_GUIDE.md            ← Tests détaillés
- ARCHITECTURE.md             ← Vue système
- ARCHITECTURE_DIAGRAMS.md    ← Diagrammes
- IMPROVEMENTS.md             ← Roadmap
- README_PROJECT_STATUS.md    ← État global

Terraform:
- terraform/main.tf           ← Deployments + Services
- terraform/providers.tf      ← Config K8s
- terraform/variables.tf      ← Variables

Docker:
- Dockerfile.backend          ← Build backend
- Dockerfile.frontend         ← Build frontend
- Dockerfile.*.optimized      ← Versions optimisées

CI/CD:
- .github/workflows/deploy-k8s.yml  ← Pipeline déploiement
```

---

## ✨ Notes Finales

### Philosophie du Projet
- 🎯 **Minimal:** Juste ce qui faut, pas plus
- 💰 **Gratuit:** $0/mois toujours
- 🚀 **Scalable:** Améliorations sans refonte
- 📖 **Documenté:** Guides complets pour tous

### Métriques de Succès
```
✅ Tous les pods Running
✅ Pas d'erreurs critiques
✅ Frontend + Backend accessible
✅ Pod-to-pod communication OK
✅ Coût = $0/mois
```

### Support & Aide
- 📖 Lire la doc correspondante (guide complet disponible)
- 🔍 Utiliser kubectl describe pour debug
- 📝 Vérifier les logs
- 🔄 Reset complet si besoin (terraform destroy/apply)

---

## 🎉 Bravo!

Si vous avez complété cette checklist avec ✅ partout, vous avez:

```
✅ Infrastructure cloud opérationnelle
✅ Déploiements Kubernetes fonctionnels
✅ CI/CD automatisé
✅ Monitoring basique
✅ Foundation pour améliorations
= 🚀 Prêt pour développement sérieux!
```

**Prochaine étape:** Lire [QUICK_COMMANDS.md](QUICK_COMMANDS.md) et commencer avec les tests!

---

**Date de création:** 10 Janvier 2026
**Dernière mise à jour:** 10 Janvier 2026
**Statut:** ✅ À jour et testé
