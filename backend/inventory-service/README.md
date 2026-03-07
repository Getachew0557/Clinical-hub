Backend microservice for managing dental supplies, equipment, and stock auditing.

## Functionality
- **Inventory Tracking**: Maintain a real-time catalog of all clinic supplies and equipment.
- **Stock Auditing**: Automatically log every 'In' or 'Out' transaction with notes and performer IDs.
- **Low Stock Alerts**: Built-in filtering to identify items falling below predefined reorder levels.
- **Category Management**: Organize supplies by category (Supplies, Equipment, Meds, etc.) for easy searching.

---

## Project Structure
```text
inventory-service/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Inventory & StockTransaction logic
│   ├── middlewares/     # JWT Auth & Authorization
│   ├── models/          # InventoryItem & StockTransaction models
│   └── routes/          # API endpoints
├── .env                 # Environment variables
├── server.js            # Entry point
└── package.json         # Dependencies
```

## Environment Variables
```env
PORT=5006
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=dental_inventory_db
JWT_SECRET=your_jwt_secret
```

## Getting Started
1. Install dependencies: `npm install`
2. Run development: `npm run dev`

## Roles & Permissions
- **Admin**: Full access (Manage items, Update stock, Delete/Deactivate).
- **Receptionist**: Manage stock levels and add new items.
- **Doctor**: Read-only access to browse inventory and check availability.
- **Patient**: No access.

---

## API Reference

### Inventory Management
- `GET /api/inventory` -> List all items (All Staff).
- `GET /api/inventory/:id` -> Single item detail with last 10 transactions.
- `POST /api/inventory` -> Add new item (Admin/Receptionist).
- `PATCH /api/inventory/:id/stock` -> Update stock level (In/Out) with audit logging.
- `DELETE /api/inventory/:id` -> Deactivate item (Admin).

---

## Postman Testing Guide

### 1. Create Inventory Item
- **Responsibility**: Admin
- **Method**: `POST`
- **URL**: `http://localhost:5006/api/inventory`
- **Body (JSON)**:
  ```json
  {
    "name": "Disposable Surgical Gloves",
    "category": "Supplies",
    "quantity": 100,
    "unit": "Boxes",
    "reorderLevel": 20,
    "pricePerUnit": 15.50
  }
  ```
- **Expected Response**: `201 Created`. An audit log entry is automatically created.

### 2. Update Stock (Stock Out)
- **Responsibility**: Receptionist / Admin
- **Method**: `PATCH`
- **URL**: `http://localhost:5006/api/inventory/<item-uuid>/stock`
- **Body (JSON)**:
  ```json
  {
    "type": "Out",
    "quantity": 5,
    "notes": "Used for clinical procedure in Room 3"
  }
  ```
- **Expected Response**: `200 OK`. Item quantity decreases to 95.

### 3. View Low Stock Items
- **Method**: `GET`
- **URL**: `http://localhost:5006/api/inventory?lowStock=true`
- **Expected Response**: List of items where `quantity <= reorderLevel`.

### 4. Search by Category
- **Method**: `GET`
- **URL**: `http://localhost:5006/api/inventory?category=Supplies`
- **Expected Response**: Returns all items in the "Supplies" category.
