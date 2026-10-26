import sqlite3
import psycopg2
import json

from datetime import datetime

SQLITE_PATH = 'prisma/dev.db'
POSTGRES_URL = 'postgres://2746d6e84094ab884ca78a14c8c56a6adfe25e70e202c1fc423fdb8cc15e3c04:sk_b-kfITJgxq34cZlWIe4V8@db.prisma.io:5432/postgres?sslmode=require'

def parse_ts(val):
    if val is None:
        return datetime.now()
    if isinstance(val, (int, float)):
        if val > 100000000000:
            val = val / 1000.0
        return datetime.fromtimestamp(val)
    if isinstance(val, str):
        val_str = val.strip()
        if val_str.isdigit():
            num = int(val_str)
            if num > 100000000000:
                num = num / 1000.0
            return datetime.fromtimestamp(num)
        try:
            return datetime.fromisoformat(val_str.replace('Z', '+00:00'))
        except:
            return datetime.now()
    return val

def sync():
    print('Connecting to SQLite...')
    sq_conn = sqlite3.connect(SQLITE_PATH)
    sq_cur = sq_conn.cursor()

    print('Connecting to PostgreSQL...')
    pg_conn = psycopg2.connect(POSTGRES_URL)
    pg_cur = pg_conn.cursor()

    # 1. Map externalDealerId to Postgres Dealer ID
    pg_cur.execute('SELECT id, external_dealer_id FROM dealers')
    pg_dealers = {r[1]: r[0] for r in pg_cur.fetchall()}
    print(f'Found {len(pg_dealers)} dealers in PostgreSQL.')

    # 2. Get SQLite Dealers mapping
    sq_cur.execute('SELECT id, external_dealer_id, display_name, masked_name, city, category, phone FROM dealers')
    sq_dealers = {r[0]: r[1] for r in sq_cur.fetchall()}

    # Check for any missing dealers in PG and insert them
    sq_cur.execute('SELECT external_dealer_id, display_name, masked_name, city, category, phone FROM dealers')
    missing_count = 0
    for ext_id, name, masked, city, cat, phone in sq_cur.fetchall():
        if ext_id not in pg_dealers:
            pg_cur.execute(
                '''INSERT INTO dealers (external_dealer_id, display_name, masked_name, city, category, phone, status, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, 'ACTIVE', NOW(), NOW()) RETURNING id''',
                (ext_id, name or f'Dealer {ext_id}', masked or 'Dealer', city or 'Tamil Nadu', cat or 'Used Car Dealer', phone)
            )
            new_id = pg_cur.fetchone()[0]
            pg_dealers[ext_id] = new_id
            missing_count += 1
    if missing_count > 0:
        pg_conn.commit()
        print(f'Inserted {missing_count} missing dealers into PostgreSQL.')

    # 3. SQLite Campaign 13 activities -> Postgres Campaign 2, Match 17
    sq_cur.execute('''
        SELECT dealer_id, activity_type, external_transaction_id, points, metadata, timestamp
        FROM dealer_activities
        WHERE campaign_id = 13
    ''')
    activities = sq_cur.fetchall()
    print(f'Fetched {len(activities)} activities from SQLite Campaign 13.')

    rows_to_insert = []
    skipped_acts = 0
    for d_id, act_type, tx_id, pts, meta, ts in activities:
        ext_id = sq_dealers.get(d_id)
        if not ext_id or ext_id not in pg_dealers:
            skipped_acts += 1
            continue
        pg_d_id = pg_dealers[ext_id]
        parsed_dt = parse_ts(ts)
        rows_to_insert.append((pg_d_id, 2, 17, act_type, tx_id, pts, meta, parsed_dt, datetime.now()))

    if rows_to_insert:
        from psycopg2.extras import execute_values
        execute_values(
            pg_cur,
            '''INSERT INTO dealer_activities (dealer_id, campaign_id, match_id, activity_type, external_transaction_id, points, metadata, timestamp, created_at)
               VALUES %s
               ON CONFLICT DO NOTHING''',
            rows_to_insert,
            page_size=500
        )
        pg_conn.commit()
    print(f'Batch inserted {len(rows_to_insert)} activities into PostgreSQL (skipped: {skipped_acts}).')

    # 4. Sync dealer scores
    sq_cur.execute('''
        SELECT dealer_id, total_points, rank
        FROM dealer_scores
        WHERE campaign_id = 13 AND total_points > 0
    ''')
    scores = sq_cur.fetchall()
    print(f'Fetched {len(scores)} scores from SQLite Campaign 13.')

    score_rows = []
    for d_id, total_pts, rank in scores:
        ext_id = sq_dealers.get(d_id)
        if not ext_id or ext_id not in pg_dealers:
            continue
        pg_d_id = pg_dealers[ext_id]
        score_rows.append((pg_d_id, 2, total_pts, rank, datetime.now()))

    if score_rows:
        from psycopg2.extras import execute_values
        execute_values(
            pg_cur,
            '''INSERT INTO dealer_scores (dealer_id, campaign_id, total_points, rank, updated_at)
               VALUES %s
               ON CONFLICT (dealer_id, campaign_id)
               DO UPDATE SET total_points = EXCLUDED.total_points, rank = EXCLUDED.rank, updated_at = NOW()''',
            score_rows,
            page_size=500
        )
        pg_conn.commit()
    print(f'Batch upserted {len(score_rows)} dealer scores in PostgreSQL Campaign 2.')

    # 5. Verify total counts in Postgres
    pg_cur.execute('SELECT COUNT(*) FROM dealer_activities WHERE campaign_id = 2')
    final_acts = pg_cur.fetchone()[0]
    pg_cur.execute('SELECT COUNT(*) FROM dealer_scores WHERE campaign_id = 2 AND total_points > 0')
    final_scores = pg_cur.fetchone()[0]
    print(f'Final PostgreSQL Campaign 2: {final_acts} activities, {final_scores} scores.')

    sq_conn.close()
    pg_conn.close()

if __name__ == '__main__':
    sync()
