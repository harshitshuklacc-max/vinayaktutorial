import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

dotenv.config();

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const adminAuth = getAuth();
const app = express();
const PORT = 3000;

const SESSION_COOKIE_NAME = 'vt_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`${firebaseConfig.projectId}:${firebaseConfig.appId}`).digest('hex');

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);
    if (!record || record.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a few minutes before trying again.',
      });
    }
    record.count += 1;
    return next();
  };
}

function signSessionPayload(payload: object): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionCookie(token: string): Record<string, unknown> | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (typeof parsed.exp === 'number' && parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  decodedToken?: DecodedIdToken;
}

async function requireFirebaseBearer(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
  }
  const idToken = authHeader.slice(7);
  try {
    req.decodedToken = await adminAuth.verifyIdToken(idToken);
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid Firebase ID token' });
  }
}

app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// SEO: robots.txt & sitemap.xml
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin/',
      'Disallow: /faculty/',
      'Disallow: /student/',
      `Sitemap: ${baseUrl}/sitemap.xml`,
    ].join('\n')
  );
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const publicPaths = ['', '/about', '/courses', '/faculty', '/gallery', '/notices', '/contact', '/admission'];
  const urls = publicPaths
    .map(
      (p) => `  <url>
    <loc>${baseUrl}${p || '/'}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === '' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
  );
});

// Health & Server Integration Status (booleans only, never secrets)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    institute: 'Vinayak Tutorial',
    integrations: {
      razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      whatsappConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_UPLOAD_PRESET),
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    },
  });
});

// Auth Session Management
app.post('/api/auth/session', rateLimit(20, 15 * 60 * 1000), async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ error: 'idToken is required' });
  }
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const cookieToken = signSessionPayload({
      uid: decoded.uid,
      email: decoded.email || '',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie(SESSION_COOKIE_NAME, cookieToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.json({ ok: true, uid: decoded.uid, email: decoded.email });
  } catch {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
});

app.get('/api/auth/session', (req, res) => {
  const raw = req.cookies?.[SESSION_COOKIE_NAME];
  if (!raw) return res.json({ authenticated: false });
  const payload = verifySessionCookie(raw);
  if (!payload) return res.json({ authenticated: false });
  return res.json({ authenticated: true, uid: payload.uid, email: payload.email });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// Password Hashing Endpoint (bcrypt)
app.post('/api/security/hash-password', requireFirebaseBearer, async (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be 6 to 128 characters' });
  }
  const hash = await bcrypt.hash(password, 10);
  return res.json({ hash });
});

// Validated File Upload Endpoint (PDF, JPG, PNG, WebP)
const ALLOWED_MIME_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.post('/api/upload', requireFirebaseBearer, rateLimit(30, 10 * 60 * 1000), (req, res) => {
  const { fileName, mimeType, base64Data } = req.body || {};
  if (!mimeType || !ALLOWED_MIME_EXT[mimeType]) {
    return res.status(400).json({ error: 'Unsupported file type. Allowed: PDF, JPG, PNG, WebP.' });
  }
  if (typeof base64Data !== 'string' || !base64Data.length) {
    return res.status(400).json({ error: 'File content is required.' });
  }
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.byteLength > 4 * 1024 * 1024) {
    return res.status(400).json({ error: 'File exceeds 4 MB size limit.' });
  }
  const safeBase = String(fileName || 'document')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 48);
  const finalName = `${safeBase}_${Date.now()}${ALLOWED_MIME_EXT[mimeType]}`;
  fs.writeFileSync(path.join(uploadsDir, finalName), buffer);
  return res.json({ url: `/uploads/${finalName}`, fileName: finalName, size: buffer.byteLength });
});

// Razorpay Order Creation & Signature Verification
app.post('/api/payments/razorpay/order', requireFirebaseBearer, async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return res.status(503).json({
      configured: false,
      error: 'Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured on the server.',
    });
  }
  const { amountInr, receipt, notes } = req.body || {};
  const amountPaise = Math.round(Number(amountInr) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    return res.status(400).json({ error: 'Invalid payment amount.' });
  }
  try {
    const authToken = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: String(receipt || `VT_${Date.now()}`).slice(0, 40),
        notes: notes || {},
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.description || 'Razorpay order creation failed' });
    }
    return res.json({ order: data, keyId });
  } catch {
    return res.status(502).json({ error: 'Unable to reach Razorpay API.' });
  }
});

app.post('/api/payments/razorpay/verify', requireFirebaseBearer, (req, res) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(503).json({ verified: false, error: 'Razorpay secret is not configured.' });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ verified: false, error: 'Missing Razorpay verification fields.' });
  }
  const generated = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  const verified = crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(String(razorpay_signature)));
  if (!verified) {
    return res.status(400).json({ verified: false, error: 'Razorpay signature verification failed.' });
  }
  return res.json({ verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
});

// Configurable WhatsApp Cloud API Notification Endpoint (Honest Status, Never Fake)
app.post('/api/notifications/whatsapp', requireFirebaseBearer, async (req, res) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const { to, message } = req.body || {};
  if (!to || !message) {
    return res.status(400).json({ sent: false, error: 'Recipient number and message are required.' });
  }
  if (!token || !phoneNumberId) {
    return res.status(200).json({
      sent: false,
      configured: false,
      message: 'WhatsApp Cloud API credentials are not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
    });
  }
  const normalizedPhone = String(to).replace(/[^\d]/g, '');
  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedPhone.length === 10 ? `91${normalizedPhone}` : normalizedPhone,
        type: 'text',
        text: { body: String(message).slice(0, 1000) },
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      return res.status(502).json({
        sent: false,
        configured: true,
        error: result?.error?.message || 'WhatsApp API rejected message.',
      });
    }
    return res.json({ sent: true, configured: true, messageId: result?.messages?.[0]?.id || null });
  } catch {
    return res.status(502).json({ sent: false, configured: true, error: 'Failed to contact WhatsApp Cloud API.' });
  }
});

// Vite middleware in development, static dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vinayak Tutorial server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
