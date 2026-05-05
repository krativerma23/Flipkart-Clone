# ShopKart — Flipkart Replica E-Commerce Application

## Overview

ShopKart is a full-stack e-commerce web application inspired by Flipkart. It allows users to browse products, search by keyword, manage a shopping cart, and place orders. Admins can manage the entire product catalogue through a dedicated dashboard. Built with **Next.js**, **Node.js**, **Express**, and **MongoDB**.

---

## Key Features

- **User Authentication** — Register, log in, and log out securely using JWT
- **Product Browsing** — Browse products by category with images, prices, and ratings
- **Search** — Live search with debounced suggestions and keyword highlighting
- **Add to Cart** — Cart works for both guests (localStorage) and logged-in users (database)
- **Checkout & Orders** — Place orders with a shipping address and payment method selection
- **Order Management** — Users can view their order history and track order status
- **Admin Dashboard** — Admins see stats (products, orders, users, revenue) at a glance
- **Product Management** — Admins can add, edit, and delete products
- **Image Upload** — Upload up to 5 product images (JPG, PNG, WebP, GIF · 15 MB each)
- **Responsive Design** — Works across mobile, tablet, and desktop screens

---

## Admin Panel

Admins access a dedicated dashboard after login at `/admin`.

- View live stats — total products, orders, customers, and revenue
- **Add products** with name, brand, category, price, MRP, stock, description, and images
- **Edit products** — update any field or replace images
- **Delete products** with an inline confirmation prompt
- Search and paginate through the full product catalogue
- Upload product images directly from their device (drag-and-drop supported)

---

## User Functionality

- Browse the home page with categorised product grids (Deals, Electronics, Fashion)
- Search for products by name, brand, or description with live suggestions
- Add items to cart — works without an account; cart syncs to the database on login
- Adjust quantities or remove items from the cart
- Checkout with a delivery address form and choice of Cash on Delivery or Online Payment
- View past orders with status tracking (Placed → Processing → Shipped → Delivered)

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS    |
| Backend  | Node.js, Express.js                     |
| Database | MongoDB, Mongoose                       |
| Auth     | JWT (JSON Web Tokens), bcryptjs         |
| Uploads  | Multer (disk storage)                   |

---

## Getting Started

```bash
# Install dependencies and start both client and server
npm install
npm run dev
```

- Frontend runs at `http://localhost:3000`
- Backend runs at `http://localhost:5000`
- Seed the database: `cd server && node seed.js`

### Demo Accounts

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | admin@flipkart.com     | Admin@1234 |
| User  | user1@flipkart.com     | User@1234  |
