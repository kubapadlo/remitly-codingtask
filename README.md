# Stock Market Simulator

REST API simulating a simplified stock market with high availability.

---

## Quick start

### Requirements

- Docker Desktop (includes docker-compose)
- PowerShell 5+ (Windows) or bash (Linux/macOS)

### Windows (PowerShell)

```powershell
.\start.ps1 -Port 8080
```

### Linux / macOS

```bash
chmod +x start.sh
./start.sh 8080
```

The application will be available at `http://localhost:8080`. The port number is a required parameter.

### Stop

```bash
docker-compose down
```

---

## REST API

Base URL: `http://localhost:{PORT}`

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| POST | `/wallets/{id}/stocks/{name}` | 200 / 400 / 404 | Buy or sell one unit of a stock |
| GET | `/wallets/{id}` | 200 | Get wallet state |
| GET | `/wallets/{id}/stocks/{name}` | 200 / 404 | Get quantity of a single stock in wallet |
| GET | `/stocks` | 200 | Get bank state |
| POST | `/stocks` | 200 | Set bank state |
| GET | `/log` | 200 | Get audit log |
| POST | `/chaos` | - | Kill the instance handling this request |

---

## Tech stack

| Technology | Version | Role |
|------------|---------|------|
| Node.js | 20 LTS | Runtime |
| TypeScript | 5.x | Type safety |
| Express | 4.x | HTTP framework |
| TypeORM | 0.3.x | ORM / query builder |
| PostgreSQL | 15 | Persistent data store |
| Docker + Compose | latest | Containerisation & orchestration |
| nginx | alpine | Reverse proxy / load balancer |

---

## Architecture

### Layer separation: routes → controllers → services

```
src/
├── routes/
│   └── routes.ts          # HTTP path registration only
├── controllers/
│   ├── StockController.ts # Parse req → call service → send res
│   └── WalletController.ts
├── services/
│   ├── StockService.ts    # Business logic: bank state
│   ├── WalletService.ts   # Business logic: buy/sell, wallet reads
│   └── AuditLogService.ts # Business logic: log reads and writes
└── entities/
    ├── BankStock.ts
    ├── WalletStock.ts
    └── AuditLog.ts
```

#### Routes (`src/routes/routes.ts`)

Responsible only for registering HTTP paths and delegating to the correct controller method. Contains no logic - one line per endpoint.

#### Controllers (`src/controllers/`)

Parse HTTP request parameters and body, call the appropriate service method, and map the result to an HTTP response (status code + body). Controllers never access the database directly.

- `StockController` - handles `GET /stocks` and `POST /stocks`
- `WalletController` - handles `GET /wallets/:id`, `GET /wallets/:id/stocks/:name`, `POST /wallets/:id/stocks/:name`

#### Services (`src/services/`)

Contain all business logic. Services are fully testable without mocking Express - they receive plain arguments and return plain values or typed result objects (`TradeResult`).

- `StockService` - read and overwrite the bank state
- `WalletService` - read wallet state, execute buy/sell within a database transaction, enforce all business rules
- `AuditLogService` - read the audit log, record a new entry (accepts an `EntityManager` so it participates in the caller's transaction)

---

## Database

### Why PostgreSQL

PostgreSQL was chosen over SQLite because the application runs as multiple Docker containers sharing a single database. SQLite stores data in a file - with multiple containers, each would need access to the same file, which is unreliable under concurrent writes. PostgreSQL is a client-server database designed for concurrent access, making it the correct choice for a multi-instance deployment.

### Schema

| Entity | Primary key | Columns |
|--------|-------------|---------|
| `BankStock` | `name` | `quantity` |
| `WalletStock` | `(walletId, stockName)` | `quantity` |
| `AuditLog` | `id` (auto-increment) | `type`, `walletId`, `stockName`, `createdAt` |

### Transactions

Every buy/sell operation runs inside a single database transaction. The bank deduction and wallet credit (or vice versa) happen atomically - if either write fails, both are rolled back and the audit log entry is not written. This prevents the bank losing stock without the wallet gaining it, or vice versa.

`POST /stocks` also runs in a transaction - `clear()` and `save()` happen together so the bank is never left empty mid-update.

---

## High availability

| Service | Exposed port | Restart policy |
|---------|-------------|----------------|
| `db` | internal only | `unless-stopped` |
| `app1` | internal only | `on-failure` |
| `app2` | internal only | `on-failure` |
| `nginx` | `{PORT}:80` | `unless-stopped` |

`app1` and `app2` start only after `db` passes its healthcheck (`pg_isready`), eliminating the race condition between the app and the database.

### nginx as load balancer

nginx uses a round-robin `upstream` block to distribute requests between `app1` and `app2`. Each incoming request goes to the next available instance alternately. If an instance is unavailable, nginx detects the failed connection within `proxy_connect_timeout` (2 s) and forwards the request to the other instance instead.

```nginx
upstream backend {
  server app1:3000;
  server app2:3000;
}
```

### Surviving `/chaos`

`POST /chaos` calls `process.exit(1)`, which immediately kills the Node.js process in that container. Docker detects the exit and, because `restart: on-failure` is set, schedules a restart. During the brief restart window, nginx routes all traffic to the surviving instance. Once the restarted container is healthy, nginx resumes distributing traffic to both.

The shared PostgreSQL database means both instances always have the same view of the data - no replication lag, no split-brain.

---