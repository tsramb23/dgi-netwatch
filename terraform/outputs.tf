output "frontend_service_name" {
  value = kubernetes_service.frontend_loadbalancer.metadata[0].name
}


output "backend_service_name" {
  value = kubernetes_service.backend.metadata[0].name
}
