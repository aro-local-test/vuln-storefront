"""Presentation helpers for the reports blueprint."""

CURRENCY_SYMBOLS = {
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
}

REGION_LABELS = {
    "eu": "Europe",
    "us": "United States",
    "apac": "Asia Pacific",
}


def money(amount, currency="USD"):
    symbol = CURRENCY_SYMBOLS.get(currency, "")
    try:
        value = float(amount)
    except (TypeError, ValueError):
        value = 0.0
    return "{}{:,.2f}".format(symbol, value)


def region_label(code):
    key = (code or "").strip().lower()
    return REGION_LABELS.get(key, key.upper() or "Unknown")


def summarize(rows):
    total = 0.0
    count = 0
    for row in rows:
        count += 1
        try:
            total += float(row.get("total", 0))
        except (TypeError, ValueError):
            continue
    average = total / count if count else 0.0
    return {
        "count": count,
        "total": round(total, 2),
        "average": round(average, 2),
    }


def decorate(rows, currency="USD"):
    decorated = []
    for row in rows:
        item = dict(row)
        item["region_label"] = region_label(item.get("region"))
        item["total_display"] = money(item.get("total"), currency)
        decorated.append(item)
    return decorated
