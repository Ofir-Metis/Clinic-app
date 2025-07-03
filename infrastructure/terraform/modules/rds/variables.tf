variable "db_name" { description = "Database name" type = string }
variable "username" { description = "Master username" type = string }
variable "password" { description = "Master password" type = string }
variable "instance_class" { description = "RDS instance class" type = string default = "db.t3.micro" }
