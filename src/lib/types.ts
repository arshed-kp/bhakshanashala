export type MenuItem = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string;
};

export type OrderItem = {
  itemId: number;
  qty: number;
  name?: string;
  price?: number;
  total?: number;
};

export type Order = {
  id: number;
  itemId: number;
  qty: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  items: OrderItem[];
};

export type Bill = {
  id: number;
  orderIds: number[];
  items: OrderItem[];
  total: number;
  orderStatus?: string;
  paymentStatus?: string;
};

export type CartLine = {
  itemId: number;
  name: string;
  price: number;
  image: string;
  stock: number;
  qty: number;
};

export type CreateOrderResult = {
  orderId: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  items?: OrderItem[];
};

export type ItemInput = {
  name: string;
  price: number;
  stock: number;
  image: string;
};
