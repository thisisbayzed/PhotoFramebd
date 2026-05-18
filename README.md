# PhotoFrameBD Backend API

REST API for the PhotoFrameBD e-commerce platform (photo frames store).

**Production base URL:**

```
https://photoframebd-backend.onrender.com
```

**Health check:**

```
GET https://photoframebd-backend.onrender.com/api
```

---

## Table of Contents

1. [Frontend Setup](#frontend-setup)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Public APIs](#public-apis)
5. [Admin APIs](#admin-apis)
6. [Environment Variables](#environment-variables)
7. [Local Development](#local-development)

---

## Frontend Setup

Never hardcode `localhost:5000` in production. Use an environment variable.

### React / Vite

Create `.env` (local):

```env
VITE_API_URL=http://localhost:5000
```

Create `.env.production` or set on Netlify:

```env
VITE_API_URL=https://photoframebd-backend.onrender.com
```

Create `src/config/api.js`:

```javascript
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiFetch = (path, options = {}) => {
  return fetch(`${API_URL}${path}`, options);
};
```

### Usage examples

```javascript
import { API_URL, apiFetch } from "./config/api";

// Simple GET
const res = await apiFetch("/api/products");
const data = await res.json();

// With admin token
const res = await apiFetch("/api/admin/dashboard", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
});
```

### Netlify

1. Site settings → **Environment variables**
2. Add: `VITE_API_URL` = `https://photoframebd-backend.onrender.com`
3. Redeploy the site

### Store admin token after login

```javascript
const res = await apiFetch("/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const result = await res.json();

if (result.success) {
  localStorage.setItem("adminToken", result.data.token);
}
```

### Logout

```javascript
await apiFetch("/api/admin/logout", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
});

localStorage.removeItem("adminToken");
```

---

## Authentication

Admin routes require a JWT token in the header:

```
Authorization: Bearer <token>
```

| Item | Value |
|------|--------|
| Token lifetime | 7 days (configurable via `JWT_EXPIRES_IN`) |
| Login | `POST /api/admin/login` |
| Logout | `POST /api/admin/logout` (blacklists token) |

---

## Response Format

### Success

```json
{
  "success": true,
  "message": "Optional message",
  "data": { }
}
```

### Error

```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP status codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized / invalid token |
| 404 | Not found |
| 409 | Conflict (duplicate email, etc.) |
| 500 | Server error |

---

## Public APIs

No authentication required (unless noted).

---

### Health Check

```
GET /api
```

**Response:**

```json
{
  "message": "API server is running"
}
```

---

### Categories

#### List categories

```
GET /api/categories
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Classic",
      "slug": "classic",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### Products

#### List all products

```
GET /api/products
```

#### Get single product

```
GET /api/products/:id
```

**Response item fields:**

| Field | Type |
|-------|------|
| id | string |
| name | string |
| price | number |
| shortDescription | string |
| material | string |
| size | string |
| finish | string |
| category | object (populated) |
| isPremium | boolean |
| fullDescription | string |
| images | string[] (4 Cloudinary URLs) |

---

### Testimonials

#### List testimonials

```
GET /api/testimonials
```

#### Get single testimonial

```
GET /api/testimonials/:id
```

---

### Cart

#### Create cart

```
POST /api/cart
```

**Response:**

```json
{
  "success": true,
  "message": "Cart created successfully",
  "data": {
    "cartId": "uuid-string",
    "items": [],
    "itemCount": 0
  }
}
```

Save `cartId` in `localStorage`.

#### Get cart

```
GET /api/cart/:cartId
```

#### Add to cart

```
POST /api/cart/:cartId/add
```

**Body:**

```json
{
  "productId": "PRODUCT_MONGO_ID",
  "quantity": 1
}
```

#### Remove item from cart

```
DELETE /api/cart/:cartId/items/:productId
```

#### Delete entire cart

```
DELETE /api/cart/:cartId
```

#### Cart summary (with pricing)

```
GET /api/cart/:cartId/summary?deliveryZone=inside_dhaka
```

**Query `deliveryZone` (required):**

| Value | Delivery charge |
|-------|-----------------|
| `inside_dhaka` | ৳80 |
| `outside_dhaka` | ৳150 |

**Fixed fees:** VAT ৳10, Platform fee ৳7

**Response:**

```json
{
  "success": true,
  "data": {
    "cartId": "...",
    "items": [
      {
        "productId": "...",
        "name": "Modern Black Frame",
        "price": 1050,
        "quantity": 1,
        "lineTotal": 1050,
        "image": "https://res.cloudinary.com/...",
        "shortDescription": "..."
      }
    ],
    "subtotal": 1900,
    "deliveryCharge": 80,
    "vat": 10,
    "platformFee": 7,
    "grandTotal": 1997,
    "deliveryZone": "inside_dhaka",
    "itemCount": 2
  }
}
```

---

### Orders (Customer)

#### Checkout (from cart)

```
POST /api/orders/checkout
```

**Body:**

```json
{
  "cartId": "your-cart-id",
  "customerName": "Farhana Islam",
  "phone": "01712345678",
  "address": "Dhaka, Bangladesh",
  "deliveryZone": "inside_dhaka"
}
```

- Creates order with `status: pending`, `orderType: cart`
- Clears cart after success
- Registers unique customer by phone

#### Direct buy (Buy Now – single product)

```
POST /api/orders/direct-buy
```

**Body:**

```json
{
  "productId": "PRODUCT_MONGO_ID",
  "quantity": 1,
  "customerName": "Farhana Islam",
  "phone": "01712345678",
  "address": "Dhaka, Bangladesh",
  "deliveryZone": "inside_dhaka"
}
```

You may use `mobileNumber` instead of `phone`.

- Creates order with `status: pending`, `orderType: direct`
- No cart required

**Success response (both checkout & direct buy):**

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": "...",
    "orderNumber": "FH-2401",
    "orderType": "cart",
    "customerName": "Farhana Islam",
    "phone": "01712345678",
    "address": "Dhaka, Bangladesh",
    "deliveryZone": "inside_dhaka",
    "items": [...],
    "subtotal": 1900,
    "deliveryCharge": 80,
    "vat": 10,
    "platformFee": 7,
    "grandTotal": 1997,
    "status": "pending",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## Admin APIs

All admin routes require:

```
Authorization: Bearer <admin_token>
```

---

### Auth

#### Login

```
POST /api/admin/login
```

**Body:**

```json
{
  "email": "photoframe021@gmail.com",
  "password": "your_password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "email": "photoframe021@gmail.com",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Logout

```
POST /api/admin/logout
```

#### Get profile

```
GET /api/admin/me
```

#### Dashboard stats

```
GET /api/admin/dashboard
```

**Response:**

```json
{
  "success": true,
  "message": "Welcome to admin dashboard",
  "data": {
    "admin": {
      "id": "...",
      "email": "photoframe021@gmail.com"
    },
    "stats": {
      "totalOrders": 10,
      "totalProducts": 12,
      "pendingOrders": 3,
      "totalSales": 25000
    }
  }
}
```

| Stat | Description |
|------|-------------|
| totalOrders | All orders placed |
| totalProducts | Products in catalog |
| pendingOrders | Orders with status `pending` |
| totalSales | Sum of `grandTotal` for **confirmed** orders |

#### Update admin email / password

```
PUT /api/admin/credentials
```

**Body:**

```json
{
  "currentPassword": "old_password",
  "newEmail": "newemail@gmail.com",
  "newPassword": "new_password"
}
```

Send `newEmail` and/or `newPassword`. Returns a new `token`.

---

### Users (Staff)

Roles: `manager`, `staff`, `support`

#### Create user

```
POST /api/admin/users
```

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@photoframe.com",
  "password": "password123",
  "role": "manager"
}
```

#### List users

```
GET /api/admin/users
```

#### Get user

```
GET /api/admin/users/:id
```

#### Update user

```
PUT /api/admin/users/:id
```

**Body (send only fields to change):**

```json
{
  "name": "Jane Doe",
  "email": "jane@photoframe.com",
  "password": "newpass123",
  "role": "staff",
  "isActive": true
}
```

#### Delete user

```
DELETE /api/admin/users/:id
```

---

### Categories (Admin)

#### Create category

```
POST /api/admin/categories
```

**Body:**

```json
{
  "name": "Classic"
}
```

#### List / Get / Update / Delete

```
GET    /api/admin/categories
GET    /api/admin/categories/:id
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

**Update body:**

```json
{
  "name": "Luxury"
}
```

---

### Products (Admin)

Uses **multipart/form-data** for image upload (Cloudinary).

#### Create product

```
POST /api/admin/products
```

**Form fields:**

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| price | number | yes |
| shortDescription | string | yes |
| material | string | yes |
| size | string | yes |
| finish | string | yes |
| category | category ID | yes |
| isPremium | boolean (`true`/`false`) | no |
| fullDescription | string | yes |
| images | file (exactly 4) | yes |

**Frontend example:**

```javascript
const formData = new FormData();
formData.append("name", "Classic Black Frame");
formData.append("price", "850");
formData.append("shortDescription", "Timeless black frame");
formData.append("material", "Wood");
formData.append("size", "8x10 inch");
formData.append("finish", "Matte");
formData.append("category", categoryId);
formData.append("isPremium", "false");
formData.append("fullDescription", "Full description here...");
imageFiles.forEach((file) => formData.append("images", file));

await apiFetch("/api/admin/products", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

#### List / Get / Update / Delete

```
GET    /api/admin/products
GET    /api/admin/products/:id
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
```

**Update:** Same form fields. Send 4 new images only if replacing all images.

---

### Orders (Admin)

#### List orders

```
GET /api/admin/orders
GET /api/admin/orders?status=pending
GET /api/admin/orders?status=confirmed
GET /api/admin/orders?status=cancelled
GET /api/admin/orders?status=all
```

#### Get order

```
GET /api/admin/orders/:id
```

#### Confirm order

```
PATCH /api/admin/orders/:id/confirm
```

#### Cancel order

```
PATCH /api/admin/orders/:id/cancel
```

#### Update status (alternative)

```
PATCH /api/admin/orders/:id/status
```

**Body:**

```json
{
  "status": "confirmed"
}
```

Values: `pending`, `confirmed`, `cancelled`

---

### Customers (Unique)

Customers are tracked by **phone number** when orders are placed.

#### List unique customers

```
GET /api/admin/customers
```

**Response:**

```json
{
  "success": true,
  "total": 5,
  "data": [
    {
      "id": "...",
      "phone": "01712345678",
      "name": "Farhana Islam",
      "address": "Dhaka, Bangladesh",
      "totalOrders": 3,
      "firstOrderedAt": "...",
      "lastOrderedAt": "..."
    }
  ]
}
```

---

### Testimonials (Admin)

#### Create

```
POST /api/admin/testimonials
```

**Body:**

```json
{
  "name": "Farhana Islam",
  "text": "Amazing quality frames. Totally changed the look of my living room."
}
```

#### List / Get / Update / Delete

```
GET    /api/admin/testimonials
GET    /api/admin/testimonials/:id
PUT    /api/admin/testimonials/:id
DELETE /api/admin/testimonials/:id
```

Public read: `GET /api/testimonials`

---

## Complete API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api` | No | Health check |
| POST | `/api/admin/login` | No | Admin login |
| POST | `/api/admin/logout` | Yes | Admin logout |
| GET | `/api/admin/me` | Yes | Admin profile |
| GET | `/api/admin/dashboard` | Yes | Dashboard stats |
| PUT | `/api/admin/credentials` | Yes | Update admin credentials |
| POST | `/api/admin/users` | Yes | Create staff user |
| GET | `/api/admin/users` | Yes | List staff users |
| GET | `/api/admin/users/:id` | Yes | Get staff user |
| PUT | `/api/admin/users/:id` | Yes | Update staff user |
| DELETE | `/api/admin/users/:id` | Yes | Delete staff user |
| GET | `/api/categories` | No | List categories |
| POST | `/api/admin/categories` | Yes | Create category |
| GET | `/api/admin/categories` | Yes | List categories |
| GET | `/api/admin/categories/:id` | Yes | Get category |
| PUT | `/api/admin/categories/:id` | Yes | Update category |
| DELETE | `/api/admin/categories/:id` | Yes | Delete category |
| GET | `/api/products` | No | List products |
| GET | `/api/products/:id` | No | Get product |
| POST | `/api/admin/products` | Yes | Create product |
| GET | `/api/admin/products` | Yes | List products |
| GET | `/api/admin/products/:id` | Yes | Get product |
| PUT | `/api/admin/products/:id` | Yes | Update product |
| DELETE | `/api/admin/products/:id` | Yes | Delete product |
| POST | `/api/cart` | No | Create cart |
| GET | `/api/cart/:cartId` | No | Get cart |
| GET | `/api/cart/:cartId/summary` | No | Cart summary |
| POST | `/api/cart/:cartId/add` | No | Add to cart |
| DELETE | `/api/cart/:cartId/items/:productId` | No | Remove from cart |
| DELETE | `/api/cart/:cartId` | No | Delete cart |
| POST | `/api/orders/checkout` | No | Checkout from cart |
| POST | `/api/orders/direct-buy` | No | Buy now (single product) |
| GET | `/api/admin/orders` | Yes | List orders |
| GET | `/api/admin/orders/:id` | Yes | Get order |
| PATCH | `/api/admin/orders/:id/confirm` | Yes | Confirm order |
| PATCH | `/api/admin/orders/:id/cancel` | Yes | Cancel order |
| PATCH | `/api/admin/orders/:id/status` | Yes | Update order status |
| GET | `/api/admin/customers` | Yes | List unique customers |
| GET | `/api/testimonials` | No | List testimonials |
| GET | `/api/testimonials/:id` | No | Get testimonial |
| POST | `/api/admin/testimonials` | Yes | Create testimonial |
| GET | `/api/admin/testimonials` | Yes | List testimonials |
| GET | `/api/admin/testimonials/:id` | Yes | Get testimonial |
| PUT | `/api/admin/testimonials/:id` | Yes | Update testimonial |
| DELETE | `/api/admin/testimonials/:id` | Yes | Delete testimonial |

---

## Frontend Flow Examples

### Storefront – load products

```javascript
const res = await apiFetch("/api/products");
const { data: products } = await res.json();
```

### Storefront – cart flow

```javascript
// 1. Create cart once
let cartId = localStorage.getItem("cartId");
if (!cartId) {
  const res = await apiFetch("/api/cart", { method: "POST" });
  const { data } = await res.json();
  cartId = data.cartId;
  localStorage.setItem("cartId", cartId);
}

// 2. Add to cart
await apiFetch(`/api/cart/${cartId}/add`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ productId, quantity: 1 }),
});

// 3. Cart summary
const zone = isInsideDhaka ? "inside_dhaka" : "outside_dhaka";
const summary = await apiFetch(`/api/cart/${cartId}/summary?deliveryZone=${zone}`);
```

### Storefront – checkout

```javascript
await apiFetch("/api/orders/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    cartId,
    customerName: name,
    phone: mobile,
    address: address,
    deliveryZone: zone,
  }),
});

localStorage.removeItem("cartId");
```

### Storefront – Buy Now

```javascript
await apiFetch("/api/orders/direct-buy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    productId,
    quantity: 1,
    customerName: name,
    phone: mobile,
    address: address,
    deliveryZone: zone,
  }),
});
```

### Admin – protected request helper

```javascript
export const adminFetch = (path, options = {}) => {
  const token = localStorage.getItem("adminToken");

  return apiFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      ...(options.body &&
        !(options.body instanceof FormData) && {
          "Content-Type": "application/json",
        }),
    },
  });
};

// Example
const dashboard = await adminFetch("/api/admin/dashboard");
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (Render sets automatically) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |
| `RENDER_EXTERNAL_URL` | Set automatically on Render |

---

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

Server runs at `http://localhost:5000`

```bash
npm run build
npm start
```

---

## Tech Stack

- Node.js + Express 5
- TypeScript
- MongoDB + Mongoose
- JWT authentication
- Cloudinary (product images)
- Multer (file upload)

---

## License

ISC
