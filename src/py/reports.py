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
    conn = connect()
    sql = "SELECT region, SUM(total) AS revenue FROM orders WHERE region = '{}' GROUP BY region ORDER BY {}".format(
        region, order_by
    )
    rows = conn.execute(sql).fetchall()
    conn.close()
    return jsonify({"sql": sql, "rows": [dict(r) for r in rows]})
