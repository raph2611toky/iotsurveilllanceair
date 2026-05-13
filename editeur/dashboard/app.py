from __future__ import annotations

import json
import re
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "iot_projects.sqlite3"

app = Flask(__name__)
CORS(app)


def now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def sanitize_name(name: str) -> str:
    name = (name or "").strip()
    name = re.sub(r"[<>:\"/\\|?*]", "_", name)
    name = re.sub(r"\s+", "_", name)
    return name.lower()[:80]


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS simulation_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
            """
        )
        conn.commit()


def row_to_summary(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def row_to_project(row: sqlite3.Row) -> dict[str, Any]:
    data = json.loads(row["data"] or "{}")
    return {
        "id": row["id"],
        "name": row["name"],
        "data": data,
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


@app.before_request
def ensure_db() -> None:
    init_db()


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "database": str(DB_PATH)})


@app.get("/api/projects")
def get_projects():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, created_at, updated_at FROM projects ORDER BY updated_at DESC"
        ).fetchall()
    return jsonify([row_to_summary(row) for row in rows])


@app.post("/api/projects")
def create_project():
    payload = request.get_json(silent=True) or {}
    name = sanitize_name(payload.get("name", ""))
    data = payload.get("data") or {}

    if not name:
        return jsonify({"error": "Le nom du projet est obligatoire."}), 400

    data["name"] = name
    data["savedAt"] = now_iso()
    created_at = now_iso()

    try:
        with get_conn() as conn:
            cursor = conn.execute(
                "INSERT INTO projects (name, data, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (name, json.dumps(data, ensure_ascii=False), created_at, created_at),
            )
            conn.commit()
            project_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({"error": "Un projet avec ce nom existe déjà."}), 409

    return jsonify({
        "id": project_id,
        "name": name,
        "data": data,
        "createdAt": created_at,
        "updatedAt": created_at,
    }), 201


@app.get("/api/projects/<int:project_id>")
def get_project(project_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if row is None:
        return jsonify({"error": "Projet introuvable."}), 404
    return jsonify(row_to_project(row))


@app.put("/api/projects/<int:project_id>")
def update_project(project_id: int):
    payload = request.get_json(silent=True) or {}
    data = payload.get("data") or {}
    new_name = payload.get("name")
    updated_at = now_iso()

    with get_conn() as conn:
        current = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if current is None:
            return jsonify({"error": "Projet introuvable."}), 404

        name = current["name"]
        if new_name:
            name = sanitize_name(new_name)
            if not name:
                return jsonify({"error": "Nom de projet invalide."}), 400

        data["name"] = name
        data["savedAt"] = updated_at

        try:
            conn.execute(
                "UPDATE projects SET name = ?, data = ?, updated_at = ? WHERE id = ?",
                (name, json.dumps(data, ensure_ascii=False), updated_at, project_id),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            return jsonify({"error": "Un autre projet porte déjà ce nom."}), 409

        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()

    return jsonify(row_to_project(row))


@app.delete("/api/projects/<int:project_id>")
def delete_project(project_id: int):
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Projet introuvable."}), 404
    return jsonify({"ok": True})


@app.post("/api/projects/<int:project_id>/simulation-data")
def receive_project_simulation_data(project_id: int):
    """Reçoit les informations complètes de simulation venant de l'éditeur.

    Le payload peut contenir : projet, items, wires, capteurs, mesures, état
    d'alimentation, mapping des connexions, horodatage, etc.
    """
    payload = request.get_json(silent=True) or {}
    created_at = now_iso()

    with get_conn() as conn:
        project = conn.execute("SELECT id FROM projects WHERE id = ?", (project_id,)).fetchone()
        if project is None:
            return jsonify({"error": "Projet introuvable."}), 404

        cursor = conn.execute(
            "INSERT INTO simulation_events (project_id, payload, created_at) VALUES (?, ?, ?)",
            (project_id, json.dumps(payload, ensure_ascii=False), created_at),
        )
        conn.commit()

    return jsonify({
        "ok": True,
        "eventId": cursor.lastrowid,
        "projectId": project_id,
        "receivedAt": created_at,
    }), 201


@app.get("/api/projects/<int:project_id>/simulation-data")
def get_project_simulation_events(project_id: int):
    limit = request.args.get("limit", default=20, type=int)
    limit = max(1, min(limit, 100))

    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT id, payload, created_at
            FROM simulation_events
            WHERE project_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (project_id, limit),
        ).fetchall()

    return jsonify([
        {
            "id": row["id"],
            "payload": json.loads(row["payload"] or "{}"),
            "createdAt": row["created_at"],
        }
        for row in rows
    ])


if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=5000, debug=True)
