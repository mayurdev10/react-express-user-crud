const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'i-am-secret-key';

// Object database
const database = {
  users: [],
};

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function seedUsers() {
  if (database.users.length > 0) return;

  const now = Date.now();

  // demo user for login
  database.users.push({
    id: uuidv4(),
    name: 'Demo Admin',
    email: 'demo@example.com',
    role: 'admin',
    password: 'password',
    createdAt: now - 1000 * 60 * 10,
  });

  // dummy users for testing
  const roles = ['user', 'manager', 'viewer'];
  for (let i = 1; i <= 7; i += 1) {
    database.users.push({
      id: uuidv4(),
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: roles[i % roles.length],
      password: 'password',
      createdAt: now - 1000 * 60 * (10 - i),
    });
  }
}

seedUsers();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const allowedRoles = ['user', 'manager', 'viewer', 'admin'];

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Valid email is required'),
  role: z.enum(allowedRoles).default('user'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().trim().toLowerCase().email('Valid email is required').optional(),
  role: z.enum(allowedRoles).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

function zodErrorToFieldMap(err) {
  const details = {};
  if (err?.issues) {
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'root';
      details[key] = issue.message;
    }
  }
  return details;
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CRUD API demo server running' });
});

// Auth
app.post('/api/login', (req, res) => {
  const parse = loginSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: zodErrorToFieldMap(parse.error) });
  }
  const { email, password } = parse.data;
  const user = database.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  return res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/logout', requireAuth, (req, res) => {
  // frontend side discards token
  res.json({ success: true });
});

// Users APIs
app.get('/api/users', requireAuth, (req, res) => {
  const sorted = [...database.users].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  res.json(sorted.map(sanitizeUser));
});

app.get('/api/users/:id', requireAuth, (req, res) => {
  const user = database.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(sanitizeUser(user));
});

app.post('/api/users', requireAuth, (req, res) => {
  const parse = createUserSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: zodErrorToFieldMap(parse.error) });
  }
  const { name, email, role, password } = parse.data;

  const existing = database.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  const user = {
    id: uuidv4(),
    name,
    email,
    role: role || 'user',
    password,
    createdAt: Date.now(),
  };
  database.users.push(user);
  res.status(201).json(sanitizeUser(user));
});

app.put('/api/users/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const user = database.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const parse = updateUserSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: zodErrorToFieldMap(parse.error) });
  }
  const { name, email, role, password } = parse.data;

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const exists = database.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    user.email = email;
  }

  if (name) user.name = name;
  if (role) user.role = role;
  if (password) user.password = password;

  res.json(sanitizeUser(user));
});

app.delete('/api/users/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const index = database.users.findIndex((u) => u.id === id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  const [deleted] = database.users.splice(index, 1);
  res.json({ success: true, user: sanitizeUser(deleted) });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
}); 