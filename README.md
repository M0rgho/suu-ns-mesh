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
# Build restaurant service
docker build -f services/Dockerfile -t restaurant-service:latest --build-arg SERVICE=restaurant .

# Build orders service
docker build -f services/Dockerfile -t orders-service:latest  --build-arg SERVICE=orders .

# Build delivery service
docker build -f services/Dockerfile -t delivery-service:latest  --build-arg SERVICE=delivery .
```

To run a service:
```bash
# Run restaurant service
docker run -p 3001:3001 --env-file .env.docker-local restaurant-service:latest 

# Run orders service
docker run -p 3002:3002 --env-file .env.docker-local orders-service:latest

# Run delivery service
docker run -p 3003:3003 --env-file .env.docker-local delivery-service:latest
```

### Kubernetes
TODO


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

![architecture](images/overview.png 'Microservice architecture')
![architecture](https://github.com/grafana/docker-otel-lgtm/blob/main/img/overview.png,)
