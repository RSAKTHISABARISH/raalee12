import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import initSqlJs from 'sql.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'helpdesk360.db');

// --- Config ---
const PORT = 8080;
const JWT_SECRET = 'helpdesk360-dev-secret-key-change-in-production-min-32-chars';
const JWT_EXPIRATION_MS = 86400000; // 24 hours

// --- Initialize sql.js and load DB ---
const SQL = await initSqlJs();
let db;
if (fs.existsSync(DB_PATH)) {
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
  console.log(`[DB] Loaded existing database from ${DB_PATH}`);
} else {
  db = new SQL.Database();
  console.log('[DB] Created new in-memory database');
}

// Helper to save DB back to disk periodically
function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper: run a query that returns rows
function allRows(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query that returns one row
function getRow(sql, params = []) {
  const rows = allRows(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run a statement (INSERT/UPDATE/DELETE)
function runStmt(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0];
  const changes = db.getRowsModified();
  return { lastInsertRowid: lastId, changes };
}

// Ensure tables exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('EMPLOYEE','TECHNICIAN')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('HARDWARE','NETWORK','SOFTWARE','ACCOUNT_ACCESS')),
    priority TEXT NOT NULL CHECK(priority IN ('LOW','MEDIUM','HIGH','URGENT')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    reported_by INTEGER NOT NULL REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    changed_by INTEGER NOT NULL REFERENCES users(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// --- Seed data if empty ---
const userCount = getRow('SELECT count(*) as cnt FROM users')?.cnt || 0;
if (userCount === 0) {
  console.log('[SEED] Creating test accounts...');
  const hash = bcrypt.hashSync('password123', 10);
  const now = new Date().toISOString();

  runStmt("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    ['Alice Johnson', 'alice@company.com', hash, 'EMPLOYEE', now]);
  runStmt("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    ['Bob Smith', 'bob@company.com', hash, 'EMPLOYEE', now]);
  runStmt("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    ['Carol Davis', 'carol@company.com', hash, 'EMPLOYEE', now]);
  runStmt("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    ['Dave Tech', 'dave@company.com', hash, 'TECHNICIAN', now]);
  runStmt("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    ['Eve Support', 'eve@company.com', hash, 'TECHNICIAN', now]);

  saveDb();
  console.log('[SEED] Test accounts created.');
  console.log('  Employees: alice@company.com, bob@company.com, carol@company.com');
  console.log('  Technicians: dave@company.com, eve@company.com');
  console.log('  All passwords: password123');
}

// --- Express App ---
const app = express();
app.use(cors({
  origin: ['http://localhost:4321', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
}));
app.use(express.json());

// --- Helpers ---
function generateToken(userId, email, role) {
  return jwt.sign(
    { sub: userId.toString(), email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION_MS / 1000 }
  );
}

function userToDTO(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function ticketToDTO(ticket) {
  const reportedBy = getRow('SELECT * FROM users WHERE id = ?', [ticket.reported_by]);
  const assignedTo = ticket.assigned_to
    ? getRow('SELECT * FROM users WHERE id = ?', [ticket.assigned_to])
    : null;
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    reportedBy: userToDTO(reportedBy),
    assignedTo: userToDTO(assignedTo),
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
  };
}

// --- Auth Middleware ---
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = parseInt(decoded.sub);
    const user = getRow('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.currentUser = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// =====================
// AUTH ROUTES
// =====================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = getRow('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user.id, user.email, user.role);
  return res.json({ token, user: userToDTO(user) });
});

// =====================
// HEALTH
// =====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', database: 'connected' });
});

// =====================
// USER ROUTES
// =====================
app.get('/api/users/me', authenticate, (req, res) => {
  res.json(userToDTO(req.currentUser));
});

app.get('/api/users/technicians', authenticate, (req, res) => {
  if (req.currentUser.role !== 'TECHNICIAN') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const technicians = allRows("SELECT * FROM users WHERE role = ?", ['TECHNICIAN']);
  res.json(technicians.map(userToDTO));
});

// =====================
// TICKET ROUTES
// =====================

// Create ticket
app.post('/api/tickets', authenticate, (req, res) => {
  const { title, description, category, priority } = req.body;

  const validCategories = ['HARDWARE', 'NETWORK', 'SOFTWARE', 'ACCOUNT_ACCESS'];
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const cat = (category || '').toUpperCase().replace(/-/g, '_');
  const pri = (priority || '').toUpperCase();

  if (!validCategories.includes(cat)) {
    return res.status(400).json({ error: `Invalid category: ${category}. Valid values: ${validCategories.join(', ')}` });
  }
  if (!validPriorities.includes(pri)) {
    return res.status(400).json({ error: `Invalid priority: ${priority}. Valid values: ${validPriorities.join(', ')}` });
  }

  const now = new Date().toISOString();
  const result = runStmt(
    `INSERT INTO tickets (title, description, category, priority, status, reported_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'OPEN', ?, ?, ?)`,
    [title, description, cat, pri, req.currentUser.id, now, now]
  );

  const ticket = getRow('SELECT * FROM tickets WHERE id = ?', [result.lastInsertRowid]);

  // Record initial status in history
  runStmt(
    `INSERT INTO status_history (ticket_id, changed_by, old_status, new_status, changed_at)
     VALUES (?, ?, NULL, 'OPEN', ?)`,
    [ticket.id, req.currentUser.id, now]
  );

  saveDb();
  res.status(201).json(ticketToDTO(ticket));
});

// Get my tickets
app.get('/api/tickets/my', authenticate, (req, res) => {
  const tickets = allRows('SELECT * FROM tickets WHERE reported_by = ? ORDER BY created_at DESC', [req.currentUser.id]);
  res.json(tickets.map(ticketToDTO));
});

// Dashboard metrics
app.get('/api/tickets/dashboard/metrics', authenticate, (req, res) => {
  const totalTickets = getRow('SELECT count(*) as cnt FROM tickets')?.cnt || 0;
  const openTickets = getRow("SELECT count(*) as cnt FROM tickets WHERE status = 'OPEN'")?.cnt || 0;
  const inProgressTickets = getRow("SELECT count(*) as cnt FROM tickets WHERE status = 'IN_PROGRESS'")?.cnt || 0;
  const resolvedTickets = getRow("SELECT count(*) as cnt FROM tickets WHERE status = 'RESOLVED'")?.cnt || 0;
  const closedTickets = getRow("SELECT count(*) as cnt FROM tickets WHERE status = 'CLOSED'")?.cnt || 0;
  const urgentTickets = getRow("SELECT count(*) as cnt FROM tickets WHERE priority = 'URGENT'")?.cnt || 0;
  const highPriorityTickets = getRow("SELECT count(*) as cnt FROM tickets WHERE priority = 'HIGH'")?.cnt || 0;
  const assignedTickets = getRow('SELECT count(*) as cnt FROM tickets WHERE assigned_to IS NOT NULL')?.cnt || 0;
  const completedTickets = getRow("SELECT count(*) as cnt FROM tickets WHERE status IN ('RESOLVED','CLOSED')")?.cnt || 0;
  const openUrgentTickets = getRow("SELECT count(*) as cnt FROM tickets WHERE status = 'OPEN' AND priority = 'URGENT'")?.cnt || 0;

  res.json({
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    urgentTickets,
    highPriorityTickets,
    assignedTickets,
    completedTickets,
    openUrgentTickets,
  });
});

// Get all tickets (technicians only)
app.get('/api/tickets', authenticate, (req, res) => {
  if (req.currentUser.role !== 'TECHNICIAN') {
    return res.status(403).json({ error: 'Access denied: technicians only' });
  }

  const { status, priority, category } = req.query;
  let tickets;

  if (status) {
    const s = status.toUpperCase().replace(/-/g, '_');
    tickets = allRows('SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC', [s]);
  } else if (priority) {
    const p = priority.toUpperCase();
    tickets = allRows('SELECT * FROM tickets WHERE priority = ? ORDER BY created_at DESC', [p]);
  } else if (category) {
    const c = category.toUpperCase().replace(/-/g, '_');
    tickets = allRows('SELECT * FROM tickets WHERE category = ? ORDER BY created_at DESC', [c]);
  } else {
    tickets = allRows(`
      SELECT * FROM tickets ORDER BY
        CASE priority
          WHEN 'URGENT' THEN 0
          WHEN 'HIGH' THEN 1
          WHEN 'MEDIUM' THEN 2
          WHEN 'LOW' THEN 3
        END,
        created_at DESC
    `);
  }

  res.json(tickets.map(ticketToDTO));
});

// Get ticket by ID
app.get('/api/tickets/:id', authenticate, (req, res) => {
  const ticket = getRow('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (req.currentUser.role === 'EMPLOYEE' && ticket.reported_by !== req.currentUser.id) {
    return res.status(403).json({ error: 'Access denied: you can only view your own tickets' });
  }

  res.json(ticketToDTO(ticket));
});

// Update ticket (PATCH)
app.patch('/api/tickets/:id', authenticate, (req, res) => {
  if (req.currentUser.role !== 'TECHNICIAN') {
    return res.status(403).json({ error: 'Access denied: only technicians can update tickets' });
  }

  const ticket = getRow('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const { assignedTo, status } = req.body;

  if (assignedTo !== undefined && assignedTo !== null) {
    const assignee = getRow('SELECT * FROM users WHERE id = ?', [assignedTo]);
    if (!assignee) return res.status(400).json({ error: 'Assigned user not found' });
    if (assignee.role !== 'TECHNICIAN') return res.status(400).json({ error: 'Can only assign tickets to technicians' });
    runStmt('UPDATE tickets SET assigned_to = ?, updated_at = ? WHERE id = ?', [assignedTo, new Date().toISOString(), ticket.id]);
  }

  if (status) {
    const newStatus = status.toUpperCase().replace(/-/g, '_');
    const validTransitions = {
      OPEN: ['IN_PROGRESS', 'CLOSED'],
      IN_PROGRESS: ['RESOLVED', 'OPEN', 'CLOSED'],
      RESOLVED: ['CLOSED', 'OPEN'],
      CLOSED: ['OPEN'],
    };

    const oldStatus = ticket.status;
    const allowed = validTransitions[oldStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      return res.status(400).json({ error: `Invalid status transition from ${oldStatus} to ${newStatus}` });
    }

    const now = new Date().toISOString();
    runStmt('UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?', [newStatus, now, ticket.id]);
    runStmt(
      'INSERT INTO status_history (ticket_id, changed_by, old_status, new_status, changed_at) VALUES (?, ?, ?, ?, ?)',
      [ticket.id, req.currentUser.id, oldStatus, newStatus, now]
    );
  }

  saveDb();
  const updatedTicket = getRow('SELECT * FROM tickets WHERE id = ?', [ticket.id]);
  res.json(ticketToDTO(updatedTicket));
});

// Get ticket history
app.get('/api/tickets/:id/history', authenticate, (req, res) => {
  const ticket = getRow('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (req.currentUser.role === 'EMPLOYEE' && ticket.reported_by !== req.currentUser.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const history = allRows('SELECT * FROM status_history WHERE ticket_id = ? ORDER BY changed_at ASC', [parseInt(req.params.id)]);
  res.json(history.map(h => {
    const changedBy = getRow('SELECT * FROM users WHERE id = ?', [h.changed_by]);
    return {
      id: h.id,
      ticketId: h.ticket_id,
      changedBy: userToDTO(changedBy),
      oldStatus: h.old_status,
      newStatus: h.new_status,
      changedAt: h.changed_at,
    };
  }));
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n  🚀 HelpDesk 360 Mock Backend running on http://localhost:${PORT}`);
  console.log(`  📦 Database: ${DB_PATH}`);
  console.log(`  🔑 JWT Secret: ${JWT_SECRET.substring(0, 15)}...`);
  console.log();
});
