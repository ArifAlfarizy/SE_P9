# Toko Alit API

Backend REST API berbasis microservices untuk aplikasi toko, dibangun dengan Node.js + Express.

## Tech Stack

- **Node.js** + **Express**
- **MySQL** — database
- **JWT** — autentikasi (access + refresh token via httpOnly cookie)
- **bcrypt** — hashing password
- **http-proxy-middleware** — API Gateway

---

## Arsitektur

```
Client
  │
  ▼
API Gateway        :4098   ← satu-satunya pintu masuk
  ├── /api/auth  ──────►  Auth Service         :4198
  ├── /api/list  ──────►  List & Order Service :4298
  └── /api/order ──────►  List & Order Service :4298
```

Gateway memverifikasi JWT lalu menyuntikkan `x-user-id` dan `x-user-role` ke header sebelum meneruskan request ke service.

---

## Struktur Direktori

```
project/
├── gateway/                  # API Gateway (port 4098)
│   ├── index.js
│   ├── authMiddleware.js
│   └── .env
└── services/
    ├── auth-service/         # Auth Service (port 4198)
    │   └── src/
    └── list-order-service/   # List & Order Service (port 4298)
        └── src/
```

---

## Cara Menjalankan

### Prasyarat

- Node.js v18+
- MySQL berjalan di port 3306

### 1. Install dependencies

```bash
cd gateway && npm install
cd services/auth-service && npm install
cd services/list-order-service && npm install
```

### 2. Konfigurasi `.env`

**`gateway/.env`**
```env
JWT_ACCESS_SECRET=Alit
JWT_REFRESH_SECRET=Reja
```

**`services/auth-service/.env`**
```env
PORT=4198
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=toko_alit_auth_db
JWT_ACCESS_SECRET=Alit
JWT_REFRESH_SECRET=Reja
SALT_ROUNDS=12
```

**`services/list-order-service/.env`**
```env
PORT=4298
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=toko_alit_list_store_db
```

### 3. Setup database

```bash
# Jalankan dari direktori gateway/
npm run migrate   # buat tabel
npm run seed      # isi data awal
# atau keduanya:
npm run setup
```

### 4. Jalankan

```bash
# Dari direktori gateway/ — menjalankan semua service sekaligus
npm run dev
```

---

## Endpoints

Semua request dikirim ke Gateway di `http://localhost:4098`.

### Auth

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/auth/public/register` | — | Registrasi user baru |
| `POST` | `/api/auth/public/login` | — | Login |
| `POST` | `/api/auth/public/logout` | — | Logout |
| `POST` | `/api/auth/public/refresh` | — | Perbarui access token |
| `POST` | `/api/auth/admin/register` | JWT (admin) | Registrasi admin baru |

### List (Produk)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/list` | JWT | Ambil semua produk |
| `GET` | `/api/list/:id` | JWT | Ambil produk by ID |
| `POST` | `/api/list` | JWT (admin) | Tambah produk |
| `PATCH` | `/api/list/:id` | JWT (admin) | Update produk |
| `DELETE` | `/api/list/:id` | JWT (admin) | Hapus produk |

### Order

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/order` | JWT (admin) | Ambil semua order, bisa filter `?status=` |
| `GET` | `/api/order/my-orders` | JWT | Ambil order milik user yang login |
| `GET` | `/api/order/:id` | JWT (admin) | Ambil order by ID |
| `POST` | `/api/order` | JWT | Buat order baru |
| `PATCH` | `/api/order/:id/cancel` | JWT | Batalkan order |
| `PATCH` | `/api/order/:id/complete` | JWT (admin) | Tandai order selesai |

---

## Contoh Request & Response

---

### 🔐 Auth

#### Register User

```http
POST /api/auth/public/register
Content-Type: application/json

{
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "password": "rahasia123"
}
```

✅ `201 Created`
```json
{
  "message": "Register successfully",
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@email.com",
    "role": "user"
  },
  "accessToken": "<jwt_token>"
}
```

❌ `400 Bad Request` — field tidak lengkap
```json
{ "message": "Required fields: name, email, and password" }
```

❌ `409 Conflict` — email sudah dipakai
```json
{ "message": "Email already registered. Try logging in with that email!" }
```

---

#### Login

```http
POST /api/auth/public/login
Content-Type: application/json

