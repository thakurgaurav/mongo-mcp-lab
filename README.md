# Mongo MCP Lab

A Spring Boot sales investigation app that uses Spring AI and OpenAI to answer questions about synthetic MongoDB sales data. The model can call tools exposed by the MongoDB MCP server, and the app displays the answer in a browser UI.

## User interface

### Main screen

![AI Pulse Engineering sales investigation UI before a query](docs/images/ui-home.png)

### Text response

![Sales investigation with a text response](docs/images/ui-text-response.png)

### Table response

![Sales investigation with a tabular response](docs/images/ui-table-response.png)

### Chart response

![Sales investigation with a chart response](docs/images/ui-chart-response.png)

The chart controls support four chart types for compatible tabular responses:

- Bar chart (the default)
- Line chart
- Area chart
- Donut chart

Use the chart metric selector to choose the numeric column and the chart type
selector to redraw the visualization. The original bar-chart behavior remains
the fallback when a selected visualization is not suitable for the data.

### Charts and table together

![Sales investigation showing a chart with its supporting table](docs/images/ui-chart-and-table.png)


## What’s included

- **Spring Boot and Spring AI** provide the REST API, browser UI, and model integration.
- **OpenAI GPT‑6 Luna** interprets sales questions and selects MongoDB tools.
- **MongoDB MCP Server** exposes database tools to Spring AI over STDIO.
- **MongoDB 7** stores synthetic sales data in the `sales_lab` database.
- **The browser UI** renders investigation answers, including formatted tables and selectable bar, line, area, and donut charts when compatible data is available.

Spring Boot starts the MongoDB MCP server as a child process. The MCP server then connects to MongoDB using the read-only `mcp_reader` account. The OpenAI API key is used by the Spring Boot application and must stay on the server side.

## Requirements

- Java 25
- Maven
- Docker with Docker Compose
- Node.js 22.13 or later and npm, for the MongoDB MCP server launched through `npx`

Check your installed versions:

```bash
java --version
mvn --version
docker --version
docker compose version
node --version
npm --version
```

The project was developed with Spring Boot 4.1.1 and Spring AI 2.0.1.

## MongoDB setup

### 1. Configure the MongoDB root password

Create a `.env` file in the project root:

```dotenv
MONGO_ROOT_PASSWORD=replace-with-a-strong-local-password
```

Keep `.env` out of Git. Add this entry to `.gitignore` if it is not already there:

```gitignore
.env
```

Compose uses this password to initialize the MongoDB administrator account `lab_admin`.

### 2. Start MongoDB

The project’s `compose.yaml` uses MongoDB 7, maps host port `27018` to container port `27017`, and stores database files in the named volume `mongodb7_data`.

Start MongoDB and check its health:

```bash
docker compose up -d
docker compose ps
```

View MongoDB logs if it does not become healthy:

```bash
docker compose logs --tail=100 mongodb
```

### 3. Connect as the administrator

Run this from the project root:

```bash
docker compose exec mongodb mongosh \
  --username lab_admin \
  --authenticationDatabase admin \
  --password
```

Enter the password from `.env` when prompted. It is hidden while typing.

### 4. Create the database and collections

At the `mongosh` prompt, run:

```javascript
use sales_lab
```

Create the six collections if they do not already exist:

```javascript
const names = [
  "customers",
  "products",
  "orders",
  "payments",
  "returns",
  "inventory"
];

const existing = new Set(db.getCollectionNames());

names.forEach(name => {
  if (!existing.has(name)) {
    db.createCollection(name);
  }
});

show collections
```

### 5. Create the read-only MCP account

Still in `mongosh`, select `sales_lab` and create the account:

```javascript
use sales_lab

db.createUser({
  user: "mcp_reader",
  pwd: passwordPrompt(),
  roles: [
    { role: "read", db: "sales_lab" }
  ]
})
```

Choose a strong password using ordinary ASCII characters and save it securely. This account can read data but cannot write to the sales collections.

Check the collections:

```javascript
show collections
```

Exit the shell when finished:

```javascript
exit
```

