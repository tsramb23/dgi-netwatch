terraform {
  required_version = ">= 1.0.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Provider Google (pour info du cluster)
provider "google" {
  project = "dgi-cosmic-20251210-1542"
  region  = "us-central1"
}

# Provider Kubernetes (utilise la config générée par gcloud)
provider "kubernetes" {
  config_path = "~/.kube/config"
}