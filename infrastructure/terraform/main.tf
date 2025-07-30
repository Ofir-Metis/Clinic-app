terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.region
}

# The following modules are placeholders and are not currently in use.
# module "ecs" {
#   source = "./modules/ecs" # placeholder
# }

# module "documentdb" {
#   source = "./modules/documentdb" # placeholder
# }

# module "s3" {
#   source = "./modules/s3" # placeholder
# }
