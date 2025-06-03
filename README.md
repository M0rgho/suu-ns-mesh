# NS Mesh Microservices Demo

This project demonstrates a simple food delivery system using three microservices connected through **Network Service Mesh (NSM)**:

- Restaurant Service
- Orders Service  
- Delivery Service

## Architecture

![architecture](images/image.png 'Microservice architecture')

The services are designed to run in separate Kubernetes namespaces and communicate through **Network Service Mesh**, which provides secure, intent-based connectivity for cloud native applications.

### Network Service Mesh Overview

Network Service Mesh (NSM) is a novel approach to solving complicated L2/L3 use cases in Kubernetes that are traditionally handled by CNI plugins. It provides:

- **Cross-namespace connectivity** - Services can communicate securely across namespace boundaries
- **Zero-trust networking** - All connections are authenticated and authorized
- **Service discovery** - Dynamic discovery and connection of network services
- **Policy enforcement** - Fine-grained network policies at the service level

### NSM Architecture in This Demo

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Orders NS     │    │  Restaurant NS  │    │   Delivery NS   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Orders Service│◄┼────┼►│Restaurant   │ │    │ │Delivery     │ │
│ │             │ │    │ │Service      │◄┼────┼►│Service      │ │
│ │  (NSM Client)│ │    │ │(NSM Endpoint│ │    │ │(NSM Endpoint│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   NSM System    │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │NSM Registry │ │
                    │ │             │ │
                    │ │NSM Manager  │ │
                    │ └─────────────┘ │
                    └─────────────────┘
```

### Services

#### Restaurant Service

- Manages menu and inventory
- Handles food preparation
- Endpoints:
  - POST /api/restaurant/prepare-order
  - GET /api/restaurant/menu
  - GET /api/restaurant/inventory
  - GET /api/restaurant/status/{orderID}

#### Orders Service

- Manages order creation and tracking
- Endpoints:
  - POST /api/orders
  - GET /api/orders/{orderID}

#### Delivery Service

- Handles order delivery
- Endpoints:
  - POST /api/delivery/dispatch
  - GET /api/delivery/status/{orderID}

## Setup

### Prerequisites

1. **Kubernetes cluster** ([minikube](https://minikube.sigs.k8s.io/docs/handbook/controls/))
2. **kubectl** configured to access your cluster

### Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Start all services locally:

```bash
npm run start
```

## Network Service Mesh Deployment

### Step 0: Start Minikube

If you are using Minikube, start it with the following command:

```bash
minikube start
```

### Step 1: Install NSM System Components

First, install the Network Service Mesh infrastructure:

```bash
# Install NSM system components (registry, manager, etc.)
kubectl apply -f k8s/nsm-install.yaml
```

Wait for NSM components to be ready:

```bash
kubectl wait --for=condition=ready pod -l app=nsm-registry -n nsm-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=nsm-node -n nsm-system --timeout=300s
```

### Step 2: Create Namespaces

Create the isolated namespaces for each service:

```bash
kubectl apply -f k8s/namespaces.yaml
```

### Step 3: Deploy Shared Configuration

Deploy the shared configuration that includes NSM-aware service URLs:

```bash
# Apply shared config to all service namespaces
kubectl apply -f k8s/shared-config.yaml -n restaurant-ns
kubectl apply -f k8s/shared-config.yaml -n orders-ns  
kubectl apply -f k8s/shared-config.yaml -n delivery-ns
kubectl apply -f k8s/shared-config.yaml -n otel-ns
```

### Step 4: Deploy Network Services and Endpoints

Configure the NSM network services and endpoints:

```bash
kubectl apply -f k8s/nsm-services.yaml
kubectl apply -f k8s/nsm-clients.yaml
```

### Step 5: Build and Load Container Images

Build the microservice images:

```bash
# For minikube (builds inside minikube's Docker daemon)
./build-containers.sh

# Or manually load pre-built images
minikube image load restaurant-service:latest
minikube image load orders-service:latest  
minikube image load delivery-service:latest
```

### Step 6: Deploy Microservices

Deploy the services with NSM annotations:

```bash
kubectl apply -f k8s/restaurant.yaml
kubectl apply -f k8s/orders.yaml
kubectl apply -f k8s/delivery.yaml
kubectl apply -f k8s/otel-lgtm.yaml
```

### Step 7: Verify NSM Connectivity

Check that services are registered and connected:

```bash
# Check NSM registry
kubectl logs -n nsm-system -l app=nsm-registry

# Check network service endpoints
kubectl get networkserviceendpoints -A

# Check network service clients  
kubectl get networkserviceclients -A

# Verify pod annotations
kubectl get pods -n restaurant-ns -o yaml | grep networkservicemesh
kubectl get pods -n orders-ns -o yaml | grep networkservicemesh
kubectl get pods -n delivery-ns -o yaml | grep networkservicemesh
```

## Traditional Kubernetes vs NSM Deployment

### Without NSM (Traditional)

- Services communicate via Kubernetes Services and Ingress
- Cross-namespace communication requires RBAC and network policies
- Limited security and observability
- Static network configuration

### With NSM

- Services discover and connect dynamically through NSM registry
- Zero-trust networking with automatic mTLS
- Fine-grained network policies at service level
- Enhanced observability and tracing of network connections
- Intent-based networking - services declare what they need

## Access and Testing

### Port Forwarding for External Access

**Grafana (Monitoring Dashboard)**

```bash
kubectl port-forward -n otel-ns svc/otel-lgtm-external 3000:3000
```

**Orders Service (API Testing)**

```bash
kubectl port-forward -n orders-ns service/orders-service 3001:3000
```

**Restaurant Service**

```bash
kubectl port-forward -n restaurant-ns service/restaurant-service 3002:3000
```

**Delivery Service**

```bash
kubectl port-forward -n delivery-ns service/delivery-service 3003:3000
```

### Additional Notes  

- Cluster LoadBalancer services in Minikube are **not exposed externally by default**.  
- Alternatively, you can access load balancers using Minikube tunnel:  

  ```bash
  minikube tunnel
  ```

  See: <https://minikube.sigs.k8s.io/docs/commands/tunnel/>

## Sample requests

Create a request in orders service to generate traces:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"items": [{"name": "Pizza", "quantity": 1}]}' \
  http://localhost:3001/api/orders
```

## OTLP Monitoring

This project uses <https://github.com/grafana/docker-otel-lgtm> which contains the entire monitoring stack:

- Grafana
- Tempo
- Prometheus
- Loki

Run it with:

```bash
docker run -p 3000:3000 -p 4317:4317 -p 4318:4318 grafana/otel-lgtm
```

Or in kubernetes:

```bash
kubectl apply -f k8s/otel-lgtm.yaml
```

![architecture](images/overview.png 'Microservice architecture')
![architecture](https://github.com/grafana/docker-otel-lgtm/blob/main/img/overview.png,)
