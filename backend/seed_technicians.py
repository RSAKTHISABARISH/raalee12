import sqlite3
import datetime

# Database connection
conn = sqlite3.connect('helpdesk360.db')
c = conn.cursor()

# Get existing employee user IDs
employees = c.execute("SELECT id FROM users WHERE role = 'EMPLOYEE'").fetchall()
employee_ids = [row[0] for row in employees]
if not employee_ids:
    c.execute("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
              ("Alice Johnson", "alice@company.com", "$2a$10$Wct1ISJKa8Mw8bicQH566e4aDrYXUmiuXJ68sVhA.RYFxcQZ2ZOYm", "EMPLOYEE", "2024-01-01T00:00:00Z"))
    employee_ids = [c.lastrowid]

# Distinct agents from dataset
agents = [
    "Khalid Al-Rashid", "Ahmed Al-Nasser", "Mohammed Al-Hamdan", "Hassan Al-Rashid",
    "Ahmed Al-Salem", "Yousef Al-Khalifa", "Abdullah Al-Rashid", "Ali Al-Khalifa",
    "Saif Al-Rashid", "Fahad Al-Farsi", "Fahad Al-Rashid", "Abdullah Al-Farsi",
    "Saif Al-Khalifa", "Mohammed Al-Rashid", "Omar Al-Mansoori", "Abdullah Al-Mansoori",
    "Yousef Al-Sabah", "Omar Al-Salem", "Saif Al-Hamdan", "Ahmed Al-Hamdan", "Ali Al-Hamdan",
    "Fahad Al-Salem", "Yousef Al-Salem", "Abdullah Al-Nasser", "Abdullah Al-Sabah",
    "Fahad Al-Nasser", "Yousef Al-Nasser", "Saif Al-Mansoori", "Omar Al-Sabah"
]

agent_id_map = {}
for agent in set(agents):
    email = agent.lower().replace(" ", ".").replace("-", ".") + "@company.com"
    existing = c.execute("SELECT id FROM users WHERE name = ?", (agent,)).fetchone()
    if existing:
        agent_id_map[agent] = existing[0]
    else:
        c.execute("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
                  (agent, email, "$2a$10$Wct1ISJKa8Mw8bicQH566e4aDrYXUmiuXJ68sVhA.RYFxcQZ2ZOYm", "TECHNICIAN", "2024-01-01T00:00:00Z"))
        agent_id_map[agent] = c.lastrowid

print(f"Configured {len(agent_id_map)} technicians.")
conn.commit()
conn.close()
