// ✅ Load environment variables
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading from current directory (apps/api) or root
dotenv.config({ path: path.join(__dirname, '.env') });
// fallback if needed, but the above is safer if .env is next to server.js
