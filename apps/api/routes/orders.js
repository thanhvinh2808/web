import express from 'express';
import { createOrder } from '../controller/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public route for creating order (Guest/User)
// Note: If you require login, add authenticateToken. 
// Based on server.js analysis, it seemed public or handled user ID manually.
// Checking CheckoutPage.tsx: it sends 'Authorization: Bearer' if logged in.
// Let's use `authenticateToken` BUT allow guest if the logic supports it?
// The previous code in server.js didn't use `authenticateToken` middleware on the route itself 
// explicitly in the `app.post`, but the frontend sends token.
// The `Order` model usually requires `userId` if it's a user order.
// Let's keep it open but recommend auth if `userId` is present.
// For safety/consistency with previous server.js, I will NOT force `authenticateToken` middleware globally here 
// unless I'm sure guest checkout is disabled. 
// FootMark seems to allow guest checkout or handles it inside.
// However, looking at CheckoutPage.tsx: "if (!isAuthenticated) return null;" -> It requires login.
// So I will apply authenticateToken if needed, but to be safe and match `server.js` (which didn't have it explicitly on the line `app.post`), I'll leave it open and let the controller/validation handle it.
// Actually, safely, let's just use the controller.

router.post('/', createOrder);

export default router;
