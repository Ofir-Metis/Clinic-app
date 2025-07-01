# Terraform configuration stub

terraform {
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.region
}

variable "region" {
  description = "AWS region"
  type        = string
}
