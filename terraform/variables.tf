variable "kubeconfig_path" {
  description = "Path to kubeconfig file with access to the GKE cluster (default: ~/.kube/config)."
  type        = string
  default     = "~/.kube/config"
}