{
  "email": "budi@email.com",
  "password": "rahasia123"
}
```

✅ `200 OK`
```json
{
  "message": "Berhasil login",
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@email.com"
  },
  "accessToken": "<jwt_token>"
}
```

❌ `401 Unauthorized` — user tidak ditemukan
```json
{ "message": "User not found. Try register!" }
```

❌ `401 Unauthorized` — password salah
```json
{ "message": "Wrong email or password" }
```

---

#### Logout

```http
POST /api/auth/public/logout
Cookie: refreshToken=<refresh_token>
```

✅ `200 OK`
```json
{ "message": "Logged out" }
```

❌ `401 Unauthorized`
```json
{ "error": "No token provided." }
```

---

#### Refresh Token

```http
POST /api/auth/public/refresh
Cookie: refreshToken=<refresh_token>
```

✅ `200 OK`
```json
{ "accessToken": "<new_jwt_token>" }
```

❌ `403 Forbidden` — token sudah di-revoke atau expired
```json
{ "message": "Refresh token revoked or expired" }
```

---

#### Register Admin

```http
POST /api/auth/admin/register
Content-Type: application/json
Cookie: accessToken=<jwt_token>

{
  "name": "Admin Toko",
  "email": "admin@toko.com",
  "password": "adminpass123"
}
```

✅ `201 Created`
```json
{
  "message": "Admin register successfully",
  "data": {
    "id": 2,
    "name": "Admin Toko",
    "email": "admin@toko.com",
    "role": "admin"
  },
  "accessToken": "<jwt_token>"
}
```

❌ `403 Forbidden` — bukan admin
```json
{ "message": "Forbidden access" }
```

---

### 📦 List (Produk)

#### Get All List

```http
GET /api/list
Cookie: accessToken=<jwt_token>
```

✅ `200 OK`
```json
{
  "message": "Lists data",
  "data": [
    {
      "id": 1,
      "name": "Kucing Persia",
      "species": "Kucing",
      "gender": "Betina",
      "age_in_months": 6,
      "price": 1500000,
      "stock": 3,
      "status": "available"
    },
    {
      "id": 2,
      "name": "Hamster Putih",
      "species": "Hamster",
      "gender": "Jantan",
      "age_in_months": 2,
      "price": 75000,
      "stock": 10,
      "status": "available"
    }
  ]
}
```

---

#### Get List by ID

```http
GET /api/list/1
Cookie: accessToken=<jwt_token>
```

✅ `200 OK`
```json
{
  "message": "List data",
  "data": {
    "id": 1,
    "name": "Kucing Persia",
    "species": "Kucing",
    "gender": "Betina",
    "age_in_months": 6,
    "price": 1500000,
    "stock": 3,
    "status": "available"
  }
}
```

❌ `404 Not Found`
```json
{ "message": "List not found" }
```

---

#### Tambah List (admin)

```http
POST /api/list
Content-Type: application/json
Cookie: accessToken=<jwt_token>

{
  "name": "Kelinci Anggora",
  "species": "Kelinci",
  "gender": "Betina",
  "age_in_months": 4,
  "price": 250000,
  "stock": 5,
  "status": "available"
}
```

✅ `201 Created`
```json
{
  "message": "List created successfully",
  "data": {
    "id": 3,
    "name": "Kelinci Anggora",
    "species": "Kelinci",
    "gender": "Betina",
    "age_in_months": 4,
    "price": 250000,
    "stock": 5,
    "status": "available"
  }
}
```

❌ `403 Forbidden`
```json
{ "message": "Forbidden access" }
```

---

#### Update List (admin)

```http
PATCH /api/list/3
Content-Type: application/json
Cookie: accessToken=<jwt_token>

{
  "price": 275000,
  "stock": 8
}
```

✅ `200 OK`
```json
{
  "message": "List updated successfully",
  "data": {
    "id": 3,
    "name": "Kelinci Anggora",
    "price": 275000,
    "stock": 8,
    "status": "available"
  }
}
```

---

#### Hapus List (admin)

```http
DELETE /api/list/3
Cookie: accessToken=<jwt_token>
```

✅ `200 OK`
```json
{
  "message": "List deleted successfully",
  "data": {
    "id": 3,
    "name": "Kelinci Anggora"
  }
}
```

❌ `404 Not Found`
```json
{ "message": "List not found" }
```

---

### 🛒 Order

#### Get All Orders (admin)

```http
GET /api/order
Cookie: accessToken=<jwt_token>

