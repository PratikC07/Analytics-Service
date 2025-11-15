# Analytics Ingestion Service

This is a high-performance analytics ingestion and reporting service, built to solve the "Problem Statement".The system is designed to handle a high volume of `ingestion` requests with extremely low latency.

This is achieved using a decoupled, asynchronous architecture. The "Ingestion" API's only job is to validate and queue an event, while a separate "Processor" service pulls from this queue to handle the database write. This ensures the client never waits for a database operation to complete.

## Tech Stack

- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Queue/Cache:** Redis
- **ORM:** Prisma
- **Queue Management:** BullMQ
- **Containerization:** Docker & Docker Compose
- **Validation:** Zod

## Features

- **Asynchronous Ingestion:** The `POST /api/ingestion/event` endpoint is lightning-fast. It validates the request with Zod, adds the job to a BullMQ queue, and returns a `202 Accepted` response.
- **Decoupled Services:** The system is split into two primary services :
  1.  `app`: A stateless Express server that runs the "Ingestion" and "Reporting" APIs.
  2.  `worker`: A background service that runs the "Processor", listening for jobs from the queue and writing them to the database.
- **Type-Safe & Robust:** The project uses **Zod** for schema-based validation on all incoming requests (both body and query params) and a global error handler for predictable, clean error responses.
- **Efficient Aggregation:** The `GET /api/reporting/stats` endpoint performs all database aggregations in a single, parallel `prisma.$transaction` call. This efficiently gathers total views, unique users, and top paths in one database round-trip.
- **Idempotent Worker:** The processor is designed to be idempotent. It leverages a `@@unique` constraint in the database and catches the `P2002` (unique constraint violation) error to safely skip processing duplicate jobs that may have been queued more than once.
- **Fully Containerized:** The entire application stack (app, worker, db, redis) is defined in `docker-compose.yml` for production and `docker-compose.dev.yml` for a hot-reloading development environment.
- **Optimized Production Image:** The `Dockerfile` uses a multi-stage build to create a small, secure, and optimized production image that contains _only_ the compiled JavaScript and production dependencies.

---

## 1\. Architecture Decision: Asynchronous Processing

## **The Challenge:**

The primary requirement is that the ingestion endpoint (`POST /event`) must be "extremely fast" and "not make the client wait for a database write to complete".

**The Solution:** An asynchronous, queue-based architecture was chosen.

1.  **Ingestion:** When a request hits `POST /api/ingestion/event`, the `app` service does two things:
    1.  Validates the data using Zod.
    2.  Pushes the validated event data into a **BullMQ job queue**.
2.  **Acknowledgement:** The API immediately returns a `202 Accepted` status to the client, confirming the event was received. This entire operation is measured in milliseconds.

3.  **Processing:** A separate `worker` service runs a BullMQ processor. This processor pulls jobs from the queue and performs the _actual_ database write (`prisma.event.create`).

## **Why BullMQ + Redis?**

- **Speed:** BullMQ is built on Redis, which is an in-memory data store, making the queue-add operation (the only thing the client waits for) incredibly fast.
- **Reliability & Persistence:** Unlike a simple message broker, BullMQ is a job queue. If the `worker` service crashes, the jobs are safely persisted in Redis, ready to be processed when the worker restarts.
- **Scalability:** This architecture is highly scalable. If job ingestion outpaces processing, we can simply scale the `worker` service by running more `worker` containers to process jobs in parallel. The `worker.ts` file is already configured with a concurrency of 50, meaning it can process 50 database writes concurrently.
- **Advanced Features:** BullMQ provides job retries with exponential backoff out of the box, which is essential for a robust system.

---

## 2\. Database Schema

A single table, `Event`, is used to store the analytics data.

