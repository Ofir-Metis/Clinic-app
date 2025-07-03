terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.region
}

# ECS Fargate module stub
module "ecs" {
  source = "./modules/ecs" # placeholder
}

# DocumentDB module stub
module "documentdb" {
  source = "./modules/documentdb" # placeholder
}

# S3 module stub
module "s3" {
  source = "./modules/s3" # placeholder
}
