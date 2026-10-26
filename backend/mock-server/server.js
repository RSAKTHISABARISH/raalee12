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

// Ensure schema columns
try {
  db.run("ALTER TABLE status_history ADD COLUMN comment TEXT;");
  saveDb();
} catch (e) {
  // column might already exist
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
  let cat = (category || '').toUpperCase().replace(/-/g, '_');
  if (cat === 'ACCESS_RIGHTS') cat = 'ACCOUNT_ACCESS';
  if (cat === 'OTHER') cat = 'SOFTWARE';
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
    `INSERT INTO status_history (ticket_id, changed_by, old_status, new_status, changed_at, comment)
     VALUES (?, ?, NULL, 'OPEN', ?, 'Initial ticket submission')`,
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

// Add comment to ticket
app.post('/api/tickets/:id/comments', authenticate, (req, res) => {
  const ticket = getRow('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (req.currentUser.role === 'EMPLOYEE' && ticket.reported_by !== req.currentUser.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { comment } = req.body;
  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  const now = new Date().toISOString();
  runStmt(
    'INSERT INTO status_history (ticket_id, changed_by, old_status, new_status, changed_at, comment) VALUES (?, ?, ?, ?, ?, ?)',
    [ticket.id, req.currentUser.id, ticket.status, ticket.status, now, comment.trim()]
  );
  runStmt('UPDATE tickets SET updated_at = ? WHERE id = ?', [now, ticket.id]);
  saveDb();
  res.status(201).json({ success: true, message: 'Comment added successfully' });
});

// Update ticket (PATCH)
app.patch('/api/tickets/:id', authenticate, (req, res) => {
  const ticket = getRow('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  // Employees can close or reopen their own tickets
  const isEmployee = req.currentUser.role === 'EMPLOYEE';
  if (isEmployee && ticket.reported_by !== req.currentUser.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { assignedTo, status, comment } = req.body;

  if (assignedTo !== undefined && assignedTo !== null) {
    if (isEmployee) return res.status(403).json({ error: 'Only technicians can assign tickets' });
    const assignee = getRow('SELECT * FROM users WHERE id = ?', [assignedTo]);
    if (!assignee) return res.status(400).json({ error: 'Assigned user not found' });
    if (assignee.role !== 'TECHNICIAN') return res.status(400).json({ error: 'Can only assign tickets to technicians' });
    runStmt('UPDATE tickets SET assigned_to = ?, updated_at = ? WHERE id = ?', [assignedTo, new Date().toISOString(), ticket.id]);
  }

  if (status) {
    const newStatus = status.toUpperCase().replace(/-/g, '_');
    const validTransitions = {
      OPEN: ['IN_PROGRESS', 'CLOSED', 'RESOLVED'],
      IN_PROGRESS: ['RESOLVED', 'OPEN', 'CLOSED'],
      RESOLVED: ['CLOSED', 'OPEN', 'IN_PROGRESS'],
      CLOSED: ['OPEN', 'IN_PROGRESS'],
    };

    const oldStatus = ticket.status;
    const allowed = validTransitions[oldStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      return res.status(400).json({ error: `Invalid status transition from ${oldStatus} to ${newStatus}` });
    }

    const now = new Date().toISOString();
    runStmt('UPDATE tickets SET status = ?, updated_at = ? WHERE id = ?', [newStatus, now, ticket.id]);
    runStmt(
      'INSERT INTO status_history (ticket_id, changed_by, old_status, new_status, changed_at, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [ticket.id, req.currentUser.id, oldStatus, newStatus, now, comment ? comment.trim() : null]
    );
  } else if (comment && comment.trim()) {
    const now = new Date().toISOString();
    runStmt(
      'INSERT INTO status_history (ticket_id, changed_by, old_status, new_status, changed_at, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [ticket.id, req.currentUser.id, ticket.status, ticket.status, now, comment.trim()]
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
      comment: h.comment || null,
    };
  }));
});

// =====================
// AI CHATBOT ROUTE
// =====================
app.post('/api/chat', authenticate, (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Check if user is asking about a specific ticket (e.g. "ticket 152", "#152", "status of 152")
  const ticketMatch = text.match(/#?(\b\d{1,5}\b)/);
  if (ticketMatch && (lower.includes('ticket') || lower.includes('status') || lower.includes('#') || lower.includes('check'))) {
    const tId = parseInt(ticketMatch[1], 10);
    const ticket = getRow('SELECT * FROM tickets WHERE id = ?', [tId]);
    if (ticket) {
      if (req.currentUser.role === 'EMPLOYEE' && ticket.reported_by !== req.currentUser.id) {
        return res.json({
          reply: `Incident **#${tId}** exists in the registry, but is registered under another corporate employee. Under security policy, you may only view details for your own incidents.`,
        });
      }
      const tech = ticket.assigned_to ? getRow('SELECT name, email FROM users WHERE id = ?', [ticket.assigned_to]) : null;
      const reporter = getRow('SELECT name FROM users WHERE id = ?', [ticket.reported_by]);
      
      const slaMap = { URGENT: '2 hours', HIGH: '4 hours', MEDIUM: '8 hours', LOW: '24 hours' };
      const slaTarget = slaMap[ticket.priority] || '8 hours';

      return res.json({
        reply: `Here are the latest telemetry details for **Incident #${ticket.id}**:\n\n` +
          `• **Title**: ${ticket.title}\n` +
          `• **Status**: \`${ticket.status}\`\n` +
          `• **Priority**: \`${ticket.priority}\` (Target SLA: ${slaTarget})\n` +
          `• **Category**: ${ticket.category.replace(/_/g, ' ')}\n` +
          `• **Assigned Technician**: ${tech ? tech.name : '*Unassigned (Awaiting Dispatch)*'}\n` +
          `• **Reported By**: ${reporter ? reporter.name : 'Employee'}\n` +
          `• **Filed On**: ${new Date(ticket.created_at).toLocaleString('en-US')}\n\n` +
          `[Click here to view the full incident workspace](/tickets/${ticket.id})`,
        ticket: ticketToDTO(ticket)
      });
    }
  }

  // 2. Check for "my tickets" / list
  if (lower.includes('my tickets') || lower.includes('my open') || lower.includes('what are my tickets')) {
    const myTickets = allRows('SELECT * FROM tickets WHERE reported_by = ? ORDER BY created_at DESC LIMIT 5', [req.currentUser.id]);
    if (myTickets.length === 0) {
      return res.json({
        reply: `You currently have **0 active support tickets** filed in the portal. Everything looks clear! Would you like me to help you report a new incident?`,
        suggestedActions: ['Submit New Ticket', 'Check VPN Guide', 'Request Software']
      });
    }
    const listStr = myTickets.map(t => `• **#${t.id}**: ${t.title} — \`${t.status}\` (${t.priority} Priority)`).join('\n');
    return res.json({
      reply: `Here are your recent support tickets:\n\n${listStr}\n\nYou can ask me *"What is the status of ticket #..."* or visit your [My Tickets Dashboard](/tickets/my).`,
      suggestedActions: ['Create Ticket', 'VPN Troubleshooting', 'Password Reset']
    });
  }

  // 3. Knowledge Base: Password Reset & MFA
  if (lower.includes('password') || lower.includes('reset') || lower.includes('mfa') || lower.includes('2fa') || lower.includes('locked')) {
    return res.json({
      reply: `### 🔑 Corporate Identity & Password Recovery Guide\n\n` +
        `If you are locked out or need to update your corporate credentials:\n\n` +
        `1. **Self-Service Portal**: Navigate to \`https://identity.company.com/recovery\` and authenticate using your backup SMS or Authenticator App.\n` +
        `2. **Password Policy**: Passwords must contain at least **14 characters**, including upper/lowercase, numbers, and symbols.\n` +
        `3. **MFA Token Desync**: If your Microsoft/Google Authenticator code fails, open the app settings and select **"Time Sync"**.\n\n` +
        `*If you are completely locked out of email, would you like me to open an **Urgent Access Rights** ticket for an IT technician?*`,
      suggestedActions: ['Create Password Ticket', 'Check Ticket Status', 'Talk to Human Tech']
    });
  }

  // 4. Knowledge Base: VPN & Connectivity
  if (lower.includes('vpn') || lower.includes('wifi') || lower.includes('network') || lower.includes('internet') || lower.includes('dns')) {
    return res.json({
      reply: `### 🌐 Corporate VPN & Connectivity Diagnostics\n\n` +
        `Follow these steps to resolve VPN and network drops:\n\n` +
        `1. **Gateway Selection**: In GlobalProtect / AnyConnect, switch gateway to \`vpn-east.company.com\` or \`vpn-west.company.com\`.\n` +
        `2. **Flush DNS**: Open terminal/command prompt and run:\n` +
        `   \`\`\`bash\n   ipconfig /flushdns\n   \`\`\`\n` +
        `3. **Re-authenticate SSO**: Disconnect from VPN, log out of SSO in your browser, and reconnect.\n` +
        `4. **WiFi Network**: Ensure you are connected to the \`Corporate-Secure\` SSID rather than \`Guest-WiFi\`.\n\n` +
        `*Still experiencing connectivity failure? I can dispatch an incident to our Network Engineering team.*`,
      suggestedActions: ['Report Network Incident', 'Check My Tickets', 'View SLA Rules']
    });
  }

  // 5. Knowledge Base: Hardware & Monitors
  if (lower.includes('monitor') || lower.includes('display') || lower.includes('screen') || lower.includes('dock') || lower.includes('laptop') || lower.includes('keyboard')) {
    return res.json({
      reply: `### 💻 Hardware & Peripheral Troubleshooting\n\n` +
        `For external monitors, docks, and workstation peripherals:\n\n` +
        `1. **Power Cycle Dock**: Unplug your USB-C Thunderbolt docking station from wall power for **30 seconds**, then reconnect.\n` +
        `2. **Display Detection**: Press \`Windows Key + P\` and ensure **"Extend"** or **"Duplicate"** is selected.\n` +
        `3. **Driver Refresh**: Press \`Win + Ctrl + Shift + B\` on Windows to restart the graphics subsystem without restarting your PC.\n` +
        `4. **Cable Check**: Verify the HDMI/DisplayPort cable is firmly seated into the dock.\n\n` +
        `*If hardware appears physically damaged or failing, submit a ticket below for replacement dispatch.*`,
      suggestedActions: ['Submit Hardware Replacement', 'Check Ticket #152', 'HelpDesk Hours']
    });
  }

  // 6. Knowledge Base: Software Licenses & Access
  if (lower.includes('software') || lower.includes('access') || lower.includes('figma') || lower.includes('github') || lower.includes('aws') || lower.includes('license') || lower.includes('jira')) {
    return res.json({
      reply: `### 📦 Software & Cloud Permissions Request\n\n` +
        `To provision access to corporate engineering and design tools:\n\n` +
        `• **Approved Catalog**: Standard tools (Slack, Zoom, VS Code, Chrome) are available self-service via the **Company Software Center** app.\n` +
        `• **Cloud & Engineering (AWS / GCP / GitHub)**: Requires manager approval. File a request with category **Account Access**.\n` +
        `• **Figma / Adobe Creative Cloud**: Provisioned within 4 hours following IT review.\n\n` +
        `*Would you like to submit a Software Access request right now?*`,
      suggestedActions: ['Request Software Access', 'Check Open Tickets', 'SLA Response Times']
    });
  }

  // 7. Knowledge Base: SLAs and Support Hours
  if (lower.includes('sla') || lower.includes('hours') || lower.includes('time') || lower.includes('support')) {
    return res.json({
      reply: `### ⏱️ HelpDesk 360 Service Level Agreements (SLA)\n\n` +
        `Our corporate IT operations team operates **24/7/365** with guaranteed response windows:\n\n` +
        `• 🔴 **URGENT (Severity 1)**: Initial response in **15 mins** • Resolution target: **2 hours**\n` +
        `• 🟠 **HIGH (Severity 2)**: Initial response in **30 mins** • Resolution target: **4 hours**\n` +
        `• 🔵 **MEDIUM (Severity 3)**: Standard resolution target: **8 hours**\n` +
        `• 🟢 **LOW (Severity 4)**: Inquiries & minor tasks: **24 hours**\n\n` +
        `All metrics are measured against live automated audit telemetry.`,
      suggestedActions: ['Submit Urgent Incident', 'View Support Queue', 'Check Ticket Status']
    });
  }

  // Default Fallback: Helpful AI Assistant
  return res.json({
    reply: `Hello! I am the **HelpDesk 360 AI Virtual Assistant**.\n\n` +
      `I can help you with:\n` +
      `• 🔑 **Password & MFA recovery**\n` +
      `• 🌐 **VPN & network connection issues**\n` +
      `• 💻 **Hardware, monitor & docking setup**\n` +
      `• 📦 **Software licenses & access permissions**\n` +
      `• 🎫 **Real-time status check on any ticket** (e.g. *"What is the status of ticket #152?"*)\n` +
      `• 📝 **Filing a new support incident**\n\n` +
      `How may I assist you today?`,
    suggestedActions: ['Check Ticket #152', 'Reset Password', 'VPN Troubleshooting', 'Submit New Ticket']
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n  🚀 HelpDesk 360 Mock Backend running on http://localhost:${PORT}`);
  console.log(`  📦 Database: ${DB_PATH}`);
  console.log(`  🔑 JWT Secret: ${JWT_SECRET.substring(0, 15)}...`);
  console.log();
});
