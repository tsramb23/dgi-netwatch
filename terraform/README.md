# Terraform Configuration for DGI-NetWatch

## Prerequisites

- Install `terraform` (>=1.0)
- Install `gcloud` CLI and authenticate with an account that has access to the existing GKE cluster
- `kubectl` is installed (or will be installed by gcloud)

## Quick Start (Local)

1. **Authenticate with GCP and configure kubectl:**
   ```bash
   gcloud auth login
   gcloud config set project <PROJECT_ID>
   gcloud container clusters get-credentials dgi_cluster --region us-central1 --project <PROJECT_ID>
   ```

2. **From this `terraform/` directory:**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

3. **Access the frontend locally (ClusterIP only):**
   ```bash
   kubectl port-forward svc/dgi-netwatch-frontend-service 8080:80 -n production
   ```
   Then open: http://localhost:8080

## CI/CD Pipeline (GitHub Actions)

Two workflows are configured:
- **`terraform.yml`** (PR-friendly): Runs `terraform plan` on pull requests to review changes
- **`terraform.yml`** (on main): Runs `terraform apply` automatically on push to `main` branch

Both workflows:
1. Authenticate to GCP using `secrets.GCP_SA_KEY`
2. Configure `kubectl` via `gcloud container clusters get-credentials`
3. Run Terraform with kubeconfig from the runner's working directory

## Cost Control & Free Tier Optimization

✅ **What we're doing to stay within free limits:**
- Frontend & Backend services use `type = "ClusterIP"` (no external LoadBalancer IP = no cost)
- Single replica per deployment (`replicas = 1`)
- Minimal resource requests: `100m` CPU, `128Mi` RAM
- `emptyDir` volume (ephemeral, no persistent storage costs)
- GKE Autopilot mode (node management is bundled/free for low usage)

⚠️ **What would cost money (avoid):**
- Changing frontend service to `LoadBalancer` (external IP provisioning)
- Adding persistent volumes (PV/PVC)
- Scaling to multiple replicas
- Using premium node types

## Troubleshooting

**Check deployment status:**
```bash
kubectl get deployments -n production
kubectl get pods -n production
kubectl logs -n production -l app=dgi-netwatch-backend
kubectl logs -n production -l app=dgi-netwatch-frontend
```

**Check services:**
```bash
kubectl get svc -n production
```

**Destroy all resources (clean up):**
```bash
terraform destroy
```
