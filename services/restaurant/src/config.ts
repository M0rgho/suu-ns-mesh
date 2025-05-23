import dotenv from 'dotenv';

dotenv.config();

export const config = {
  serviceName: 'restaurant-service',
  serviceVersion: '1.0.0',
  port: process.env.PORT || 3001,

  ordersServiceUrl: process.env.ORDERS_SERVICE_URL || 'http://localhost:3002',
  restaurantServiceUrl: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3001',
  deliveryServiceUrl: process.env.DELIVERY_SERVICE_URL || 'http://localhost:3003',
  monitoring: {
    tracesUrl: process.env.TRACES_URL || 'http://localhost:4317',
    metricsUrl: process.env.METRICS_URL || 'http://localhost:4317',
    logsUrl: process.env.LOGS_URL || 'http://localhost:4317',
  },
};
