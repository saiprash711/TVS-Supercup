import psycopg2
import sqlite3

PG_URL = 'postgres://2746d6e84094ab884ca78a14c8c56a6adfe25e70e202c1fc423fdb8cc15e3c04:sk_b-kfITJgxq34cZlWIe4V8@db.prisma.io:5432/postgres?sslmode=require'
SQLITE_PATH = 'prisma/dev.db'

def clean_postgres():
    print('Connecting to PostgreSQL...')
    pg_conn = psycopg2.connect(PG_URL)
    pg_cur = pg_conn.cursor()

    pg_cur.execute("SELECT id, external_dealer_id, display_name FROM dealers WHERE external_dealer_id LIKE 'DEMO-%'")
    demo_dealers = pg_cur.fetchall()
    print('Demo dealers in PG:', demo_dealers)

    if demo_dealers:
        dealer_ids = tuple(d[0] for d in demo_dealers)
        pg_cur.execute(f"DELETE FROM dealer_activities WHERE dealer_id IN %s", (dealer_ids,))
        del_acts = pg_cur.rowcount
        print(f'Deleted {del_acts} activities for demo dealers in PG.')

        pg_cur.execute(f"DELETE FROM dealer_scores WHERE dealer_id IN %s", (dealer_ids,))
        del_scores = pg_cur.rowcount
        print(f'Deleted {del_scores} scores for demo dealers in PG.')

        pg_conn.commit()

    pg_conn.close()

def clean_sqlite():
    try:
        print('Connecting to SQLite...')
        sq_conn = sqlite3.connect(SQLITE_PATH)
        sq_cur = sq_conn.cursor()
        sq_cur.execute("SELECT id, external_dealer_id, display_name FROM dealers WHERE external_dealer_id LIKE 'DEMO-%'")
        demo_dealers = sq_cur.fetchall()
        print('Demo dealers in SQLite:', demo_dealers)
        for d in demo_dealers:
            sq_cur.execute("DELETE FROM dealer_activities WHERE dealer_id = ?", (d[0],))
            sq_cur.execute("DELETE FROM dealer_scores WHERE dealer_id = ?", (d[0],))
        sq_conn.commit()
        sq_conn.close()
        print('Cleaned SQLite demo data.')
    except Exception as e:
        print('SQLite clean error:', e)

if __name__ == '__main__':
    clean_postgres()
    clean_sqlite()
