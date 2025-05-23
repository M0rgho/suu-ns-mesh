import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import { config } from './config';

const jsonErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message || err });
};

const app = express();
const port = config.port;

import './tracing';

app.use(cors());
app.use(express.json());
app.use(jsonErrorHandler);
interface MenuItem {
  id: number;
  name: string;
  price: number;
  available: boolean;
}

interface OrderItem {
  name: string;
  quantity: number;
}

interface OrderStatus {
  [key: string]: 'preparing' | 'ready' | 'not_found';
}

// In-memory storage for demo purposes
const menu: MenuItem[] = [
  { id: 1, name: 'Pizza', price: 12.99, available: true },
  { id: 2, name: 'Burger', price: 8.99, available: true },
  { id: 3, name: 'Salad', price: 6.99, available: true },
];

const inventory: { [key: string]: number } = {
  Pizza: 10,
  Burger: 15,
  Salad: 20,
};

const orderStatus: OrderStatus = {};

// Get menu
app.get('/api/restaurant/menu', (_req: Request, res: Response) => {
  res.json(menu);
});

// Get inventory
app.get('/api/restaurant/inventory', (_req: Request, res: Response) => {
  res.json(inventory);
});

// Prepare order
app.post('/api/restaurant/prepare-order', (req: Request, res: Response) => {
  const { orderId, items } = req.body as {
    orderId: string;
    items: OrderItem[];
  };

  if (!orderId || !items) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Update inventory
  // Check if we have enough inventory first
  items.forEach((item) => {
    if (!inventory[item.name] || inventory[item.name] < item.quantity) {
      return res.status(400).json({ error: `Not enough ${item.name} in inventory` });
    }
  });

  // Only update inventory after validating quantities
  items.forEach((item) => {
    inventory[item.name] -= item.quantity;
  });

  // Set order status
  orderStatus[orderId] = 'preparing';

  // Simulate preparation time
  setTimeout(async () => {
    orderStatus[orderId] = 'ready';

    // Notify delivery service that order is ready
    try {
      await axios.post(`${config.deliveryServiceUrl}/api/delivery/dispatch`, {
        orderId,
      });
      console.log(`Notified delivery service for order ${orderId}`);
    } catch (error) {
      console.error('Error notifying delivery service:', error);
    }
  }, 5000);

  res.json({ message: 'Order preparation started', orderId });
});

// Get order status
app.get('/api/restaurant/status/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const status = orderStatus[orderId] || 'not_found';
  res.json({ orderId, status });
});

app.listen(port, () => {
  console.log(`Restaurant service listening on port ${port}`);
});
