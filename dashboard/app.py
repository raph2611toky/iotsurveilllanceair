from __future__ import annotations

import ast
import importlib.util
import json
import os
import re
import sqlite3
import sys
import time
from queue import Empty, Queue
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from flask import Flask, Response, jsonify, request, render_template, send_from_directory, stream_with_context
from flask_cors import CORS

try:
    from utils import send_email_notification
except Exception as exc:  # Le dashboard doit rester disponible même si l'email est mal configuré.
    send_email_notification = None
    EMAIL_UTILS_IMPORT_ERROR = exc
else:
    EMAIL_UTILS_IMPORT_ERROR = None

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "iot_projects.sqlite3"

app = Flask(__name__)
CORS(app)

# Flux interne du dashboard Flask : aucune récupération fetch côté template.
# Quand /api/projects/<id>/simulation-data reçoit une mesure, Flask la pousse
# directement aux pages /dashboard ouvertes via Server-Sent Events.
DASHBOARD_SUBSCRIBERS: list[Queue] = []


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def sanitize_name(name: str) -> str:
    name = (name or "").strip()
    name = re.sub(r"[<>:\"/\\|?*]", "_", name)
    name = re.sub(r"\s+", "_", name)
    return name.lower()[:80]


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 15000")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.execute("PRAGMA journal_mode = WAL")
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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS editor_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS raspberry_codes (
                project_id INTEGER PRIMARY KEY,
                item_id TEXT,
                code TEXT NOT NULL,
                validation TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
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


def get_state(key: str, default: Any = None) -> Any:
    with get_conn() as conn:
        row = conn.execute("SELECT value FROM editor_state WHERE key = ?", (key,)).fetchone()
    if row is None:
        return default
    try:
        return json.loads(row["value"])
    except Exception:
        return default


def set_state(key: str, value: Any) -> None:
    updated_at = now_iso()
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO editor_state (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            """,
            (key, json.dumps(value, ensure_ascii=False), updated_at),
        )
        conn.commit()


PIP_NAME_MAP = {
    "PIL": "pillow",
    "cv2": "opencv-python",
    "dotenv": "python-dotenv",
    "flask": "flask",
    "flask_cors": "flask-cors",
    "gpiozero": "gpiozero",
    "lgpio": "lgpio",
    "board": "adafruit-blinka",
    "busio": "adafruit-blinka",
    "digitalio": "adafruit-blinka",
    "adafruit_dht": "adafruit-circuitpython-dht",
    "adafruit_bmp280": "adafruit-circuitpython-bmp280",
    "adafruit_ssd1306": "adafruit-circuitpython-ssd1306",
    "requests": "requests",
}


def extract_import_roots(code: str) -> list[str]:
    tree = ast.parse(code)
    imports: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.add(alias.name.split(".")[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.add(node.module.split(".")[0])
    return sorted(imports)


def is_stdlib_module(module_name: str) -> bool:
    if module_name in sys.builtin_module_names:
        return True
    stdlib = getattr(sys, "stdlib_module_names", set())
    return module_name in stdlib


def validate_python_code(code: str) -> dict[str, Any]:
    result: dict[str, Any] = {
        "ok": False,
        "syntaxOk": False,
        "importsOk": False,
        "imports": [],
        "missingModules": [],
        "installCommand": "",
        "message": "",
    }

    try:
        imports = extract_import_roots(code)
        result["syntaxOk"] = True
        result["imports"] = imports
    except SyntaxError as exc:
        result["message"] = f"Erreur de syntaxe ligne {exc.lineno}: {exc.msg}"
        return result
    except Exception as exc:
        result["message"] = f"Impossible d'analyser le code: {exc}"
        return result

    missing = []
    for module_name in imports:
        if is_stdlib_module(module_name):
            continue
        try:
            spec = importlib.util.find_spec(module_name)
        except Exception:
            spec = None
        if spec is None:
            missing.append({
                "module": module_name,
                "package": PIP_NAME_MAP.get(module_name, module_name),
            })

    unique_packages = sorted({item["package"] for item in missing})
    result["missingModules"] = missing
    result["importsOk"] = not missing
    result["ok"] = result["syntaxOk"] and result["importsOk"]
    result["installCommand"] = "pip install " + " ".join(unique_packages) if unique_packages else ""
    result["message"] = (
        "Code valide : syntaxe OK et modules disponibles."
        if result["ok"]
        else "Code syntaxiquement valide, mais certains modules doivent être installés."
    )
    return result


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

            # Très important pour le dashboard : l'éditeur actualise souvent les capteurs
            # avec PUT /api/projects/<id>. On enregistre aussi cet état comme une mesure
            # temps réel, sinon seul le compteur peut augmenter sans que les cartes changent.
            if has_sensor_measurements(data):
                event_payload = make_project_snapshot_payload(project_id, name, data, updated_at)
                conn.execute(
                    "INSERT INTO simulation_events (project_id, payload, created_at) VALUES (?, ?, ?)",
                    (project_id, json.dumps(event_payload, ensure_ascii=False), updated_at),
                )

            conn.commit()
        except sqlite3.IntegrityError:
            return jsonify({"error": "Un autre projet porte déjà ce nom."}), 409

        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()

    # Mise à jour instantanée du template dashboard si le PUT contenait des valeurs de capteurs.
    if has_sensor_measurements(data):
        publish_dashboard_update(project_id)
        handle_critical_email_notification(project_id)

    return jsonify(row_to_project(row))


@app.delete("/api/projects/<int:project_id>")
def delete_project(project_id: int):
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Projet introuvable."}), 404
    return jsonify({"ok": True})



def publish_dashboard_update(project_id: int | None = None) -> None:
    """Diffuse une mise à jour aux templates dashboard ouverts.

    On reconstruit les données côté Flask, puis on les envoie au navigateur via
    EventSource. Le template ne fait donc plus de fetch vers une API dashboard.
    """
    try:
        data, status = build_dashboard_data(project_id, limit=80)
        if status != 200:
            payload = {"ok": False, "error": data.get("error", "Dashboard indisponible"), "projectId": project_id}
        else:
            payload = {"ok": True, "projectId": data.get("project", {}).get("id"), "dashboard": data}
    except Exception as exc:
        payload = {"ok": False, "error": str(exc), "projectId": project_id}

    dead: list[Queue] = []
    for subscriber in list(DASHBOARD_SUBSCRIBERS):
        try:
            subscriber.put_nowait(payload)
        except Exception:
            dead.append(subscriber)

    for subscriber in dead:
        try:
            DASHBOARD_SUBSCRIBERS.remove(subscriber)
        except ValueError:
            pass

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

    # Dès réception d'une mesure, Flask pousse les nouvelles valeurs vers le template.
    publish_dashboard_update(project_id)
    # Si l'état vient de passer en critique, Flask envoie aussi l'email d'alerte.
    handle_critical_email_notification(project_id)

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


@app.get("/api/editor-env")
def get_editor_env():
    """Retourne le projet actif persistant de l'éditeur.

    Cet état complète localStorage : si l'utilisateur recharge l'éditeur ou lance
    le code Raspberry Pi généré, le project_id actif peut être retrouvé de façon
    stable sans le réécrire à la main.
    """
    active_project = get_state("active_project", {}) or {}
    return jsonify({
        "activeProjectId": active_project.get("id"),
        "activeProjectName": active_project.get("name", ""),
        "updatedAt": active_project.get("updatedAt"),
        "env": {
            "IOT_PROJECT_ID": active_project.get("id"),
            "IOT_ACTIVE_PROJECT_ID": active_project.get("id"),
        },
    })


@app.post("/api/editor-env")
def set_editor_env():
    payload = request.get_json(silent=True) or {}
    project_id = payload.get("activeProjectId") or payload.get("projectId") or payload.get("id")
    project_name = payload.get("activeProjectName") or payload.get("projectName") or payload.get("name") or ""

    if project_id in (None, ""):
        return jsonify({"error": "activeProjectId est obligatoire."}), 400

    try:
        project_id = int(project_id)
    except (TypeError, ValueError):
        return jsonify({"error": "activeProjectId doit être numérique."}), 400

    with get_conn() as conn:
        project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if project is None:
        return jsonify({"error": "Projet introuvable."}), 404

    value = {
        "id": project_id,
        "name": project_name or project["name"],
        "updatedAt": now_iso(),
    }
    set_state("active_project", value)
    return jsonify({
        "ok": True,
        "activeProjectId": value["id"],
        "activeProjectName": value["name"],
        "updatedAt": value["updatedAt"],
    })


@app.post("/api/python/validate")
def validate_python_endpoint():
    payload = request.get_json(silent=True) or {}
    code = payload.get("code") or ""
    if not code.strip():
        return jsonify({"ok": False, "message": "Le code Python est vide."}), 400
    result = validate_python_code(code)
    status = 200 if result.get("syntaxOk") else 400
    return jsonify(result), status


@app.get("/api/projects/<int:project_id>/raspberry-code")
def get_raspberry_code(project_id: int):
    with get_conn() as conn:
        project = conn.execute("SELECT id FROM projects WHERE id = ?", (project_id,)).fetchone()
        if project is None:
            return jsonify({"error": "Projet introuvable."}), 404
        row = conn.execute("SELECT * FROM raspberry_codes WHERE project_id = ?", (project_id,)).fetchone()

    if row is None:
        return jsonify({"projectId": project_id, "code": "", "validation": None})

    return jsonify({
        "projectId": project_id,
        "itemId": row["item_id"],
        "code": row["code"],
        "validation": json.loads(row["validation"] or "null"),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    })


@app.post("/api/projects/<int:project_id>/raspberry-code")
def save_raspberry_code(project_id: int):
    payload = request.get_json(silent=True) or {}
    code = payload.get("code") or ""
    item_id = payload.get("itemId") or ""

    if not code.strip():
        return jsonify({"error": "Le code Raspberry Pi est vide."}), 400

    validation = validate_python_code(code)
    created_or_updated = now_iso()

    with get_conn() as conn:
        project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if project is None:
            return jsonify({"error": "Projet introuvable."}), 404

        existing = conn.execute("SELECT project_id FROM raspberry_codes WHERE project_id = ?", (project_id,)).fetchone()
        if existing is None:
            conn.execute(
                """
                INSERT INTO raspberry_codes (project_id, item_id, code, validation, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (project_id, item_id, code, json.dumps(validation, ensure_ascii=False), created_or_updated, created_or_updated),
            )
        else:
            conn.execute(
                """
                UPDATE raspberry_codes
                SET item_id = ?, code = ?, validation = ?, updated_at = ?
                WHERE project_id = ?
                """,
                (item_id, code, json.dumps(validation, ensure_ascii=False), created_or_updated, project_id),
            )

        data = json.loads(project["data"] or "{}")
        data["raspberryPiCode"] = code
        data["raspberryPiCodeUpdatedAt"] = created_or_updated
        data["savedAt"] = created_or_updated
        conn.execute(
            "UPDATE projects SET data = ?, updated_at = ? WHERE id = ?",
            (json.dumps(data, ensure_ascii=False), created_or_updated, project_id),
        )
        conn.commit()

    set_state("active_project", {"id": project_id, "name": project["name"], "updatedAt": created_or_updated})

    return jsonify({
        "ok": True,
        "projectId": project_id,
        "itemId": item_id,
        "validation": validation,
        "updatedAt": created_or_updated,
    })


# ---------------------------------------------------------------------------
# Dashboard temps réel
# ---------------------------------------------------------------------------

def as_float(value: Any, default: float | None = None) -> float | None:
    try:
        if value in (None, "", "None", "nan"):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def dig(data: dict[str, Any], *keys: str, default: Any = None) -> Any:
    current: Any = data
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current


def bool_value(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "oui", "on", "detected"}
    return False


def first_dict(*values: Any) -> dict[str, Any]:
    """Retourne le premier dictionnaire non vide."""
    for value in values:
        if isinstance(value, dict) and value:
            return value
    return {}


def pick_sensor_by_type(sensor_data: Any, sensor_type: str) -> dict[str, Any]:
    """Retrouve un capteur quel que soit le format envoyé.

    Formats acceptés :
    - {"dht22": {...}}
    - {"dht22-default": {"type": "dht22", ...}}
    - [{"type":"dht22", "data": {...}}]
    - [{"name":"DHT22", "data": {...}}]
    """
    wanted = str(sensor_type or "").strip().lower().replace("-", "")

    def matches(value: Any) -> bool:
        if not isinstance(value, dict):
            return False
        keys = [
            value.get("type"),
            value.get("sensor"),
            value.get("name"),
            value.get("itemType"),
        ]
        text = " ".join(str(x or "").lower().replace("-", "") for x in keys)
        return wanted in text

    def normalized(value: Any) -> dict[str, Any]:
        if not isinstance(value, dict):
            return {}
        data = value.get("data")
        if isinstance(data, dict):
            merged = {**value, **data}
            merged.setdefault("type", data.get("type") or value.get("type") or sensor_type)
            return merged
        return value

    if isinstance(sensor_data, dict):
        # clé directe : sensors.dht22, sensors.bmp280, etc.
        for key in (sensor_type, sensor_type.replace("-", ""), sensor_type.upper(), sensor_type.lower()):
            direct = sensor_data.get(key)
            if isinstance(direct, dict):
                return normalized(direct)

        # clé par itemId : dht22-default, mq2-xxxx, etc.
        for key, value in sensor_data.items():
            key_text = str(key).lower().replace("-", "")
            if wanted in key_text and isinstance(value, dict):
                return normalized(value)
            if matches(value):
                return normalized(value)

    if isinstance(sensor_data, list):
        for item in sensor_data:
            if not isinstance(item, dict):
                continue
            if matches(item):
                return normalized(item)
            data = item.get("data")
            if matches(data):
                return normalized(data)

    return {}

def get_all_sensor_sources(payload: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Centralise toutes les formes de données possibles.

    Le dashboard cible d'abord les valeurs EXACTEMENT envoyées à
    /api/projects/<id>/simulation-data. Pour ton éditeur, les valeurs sont dans :
    payload["simulation"]["sensorDataByItem"].
    """
    if not isinstance(payload, dict):
        return {"dht22": {}, "bmp280": {}, "mq135": {}, "mq2": {}}, {}

    # Certains clients enveloppent parfois le paquet dans data/payload/body.
    for wrapper_key in ("payload", "data", "body"):
        wrapped = payload.get(wrapper_key)
        if isinstance(wrapped, dict) and (
            "simulation" in wrapped or "sensorDataByItem" in wrapped or "sensors" in wrapped
        ):
            payload = wrapped
            break

    simulation = payload.get("simulation") if isinstance(payload.get("simulation"), dict) else {}
    editor = payload.get("editor") if isinstance(payload.get("editor"), dict) else {}
    sim_summary = simulation.get("summary") if isinstance(simulation.get("summary"), dict) else {}

    sources = {
        "real_sensors": payload.get("sensors") if isinstance(payload.get("sensors"), (dict, list)) else {},
        "top_by_item": payload.get("sensorDataByItem") if isinstance(payload.get("sensorDataByItem"), dict) else {},
        "simulation_by_item": simulation.get("sensorDataByItem") if isinstance(simulation.get("sensorDataByItem"), dict) else {},
        "simulation_summary_sensors": sim_summary.get("sensors") if isinstance(sim_summary.get("sensors"), list) else [],
        "editor_sensor_configs": editor.get("sensorConfigs") if isinstance(editor.get("sensorConfigs"), dict) else {},
    }

    merged: dict[str, Any] = {}
    for sensor_type in ("dht22", "bmp280", "mq135", "mq2"):
        # Priorité : mesures dynamiques envoyées, puis summary, puis configs statiques.
        merged[sensor_type] = first_dict(
            pick_sensor_by_type(sources["real_sensors"], sensor_type),
            pick_sensor_by_type(sources["top_by_item"], sensor_type),
            pick_sensor_by_type(sources["simulation_by_item"], sensor_type),
            pick_sensor_by_type(sources["simulation_summary_sensors"], sensor_type),
            pick_sensor_by_type(sources["editor_sensor_configs"], sensor_type),
        )

    return merged, simulation

def get_number(data: dict[str, Any], *keys: str) -> float | None:
    for key in keys:
        value = data.get(key)
        parsed = as_float(value, None)
        if parsed is not None:
            return parsed
    return None


def make_alert(sensor: str, field: str, value: Any, level: str, message: str) -> dict[str, Any]:
    return {
        "sensor": sensor,
        "field": field,
        "value": value,
        "level": level,
        "message": message,
    }


def evaluate_thresholds(event: dict[str, Any], previous: dict[str, Any] | None = None) -> tuple[str, list[dict[str, Any]], str]:
    alerts: list[dict[str, Any]] = []

    temp = event.get("temperature")
    humidity = event.get("humidity")
    pressure = event.get("pressure")
    mq135_ppm = event.get("mq135Ppm")
    mq2_ppm = event.get("mq2Ppm")

    # Seuils simples adaptés à la simulation. Tu peux les modifier ici.
    if isinstance(temp, (int, float)):
        if temp >= 45:
            alerts.append(make_alert("DHT22/BMP280", "temperature", round(temp, 1), "critical", "Température très élevée."))
        elif temp >= 35:
            alerts.append(make_alert("DHT22/BMP280", "temperature", round(temp, 1), "warning", "Température en hausse."))

    if isinstance(humidity, (int, float)):
        if humidity >= 85 or humidity <= 15:
            alerts.append(make_alert("DHT22", "humidity", round(humidity, 1), "critical", "Humidité hors zone critique."))
        elif humidity >= 75 or humidity <= 25:
            alerts.append(make_alert("DHT22", "humidity", round(humidity, 1), "warning", "Humidité proche du seuil."))

    if isinstance(pressure, (int, float)):
        if pressure >= 1050 or pressure <= 950:
            alerts.append(make_alert("BMP280", "pressure", round(pressure, 1), "critical", "Pression atmosphérique critique."))
        elif pressure >= 1035 or pressure <= 980:
            alerts.append(make_alert("BMP280", "pressure", round(pressure, 1), "warning", "Pression atmosphérique inhabituelle."))

    if isinstance(mq135_ppm, (int, float)):
        if mq135_ppm >= 1200:
            alerts.append(make_alert("MQ-135", "co2", round(mq135_ppm, 1), "critical", "Pollution/CO₂ très élevée."))
        elif mq135_ppm >= 800:
            alerts.append(make_alert("MQ-135", "co2", round(mq135_ppm, 1), "warning", "Qualité de l'air en dégradation."))

    if isinstance(mq2_ppm, (int, float)):
        if mq2_ppm >= 300:
            alerts.append(make_alert("MQ-2", "smoke", round(mq2_ppm, 1), "critical", "Fumée ou gaz inflammable critique."))
        elif mq2_ppm >= 150:
            alerts.append(make_alert("MQ-2", "smoke", round(mq2_ppm, 1), "warning", "Début de fumée/gaz détecté."))

    if event.get("mq135Detected"):
        alerts.append(make_alert("MQ-135", "digital", event.get("mq135Raw"), "critical", "Sortie digitale MQ-135 active."))
    if event.get("mq2Detected"):
        alerts.append(make_alert("MQ-2", "digital", event.get("mq2Raw"), "critical", "Sortie digitale MQ-2 active."))

    if previous:
        spike_rules = [
            ("temperature", "DHT22/BMP280", 3.0, "Pic rapide de température."),
            ("humidity", "DHT22", 8.0, "Pic rapide d'humidité."),
            ("pressure", "BMP280", 8.0, "Variation rapide de pression."),
            ("mq135Ppm", "MQ-135", 100.0, "Pic rapide de pollution/CO₂."),
            ("mq2Ppm", "MQ-2", 50.0, "Pic rapide de fumée/gaz."),
        ]
        for key, sensor, delta, message in spike_rules:
            current = event.get(key)
            old = previous.get(key)
            if isinstance(current, (int, float)) and isinstance(old, (int, float)) and current - old >= delta:
                alerts.append(make_alert(sensor, key, round(current, 1), "warning", message))

    level = "normal"
    if any(alert.get("level") == "critical" for alert in alerts):
        level = "critical"
    elif alerts:
        level = "warning"

    if level == "critical":
        recommendation = "Situation critique : vérifie immédiatement la zone et aère si nécessaire."
    elif level == "warning":
        recommendation = "Pré-alerte : surveille l'évolution des capteurs, un pic vient d'être détecté."
    else:
        recommendation = "Situation normale : les capteurs restent dans les seuils acceptables."

    return level, alerts, recommendation



def has_sensor_measurements(payload: dict[str, Any]) -> bool:
    """Retourne True si le payload contient vraiment des valeurs de capteurs.

    Important : l'éditeur envoie parfois deux flux :
    - PUT /api/projects/<id> avec data.simulation.sensorDataByItem
    - POST /simulation-data avec un payload Raspberry Pi qui peut ne contenir que pins/timestamp
    Le dashboard doit donc savoir distinguer un vrai paquet de mesures d'un simple paquet technique.
    """
    if not isinstance(payload, dict):
        return False
    sensors, simulation = get_all_sensor_sources(payload)
    for sensor in sensors.values():
        if not isinstance(sensor, dict):
            continue
        for key in (
            "temperature", "temperature_c", "humidity", "humidity_percent",
            "pressure", "pressure_hpa", "co2", "co2_ppm", "smoke", "smoke_ppm",
            "ppm", "value", "alert", "airQuality",
        ):
            if key in sensor and sensor.get(key) not in (None, ""):
                return True
    if isinstance(simulation, dict) and isinstance(simulation.get("summary"), dict):
        return bool(simulation["summary"].get("sensors"))
    return False


def normalize_payload_event(payload: dict[str, Any], event_id: Any, created_at: str) -> dict[str, Any]:
    """Convertit le payload reçu par /simulation-data en valeurs dashboard.

    Le but est de ne plus deviner côté HTML : Python extrait ici les vraies valeurs
    fournies par l'éditeur ou par le Raspberry Pi, puis le template ne fait que les
    afficher.
    """
    if not isinstance(payload, dict):
        payload = {}

    sensors, simulation = get_all_sensor_sources(payload)
    analysis = payload.get("analysis") if isinstance(payload.get("analysis"), dict) else {}
    api = payload.get("api") if isinstance(payload.get("api"), dict) else {}

    dht = sensors.get("dht22") or {}
    bmp = sensors.get("bmp280") or {}
    mq135 = sensors.get("mq135") or {}
    mq2 = sensors.get("mq2") or {}

    # Champs exacts de ton éditeur :
    # dht22.temperature, dht22.humidity, bmp280.pressure,
    # mq135.co2, mq2.smoke.
    temperature = get_number(dht, "temperature", "temperature_c", "temp", "value")
    bmp_temperature = get_number(bmp, "temperature", "temperature_c", "temp")
    if temperature is None:
        temperature = bmp_temperature

    humidity = get_number(dht, "humidity", "humidity_percent", "humidite")
    pressure = get_number(bmp, "pressure", "pressure_hpa", "pression", "value")
    altitude = get_number(bmp, "altitude", "altitude_m")

    mq135_ppm = get_number(mq135, "co2", "co2_ppm", "ppm", "value", "air_quality")
    mq2_ppm = get_number(mq2, "smoke", "smoke_ppm", "ppm", "value")

    mq135_detected = (
        bool_value(mq135.get("gas_detected"))
        or bool_value(mq135.get("detected"))
        or bool_value(mq135.get("alert"))
        or bool_value(mq135.get("digital"))
    )
    mq2_detected = (
        bool_value(mq2.get("gas_detected"))
        or bool_value(mq2.get("detected"))
        or bool_value(mq2.get("alert"))
        or bool_value(mq2.get("digital"))
    )

    raw_alerts = analysis.get("alerts") if isinstance(analysis.get("alerts"), list) else []
    status = str(analysis.get("global_status") or analysis.get("status") or payload.get("status") or "").strip().lower()
    if status not in {"normal", "warning", "critical"}:
        status = ""

    event_time = (
        payload.get("datetime_utc")
        or payload.get("datetime")
        or payload.get("timestamp")
        or payload.get("savedAt")
        or simulation.get("timestamp")
        or dig(simulation, "summary", "timestamp")
        or created_at
    )

    leds = payload.get("leds") if isinstance(payload.get("leds"), dict) else {}
    if not leds:
        leds = {"red": "off", "green": "off"}

    source = (
        payload.get("source")
        or dig(payload, "simulation", "summary", "source")
        or api.get("source")
        or "Éditeur / Raspberry Pi 5"
    )

    return {
        "id": event_id,
        "createdAt": created_at,
        "datetime": event_time,
        "timestamp": payload.get("timestamp") or payload.get("savedAt") or simulation.get("timestamp"),
        "source": source,
        "status": status or "normal",
        "temperature": temperature,
        "bmpTemperature": bmp_temperature,
        "humidity": humidity,
        "pressure": pressure,
        "altitude": altitude,
        "mq135Detected": mq135_detected,
        "mq2Detected": mq2_detected,
        "mq135Raw": mq135.get("digital_raw") or mq135.get("raw") or mq135.get("DOUT"),
        "mq2Raw": mq2.get("digital_raw") or mq2.get("raw") or mq2.get("DOUT"),
        "mq135Ppm": mq135_ppm,
        "mq2Ppm": mq2_ppm,
        "mq135AirQuality": mq135.get("airQuality") or mq135.get("air_quality") or mq135.get("quality"),
        "mq2Alert": mq2.get("alert"),
        "alertsCount": int(analysis.get("alerts_count") or len(raw_alerts)),
        "alerts": raw_alerts,
        "recommendation": analysis.get("recommendation", ""),
        "leds": leds,
        "pins": payload.get("pins") if isinstance(payload.get("pins"), dict) else {},
        "rawSensors": {"dht22": dht, "bmp280": bmp, "mq135": mq135, "mq2": mq2},
    }

def make_project_snapshot_payload(project_id: int, project_name: str, data: dict[str, Any], created_at: str) -> dict[str, Any]:
    """Transforme l'état complet sauvegardé par l'éditeur en mesure lisible par le dashboard."""
    payload = dict(data or {})
    payload.setdefault("source", "Éditeur de simulation")
    payload.setdefault("timestamp", created_at)
    payload.setdefault("datetime", created_at)
    payload["project"] = {
        "id": project_id,
        "name": project_name,
        **(payload.get("project") if isinstance(payload.get("project"), dict) else {}),
    }
    return payload

def normalize_simulation_event(row: sqlite3.Row) -> dict[str, Any]:
    payload = json.loads(row["payload"] or "{}")
    return normalize_payload_event(payload, row["id"], row["created_at"])


def average(values: list[float | None]) -> float | None:
    usable = [v for v in values if isinstance(v, (int, float))]
    if not usable:
        return None
    return round(sum(usable) / len(usable), 2)


def max_or_none(values: list[float | None]) -> float | None:
    usable = [v for v in values if isinstance(v, (int, float))]
    return max(usable) if usable else None


def min_or_none(values: list[float | None]) -> float | None:
    usable = [v for v in values if isinstance(v, (int, float))]
    return min(usable) if usable else None



def display_number(value: Any, decimals: int = 1) -> str:
    number = as_float(value, None)
    if number is None:
        return "--"
    return f"{number:.{decimals}f}"


def make_display_payload(dashboard: dict[str, Any]) -> dict[str, Any]:
    """Prépare les chaînes prêtes à afficher dans index.html.

    Ainsi, le JS ne calcule plus les valeurs capteurs. Il applique uniquement ce
    que Flask a déjà interprété depuis /simulation-data.
    """
    latest = dashboard.get("latest") if isinstance(dashboard.get("latest"), dict) else None
    summary = dashboard.get("summary") if isinstance(dashboard.get("summary"), dict) else {}

    if not latest:
        return {
            "globalStatus": "En attente",
            "recommendation": "Aucune mesure reçue pour ce projet.",
            "eventCount": str(summary.get("totalEvents") or 0),
            "alertCount": "0",
            "source": "--",
            "temperature": "--",
            "humidity": "--",
            "pressure": "--",
            "mq135": "--",
            "mq2": "--",
            "leds": "--",
            "lastUpdate": "En attente des données",
            "alertBadge": "0 alerte",
        }

    status = latest.get("status") or "normal"
    if status == "critical":
        status_text = "Critique"
    elif status == "warning":
        status_text = "Pré-alerte"
    else:
        status_text = "Normal"

    mq135_ppm = latest.get("mq135Ppm")
    mq2_ppm = latest.get("mq2Ppm")
    mq135 = f"{display_number(mq135_ppm, 0)} ppm"
    if mq135_ppm is None:
        mq135 = "Détecté" if latest.get("mq135Detected") else "Stable"
    if latest.get("mq135AirQuality"):
        mq135 += f" · {latest.get('mq135AirQuality')}"

    mq2 = f"{display_number(mq2_ppm, 0)} ppm"
    if mq2_ppm is None:
        mq2 = "Détecté" if latest.get("mq2Detected") else "Stable"
    if latest.get("mq2Alert"):
        mq2 += " · alerte"

    leds = latest.get("leds") if isinstance(latest.get("leds"), dict) else {}
    red = leds.get("red", "off")
    green = leds.get("green", "off")
    alerts_count = int(latest.get("alertsCount") or 0)

    return {
        "globalStatus": status_text,
        "recommendation": latest.get("recommendation") or "Situation normale.",
        "eventCount": str(summary.get("totalEvents") or 0),
        "alertCount": str(alerts_count),
        "source": latest.get("source") or "Éditeur / Raspberry Pi 5",
        "temperature": display_number(latest.get("temperature"), 1),
        "humidity": display_number(latest.get("humidity"), 1),
        "pressure": display_number(latest.get("pressure"), 1),
        "mq135": mq135,
        "mq2": mq2,
        "leds": f"Rouge:{red} · Verte:{green}",
        "lastUpdate": latest.get("datetime") or latest.get("createdAt") or "--",
        "alertBadge": f"{alerts_count} alerte" + ("s" if alerts_count > 1 else ""),
    }




def email_alerts_enabled() -> bool:
    value = os.getenv("EMAIL_ALERT_ENABLED", "true").strip().lower()
    return value not in {"0", "false", "no", "non", "off"}


def build_critical_email_message(project: dict[str, Any], latest: dict[str, Any], display: dict[str, Any]) -> str:
    alerts = latest.get("alerts") if isinstance(latest.get("alerts"), list) else []
    alert_lines = []
    for alert in alerts:
        sensor = alert.get("sensor") or "Capteur"
        message = alert.get("message") or "Seuil critique détecté"
        value = alert.get("value")
        field = alert.get("field") or "valeur"
        suffix = f" ({field}: {value})" if value not in (None, "") else ""
        alert_lines.append(f"- {sensor}: {message}{suffix}")

    if not alert_lines:
        alert_lines.append("- Situation critique détectée par le système de surveillance.")

    return "\n".join([
        "ALERTE CRITIQUE - Surveillance qualité de l'air",
        "",
        f"Projet : #{project.get('id')} · {project.get('name')}",
        f"Date/heure : {display.get('lastUpdate') or latest.get('datetime') or latest.get('createdAt')}",
        f"État global : {display.get('globalStatus') or latest.get('status')}",
        "",
        "Valeurs reçues :",
        f"- Température : {display.get('temperature', '--')} °C",
        f"- Humidité : {display.get('humidity', '--')} %",
        f"- Pression : {display.get('pressure', '--')} hPa",
        f"- MQ-135 : {display.get('mq135', '--')}",
        f"- MQ-2 : {display.get('mq2', '--')}",
        f"- LEDs : {display.get('leds', '--')}",
        "",
        "Alertes :",
        *alert_lines,
        "",
        f"Recommandation : {display.get('recommendation') or latest.get('recommendation') or 'Vérifier immédiatement la zone.'}",
    ])


def handle_critical_email_notification(project_id: int | None, dashboard: dict[str, Any] | None = None) -> None:
    """Envoie un email uniquement quand l'état devient critique.

    Le but est d'éviter un email toutes les 2 secondes lorsque le capteur reste
    critique. On mémorise le dernier état critique dans editor_state.
    """
    if project_id is None or not email_alerts_enabled():
        return

    if dashboard is None:
        dashboard, status = build_dashboard_data(project_id, limit=80)
        if status != 200:
            return

    latest = dashboard.get("latest") if isinstance(dashboard.get("latest"), dict) else None
    project = dashboard.get("project") if isinstance(dashboard.get("project"), dict) else {"id": project_id, "name": "Projet"}
    display = dashboard.get("display") if isinstance(dashboard.get("display"), dict) else make_display_payload(dashboard)

    if not latest:
        return

    current_status = str(latest.get("status") or "normal").lower()
    current_event_id = str(latest.get("id") or "")
    state_key = f"email_critical_alert_project_{project_id}"
    previous_state = get_state(state_key, {}) or {}
    previous_status = str(previous_state.get("lastStatus") or "").lower()

    base_state = {
        "lastStatus": current_status,
        "lastEventId": current_event_id,
        "updatedAt": now_iso(),
    }

    if current_status != "critical":
        set_state(state_key, {**previous_state, **base_state})
        return

    # On envoie seulement au moment où l'état devient critique.
    if previous_status == "critical":
        set_state(state_key, {**previous_state, **base_state})
        return

    if send_email_notification is None:
        set_state(state_key, {
            **previous_state,
            **base_state,
            "lastEmailOk": False,
            "lastEmailError": f"utils.py non chargé: {EMAIL_UTILS_IMPORT_ERROR}",
        })
        return

    message = build_critical_email_message(project, latest, display)
    subject = f"ALERTE CRITIQUE · Qualité de l'air · Projet #{project.get('id')}"
    context = {
        "project": project,
        "latest": latest,
        "display": display,
        "alerts": latest.get("alerts") or [],
        "dashboard_url": os.getenv("DASHBOARD_URL", "http://127.0.0.1:5000/dashboard"),
    }

    try:
        result = send_email_notification(message=message, subject=subject, context=context)
        set_state(state_key, {
            **base_state,
            "lastStatusBeforeSend": previous_status or "normal",
            "lastCriticalEventId": current_event_id,
            "lastEmailOk": True,
            "lastEmailSentAt": now_iso(),
            "lastEmailResult": result,
        })
        print(f"[EMAIL] Alerte critique envoyée pour le projet {project_id} vers {result.get('recipient')}")
    except Exception as exc:
        set_state(state_key, {
            **base_state,
            "lastCriticalEventId": current_event_id,
            "lastEmailOk": False,
            "lastEmailError": str(exc),
            "lastEmailFailedAt": now_iso(),
        })
        print(f"[EMAIL] Échec envoi alerte critique projet {project_id}: {exc}")


def compact_dashboard_event(event: dict[str, Any] | None) -> dict[str, Any] | None:
    """Ne garde que les champs utiles au template.

    Les valeurs capteurs restent exactes : elles viennent de normalize_payload_event().
    """
    if not isinstance(event, dict):
        return None

    allowed = [
        "id", "createdAt", "datetime", "timestamp", "source", "status",
        "temperature", "bmpTemperature", "humidity", "pressure", "altitude",
        "mq135Detected", "mq2Detected", "mq135Raw", "mq2Raw",
        "mq135Ppm", "mq2Ppm", "mq135AirQuality", "mq2Alert",
        "alertsCount", "alerts", "recommendation", "leds",
    ]
    return {key: event.get(key) for key in allowed if key in event}

def build_dashboard_data(project_id: int | None = None, limit: int = 80) -> tuple[dict[str, Any], int]:
    limit = max(5, min(int(limit or 80), 300))

    with get_conn() as conn:
        project = None
        if project_id is not None:
            project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        else:
            active = get_state("active_project", {}) or {}
            active_id = active.get("id")
            if active_id:
                project = conn.execute("SELECT * FROM projects WHERE id = ?", (active_id,)).fetchone()
            if project is None:
                project = conn.execute("SELECT * FROM projects ORDER BY updated_at DESC LIMIT 1").fetchone()

        if project is None:
            return ({"error": "Aucun projet disponible."}, 404)

        rows = conn.execute(
            """
            SELECT id, payload, created_at
            FROM simulation_events
            WHERE project_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (project["id"], limit),
        ).fetchall()

        total_events = conn.execute(
            "SELECT COUNT(*) AS total FROM simulation_events WHERE project_id = ?",
            (project["id"],),
        ).fetchone()["total"]

    history = [normalize_simulation_event(row) for row in reversed(rows)]

    # Fallback instantané : si l'état courant du projet contient les capteurs mais que
    # le dernier POST /simulation-data ne contient que pins/timestamp, on ajoute l'état
    # courant du projet comme dernière mesure visible. Cela rend le dashboard vivant
    # pendant la simulation de l'éditeur.
    try:
        project_data = json.loads(project["data"] or "{}") if "data" in project.keys() else {}
    except Exception:
        project_data = {}
    if has_sensor_measurements(project_data):
        snapshot_payload = make_project_snapshot_payload(project["id"], project["name"], project_data, project["updated_at"])
        snapshot = normalize_payload_event(snapshot_payload, f"project-{project['id']}-{project['updated_at']}", project["updated_at"])
        if not history or str(history[-1].get("datetime")) != str(snapshot.get("datetime")):
            history.append(snapshot)

    # Complète l'état, les alertes et les LEDs pour les données venant de l'éditeur.
    previous = None
    for event in history:
        computed_status, computed_alerts, computed_reco = evaluate_thresholds(event, previous)
        existing_alerts = event.get("alerts") if isinstance(event.get("alerts"), list) else []
        if existing_alerts:
            event["alerts"] = existing_alerts + [a for a in computed_alerts if a not in existing_alerts]
            if event.get("status") not in {"warning", "critical"}:
                event["status"] = computed_status
        else:
            event["alerts"] = computed_alerts
            event["status"] = computed_status

        event["alertsCount"] = len(event.get("alerts") or [])
        if not event.get("recommendation"):
            event["recommendation"] = computed_reco

        leds = event.get("leds") if isinstance(event.get("leds"), dict) else {}
        if event["status"] == "critical":
            leds = {**leds, "red": "on", "green": "off"}
        elif event["status"] == "warning":
            leds = {**leds, "red": "off", "green": "on"}
        else:
            leds = {**leds, "red": "off", "green": "off"}
        event["leds"] = leds
        previous = event

    latest = history[-1] if history else None

    # Version compacte envoyée au navigateur : garde les calculs complets côté
    # serveur, mais évite d'envoyer le payload brut très lourd du simulateur.
    compact_history = [compact_dashboard_event(event) for event in history]
    compact_latest = compact_dashboard_event(latest)

    status_counts = {"normal": 0, "warning": 0, "critical": 0}
    alerts_by_sensor: dict[str, int] = {}
    for event in history:
        status_counts[event["status"]] = status_counts.get(event["status"], 0) + 1
        for alert in event.get("alerts", []):
            sensor = str(alert.get("sensor") or "Inconnu")
            alerts_by_sensor[sensor] = alerts_by_sensor.get(sensor, 0) + 1

    temperatures = [event["temperature"] for event in history]
    humidities = [event["humidity"] for event in history]
    pressures = [event["pressure"] for event in history]
    mq135_values = [event.get("mq135Ppm") for event in history]
    mq2_values = [event.get("mq2Ppm") for event in history]

    response = {
        "project": {"id": project["id"], "name": project["name"]},
        "latest": compact_latest,
        "history": compact_history,
        "summary": {
            "totalEvents": total_events,
            "visibleEvents": len(history),
            "statusCounts": status_counts,
            "alertsBySensor": alerts_by_sensor,
            "averages": {
                "temperature": average(temperatures),
                "humidity": average(humidities),
                "pressure": average(pressures),
                "mq135Ppm": average(mq135_values),
                "mq2Ppm": average(mq2_values),
            },
            "max": {
                "temperature": max_or_none(temperatures),
                "humidity": max_or_none(humidities),
                "pressure": max_or_none(pressures),
                "mq135Ppm": max_or_none(mq135_values),
                "mq2Ppm": max_or_none(mq2_values),
            },
            "min": {
                "temperature": min_or_none(temperatures),
                "humidity": min_or_none(humidities),
                "pressure": min_or_none(pressures),
                "mq135Ppm": min_or_none(mq135_values),
                "mq2Ppm": min_or_none(mq2_values),
            },
        },
        "serverTime": now_iso(),
        "transport": {"compact": True, "historyReturned": len(compact_history)},
    }
    response["display"] = make_display_payload(response)
    return response, 200




@app.after_request
def add_no_cache_headers(response):
    if request.path.startswith("/api/") or request.path in {"/dashboard", "/", "/dashboard.css", "/dashboard/stream"}:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


@app.get("/images/<path:filename>")
def dashboard_image(filename: str):
    response = send_from_directory(BASE_DIR / "images", filename)
    response.headers["Cache-Control"] = "no-cache"
    return response


@app.get("/dashboard.css")
def dashboard_stylesheet():
    response = send_from_directory(BASE_DIR / "templates", "index.css")
    response.headers["Cache-Control"] = "no-store"
    return response


def get_project_rows_for_dashboard() -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, created_at, updated_at FROM projects ORDER BY updated_at DESC"
        ).fetchall()
    return [row_to_summary(row) for row in rows]


def resolve_dashboard_project_id() -> int | None:
    raw = request.args.get("project_id") or request.args.get("projectId")
    if raw:
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    active = get_state("active_project", {}) or {}
    active_id = active.get("id")
    if active_id:
        try:
            return int(active_id)
        except (TypeError, ValueError):
            pass

    projects = get_project_rows_for_dashboard()
    return int(projects[0]["id"]) if projects else None


@app.get("/")
@app.get("/dashboard")
def dashboard_page():
    """Page dashboard rendue par Flask.

    Les premières valeurs sont injectées par Jinja au moment du render_template.
    Les valeurs suivantes arrivent par /dashboard/stream, donc le HTML ne fait
    plus de fetch vers /api/dashboard-data.
    """
    projects = get_project_rows_for_dashboard()
    active_project_id = resolve_dashboard_project_id()
    dashboard_data: dict[str, Any] = {
        "project": None,
        "latest": None,
        "history": [],
        "summary": {"totalEvents": 0, "statusCounts": {"normal": 0, "warning": 0, "critical": 0}},
        "serverTime": now_iso(),
    }
    dashboard_data["display"] = make_display_payload(dashboard_data)
    status = 200
    if active_project_id:
        dashboard_data, status = build_dashboard_data(active_project_id, limit=80)
        if status != 200:
            dashboard_data = {
                "project": {"id": active_project_id, "name": "Projet introuvable"},
                "latest": None,
                "history": [],
                "summary": {"totalEvents": 0, "statusCounts": {"normal": 0, "warning": 0, "critical": 0}},
                "error": dashboard_data.get("error", "Impossible de charger le dashboard"),
                "serverTime": now_iso(),
            }
            dashboard_data["display"] = make_display_payload(dashboard_data)

    return render_template(
        "index.html",
        projects=projects,
        active_project_id=active_project_id,
        dashboard_data=dashboard_data,
    )


@app.get("/dashboard/stream")
def dashboard_stream():
    """Flux temps réel Flask -> template.

    Ce n'est pas une récupération fetch côté dashboard. Le navigateur garde une
    connexion ouverte et Flask pousse une mise à jour quand /simulation-data ou
    PUT /projects reçoit une nouvelle mesure.
    """
    project_id = resolve_dashboard_project_id()
    subscriber: Queue = Queue(maxsize=10)
    DASHBOARD_SUBSCRIBERS.append(subscriber)

    def sse(event: str, payload: dict[str, Any]) -> str:
        return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"

    @stream_with_context
    def generate():
        try:
            # Envoi initial : le template reçoit immédiatement l'état serveur.
            data, status = build_dashboard_data(project_id, limit=80)
            yield sse("dashboard", {"ok": status == 200, "projectId": project_id, "dashboard": data})

            while True:
                try:
                    payload = subscriber.get(timeout=20)
                    target = payload.get("projectId")
                    if project_id is None or target is None or int(target) == int(project_id):
                        yield sse("dashboard", payload)
                except Empty:
                    yield sse("heartbeat", {"ok": True, "time": now_iso()})
        finally:
            try:
                DASHBOARD_SUBSCRIBERS.remove(subscriber)
            except ValueError:
                pass

    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    }
    return Response(generate(), mimetype="text/event-stream", headers=headers)


# Ces routes restent disponibles pour debug manuel, mais le template dashboard
# ne les utilise plus pour son affichage temps réel.
@app.get("/api/dashboard/active")
def active_dashboard_data():
    limit = request.args.get("limit", default=80, type=int)
    data, status = build_dashboard_data(None, limit)
    return jsonify(data), status


@app.get("/api/projects/<int:project_id>/dashboard-data")
def project_dashboard_data(project_id: int):
    limit = request.args.get("limit", default=80, type=int)
    data, status = build_dashboard_data(project_id, limit)
    return jsonify(data), status


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False, threaded=True)
