import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import { config } from './config';

const app = express();
const port = config.port;

// Service URLs with fallbacks for local development

const jsonErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).send({ error: err });
};

app.use(cors());
app.use(express.json());
app.use(jsonErrorHandler);
interface Delivery {
  orderId: string;
  status: 'pending' | 'dispatched' | 'in_transit' | 'delivered';
  driverId?: string;
  estimatedDeliveryTime?: Date;
}

// In-memory storage for demo purposes
const deliveries: { [key: string]: Delivery } = {};

// Dispatch delivery
app.post('/api/delivery/dispatch', async (req: Request, res: Response) => {
  const { orderId } = req.body as { orderId: string };

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    // Check order status from orders service
    const orderStatus = await axios.get(`${config.ordersServiceUrl}/api/orders/${orderId}`);

    if (orderStatus.data.status !== 'ready') {
      return res.status(400).json({ error: 'Order is not ready for delivery' });
    }

    const delivery: Delivery = {
      orderId,
      status: 'dispatched',
      driverId: `DRIVER-${Math.floor(Math.random() * 1000)}`,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
    };

    deliveries[orderId] = delivery;

    // Simulate delivery time
    setTimeout(() => {
      if (deliveries[orderId]) {
        deliveries[orderId].status = 'in_transit';

        setTimeout(() => {
          if (deliveries[orderId]) {
            deliveries[orderId].status = 'delivered';
          }
        }, 15 * 1000); // 15 seconds later
      }
    }, 5 * 1000); // 5 seconds later

    res.status(201).json(delivery);
  } catch (error) {
    console.error('Error dispatching delivery:', error);
    res.status(500).json({ error: 'Failed to dispatch delivery' });
  }
});

app.get('/api/delivery/status/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const delivery = deliveries[orderId];

  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found' });
  }

  res.json(delivery);
});

app.listen(port, () => {
  console.log(`Delivery service listening on port ${port}`);
  console.log(`Using orders service at: ${config.ordersServiceUrl}`);
});
