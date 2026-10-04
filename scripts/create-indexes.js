const salesDb = db.getSiblingDB("sales_lab");

salesDb.orders.createIndex(
  { status: 1, orderDate: 1 },
  { name: "idx_orders_status_orderDate" }
);

salesDb.payments.createIndex(
  { orderId: 1 },
  { name: "idx_payments_orderId" }
);

salesDb.payments.createIndex(
  { status: 1, paymentDate: 1 },
  { name: "idx_payments_status_paymentDate" }
);

salesDb.inventory.createIndex(
  { warehouseId: 1, quantity: 1 },
  { name: "idx_inventory_warehouseId_quantity" }
);

salesDb.returns.createIndex(
  { returnDate: 1 },
  { name: "idx_returns_returnDate" }
);