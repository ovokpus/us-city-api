provider "aws" {
  region = var.region
  default_tags {
    tags = { app = "us-city-api", managed-by = "terraform" }
  }
}

# Default VPC keeps the example small. Use a dedicated VPC for production.
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_security_group" "app" {
  name_prefix = "uscity-app-"
  description = "us-city-api tasks"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "app_80" {
  security_group_id = aws_security_group.app.id
  description       = "load balancer to tasks"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = data.aws_vpc.default.cidr_block
}

resource "aws_vpc_security_group_ingress_rule" "app_3000" {
  security_group_id = aws_security_group.app.id
  description       = "load balancer to tasks"
  ip_protocol       = "tcp"
  from_port         = 3000
  to_port           = 3000
  cidr_ipv4         = data.aws_vpc.default.cidr_block
}

resource "aws_vpc_security_group_egress_rule" "app_all" {
  security_group_id = aws_security_group.app.id
  description       = "outbound (image pulls, database, external APIs)"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_ecs_cluster" "this" {
  name = "uscity"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_secretsmanager_secret" "dburl_node" {
  name_prefix = "uscity-dburl-node-"
}

resource "aws_secretsmanager_secret_version" "dburl_node" {
  secret_id     = aws_secretsmanager_secret.dburl_node.id
  secret_string = "postgres://${module.db.user}:${module.db.password}@${module.db.host}:5432/${module.db.database}?sslmode=no-verify"
}

module "ecr" {
  source = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/aws/ecr?ref=tf-modules-v0.1.0"
  prefix = "uscity"
  names  = ["api", "frontend"]
}

module "db" {
  source                = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/aws/rds-postgres?ref=tf-modules-v0.1.0"
  name                  = "uscity-pg"
  database              = "cities"
  user                  = "cities"
  vpc_id                = data.aws_vpc.default.id
  subnet_ids            = data.aws_subnets.default.ids
  app_security_group_id = aws_security_group.app.id
}

module "api" {
  source             = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/aws/express-service?ref=tf-modules-v0.1.0"
  name               = "uscity-api"
  cluster            = aws_ecs_cluster.this.name
  image              = "${module.ecr.repository_urls["api"]}:${var.image_tag}"
  port               = 3000
  health_path        = "/health"
  subnet_ids         = data.aws_subnets.default.ids
  security_group_ids = [aws_security_group.app.id]
  env = {
    PORT = "3000"
  }
  secret_env = {
    DATABASE_URL = aws_secretsmanager_secret.dburl_node.arn
  }
}

module "frontend" {
  source             = "git::https://github.com/ovokpus/GKE-Cluster-Management.git//terraform/modules/aws/express-service?ref=tf-modules-v0.1.0"
  name               = "uscity-frontend"
  cluster            = aws_ecs_cluster.this.name
  image              = "${module.ecr.repository_urls["frontend"]}:${var.image_tag}"
  port               = 80
  health_path        = "/"
  subnet_ids         = data.aws_subnets.default.ids
  security_group_ids = [aws_security_group.app.id]
  env = {
    API_UPSTREAM = module.api.url
  }
  secret_env = {}
}
