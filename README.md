# NS Mesh Microservices Demo

This project demonstrates a simple food delivery system using three microservices:

- Restaurant Service
- Orders Service
- Delivery Service

## Architecture

![architecture](images/image.png 'Microservice architecture')

The services are designed to run in separate Kubernetes namespaces and communicate through NS Mesh (Network Service Mesh).

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

1. Install dependencies:

```bash
npm install
```

2. Start all services locally:

```bash
npm run start
```

## Containerized Deployment

### Docker Images

Create microservice images:

```bash
docker build -f services/Dockerfile -t restaurant-service:latest --build-arg SERVICE=restaurant .

docker build -f services/Dockerfile -t orders-service:latest  --build-arg SERVICE=orders .

docker build -f services/Dockerfile -t delivery-service:latest  --build-arg SERVICE=delivery .
```

Run them with:
```bash
docker run -p 3001:3001 --env-file .env.docker-local restaurant-service:latest 

docker run -p 3002:3002 --env-file .env.docker-local orders-service:latest

docker run -p 3003:3003 --env-file .env.docker-local delivery-service:latest
```

### Kubernetes 
1. Install minikube

Follow the official guide here:  
https://minikube.sigs.k8s.io/docs/handbook/controls/

2. Start minikube
```bash
minikube start
```
3. Load Pre-Built Containers into minikube
```bash
minikube image load restaurant-service
minikube image load orders-service
minikube image load delivery-service
```
Alternatively, build the containers **inside** Minikube with script:
```bash
./build-containers.sh
```
4. Deploy all services
```bash
kubectl apply -f k8s/
```
5. Expose Ports for Access

**Grafana**
```bash
kubectl port-forward -n otel-ns svc/otel-lgtm-external 3000:3000
```

**Orders Service**
```bash
kubectl port-forward service/orders-service 3001:3000
```
### Additional Notes  
- Cluster LoadBalancer services in Minikube are **not exposed externally by default**.  
- Alternatively, you can access load balancers using Minikube tunnel:  
  ```bash
  minikube tunnel
  ```
  See: https://minikube.sigs.k8s.io/docs/commands/tunnel/

## Sample requests

Create a request in orders service to generate traces:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"items": [{"name": "Pizza", "quantity": 1}]}' \
  http://localhost:3001/api/orders
```

## OTLP Monitoring

This project uses https://github.com/grafana/docker-otel-lgtm which contains the entire monitoring stack:

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
