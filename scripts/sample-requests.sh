#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
ENDPOINT="${BASE_URL}/api/v1/sales/investigations"

# Run one example at a time:
# bash scripts/sample-requests.sh collections
# bash scripts/sample-requests.sh monthly-sales
#
# Override the application URL:
# BASE_URL=http://localhost:9090 bash scripts/sample-requests.sh collections

case "${1:-}" in
  collections)
    curl --fail-with-body -sS "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      --data-binary @- <<'JSON'
{
  "question": "Using database tools, count the documents in each of the six sales_lab collections. Return a table with collection name and document count."
}
JSON
    ;;

  monthly-sales)
    curl --fail-with-body -sS "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      --data-binary @- <<'JSON'
{
  "question": "Compare completed-order sales for each month from April through September 2026. Show order count, total sales in USD, average order value, and month-over-month percentage change. Use orderDate and calculate sales from orders.totalCents."
}
JSON
    ;;

  customer-segments)
    curl --fail-with-body -sS "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      --data-binary @- <<'JSON'
{
  "question": "Compare August and September 2026 completed-order sales by customer segment and region. Join orders with customers. Show sales, distinct purchasing customers, and sales per purchasing customer. Rank the five segment-region combinations with the largest absolute dollar declines. Include both months and show dollar and percentage changes."
}
JSON
    ;;

  category-sales)
    curl --fail-with-body -sS "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      --data-binary @- <<'JSON'
{
  "question": "Which product categories contributed most to the change in completed-order sales between August and September 2026? Join order items with products, use lineTotalCents after discounts, and show each category's sales, dollar change, and percentage change. Reconcile the category totals with overall completed-order sales."
}
JSON
    ;;

  payment-recovery)
    curl --fail-with-body -sS "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      --data-binary @- <<'JSON'
{
  "question": "For orders placed in September 2026, analyze payment attempts by payment method. Show failed attempts, distinct orders with failures, orders subsequently recovered by a successful payment, and orders without a successful payment. Separate completed, pending, and cancelled orders. Avoid counting retries as additional revenue. State the observation cutoff and how orders with multiple payment methods are counted."
}
JSON
    ;;

  net-collections)
    curl --fail-with-body -sS "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      --data-binary @- <<'JSON'
{
  "question": "Compare August and September 2026 cash collections. Use SUCCESS payments by paymentDate and REFUNDED returns by refundDate. Show gross collections, refunds, and net collections in USD. Break the results down by customer region without double counting orders or payment attempts. Reconcile regional totals with the overall totals."
}
JSON
    ;;

  returns)
    curl --fail-with-body -sS "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      --data-binary @- <<'JSON'
{
  "question": "Compare August and September 2026 refunded returns by product category and return reason, using returnDate. Show returned units and refund amounts. Separately calculate the percentage of completed orders placed in each month that had at least one refunded return observed before October 1, 2026 UTC. Explain why September's shorter observation window affects this comparison."
}
JSON
    ;;

  inactive-customers)
    curl --fail-with-body -sS "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      --data-binary @- <<'JSON'
{
  "question": "Identify the top 20 customers by completed-order sales during April through August 2026 who placed no completed orders in September 2026. Show customer ID, segment, region, earlier sales in USD, and last completed-order date. Describe them as inactive in September rather than claiming they have churned."
}
JSON
    ;;

  inventory-correlation)
    curl --fail-with-body -sS "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      --data-binary @- <<'JSON'
{
  "question": "Investigate whether low ELECTRONICS inventory at WH-WEST during September 2026 coincided with lower completed-order sales. Define low inventory as quantity below reorderPoint. Match inventory snapshots and orders by UTC calendar day, product, and warehouse, retaining days with no sales. Compare with August and WH-EAST. Avoid multiplying sales across inventory snapshots, and explain why this cannot establish lost sales or causation."
}
JSON
    ;;

  blank-question)
    # Expected HTTP 400. Invalid requests should not call AI.
    curl -sS -i "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      -d '{"question":"   "}'
    ;;

  missing-question)
    # Expected HTTP 400.
    curl -sS -i "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      -d '{}'
    ;;

  malformed-json)
    # Expected HTTP 400.
    curl -sS -i "$ENDPOINT" \
      -H 'Content-Type: application/json' \
      -d '{"question":'
    ;;

  *)
    cat <<'HELP'
Usage:
  bash scripts/sample-requests.sh <example>

Examples:
  collections
  monthly-sales
  customer-segments
  category-sales
  payment-recovery
  net-collections
  returns
  inactive-customers
  inventory-correlation
  blank-question
  missing-question
  malformed-json
HELP
    exit 1
    ;;
esac

printf '\n'