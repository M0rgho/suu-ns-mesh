export interface MenuItem {
  id: number;
  name: string;
  price: number;
  available: boolean;
}

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: "created" | "preparing" | "ready" | "delivering" | "delivered";
  createdAt: Date;
}

export interface Delivery {
  orderId: string;
  status: "pending" | "dispatched" | "in_transit" | "delivered";
  driverId?: string;
  estimatedDeliveryTime?: Date;
}

export interface RestaurantOrderStatus {
  orderId: string;
  status: "preparing" | "ready" | "not_found";
}
