FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json tsconfig.json requirements.txt ./
RUN npm install --omit=dev
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

COPY src ./src

ENV PORT=3000
ENV REPORTS_PORT=5000
ENV REPORTS_SVC=http://127.0.0.1:5000
EXPOSE 3000

CMD ["/bin/sh", "-c", "/opt/venv/bin/python src/py/app.py & exec npx tsx src/server.ts"]