| Field         | Type     | Description                                               |
| :------------ | :------- | :-------------------------------------------------------- |
| `id`          | String   | Unique identifier (UUID)                                  |
| `site_id`     | String   | The site the event belongs to (e.g., "site-abc-123")      |
| `event_type`  | String   | The type of event (e.g., "page_view")                     |
| `path`        | String?  | (Optional) The URL path of the event (e.g., "/pricing")   |
| `user_id`     | String?  | (Optional) The unique identifier for the user             |
| `timestamp`   | DateTime | The ISO 8601 timestamp when the event occurred            |
| `inserted_at` | DateTime | Automatically set when the record is inserted into the DB |

### Key Schema Features:

1.  **Performance Index:** `@@index([site_id, event_type, timestamp])`
    - **Why:** This index is critical for the `GET /stats` reporting API. It allows the database to quickly find all `page_view` events for a specific `site_id` within a given time range, ensuring the reporting endpoint is fast.
2.  **Idempotency Constraint:** `@@unique([site_id, user_id, path, timestamp])`
    - **Why:** This database-level constraint prevents duplicate events from being recorded. This is the foundation for our idempotent worker, which catches the "unique constraint violation" error (`P2002`) to safely skip jobs that have already been processed.

---

## 3\. Setup Instructions

### Prerequisites

- Docker and Docker Compose
- A terminal (like bash, zsh, or PowerShell)
- A text editor

### A. Production Environment

This will build the final, optimized production image using the multi-stage `Dockerfile` and run the `app`, `worker`, `db`, and `redis` services.

1.  **Create Environment File:**
    Copy the example `.env` file. This file holds all your secrets and configuration.

    ```sh
    cp .env.example .env
    ```

2.  **Configure Environment:**
    Open the newly created `.env` file and set the variables. For the Docker setup, you _must_ use the service names (`db` and `redis`) as the hosts.

    ```ini
    # .env
    PORT=3000
    DATABASE_URL="postgresql://postgres:postgres@db:5432/analytics_db"
    REDIS_URL="redis://redis:6379"
    ```

3.  **Build and Run:**
    Use `docker-compose.yml` to build and run all services in detached mode.

    ```sh
    docker compose up -d --build
    ```

4.  **How it Works:**

    - Docker Compose will build the production image from your `Dockerfile`.
    - It will start all four services (`app`, `worker`, `db`, `redis`).
    - The `app` service will automatically run `npm run migrate` to apply database migrations before starting the server.

The API will be available at `http://localhost:3000`.

### B. Development Environment (with Hot Reloading)

This method uses `Dockerfile.dev` and `docker-compose.dev.yml` to run the services with your local `src` folder mounted directly into the containers. This enables `nodemon` to automatically restart your server on any code change.