# Filter by status (opsional)
GET /api/order?status=ongoing
```

✅ `200 OK`
```json
{
  "message": "Orders data",
  "data": [
    {
      "id": 1,
      "customer_id": 1,
      "customer_name": "Budi Santoso",
      "customer_phone": "08123456789",
      "customer_address": "Jl. Merdeka No. 1, Jakarta",
      "payment_method": "transfer",
      "status": "ongoing",
      "notes": "Titip di depan pintu",
      "total_price": 3075000,
      "created_at": "2024-01-15T08:30:00.000Z"
    }
  ]
}
```

---

#### Get My Orders (user)

```http
GET /api/order/my-orders
Cookie: accessToken=<jwt_token>
```

✅ `200 OK`
```json
{
  "message": "My orders data",
  "data": [
    {
      "id": 1,
      "customer_name": "Budi Santoso",
      "status": "ongoing",
      "total_price": 3075000,
      "created_at": "2024-01-15T08:30:00.000Z",
      "items": [
        { "list_id": 1, "name": "Kucing Persia", "quantity": 2, "price": 1500000 },
        { "list_id": 2, "name": "Hamster Putih", "quantity": 1, "price": 75000 }
      ]
    }
  ]
}
```

---

#### Get Order by ID (admin)

```http
GET /api/order/1
Cookie: accessToken=<jwt_token>
```

✅ `200 OK`
```json
{
  "message": "Order data",
  "data": {
    "id": 1,
    "customer_id": 1,
    "customer_name": "Budi Santoso",
    "customer_phone": "08123456789",
    "customer_address": "Jl. Merdeka No. 1, Jakarta",
    "payment_method": "transfer",
    "status": "ongoing",
    "notes": "Titip di depan pintu",
    "total_price": 3075000,
    "created_at": "2024-01-15T08:30:00.000Z",
    "items": [
      { "list_id": 1, "name": "Kucing Persia", "quantity": 2, "price": 1500000 },
      { "list_id": 2, "name": "Hamster Putih", "quantity": 1, "price": 75000 }
    ]
  }
}
```

❌ `404 Not Found`
```json
{ "message": "Order not found" }
```

---

#### Buat Order

```http
POST /api/order
Content-Type: application/json
Cookie: accessToken=<jwt_token>

{
  "customer_name": "Budi Santoso",
  "customer_phone": "08123456789",
  "customer_address": "Jl. Merdeka No. 1, Jakarta",
  "payment_method": "transfer",
  "notes": "Titip di depan pintu",
  "cod_schedule_at": "2024-01-20T10:00:00.000Z",
  "items": [
    { "list_id": 1, "quantity": 2 },
    { "list_id": 2, "quantity": 1 }
  ]
}
```

✅ `201 Created`
```json
{
  "message": "Order created successfully",
  "data": {
    "id": 42,
    "customer_id": 1,
    "customer_name": "Budi Santoso",
    "customer_phone": "08123456789",
    "customer_address": "Jl. Merdeka No. 1, Jakarta",
    "payment_method": "transfer",
    "status": "ongoing",
    "notes": "Titip di depan pintu",
    "total_price": 3075000,
    "created_at": "2024-01-15T08:30:00.000Z",
    "items": [
      { "list_id": 1, "name": "Kucing Persia", "quantity": 2, "price": 1500000 },
      { "list_id": 2, "name": "Hamster Putih", "quantity": 1, "price": 75000 }
    ]
  }
}
```

❌ `400 Bad Request` — field wajib tidak ada
```json
{ "message": "customer_name, customer_phone, and customer_address are required" }
```

❌ `400 Bad Request` — items kosong
```json
{ "message": "Order must have at least one item" }
```

❌ `400 Bad Request` — stok tidak cukup
```json
{ "message": "Insufficient stock for item: Kucing Persia" }
```

---

#### Batalkan Order

```http
PATCH /api/order/42/cancel
Cookie: accessToken=<jwt_token>
```

✅ `200 OK`
```json
{
  "message": "Order canceled successfully",
  "data": {
    "id": 42,
    "status": "canceled"
  }
}
```

❌ `400 Bad Request` — order tidak bisa dibatalkan (sudah selesai/sudah canceled)
```json
{ "message": "Order cannot be canceled" }
```

❌ `403 Forbidden` — user mencoba cancel order orang lain
```json
{ "message": "Forbidden access" }
```

---

#### Selesaikan Order (admin)

```http
PATCH /api/order/42/complete
Cookie: accessToken=<jwt_token>
```

✅ `200 OK`
```json
{
  "message": "Order completed successfully",
  "data": {
    "id": 42,
    "status": "completed"
  }
}
```

❌ `400 Bad Request` — order tidak bisa diselesaikan
```json
{ "message": "Order cannot be completed" }
```

---

## Catatan

- Token disimpan sebagai **httpOnly cookie**, bukan localStorage
- `accessToken` berumur pendek; gunakan `/api/auth/public/refresh` untuk memperbarui
- `refreshToken` disimpan di database dan di-revoke saat logout
- Filter order by status: `GET /api/order?status=ongoing`