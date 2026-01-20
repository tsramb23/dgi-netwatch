# No variables required - Kubernetes provider uses kubeconfig from gcloud
# Pass these via -var flags in the workflow for documentation purposes only
variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "dgi-cosmic-20251210-1542"
}

variable "gcp_region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "cluster_name" {
  description = "GKE Cluster Name"
  type        = string
  default     = "dgi-netwatch-cluster"
}