variable "REGISTRY" {
  default = ""
}

variable "VERSION" {
  default = "latest"
}

variable "NODE_VERSION" {
  default = "20-alpine"
}

group "default" {
  targets = ["api_gateway", "bff_portal", "portal_app", "drc_service"]
}

target "base" {
  context = "."
}

target "api_gateway" {
  inherits = ["base"]
  dockerfile = "Dockerfile.api-gateway"
  args = {
    NODE_VERSION = NODE_VERSION
  }
  tags = ["${REGISTRY}api-gateway:${VERSION}"]
}

target "bff_portal" {
  inherits = ["base"]
  dockerfile = "Dockerfile.bff-portal"
  args = {
    NODE_VERSION = NODE_VERSION
  }
  tags = ["${REGISTRY}bff-portal:${VERSION}"]
}

target "portal_app" {
  inherits = ["base"]
  dockerfile = "Dockerfile.portal"
  args = {
    NODE_VERSION = NODE_VERSION
  }
  tags = ["${REGISTRY}portal:${VERSION}"]
}

target "drc_service" {
  inherits = ["base"]
  dockerfile = "Dockerfile.drc"
  tags = ["${REGISTRY}drc:${VERSION}"]
}
