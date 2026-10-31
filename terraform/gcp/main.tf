provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "secretmanager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

resource "google_secret_manager_secret" "dburl_node" {
  secret_id = "uscity-dburl-node"
  replication {
    auto {}
  }
  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "dburl_node" {
  secret      = google_secret_manager_secret.dburl_node.id
  secret_data = "postgres://${module.db.user}:${module.db.password}@${module.db.private_ip}:5432/${module.db.database}?sslmode=no-verify"
}

module "registry" {
  source        = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/gcp/artifact-registry?ref=tf-modules-v0.1.0"
  project_id    = var.project_id
  region        = var.region
  repository_id = "uscity"
}

module "network" {
  source     = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/gcp/network?ref=tf-modules-v0.1.0"
  project_id = var.project_id
  region     = var.region
  name       = "uscity"
}

module "db" {
  source                      = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/gcp/cloud-sql-postgres?ref=tf-modules-v0.1.0"
  project_id                  = var.project_id
  region                      = var.region
  name                        = "uscity-pg"
  network_id                  = module.network.network_id
  private_services_connection = module.network.private_services_connection
  database                    = "cities"
  user                        = "cities"
}

module "api" {
  source      = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/gcp/cloud-run-service?ref=tf-modules-v0.1.0"
  project_id  = var.project_id
  region      = var.region
  name        = "uscity-api"
  image       = "${module.registry.repository_url}/api:${var.image_tag}"
  port        = 3000
  memory      = "512Mi"
  health_path = "/health"
  vpc         = { network = module.network.network_id, subnet = module.network.subnet_id }
  env = {
    PORT = "3000"
  }
  secret_env = {
    DATABASE_URL = google_secret_manager_secret.dburl_node.secret_id
  }
}

module "frontend" {
  source      = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/gcp/cloud-run-service?ref=tf-modules-v0.1.0"
  project_id  = var.project_id
  region      = var.region
  name        = "uscity-frontend"
  image       = "${module.registry.repository_url}/frontend:${var.image_tag}"
  port        = 80
  memory      = "512Mi"
  health_path = "/"
  env = {
    API_UPSTREAM = module.api.url
  }
  secret_env = {}
}
