#!/bin/bash

set -euxo pipefail

eval $(minikube docker-env)

docker build -f services/Dockerfile -t restaurant-service:latest --build-arg SERVICE=restaurant .
docker build -f services/Dockerfile -t orders-service:latest --build-arg SERVICE=orders .
docker build -f services/Dockerfile -t delivery-service:latest --build-arg SERVICE=delivery .