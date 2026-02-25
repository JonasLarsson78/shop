#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:3000"

echo "Running API smoke tests against $BASE"

test(){
  method=$1; url=$2; data=$3
  echo
  echo "=== $method $url ==="
  if [ -n "$data" ]; then
    curl -sS -X "$method" "$url" -H "Content-Type: application/json" -d "$data" || true
  else
    curl -sS -X "$method" "$url" || true
  fi
}

# Settings
test GET "$BASE/api/settings" ""
test PUT "$BASE/api/settings" '{"storeName":"Testbutik"}'

# Bootstrap
test POST "$BASE/api/bootstrap" ""
test GET "$BASE/api/bootstrap" ""

# Products
test GET "$BASE/api/products" ""
test POST "$BASE/api/products" '{"name":"Testprodukt","description":"desc","price":100,"imageUrl":"","groupId":null}'
test PUT "$BASE/api/products/1" '{"name":"Upp","description":"x","price":10,"imageUrl":"","groupId":null}'
test DELETE "$BASE/api/products/1" ""

# Groups
test GET "$BASE/api/groups" ""
test POST "$BASE/api/groups" '{"name":"Testgrupp"}'
test GET "$BASE/api/groups/1" ""
test POST "$BASE/api/groups/1" '{"name":"Ny grupp"}'

# Orders
test GET "$BASE/api/orders" ""
test POST "$BASE/api/orders" '{"items":[],"shippingOptionId":1,"customer":{"name":"Test","email":"t@e.com"}}'
test PATCH "$BASE/api/orders" '{"id":1,"status":"sent"}'

test GET "$BASE/api/my-orders?userId=1" ""
test GET "$BASE/api/orders-count?status=pending" ""

# Shipping
test GET "$BASE/api/shipping-options" ""
test POST "$BASE/api/shipping-options" '{"name":"Testfrakt","price":49}'
test PUT "$BASE/api/shipping-options" '{"id":1,"name":"Express","price":99}'
test DELETE "$BASE/api/shipping-options" '{"id":1}'

# Auth
test POST "$BASE/api/auth/register" '{"email":"test@example.com","password":"test1234","name":"Test","address":"Gata","phone":"070","zip":"12345","city":"Stad"}'
test POST "$BASE/api/auth/login" '{"email":"test@example.com","password":"test1234"}'
test POST "$BASE/api/auth/update" '{"id":1,"name":"Nytt namn"}'

echo
echo "Done. Review outputs above for failures."
