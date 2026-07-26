import os
import sys

from flask import Flask

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from py.reports import reports_bp
from utils.db import bootstrap


def create_app():
    app = Flask(__name__)
    app.register_blueprint(reports_bp)
    bootstrap()
    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=int(os.environ.get("REPORTS_PORT", 5000)))
