import psycopg2
import sqlite3

PG_URL = 'postgres://2746d6e84094ab884ca78a14c8c56a6adfe25e70e202c1fc423fdb8cc15e3c04:sk_b-kfITJgxq34cZlWIe4V8@db.prisma.io:5432/postgres?sslmode=require'
SQLITE_PATH = 'prisma/dev.db'

def update_pg():
    conn = psycopg2.connect(PG_URL)
    cur = conn.cursor()
    cur.execute(
        "UPDATE dealers SET display_name = 'TVS Certified Internal Employee', masked_name = 'TVS Certified Employee' WHERE external_dealer_id IN ('DEMO-EMPLOYEE-2026', 'DEMO-COLLEAGUE-2026')"
    )
    conn.commit()
    print('Updated PG:', cur.rowcount)
    cur.execute("SELECT id, external_dealer_id, display_name FROM dealers WHERE external_dealer_id = 'DEMO-EMPLOYEE-2026'")
    print('PG row:', cur.fetchone())
    conn.close()

def update_sqlite():
    conn = sqlite3.connect(SQLITE_PATH)
    cur = conn.cursor()
    cur.execute(
        "UPDATE dealers SET display_name = 'TVS Certified Internal Employee', masked_name = 'TVS Certified Employee' WHERE external_dealer_id IN ('DEMO-EMPLOYEE-2026', 'DEMO-COLLEAGUE-2026')"
    )
    conn.commit()
    print('Updated SQLite:', cur.rowcount)
    cur.execute("SELECT id, external_dealer_id, display_name FROM dealers WHERE external_dealer_id = 'DEMO-EMPLOYEE-2026'")
    print('SQLite row:', cur.fetchone())
    conn.close()

if __name__ == '__main__':
    update_pg()
    update_sqlite()
