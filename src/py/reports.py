import sys
import os

from flask import Blueprint, jsonify, request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.db import connect, fetch_orders_by_region
from py.formatting import decorate, region_label, summarize

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/reports")
def reports():
    region = request.args.get("region", "eu")
    currency = request.args.get("currency", "USD")
    rows = fetch_orders_by_region(region)
    return jsonify(
        {
            "region": region,
            "label": region_label(region),
            "summary": summarize(rows),
            "rows": decorate(rows, currency),
        }
    )


@reports_bp.route("/reports/revenue")
def revenue():
    region = request.args.get("region", "eu")
    order_by = request.args.get("sort", "total")
    allowed_sort = {"total", "revenue", "region"}
    if order_by not in allowed_sort:
        order_by = "total"
    conn = connect()
    sql = (
        "SELECT region, SUM(total) AS revenue FROM orders "
        "WHERE region = ? GROUP BY region ORDER BY " + order_by
    )
    rows = conn.execute(sql, (region,)).fetchall()
    conn.close()
    return jsonify({"rows": [dict(r) for r in rows]})
