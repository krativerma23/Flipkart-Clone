import multer   from 'multer';
import path     from 'path';
import fs       from 'fs';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'products');

// Create directory if it doesn't exist on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const ALLOWED = /jpeg|jpg|png|webp|gif/;

const fileFilter = (_req, file, cb) => {
  const extOk  = ALLOWED.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = ALLOWED.test(file.mimetype);
  if (extOk && mimeOk) cb(null, true);
  else cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed'));
};

// Up to 5 images, 15 MB each, field name "images"
export const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
}).array('images', 5);
