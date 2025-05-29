FROM node:20-alpine

ARG SERVICE
ARG SERVICE_DIR=services/${SERVICE}

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

COPY ${SERVICE_DIR} ./${SERVICE_DIR}

RUN npm install

WORKDIR /app/${SERVICE_DIR}
RUN npm run build

WORKDIR /app/${SERVICE_DIR}
ENTRYPOINT ["node", "dist/index.js"]
