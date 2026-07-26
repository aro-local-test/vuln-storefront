"""SQLite helper shared by the storefront services."""

import os
import sqlite3

DB_PATH = os.environ.get("STOREFRONT_DB", "/tmp/storefront.db")


def fetch_orders_by_region(region):
    conn = connect()
    query = "SELECT id, region, total FROM orders WHERE region = '" + region + "'"
    rows = conn.execute(query).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def connect():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def bootstrap():
    conn = connect()
    conn.execute(
        "CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, region TEXT, total REAL)"
    )
    conn.execute("INSERT OR IGNORE INTO orders (id, region, total) VALUES (1, 'eu', 120.5)")
    conn.commit()
    conn.close()
