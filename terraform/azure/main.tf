provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "this" {
  name     = "rg-uscity"
  location = var.location
}

module "acr" {
  source              = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/azure/acr?ref=tf-modules-v0.1.0"
  resource_group_name = azurerm_resource_group.this.name
  location            = var.location
  name                = "${var.name_prefix}acr"
}

module "env" {
  source              = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/azure/container-apps-env?ref=tf-modules-v0.1.0"
  resource_group_name = azurerm_resource_group.this.name
  location            = var.location
  name                = "cae-uscity"
  acr_id              = module.acr.id
}

module "db" {
  source              = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/azure/postgres-flexible?ref=tf-modules-v0.1.0"
  resource_group_name = azurerm_resource_group.this.name
  location            = var.location
  name                = "${var.name_prefix}-pg"
  database            = "cities"
  admin_user          = "cities"
}

module "api" {
  source              = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/azure/container-app?ref=tf-modules-v0.1.0"
  resource_group_name = azurerm_resource_group.this.name
  name                = "uscity-api"
  environment_id      = module.env.id
  identity_id         = module.env.identity_id
  registry_server     = module.acr.login_server
  image               = "${module.acr.login_server}/api:${var.image_tag}"
  port                = 3000
  env = {
    PORT = "3000"
  }
  secret_env = {
    DATABASE_URL = "postgres://${module.db.user}:${module.db.password}@${module.db.host}:5432/${module.db.database}?sslmode=no-verify"
  }
}

module "frontend" {
  source              = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/azure/container-app?ref=tf-modules-v0.1.0"
  resource_group_name = azurerm_resource_group.this.name
  name                = "uscity-frontend"
  environment_id      = module.env.id
  identity_id         = module.env.identity_id
  registry_server     = module.acr.login_server
  image               = "${module.acr.login_server}/frontend:${var.image_tag}"
  port                = 80
  env = {
    API_UPSTREAM = module.api.url
  }
  secret_env = {}
}
