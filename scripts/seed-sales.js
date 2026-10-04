const salesDb = db.getSiblingDB("sales_lab");

let randomState = 2026;

function random() {
  randomState = (
    Math.imul(1664525, randomState) + 1013904223
  ) >>> 0;
  return randomState / 4294967296;
}

function integer(min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function pick(values) {
  return values[integer(0, values.length - 1)];
}

function id(prefix, number, width = 6) {
  return `${prefix}-${String(number).padStart(width, "0")}`;
}

const DAY = 86400000;
const START = Date.UTC(2026, 3, 1);
const END = Date.UTC(2026, 9, 1);
const SEPTEMBER = Date.UTC(2026, 8, 1);

function writeDocuments(collection, documents) {
  for (let offset = 0; offset < documents.length; offset += 1000) {
    collection.bulkWrite(
      documents.slice(offset, offset + 1000).map(document => ({
        replaceOne: {
          filter: { _id: document._id },
          replacement: document,
          upsert: true
        }
      }))
    );
  }
}

// Load customers in a stable order.
const customers = salesDb.customers.find({}).sort({ _id: 1 }).toArray();

if (customers.length !== 1000) {
  throw new Error("Seed the 1,000 customers before running this script.");
}

const categories = [
  "ELECTRONICS",
  "OFFICE",
  "HOME",
  "SPORTS",
  "APPAREL"
];

const brands = ["Northstar", "Harbor", "Summit", "Maple"];
const warehouses = ["WH-WEST", "WH-EAST"];

// 1. PRODUCTS: 200 products, 40 per category.
const products = [];

for (let i = 1; i <= 200; i++) {
  const category = categories[(i - 1) % categories.length];
  const priceCents = integer(1000, 50000);

  products.push({
    _id: id("PROD", i, 4),
    name: `${category} Product ${i}`,
    category,
    brand: brands[Math.floor((i - 1) / 5) % brands.length],
    currency: "USD",
    priceCents,
    unitCostCents: Math.round(priceCents * integer(40, 75) / 100),
    status: "ACTIVE"
  });
}

writeDocuments(salesDb.products, products);

// 2. ORDERS: 20,000 orders with embedded line items.
const orders = [];

// These customers stop ordering in September.
const dormantCustomerIds = new Set(
  customers.slice(0, 100).map(customer => customer._id)
);

for (let i = 1; i <= 20000; i++) {
  // Deliberately fewer September orders.
  const orderMillis = random() < 0.12
    ? integer(SEPTEMBER, END - 1)
    : integer(START, SEPTEMBER - 1);

  const september = orderMillis >= SEPTEMBER;

  const eligibleCustomers = september
    ? customers.slice(100)
    : customers;

  const customer = pick(eligibleCustomers);

  // Electronics demand falls during September.
  const eligibleProducts = september
    ? products.filter(product => product.category !== "ELECTRONICS")
    : products;

  const itemCount = integer(1, 5);
  const chosenProductIds = new Set();
  const items = [];

  for (let line = 1; line <= itemCount; line++) {
    let product;

    do {
      product = pick(
        september && random() < 0.10 ? products : eligibleProducts
      );
    } while (chosenProductIds.has(product._id));

    chosenProductIds.add(product._id);

    const quantity = integer(
      1,
      customer.segment === "ENTERPRISE" ? 10 : 4
    );

    const grossCents = product.priceCents * quantity;
    const discountPercent = pick([0, 0, 0, 5, 10, 15]);
    const discountCents = Math.round(
      grossCents * discountPercent / 100
    );

    items.push({
      lineId: `LINE-${line}`,
      productId: product._id,
      quantity,
      unitPriceCents: product.priceCents,
      unitCostCents: product.unitCostCents,
      discountCents,
      lineTotalCents: grossCents - discountCents
    });
  }

  const statusValue = random();
  const status = statusValue < 0.88
    ? "COMPLETED"
    : statusValue < 0.95 ? "CANCELLED" : "PENDING";

  orders.push({
    _id: id("ORD", i),
    customerId: customer._id,
    orderDate: new Date(orderMillis),
    status,
    currency: "USD",
    channel: pick(["WEB", "MOBILE", "STORE"]),
    warehouseId: pick(warehouses),
    items,
    totalCents: items.reduce(
      (total, item) => total + item.lineTotalCents, 0
    )
  });
}

writeDocuments(salesDb.orders, orders);

// 3. PAYMENTS: failed attempts and successful retries.
// Failed amounts represent attempted charges, not collected money.
const payments = [];
let paymentNumber = 0;

for (const order of orders) {
  const september = order.orderDate.getTime() >= SEPTEMBER;
  const completed = order.status === "COMPLETED";
  const initialFailure = !completed ||
    random() < (september ? 0.25 : 0.10);

  const firstStatus = initialFailure ? "FAILED" : "SUCCESS";

  payments.push({
    _id: id("PAY", ++paymentNumber),
    orderId: order._id,
    attemptNumber: 1,
    paymentDate: new Date(order.orderDate.getTime() + 60000),
    status: firstStatus,
    amountCents: order.totalCents,
    currency: "USD",
    method: pick(["CARD", "BANK_TRANSFER", "WALLET"]),
    failureReason: initialFailure ? "PROCESSOR_DECLINED" : null
  });

  if (completed && initialFailure) {
    payments.push({
      _id: id("PAY", ++paymentNumber),
      orderId: order._id,
      attemptNumber: 2,
      paymentDate: new Date(order.orderDate.getTime() + 3600000),
      status: "SUCCESS",
      amountCents: order.totalCents,
      currency: "USD",
      method: "CARD",
      failureReason: null
    });
  }
}

writeDocuments(salesDb.payments, payments);

// 4. RETURNS: one returned line per selected completed order.
const returns = [];
let returnNumber = 0;

for (const order of orders) {
  if (order.status !== "COMPLETED") {
    continue;
  }

  const september = order.orderDate.getTime() >= SEPTEMBER;
  const item = pick(order.items);
  const product = products.find(p => p._id === item.productId);

  const elevatedReturns = september && product.category === "HOME";
  const returnProbability = elevatedReturns ? 0.35 : 0.10;

  if (random() >= returnProbability) {
    continue;
  }

  const returnMillis =
    order.orderDate.getTime() + integer(2, 21) * DAY;

  // Dataset represents events known before October 1.
  if (returnMillis >= END) {
    continue;
  }

  const quantity = integer(1, item.quantity);

  returns.push({
    _id: id("RET", ++returnNumber),
    orderId: order._id,
    lineId: item.lineId,
    productId: item.productId,
    customerId: order.customerId,
    quantity,
    returnDate: new Date(returnMillis),
    refundDate: new Date(returnMillis),
    status: "REFUNDED",
    refundAmountCents: Math.round(
      item.lineTotalCents * quantity / item.quantity
    ),
    currency: "USD",
    reason: elevatedReturns
      ? "DEFECTIVE"
      : pick(["DAMAGED", "WRONG_SIZE", "CHANGED_MIND"])
  });
}

writeDocuments(salesDb.returns, returns);

// 5. INVENTORY: daily opening snapshots for two warehouses.
// Synthetic observations, not a reconciled stock ledger.
let inventoryBatch = [];
let inventoryCount = 0;

for (let dateMillis = START; dateMillis < END; dateMillis += DAY) {
  for (const product of products) {
    for (const warehouseId of warehouses) {
      const lowStockPeriod =
        product.category === "ELECTRONICS" &&
        warehouseId === "WH-WEST" &&
        dateMillis >= SEPTEMBER &&
        dateMillis < Date.UTC(2026, 8, 21);

      const snapshotDate = new Date(dateMillis);

      inventoryBatch.push({
        _id: `${product._id}-${warehouseId}-${snapshotDate
          .toISOString().slice(0, 10)}`,
        productId: product._id,
        warehouseId,
        snapshotDate,
        availableQuantity: lowStockPeriod
          ? integer(0, 5)
          : integer(40, 250),
        reorderPoint: 20
      });

      inventoryCount++;

      if (inventoryBatch.length === 1000) {
        writeDocuments(salesDb.inventory, inventoryBatch);
        inventoryBatch = [];
      }
    }
  }
}

if (inventoryBatch.length > 0) {
  writeDocuments(salesDb.inventory, inventoryBatch);
}

// Summary.
printjson({
  generated: {
    products: products.length,
    orders: orders.length,
    payments: payments.length,
    returns: returns.length,
    inventory: inventoryCount
  },
  databaseCounts: {
    customers: salesDb.customers.countDocuments({}),
    products: salesDb.products.countDocuments({}),
    orders: salesDb.orders.countDocuments({}),
    payments: salesDb.payments.countDocuments({}),
    returns: salesDb.returns.countDocuments({}),
    inventory: salesDb.inventory.countDocuments({})
  },
  dormantCustomerCount: dormantCustomerIds.size
});