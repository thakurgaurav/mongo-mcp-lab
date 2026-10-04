const salesDb = db.getSiblingDB("sales_lab");

// Fixed seed makes generated data reproducible.
let randomState = 42;

function random() {
  randomState = (
    Math.imul(1664525, randomState) + 1013904223
  ) >>> 0;

  return randomState / 4294967296;
}

function pick(values) {
  return values[Math.floor(random() * values.length)];
}

const locations = [
  { city: "San Jose", state: "CA", country: "US", region: "WEST" },
  { city: "Seattle", state: "WA", country: "US", region: "WEST" },
  { city: "Austin", state: "TX", country: "US", region: "SOUTH" },
  { city: "Atlanta", state: "GA", country: "US", region: "SOUTH" },
  { city: "Chicago", state: "IL", country: "US", region: "MIDWEST" },
  { city: "Columbus", state: "OH", country: "US", region: "MIDWEST" },
  { city: "New York", state: "NY", country: "US", region: "NORTHEAST" },
  { city: "Boston", state: "MA", country: "US", region: "NORTHEAST" }
];

const signupStart = Date.UTC(2025, 0, 1);
const signupEnd = Date.UTC(2026, 3, 1);

const operations = [];

for (let i = 1; i <= 1000; i++) {
  const customerId = `CUST-${String(i).padStart(4, "0")}`;

  const segmentValue = random();
  const segment =
    segmentValue < 0.65 ? "INDIVIDUAL" :
    segmentValue < 0.90 ? "SMALL_BUSINESS" :
    "ENTERPRISE";

  const customer = {
    _id: customerId,
    name: `Synthetic Customer ${String(i).padStart(4, "0")}`,
    segment,
    location: { ...pick(locations) },
    signupDate: new Date(
      signupStart + Math.floor(random() * (signupEnd - signupStart))
    ),
    status: random() < 0.90 ? "ACTIVE" : "INACTIVE"
  };

  operations.push({
    replaceOne: {
      filter: { _id: customerId },
      replacement: customer,
      upsert: true
    }
  });
}

const result = salesDb.customers.bulkWrite(operations);

printjson({
  matched: result.matchedCount,
  modified: result.modifiedCount,
  inserted: result.upsertedCount,
  totalCustomers: salesDb.customers.countDocuments({})
});

print("Customer distribution by segment:");

printjson(
  salesDb.customers.aggregate([
    {
      $group: {
        _id: "$segment",
        customerCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]).toArray()
);