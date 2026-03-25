# TechStore Monorepo Context

## Project Overview
This project is a full-stack e-commerce application ("TechStore") organized as a monorepo. It consists of a **Next.js frontend** (`apps/web`) and an **Express.js backend** (`apps/api`), sharing code via local packages.

## Architecture

### Monorepo Structure
*   **Workspaces:** Managed via `pnpm-workspace.yaml` (or npm workspaces in `package.json`).
*   **`apps/web`**: Frontend application (Next.js 14 App Router).
*   **`apps/api`**: Backend API (Node.js/Express).
*   **`packages/types`**: Shared TypeScript definitions.
*   **`packages/constants`**: Shared constant values.

### Backend (`apps/api`)
*   **Framework:** Express.js
*   **Database:** MongoDB (using Mongoose).
*   **Authentication:** JWT (JSON Web Tokens) with `bcrypt` for password hashing.
*   **Real-time:** `socket.io` for order status updates.
*   **File Uploads:** `multer` (stores files locally in `uploads/`).
*   **Email:** `nodemailer` for notifications.
*   **Key Files:**
    *   `server.js`: Main entry point. Configures Middleware, Database, Socket.io, and Routes.
    *   `config/database.js`: MongoDB connection logic.
    *   `middleware/auth.js`: JWT verification and role-based access control (`requireAdmin`).
    *   `models/`: Mongoose schemas (User, Product, Order, Category, Blog, Contact).

### Frontend (`apps/web`)
*   **Framework:** Next.js 14 (App Router).
*   **Styling:** Tailwind CSS.
*   **State Management:** React Context (`AuthContext`, `OrderContext`, `SocketContext`).
*   **UI Libraries:** `lucide-react` (icons), `react-hot-toast` (notifications), `recharts` (charts).
*   **Key Files:**
    *   `app/layout.tsx`: Root layout, includes `AuthProvider`, `SocketProvider`, `ClientProviders`.
    *   `app/page.tsx`: Landing page.
    *   `admin/`: Admin dashboard routes.
    *   `contexts/`: React Context providers.

## Building and Running

### Prerequisites
*   Node.js (>=18)
*   MongoDB Instance (Local or Atlas)
*   `.env` file in `apps/api` (containing `MONGODB_URI`, `JWT_SECRET`, etc.)

### Commands
*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Start Development (Both):**
    ```bash
    npm run dev
    ```
    (Runs `npm:dev:*` concurrently)
*   **Start API Only:**
    ```bash
    npm run dev:api
    ```
*   **Start Web Only:**
    ```bash
    npm run dev:web
    ```
*   **Linting:**
    ```bash
    npm run lint
    ```

## Development Conventions

*   **Type Safety:** Uses TypeScript. Shared types are defined in `packages/types`.
*   **API Routes:** Backend routes are prefixed with `/api`.
*   **Authentication:**
    *   Tokens passed in `Authorization` header: `Bearer <token>`.
    *   Role-based protection using middleware (`authenticateToken`, `requireAdmin`).
*   **Images:**
    *   Backend serves static files from `uploads/` via `app.use('/uploads', ...)`
    *   Frontend constructs URLs relative to the API URL.

## Pricing Architecture (FootMark)
*   **Model:** `Total Price = Base Product Price + Variant Surcharge(s)`.
*   **Backend Verification (`orderController.js`):** Implements Zero Trust price verification. The server fetches the base price from the DB and adds verified surcharges from the selected variant options during order creation.
*   **Variant Logic:** Variant prices are treated as **surcharges (offsets)** relative to the base price, not absolute prices.
*   **Frontend Calculation:** 
    *   `CartContext.tsx`: `getTotalPrice` sums `(item.product.price + surcharge) * quantity`.
    *   `ProductCard.tsx`: `getLowestPrice` calculates the minimum total price (Base + minimum surcharges).
    *   `ProductModal.tsx` (Admin): Input fields for variant prices are labeled and treated as surcharges (e.g., `+ 100,000đ`).
*   **Consistency:** All order items saved to the database (`Order` model) store the final calculated price (Base + Surcharge) in the `item.price` field for historical accuracy.