### 6. Seed synthetic data

The seed scripts are deterministic and use upserts so they can be rerun to recreate the same lab data.

Run the customer script first:

```bash
docker compose cp scripts/seed-customers.js mongodb:/tmp/seed-customers.js

docker compose exec mongodb mongosh \
  --username lab_admin \
  --authenticationDatabase admin \
  --file /tmp/seed-customers.js \
  --password
```

Then seed products, orders, payments, returns, and inventory:

```bash
docker compose cp scripts/seed-sales.js mongodb:/tmp/seed-sales.js

docker compose exec mongodb mongosh \
  --username lab_admin \
  --authenticationDatabase admin \
  --file /tmp/seed-sales.js \
  --password
```

Enter the administrator password when prompted. The scripts print summary counts when complete.

To inspect the resulting collection counts, open the administrator shell again:

```bash
docker compose exec mongodb mongosh \
  --username lab_admin \
  --authenticationDatabase admin \
  --password
```

Then run:

```javascript
use sales_lab

db.customers.countDocuments({})
db.products.countDocuments({})
db.orders.countDocuments({})
db.payments.countDocuments({})
db.returns.countDocuments({})
db.inventory.countDocuments({})
```

## Configure the application

In `src/main/resources/application.properties`, keep secrets as environment variable references. The relevant settings should look like this:

```properties
spring.application.name=mongo-mcp-lab
server.port=8080

spring.ai.openai.api-key=${OPENAI_API_KEY}
spring.ai.openai.chat.model=gpt-6-luna
spring.ai.openai.chat.reasoning-effort=none

app.ai.sales.system-prompt=classpath:prompts/sales-investigator-system.txt
app.ai.sales.response-format=classpath:prompts/sales-response-format.txt

spring.ai.mcp.client.name=mongo-mcp-lab
spring.ai.mcp.client.type=SYNC
spring.ai.mcp.client.request-timeout=60s

spring.ai.mcp.client.stdio.connections.mongodb.command=npx
spring.ai.mcp.client.stdio.connections.mongodb.args[0]=-y
spring.ai.mcp.client.stdio.connections.mongodb.args[1]=mongodb-mcp-server@2.1.1
spring.ai.mcp.client.stdio.connections.mongodb.args[2]=--readOnly
spring.ai.mcp.client.stdio.connections.mongodb.env[MDB_MCP_CONNECTION_STRING]=${MONGODB_MCP_URI}
```

The model setting uses `reasoning-effort=none` because GPT‑6 Luna returned an error when function tools were used with another reasoning effort over the Chat Completions endpoint.

## Set credentials and run the application

