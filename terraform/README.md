# Terraform Configuration for DGI-NetWatch

## Prerequisites

- Install `terraform` (>=1.0)
- Install `gcloud` CLI and authenticate with an account that has access to the existing GKE cluster
- `kubectl` is installed (or will be installed by gcloud)

## Quick Start (Local)

1. **Authenticate with GCP and configure kubectl:**
   ```bash
   gcloud auth application-default login
   gcloud config set project <PROJECT_ID>
   gcloud container clusters get-credentials dgi_cluster --region us-central1 --project <PROJECT_ID>
   ```

2. **Create `terraform.tfvars` in the `terraform/` directory:**
   ```hcl
   gcp_project_id = "your-gcp-project-id"
   gcp_region     = "us-central1"
   gke_cluster_name = "dgi_cluster"
   ```

3. **From this `terraform/` directory:**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Access the frontend locally (ClusterIP only):**
   ```bash
   kubectl port-forward svc/dgi-netwatch-frontend-service 8080:80 -n production
   ```
   Then open: http://localhost:8080

## CI/CD Pipeline (GitHub Actions)

### Setup GitHub Secrets

Add the following secrets to your repository:
- **`GCP_SA_KEY`**: Service account JSON key with GKE admin access
- **`GCP_PROJECT_ID`**: Your GCP project ID

### Workflow Configuration

The workflow automatically:
1. Authenticates to GCP using `GCP_SA_KEY`
2. Configures Terraform with GCP credentials
3. Runs `terraform plan` on PRs
4. Runs `terraform apply` on push to main branch

### Example GitHub Actions workflow snippet:
```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v1
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}

- name: Set up Cloud SDK
  uses: google-github-actions/setup-gcloud@v1

- name: Run Terraform
  working-directory: dgi-netwatch/terraform
  run: |
    terraform init
    terraform plan -var="gcp_project_id=${{ secrets.GCP_PROJECT_ID }}" -out=tfplan
    terraform apply -input=false -auto-approve tfplan
```

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
terraform destroy -var="gcp_project_id=<YOUR_PROJECT_ID>"
```
