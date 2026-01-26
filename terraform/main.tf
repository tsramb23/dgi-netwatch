resource "kubernetes_namespace" "production" {
  metadata {
    name = "production"
  }

  lifecycle {
    ignore_changes        = all
    create_before_destroy = true
  }
}

# Service backend (ClusterIP)
resource "kubernetes_service" "backend" {
  metadata {
    name      = "dgi-netwatch-backend"
    namespace = kubernetes_namespace.production.metadata[0].name
    labels = {
      app = "dgi-netwatch-backend"
    }
  }

  spec {
    selector = {
      app = "dgi-netwatch-backend"
    }

    port {
      port        = 3001
      target_port = 3001
    }

    type = "ClusterIP"
  }
}

# # Service frontend interne (ClusterIP)
# resource "kubernetes_service" "frontend_clusterip" {
#   metadata {
#     name      = "dgi-netwatch-frontend-service"
#     namespace = kubernetes_namespace.production.metadata[0].name
#     labels = {
#       app = "dgi-netwatch-frontend"
#     }
#   }

#   spec {
#     selector = {
#       app = "dgi-netwatch-frontend"
#     }

#     port {
#       port        = 80
#       target_port = 80
#     }

#     type = "ClusterIP"
#   }
# }

# Service frontend exposé (LoadBalancer)
resource "kubernetes_service" "frontend-loadbalancer" {
  metadata {
    name      = "dgi-netwatch-service"
    namespace = kubernetes_namespace.production.metadata[0].name
    labels = {
      app = "dgi-netwatch-frontend"
    }
  }

  spec {
    selector = {
      app = "dgi-netwatch-frontend"
    }

    port {
      port        = 80
      target_port = 80
    }

    type = "LoadBalancer"
  }
}