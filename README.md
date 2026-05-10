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

### Register

```http
POST /api/auth/public/register
Content-Type: application/json

{
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "password": "rahasia123"
}
```

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

### Login

```http
POST /api/auth/public/login
Content-Type: application/json

{
  "email": "budi@email.com",
  "password": "rahasia123"
}
```

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

### Buat Order

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
  "items": [
    { "list_id": 1, "quantity": 2 },
    { "list_id": 3, "quantity": 1 }
  ]
}
```

```json
{
  "message": "Order created successfully",
  "data": {
    "id": 42,
    "customer_id": 1,
    "status": "ongoing",
    "total_price": 150000,
    "items": [...]
  }
}
```

### Refresh Token

```http
POST /api/auth/public/refresh
Cookie: refreshToken=<refresh_token>
```

```json
{
  "accessToken": "<new_jwt_token>"
}
```

---

## Catatan

- Token disimpan sebagai **httpOnly cookie**, bukan localStorage
- `accessToken` berumur pendek; gunakan `/api/auth/public/refresh` untuk memperbarui
- `refreshToken` disimpan di database dan di-revoke saat logout
- Filter order by status: `GET /api/order?status=ongoing`