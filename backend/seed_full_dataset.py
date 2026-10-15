import sqlite3
import datetime
import random

conn = sqlite3.connect('helpdesk360.db')
c = conn.cursor()

# Get users
techs = c.execute("SELECT id, name FROM users WHERE role = 'TECHNICIAN'").fetchall()
tech_map = {name: uid for uid, name in techs}
tech_ids = [uid for uid, name in techs]

emps = c.execute("SELECT id FROM users WHERE role = 'EMPLOYEE'").fetchall()
emp_ids = [uid for uid, in emps]
if not emp_ids:
    emp_ids = [1]

print(f"Loaded {len(tech_ids)} technicians and {len(emp_ids)} employees.")

# Read part 1 CSV if present
csv_rows = []
try:
    with open('src/main/resources/tickets_dataset_part1.csv', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        header = lines[0].strip().split(',')
        for line in lines[1:]:
            parts = line.strip().split(',')
            if len(parts) >= 20:
                csv_rows.append(parts)
except Exception as ex:
    print("CSV read error:", ex)

print(f"Read {len(csv_rows)} rows from dataset CSV.")

category_map = {
    'Access Request': 'ACCOUNT_ACCESS',
    'Hardware Failure': 'HARDWARE',
    'Network Issue': 'NETWORK',
    'Software Bug': 'SOFTWARE',
    'General Inquiry': 'SOFTWARE'
}

priority_map = {
    'Critical': 'URGENT',
    'High': 'HIGH',
    'Medium': 'MEDIUM',
    'Low': 'LOW'
}

status_map = {
    'Closed': 'CLOSED',
    'Resolved': 'RESOLVED',
    'In Progress': 'IN_PROGRESS',
    'Open': 'OPEN',
    'New': 'OPEN'
}

inserted_count = 0
for r in csv_rows:
    st_raw = r[0].strip()
    tid = int(r[1].strip())
    pr_raw = r[2].strip()
    source = r[3].strip()
    topic = r[4].strip()
    agent_group = r[5].strip()
    agent_name = r[6].strip()
    created_raw = r[7].strip()
    product = r[17].strip()
    level = r[18].strip()
    country = r[19].strip()

    status = status_map.get(st_raw, 'OPEN')
    priority = priority_map.get(pr_raw, 'MEDIUM')
    category = category_map.get(topic, 'HARDWARE')

    title = f"{topic}: {product} service outage ({country})"
    desc = f"Channel: {source} | Region: {country} | Product Group: {product} | Tier: {level} | Team: {agent_group}\n\nIssue reported regarding {topic.lower()} impacting enterprise workflow. Technician diagnostics and SLA tracking actively monitored."

    try:
        created_dt = datetime.datetime.strptime(created_raw, "%Y-%m-%d %H:%M:%S")
        created_iso = created_dt.isoformat() + "Z"
    except:
        created_iso = "2024-05-01T12:00:00Z"

    assigned_id = tech_map.get(agent_name, random.choice(tech_ids))
    reported_id = random.choice(emp_ids)

    # Check if ticket ID exists
    existing = c.execute("SELECT id FROM tickets WHERE id = ?", (tid,)).fetchone()
    if not existing:
        c.execute("""
            INSERT INTO tickets (id, title, description, category, priority, status, reported_by, assigned_to, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tid, title, desc, category, priority, status, reported_id, assigned_id, created_iso, created_iso))
        
        # Insert initial status history
        c.execute("""
            INSERT INTO status_history (ticket_id, changed_by, old_status, new_status, changed_at)
            VALUES (?, ?, ?, ?, ?)
        """, (tid, reported_id, None, 'OPEN', created_iso))

        if status != 'OPEN':
            c.execute("""
                INSERT INTO status_history (ticket_id, changed_by, old_status, new_status, changed_at)
                VALUES (?, ?, ?, ?, ?)
            """, (tid, assigned_id, 'OPEN', status, created_iso))

        inserted_count += 1

conn.commit()
print(f"Successfully seeded {inserted_count} real-world tickets into helpdesk360.db!")
total_tickets = c.execute("SELECT count(*) FROM tickets").fetchone()[0]
print(f"Total tickets now in database: {total_tickets}")
conn.close()
