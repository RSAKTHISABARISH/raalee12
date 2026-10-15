import sqlite3

conn = sqlite3.connect('helpdesk360.db')
c = conn.cursor()
tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("Tables:", tables)

for t in ['users', 'tickets', 'status_history']:
    try:
        cols = [x[1] for x in c.execute(f"PRAGMA table_info({t})").fetchall()]
        cnt = c.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
        print(f"{t} ({cnt} rows): {cols}")
    except Exception as ex:
        print(t, ex)
conn.close()
