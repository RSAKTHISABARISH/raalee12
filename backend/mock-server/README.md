# HelpDesk 360 Mock Backend

A lightweight Node.js/Express backend that directly connects to `backend/helpdesk360.db` using `sql.js`. It exposes all the REST API endpoints required by the Astro frontend on port 8080, serving as an instant, zero-setup alternative to the Spring Boot Java backend.

## Requirements
- Node.js (v18+)

## Setup & Run

1. Navigate to the mock server directory:
   ```bash
   cd backend/mock-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:8080` and serve all `/api/*` endpoints.
