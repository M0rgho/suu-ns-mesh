import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosError } from 'axios';
import { config } from './config';

const app = express();
const port = config.port;

import './tracing';

const jsonErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).send({ error: err });
};

app.use(cors());
app.use(express.json());
app.use(jsonErrorHandler);
interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: 'created' | 'preparing' | 'ready' | 'delivering' | 'delivered';
  createdAt: Date;
}

// In-memory storage for demo purposes
const orders: { [key: string]: Order } = {};

// Create new order
app.post('/api/orders', async (req: Request, res: Response) => {
  const { items } = req.body as { items: OrderItem[] };

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid order items' });
  }

  const orderId = uuidv4().slice(0, 8);
  const order: Order = {
    id: orderId,
    items,
    status: 'created',
    createdAt: new Date(),
  };

  orders[orderId] = order;

  try {
    // Notify restaurant service to prepare the order
    await axios.post(`${config.restaurantServiceUrl}/api/restaurant/prepare-order`, {
      orderId,
      items,
    });

    order.status = 'preparing';
    res.status(201).json(order);
  } catch (error: any) {
    console.error('Error notifying restaurant service:', error);
    res.status(500).json({ error: 'Failed to process order: ' + error.response.data.error });
  }
});

// Get order by ID
app.get('/api/orders/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = orders[orderId];

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  try {
    // Get current status from restaurant service
    const restaurantStatus = await axios.get(`${config.restaurantServiceUrl}/api/restaurant/status/${orderId}`);

    // Update order status based on restaurant status
    if (restaurantStatus.data.status === 'ready') {
      order.status = 'ready';
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.json(order); // Return order with last known status
  }
});

app.listen(port, () => {
  console.log(`Orders service listening on port ${port}`);
  console.log(`Using restaurant service at: ${config.restaurantServiceUrl}`);
});