1.  **Create Environment File:**
    (If you haven't already from the production setup)

    ```sh
    cp .env.example .env
    ```

2.  **Configure Environment:**
    (If you haven't already) Ensure your `.env` file uses the Docker service names.

    ```ini
    # .env
    PORT=3000
    DATABASE_URL="postgresql://postgres:postgres@db:5432/analytics_db"
    REDIS_URL="redis://redis:6379"
    ```

3.  **Build and Run:**
    Use `docker-compose.dev.yml` to build and run the development services.

    ```sh
    docker compose -f docker-compose.dev.yml up -d --build
    ```

4.  **Run Migrations Manually:**
    The development server does not run migrations automatically. You must run them manually _once_ using `exec`:

    ```sh
    docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev
    ```

Your development environment is now running. You can edit the files in your local `src` folder, and the `app` and `worker` services in Docker will automatically restart.

### Stopping the Services

To stop all running containers (for either prod or dev):

```sh
# For prod
docker compose down

# For dev
docker compose -f docker-compose.dev.yml down
```

---

## 4\. API Usage (cURL Examples)

### `POST /api/ingestion/event`

This endpoint ingests a new analytics event.It expects a JSON body.

**Request:**

```sh
curl -X POST http://localhost:3000/api/ingestion/event \
-H "Content-Type: application/json" \
-d '{
    "site_id": "site-abc-123",
    "event_type": "page_view",
    "path": "/pricing",
    "user_id": "user-xyz-789",
    "timestamp": "2025-11-12T19:30:01Z"
}'
```

**Success Response (HTTP 202 Accepted):**
The server acknowledges the event and queues it for processing.

```json
{
  "status": "queued"
}
```

**Validation Error Response (HTTP 400 Bad Request):**
If validation fails (e.g., `site_id` is missing ), the server returns a descriptive error.

```json
{
  "status": "fail",
  "errors": [
    {
      "path": "body.site_id",
      "message": "site_id is required"
    }
  ]
}
```

### `GET /api/reporting/stats`

This endpoint retrieves aggregated analytics data.

**Example 1: Stats for a specific date**

**Request:**

```sh
curl "http://localhost:3000/api/reporting/stats?site_id=site-abc-123&date=2025-11-12"
```

**Success Response (HTTP 200 OK):**

```json
{
  "status": "success",
  "data": {
    "site_id": "site-abc-123",
    "date": "2025-11-12",
    "total_views": 1450,
    "unique_users": 212,
    "top_paths": [
      {
        "path": "/pricing",
        "views": 700
      },
      {
        "path": "/blog/post-1",
        "views": 500
      },
      {
        "path": "/",
        "views": 250
      }
    ]
  }
}
```

**Example 2: All-time stats (date parameter omitted)**

**Request:**

```sh
curl "http://localhost:3000/api/reporting/stats?site_id=site-abc-123"
```

**Success Response (HTTP 200 OK):**
The `date` field will show `"all-time"`.

```json
{
  "status": "success",
  "data": {
    "site_id": "site-abc-123",
    "date": "all-time",
    "total_views": 10250,
    "unique_users": 1842,
    "top_paths": [
      {
        "path": "/pricing",
        "views": 4200
      },
      {
        "path": "/",
        "views": 3100
      },
      {
        "path": "/blog",
        "views": 1500
      }
    ]
  }
}
```

**Error Response (HTTP 404 Not Found):**
If no data is found for the given criteria.

```json
{
  "status": "fail",
  "message": "No analytics data found for the specified criteria."
}
```

## 5. API ENDPOINTS

Here are the API endpoints, parameters, and responses.

### `GET /api/healthcheck`

A simple health check endpoint to confirm the API service is running.

- **Parameters:** None
- **Success Response (200 OK):**
  ```json
  {
    "message": "API is running, healthy, and ready!"
  }
  ```

---

### `POST /api/ingestion/event`

Ingests a new analytics event. This endpoint validates the data and adds it to a queue for processing, returning an immediate response.

- **Parameters (Body):**
  - `site_id` (string, **Required**): The ID of the site.
  - `event_type` (string, **Required**): The type of event (e.g., "page_view").
  - `timestamp` (string, **Required**): An ISO 8601 datetime string.
  - `path` (string, Optional): The URL path.
  - `user_id` (string, Optional): The user's unique identifier.
- **Success Response (202 Accepted):**
  ```json
  {
    "status": "queued"
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "status": "fail",
    "errors": [
      {
        "path": "body.site_id",
        "message": "site_id is required"
      }
    ]
  }
  ```

---

### `GET /api/reporting/stats`

Retrieves an aggregated report of analytics data.

- **Parameters (Query):**
  - `site_id` (string, **Required**): The ID of the site to report on.
  - `date` (string, Optional): A specific date in `YYYY-MM-DD` format. If omitted, returns all-time data.
- **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "site_id": "site-abc-123",
      "date": "2025-11-12", // or "all-time" if date param is omitted
      "total_views": 1450,
      "unique_users": 212,
      "top_paths": [
        { "path": "/pricing", "views": 700 },
        { "path": "/blog/post-1", "views": 500 },
        { "path": "/", "views": 250 }
      ]
    }
  }
  ```
- **Error Response (404 Not Found):**
  ```json
  {
    "status": "fail",
    "message": "No analytics data found for the specified criteria."
  }
  ```
