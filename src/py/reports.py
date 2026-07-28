import sys
import os
from functools import wraps

from flask import Blueprint, jsonify, request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.db import connect, fetch_orders_by_region
from py.formatting import decorate, region_label, summarize

reports_bp = Blueprint("reports", __name__)

# Roles permitted to read financial order reports.
_AUTHORIZED_ROLES = {"admin", "administrator", "analyst"}


def _report_tokens():
    """Bearer-token -> role mapping loaded from the environment.

    Configured via ``REPORTS_API_TOKENS`` as a comma-separated list of
    ``<token>:<role>`` pairs. Absent configuration means no caller is
    authorized (fail closed).
    """
    tokens = {}
    for pair in os.environ.get("REPORTS_API_TOKENS", "").split(","):
        pair = pair.strip()
        if not pair or ":" not in pair:
            continue
        token, role = pair.split(":", 1)
        token = token.strip()
        if token:
            tokens[token] = role.strip().lower()
    return tokens


def require_report_access(view):
    """Reject callers lacking a valid token bound to an authorized role.

    The principal is derived solely from the request's ``Authorization``
    header, never from caller-controlled query/body parameters, and the
    check runs before any database access.
    """

    @wraps(view)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        parts = header.split(None, 1)
        if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
            return jsonify({"error": "authentication required"}), 401
        role = _report_tokens().get(parts[1].strip())
        if role is None:
            return jsonify({"error": "authentication required"}), 401
        if role not in _AUTHORIZED_ROLES:
            return jsonify({"error": "forbidden"}), 403
        return view(*args, **kwargs)

    return wrapper


@reports_bp.route("/reports")
@require_report_access
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
@require_report_access
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
