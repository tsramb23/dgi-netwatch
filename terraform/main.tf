resource "kubernetes_namespace" "production" {
  metadata {
    name = "production"
  }

  lifecycle {
    ignore_changes = all
    create_before_destroy = true
  }

  depends_on = []
}

resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "dgi-netwatch-backend"
    namespace = kubernetes_namespace.production.metadata[0].name
    labels = {
      app = "dgi-netwatch-backend"
    }
  }

  lifecycle {
    ignore_changes = [spec]
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "dgi-netwatch-backend"
      }
    }

    template {
      metadata {
        labels = {
          app = "dgi-netwatch-backend"
        }
      }

      spec {
        image_pull_secrets {
          name = "ghcr-secret"
        }
        container {
          name  = "backend"
          image = "ghcr.io/tsramb23/dgi-netwatch-backend:latest"
          image_pull_policy = "Always"

          port {
            container_port = 3001
          }

          liveness_probe {
            tcp_socket {
              port = 3001
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            failure_threshold     = 3
          }

          readiness_probe {
            tcp_socket {
              port = 3001
            }
            initial_delay_seconds = 5
            period_seconds        = 5
            failure_threshold     = 3
          }

          env {
            name  = "NODE_ENV"
            value = "production"
          }

          env {
            name  = "DB_PATH"
            value = "/app/db/surveillance.db"
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
          }

          volume_mount {
            name       = "db-volume"
            mount_path = "/app/db"
          }
        }

        volume {
          name = "db-volume"
          empty_dir {}
        }
      }
    }
  }
}

resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "dgi-netwatch-frontend"
    namespace = kubernetes_namespace.production.metadata[0].name
    labels = {
      app = "dgi-netwatch-frontend"
    }
  }

  lifecycle {
    ignore_changes = [spec]
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "dgi-netwatch-frontend"
      }
    }

    template {
      metadata {
        labels = {
          app = "dgi-netwatch-frontend"
        }
      }

      spec {
        image_pull_secrets {
          name = "ghcr-secret"
        }
        container {
          name  = "frontend"
          image = "ghcr.io/tsramb23/dgi-netwatch-frontend:latest"
          image_pull_policy = "Always"

          port {
            container_port = 80
          }

          liveness_probe {
            tcp_socket {
              port = 80
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            failure_threshold     = 3
          }

          readiness_probe {
            tcp_socket {
              port = 80
            }
            initial_delay_seconds = 5
            period_seconds        = 5
            failure_threshold     = 3
          }

          env {
            name  = "REACT_APP_API_URL"
            value = "http://dgi-netwatch-backend:3001"
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
          }
        }
      }
    }
  }
}

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
      app = kubernetes_deployment.backend.metadata[0].labels["app"]
    }

    port {
      port        = 3001
      target_port = 3001
    }

    type = "ClusterIP"
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "dgi-netwatch-frontend-service"
    namespace = kubernetes_namespace.production.metadata[0].name
    labels = {
      app = "dgi-netwatch-frontend"
    }
  }

  spec {
    selector = {
      app = kubernetes_deployment.frontend.metadata[0].labels["app"]
    }

    port {
      port        = 80
      target_port = 80
    }

    type = "ClusterIP"
  }
}