Create an OpenAI API key in the [OpenAI API key dashboard](https://platform.openai.com/api-keys). API usage is billed separately from a ChatGPT subscription. See the [OpenAI API quickstart](https://platform.openai.com/docs/quickstart/make-your-first-api-request) and [API key safety guidance](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety).

In the terminal where you will run Spring Boot, enter the API key and MongoDB MCP connection URI at hidden prompts:

```bash
read -rsp "OpenAI API key: " OPENAI_API_KEY
export OPENAI_API_KEY
printf '\n'

read -rsp "MongoDB MCP connection URI: " MONGODB_MCP_URI
export MONGODB_MCP_URI
printf '\n'
```

For the MongoDB URI, use the read-only account, the host-mapped port, and `sales_lab` as the authentication database:

```text
mongodb://mcp_reader:YOUR_PASSWORD@localhost:27018/sales_lab?authSource=sales_lab
```

Replace `YOUR_PASSWORD` locally. If the password contains reserved URI characters such as `@`, `:`, `/`, `?`, `#`, or `%`, percent-encode those characters in the URI. For example, encode `@` as `%40`.

Start Spring Boot **in the same terminal where both environment variables were set**:

```bash
mvn spring-boot:run
```

Spring Boot starts the MongoDB MCP server over STDIO. Startup logs should show the MCP server starting and the web server listening on port `8080`.

These environment variables apply only to the current terminal session. If you open a new terminal or restart the machine, set them again before running the application.

## Use the web UI or API

Open the UI at:

```text
http://localhost:8080/
```

The investigation endpoint is:

```text
POST http://localhost:8080/api/v1/sales/investigations
```

Example request:

```bash
curl --fail-with-body -sS \
  http://localhost:8080/api/v1/sales/investigations \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "question": "Compare completed-order sales by product category for August and September 2026."
  }'
```

The endpoint returns a JSON response with the answer. Use `scripts/sample-requests.sh` for saved examples:

```bash
bash scripts/sample-requests.sh
```

If the script supports named examples, list or open it to see the available case names. You can override the app URL when running an example:

```bash
BASE_URL=http://localhost:8080 bash scripts/sample-requests.sh collections
```

## Data and business rules

The database contains synthetic sales history for April through September 2026 across these collections:

- `customers`
- `products`
- `orders`
- `payments`
- `returns`
- `inventory`

Key relationships include:

- `orders.customerId` → `customers._id`
- `orders.items.productId` → `products._id`
- `payments.orderId` and `returns.orderId` → `orders._id`
- `returns.lineId` identifies a returned order item
- `inventory.productId` → `products._id`

Business rules are supplied to the model in `sales-investigator-system.txt`. They define how to interpret monetary fields, successful payments, refunds, historical item costs, dates, and inventory snapshots. These prompt instructions guide the model; MongoDB account permissions provide the actual read-only access boundary.

## Useful MongoDB commands

Check the Compose service and health:

```bash
docker compose ps
```

Follow MongoDB logs:

```bash
docker compose logs -f mongodb
```

Open an administrator shell:

```bash
docker compose exec mongodb mongosh \
  --username lab_admin \
  --authenticationDatabase admin \
  --password
```

Stop MongoDB while retaining its data:

```bash
docker compose stop
```

Start it again:

```bash
docker compose start
```

Stop and remove the container and network while retaining the named data volume:

```bash
docker compose down
```

Removing the named volume permanently deletes the local database contents. Do not use `docker compose down -v` unless you intentionally want to erase the lab data.

## Troubleshooting

### MongoDB is not healthy

Check:

```bash
docker compose ps -a
docker compose logs --tail=100 mongodb
```

The lab uses MongoDB 7. If you change MongoDB major versions, use a compatible data directory or make a backup before switching versions.

### MongoDB authentication fails

- Confirm `lab_admin` is authenticated against `admin`.
- Confirm `mcp_reader` is authenticated against `sales_lab`.
- Verify the passwords are correct.
- For the MCP URI, percent-encode reserved characters in the password.
- Changing `MONGO_ROOT_PASSWORD` in `.env` does not change an administrator password already initialized in an existing MongoDB data volume.

### Spring cannot start the MCP server

- Confirm Node.js and npm are installed.
- Check the `npx` command and pinned `mongodb-mcp-server@2.1.1` arguments in `application.properties`.
- Confirm `MONGODB_MCP_URI` is set in the same terminal used to start Spring Boot.
- Confirm the URI uses `localhost:27018` and the `mcp_reader` account.

### OpenAI authentication or model errors

- Confirm `OPENAI_API_KEY` is set in the same terminal used to start Spring Boot.
- Confirm the key is valid and has API access.
- Keep the configured model and reasoning effort consistent with the OpenAI error returned by the application.
- Never paste API keys into logs, Git, browser code, or chat messages.

### The API returns HTTP 400 for a blank question

The request validator rejects missing or whitespace-only questions before the investigation service calls the model.

## Project layout

```text
src/main/java/com/gauravthakur/mongomcplab/
├── controller/          # HTTP endpoint
├── dto/request/         # Request model and validation
├── dto/response/        # JSON response model
├── exception/           # API error handling
└── service/             # AI investigation and answer sanitization

src/main/resources/
├── prompts/
│   ├── sales-investigator-system.txt
│   └── sales-response-format.txt
└── static/              # Browser UI assets

scripts/
├── seed-customers.js    # Seeds customers
├── seed-sales.js        # Seeds remaining sales collections
└── sample-requests.sh   # Example API requests
```


## Investigation questions and query guide

Ask one question at a time in the browser UI or through the API. Start with collection counts, then progress to date filtering, aggregations, joins, and multi-step analysis.

The question is written in business language. The model chooses MongoDB MCP tools and builds the corresponding query. It may inspect a collection schema before querying fields it has not seen before.

### 1. Collection counts

**Question**

> Using database tools, count the documents in each of the six `sales_lab` collections. Return a table with collection name and document count.

**What it exercises**

- Collection discovery
- Collection-level counts
- A simple table response

**Check**

Confirm that all six collections appear and that the counts are nonzero after seeding.

### 2. Monthly completed-order sales

**Question**

> Compare completed-order sales for each month from April through September 2026. Show order count, total sales in USD, average order value, and month-over-month percentage change. Use `orderDate` and calculate sales from `orders.totalCents`.

**What it exercises**

- Filtering `orders` by status and date
- Grouping results by month
- Calculating totals, averages, and month-over-month changes
- Formatting monetary values

**Check**

The answer should use completed orders and order dates. It should explain that this is order-period sales, not payment-period cash collected, and note that September may be incomplete if the dataset ends before the month is complete.

### 3. Category sales comparison

**Question**

> Compare completed-order sales by product category for August and September 2026. Use completed orders with `orderDate` in those months, unwind `items`, group item sales by month and product, join products to get category, and return August sales, September sales, dollar change, and percentage change in a table.

**What it exercises**

- Date-range filtering
- Unwinding embedded order items
- Grouping by product and month
- Joining the `products` collection
- Pivoting monthly totals by category

**Check**

Sales should be based on item `lineTotalCents` if comparing category-level product sales. A successful query returning zero rows is different from a failed aggregation. If the tool fails, the response should report the failure rather than claim that no data exists.

### 4. Customer segments and regions

**Question**

> Compare August and September 2026 completed-order sales by customer segment and region. Join orders with customers. Show sales, distinct purchasing customers, and sales per purchasing customer. Rank the five segment-region combinations with the largest absolute dollar declines. Include both months and show dollar and percentage changes.

**What it exercises**

- Joining orders to customers
- Grouping by customer attributes
- Distinct customer counts
- Calculating per-customer metrics
- Ranking changes across groups

**Check**

Make sure customer counts are distinct. If order items are unwound before customer counts are calculated, one customer with multiple items or orders must not be counted repeatedly by accident.

### 5. Payment failures and recovery

**Question**

> For orders placed in September 2026, analyze payment attempts by payment method. Show failed attempts, distinct orders with failures, orders subsequently recovered by a successful payment, and orders without a successful payment. Separate completed, pending, and cancelled orders. Avoid counting retries as additional revenue. State the observation cutoff and how orders with multiple payment methods are counted.

**What it exercises**

- Filtering orders by `orderDate`
- Joining orders and payments
- Separating payment attempts from orders
- Finding failed attempts followed by successful retries
- Grouping by payment method and order status

**Check**

A failed attempt followed by a successful payment is a retry, not an additional payment or automatically lost revenue. The answer should state how it handles orders with multiple payment methods and identify the data cutoff used.

### 6. Cash collections after refunds

**Question**

> Compare August and September 2026 cash collections. Use `SUCCESS` payments by `paymentDate` and `REFUNDED` returns by `refundDate`. Show gross collections, refunds, and net collections in USD. Break the results down by customer region without double counting orders or payment attempts. Reconcile regional totals with the overall totals.

**What it exercises**

- Using payment dates and refund dates for cash-period analysis
- Filtering successful payments
- Joining payment and return data to orders and customers
- Aggregating regional and overall totals

**Check**

Gross collections should include only successful payments. Refunds should be subtracted from net collections. Joining payments and returns directly can multiply rows when an order has multiple attempts or return lines, so inspect whether the result avoids that fan-out and whether regional totals reconcile.

### 7. Returns by category and return reason

**Question**

> Compare August and September 2026 refunded returns by product category and return reason, using `refundDate`. Show returned units and refund amounts. Separately calculate the percentage of completed orders placed in each month that had at least one refunded return observed before October 1, 2026 UTC. Explain why September’s shorter observation window affects this comparison.

**What it exercises**

- Filtering refunds by refund date
- Joining returns to orders and products
- Grouping by category and reason
- Counting orders with at least one return
- Explaining differences in observation windows

**Check**

Count orders with returned items only once when calculating the percentage. Since September orders have had less time to generate observed returns than August orders, the comparison has unequal follow-up time.

### 8. Customers inactive in September

**Question**

> Identify the top 20 customers by completed-order sales during April through August 2026 who placed no completed orders in September 2026. Show customer ID, segment, region, earlier sales in USD, and last completed-order date. Describe them as inactive in September rather than claiming they have churned.

**What it exercises**

- Aggregating sales by customer
- Comparing two date periods
- Excluding customers with September orders
- Limiting a ranked detail list

**Check**

The result identifies customers with no completed orders during September in the available dataset. That alone does not establish that they have permanently churned.

### 9. Inventory and sales correlation

**Question**

> Investigate whether low `ELECTRONICS` inventory at `WH-WEST` during September 2026 coincided with lower completed-order sales. Define low inventory as quantity below `reorderPoint`. Match inventory snapshots and orders by UTC calendar day, product, and warehouse, retaining days with no sales. Compare with August and `WH-EAST`. Avoid multiplying sales across inventory snapshots, and explain why this cannot establish lost sales or causation.

**What it exercises**

- Filtering inventory by category, warehouse, and threshold
- Aligning inventory and orders by product and UTC day
- Preserving days without sales
- Comparing periods and warehouses
- Avoiding sales duplication across multiple snapshots

**Check**

Inventory snapshots are synthetic observations, not a reconciled stock ledger. A relationship between low inventory and sales does not prove that stock levels caused lost sales.

### 10. Multi-step September decline investigation

**Question**

> Investigate the change in completed-order sales from August to September 2026. First calculate overall sales by month. Then identify the categories with the largest dollar declines. For those categories, compare order counts, average order value, successful payment totals, and refunded returns. Reconcile every breakdown to its overall total. Use order dates for order-period sales and payment or refund dates for cash-period metrics. Explain limitations and distinguish correlation from causation.

**What it exercises**

- A sequence of database investigations
- Category-level follow-up based on initial results
- Combining order, payment, and return measures
- Reconciling independent aggregations
- Separating order-period sales from cash-period collections

**Check**

The answer should keep each metric’s date basis clear. Do not add successful payments or refunds to order-date sales as if they were measured on the same time basis. The model should support factual claims with successful tool results and report query failures instead of turning them into “no data” conclusions.

### Reviewing a generated answer

For each question, review:

1. **Metric:** Is the answer clear about what it counts—for example, completed-order sales, successful payment collections, or refunded returns?
2. **Time basis:** Does it use `orderDate`, `paymentDate`, or `refundDate` appropriately?
3. **Relationships:** Are joins based on the documented IDs?
4. **Double counting:** Could unwinding items or joining multiple payments, returns, or inventory snapshots multiply the totals?
5. **Currency:** Are integer cent amounts divided by 100 before being shown as USD?
6. **Tool outcome:** Did the database query succeed? A failed query is not evidence that there are no matching records.
7. **Limits:** Are partial periods, return observation windows, and correlation-versus-causation limits stated where relevant?

Use the same question again after a prompt or model change to compare response time, query success, figures, and explanation. A faster answer is useful only if it remains factually supported by successful database queries.

## Future deployment note

This lab currently runs the MongoDB MCP server locally as a child process over STDIO. For a deployment with multiple application instances, the MCP server could instead be run as a separately managed network service, provided the chosen MCP transport and deployment setup support that architecture. The application instances would then connect to that service rather than each launching a local MCP process.

## License

This project is licensed under the Apache License 2.0 (Apache-2.0). See the [LICENSE](LICENSE) file for the complete license text.
