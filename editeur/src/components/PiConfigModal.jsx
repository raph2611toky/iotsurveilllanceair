import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { componentsData } from "../data/componentsData";

function getPinUniqueKey(pin) {
  return pin?.pinKey || pin?.key || pin?.id || `pin-${pin?.number || pin?.pinName || pin?.name}-${pin?.localX ?? pin?.x}-${pin?.localY ?? pin?.y}`;
}

function makePinKey(pinRef) {
  return `${pinRef.itemId}:${getPinUniqueKey(pinRef)}`;
}

function getPinNodeId(itemId, pin) {
  return `${itemId}:${getPinUniqueKey(pin)}`;
}

function createUnionFind() {
  const parent = new Map();

  function find(x) {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x);
    if (p !== x) parent.set(x, find(p));
    return parent.get(x);
  }

  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  }

  function connected(a, b) {
    return find(a) === find(b);
  }

  return { find, union, connected };
}

function getBreadboardGroupKey(pinName = "") {
  const name = String(pinName).toUpperCase();
  if (/^L\+\d+$/.test(name)) return "LEFT_PLUS_RAIL";
  if (/^L-\d+$/.test(name)) return "LEFT_MINUS_RAIL";
  if (/^R\+\d+$/.test(name)) return "RIGHT_PLUS_RAIL";
  if (/^R-\d+$/.test(name)) return "RIGHT_MINUS_RAIL";
  const columnMatch = name.match(/^([A-J])(\d+)$/);
  if (columnMatch) return `COLUMN_${columnMatch[1]}`;
  return null;
}

function normalizeConstantPart(value = "") {
  return String(value)
    .toUpperCase()
    .replace(/GPIO/g, "GPIO")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getComponentPrefix(type, name) {
  const map = {
    dht22: "DHT22",
    mq135: "MQ135",
    mq2: "MQ2",
    bmp280: "BMP280",
    oled: "OLED",
    pir: "PIR",
    pressure: "PRESSURE",
    soil: "SOIL",
    relay: "RELAY",
    buzzer: "BUZZER",
    led_r: "LED_RED",
    led_g: "LED_GREEN",
    wifi: "WIFI",
    bluetooth: "BT",
  };

  return map[type] || normalizeConstantPart(name || type);
}

function normalizeRpiPinValue(pinName = "") {
  const text = String(pinName).toUpperCase();
  const gpio = text.match(/GPIO\s*(\d+)/);
  if (gpio) return `GPIO${gpio[1]}`;
  if (text.includes("3V3") || text.includes("3.3V")) return "3V3";
  if (text.includes("5V")) return "5V";
  if (text.includes("GND")) return "GND";
  if (text.includes("SDA")) return "GPIO2";
  if (text.includes("SCL")) return "GPIO3";
  return normalizeConstantPart(text) || "PIN";
}

function extractGpioNumber(pinValue) {
  const gpio = String(pinValue || "").match(/GPIO\s*(\d+)/i);
  return gpio ? Number(gpio[1]) : null;
}

function buildElectricalNetwork(items, wires) {
  const uf = createUnionFind();

  items.forEach((item) => {
    const component = componentsData[item.type];
    component?.pins?.forEach((pin) => uf.find(getPinNodeId(item.id, pin)));
  });

  items.forEach((item) => {
    if (item.type !== "breadboard") return;
    const component = componentsData[item.type];
    const groups = new Map();

    component?.pins?.forEach((pin) => {
      const groupKey = getBreadboardGroupKey(pin.name);
      if (!groupKey) return;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(getPinNodeId(item.id, pin));
    });

    groups.forEach((nodes) => {
      const [first, ...rest] = nodes;
      rest.forEach((node) => uf.union(first, node));
    });
  });

  wires.forEach((wire) => {
    if (!wire?.from || !wire?.to) return;
    uf.union(makePinKey(wire.from), makePinKey(wire.to));
  });

  return uf;
}

function generatePinMappings(item, items, wires) {
  const uf = buildElectricalNetwork(items, wires);
  const rpiComponent = componentsData[item.type];
  const rpiPins = (rpiComponent?.pins || []).map((pin) => ({
    item,
    pin,
    node: getPinNodeId(item.id, pin),
    value: normalizeRpiPinValue(pin.name),
  }));

  const mappings = [];
  const usedConstants = new Set();

  items.forEach((otherItem) => {
    if (otherItem.id === item.id || otherItem.type === "breadboard") return;

    const component = componentsData[otherItem.type];
    if (!component?.pins) return;

    component.pins.forEach((pin) => {
      const node = getPinNodeId(otherItem.id, pin);
      const rpiPin = rpiPins.find((candidate) => uf.connected(node, candidate.node));
      if (!rpiPin) return;

      const prefix = getComponentPrefix(otherItem.type, component.name);
      const pinPart = normalizeConstantPart(pin.name)
        .replace(/^DOUT$/, "DOUT")
        .replace(/^OUT$/, "DATA")
        .replace(/^SIG$/, "SIGNAL")
        .replace(/^A$/, "ANODE")
        .replace(/^K$/, "CATHODE");

      let constant = `${prefix}_${pinPart}`;
      if (usedConstants.has(constant)) constant = `${constant}_${otherItem.id.replace(/[^a-zA-Z0-9]/g, "_")}`;
      usedConstants.add(constant);

      mappings.push({
        constant,
        value: rpiPin.value,
        gpio: extractGpioNumber(rpiPin.value),
        componentName: component.name,
        componentType: otherItem.type,
        itemId: otherItem.id,
        sensorPin: pin.name,
        rpiPinName: rpiPin.pin.name,
        rpiPinLabel: rpiPin.pin.label,
      });
    });
  });

  return mappings.sort((a, b) => a.constant.localeCompare(b.constant));
}

function getMappingValue(mappings, constant, fallback) {
  return mappings.find((mapping) => mapping.constant === constant)?.value || fallback;
}

function getMappingGpio(mappings, constant, fallback) {
  return mappings.find((mapping) => mapping.constant === constant)?.gpio || fallback;
}

function generatePinMapForPython(mappings) {
  const pinMap = {};

  mappings.forEach((mapping) => {
    pinMap[mapping.constant] = {
      value: mapping.value,
      gpio: mapping.gpio,
      component: mapping.componentName,
      componentType: mapping.componentType,
      sensorPin: mapping.sensorPin,
      raspberryPin: mapping.rpiPinName,
      raspberryLabel: mapping.rpiPinLabel,
    };
  });

  pinMap.NOTES = {
    project: "Les valeurs viennent des liaisons actives de l'éditeur.",
    mqAnalog: "AOUT des MQ non lu sans ADC externe MCP3008 ou ADS1115.",
    voltage: "Sur Raspberry Pi réel, ne jamais envoyer 5V directement dans un GPIO.",
  };

  return pinMap;
}

function generatePythonCode({ mappings, currentProjectId, currentProjectName, projectApiBaseUrl }) {
  const pinMapJson = JSON.stringify(generatePinMapForPython(mappings), null, 4);
  const defaultProjectId = currentProjectId ? String(currentProjectId) : "";
  const apiBase = String(projectApiBaseUrl || "http://127.0.0.1:5000/api").replace(/\/api\/?$/, "");

  const dhtGpio = getMappingGpio(mappings, "DHT22_DATA", 4);
  const mq135Gpio = getMappingGpio(mappings, "MQ135_DOUT", 17);
  const mq2Gpio = getMappingGpio(mappings, "MQ2_DOUT", 27);
  const redLedGpio = getMappingGpio(mappings, "LED_RED_ANODE", 22);
  const greenLedGpio = getMappingGpio(mappings, "LED_GREEN_ANODE", 23);

  return String.raw`#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Raspberry Pi 5 - Surveillance temps réel de la qualité de l'air
Projet actif éditeur : ${currentProjectName || "non défini"}

Ce fichier est généré depuis l'éditeur.
Il récupère dynamiquement PROJECT_ID depuis :
1) IOT_PROJECT_ID / IOT_ACTIVE_PROJECT_ID / PROJECT_ID
2) le fichier permanent ~/.iot_air_editor_state.json
3) l'ID actif connu par l'éditeur au moment de la génération
"""

import importlib.util
import json
import logging
import os
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

REQUIRED_MODULES = {
    "requests": "requests",
    "gpiozero": "gpiozero",
    "lgpio": "lgpio",
    "board": "adafruit-blinka",
    "adafruit_dht": "adafruit-circuitpython-dht",
    "adafruit_bmp280": "adafruit-circuitpython-bmp280",
    "adafruit_ssd1306": "adafruit-circuitpython-ssd1306",
    "PIL": "pillow",
}


def check_required_modules():
    missing = []
    for module_name, package_name in REQUIRED_MODULES.items():
        try:
            spec = importlib.util.find_spec(module_name)
        except Exception:
            spec = None
        if spec is None:
            missing.append((module_name, package_name))

    if missing:
        packages = " ".join(sorted({package for _, package in missing}))
        print("\n[MODULES MANQUANTS]")
        for module_name, package_name in missing:
            print(f"- import {module_name} introuvable  ->  pip install {package_name}")
        print("\nCommande recommandée :")
        print(f"pip install {packages}")
        print("\nPuis relance le code.\n")
        sys.exit(2)


check_required_modules()

import requests

os.environ.setdefault("GPIOZERO_PIN_FACTORY", "lgpio")

DEFAULT_PROJECT_ID_FROM_EDITOR = "${defaultProjectId}"
DEFAULT_API_BASE_URL_FROM_EDITOR = "${apiBase}"
EDITOR_STATE_FILE = Path(os.getenv("IOT_EDITOR_STATE_FILE", str(Path.home() / ".iot_air_editor_state.json")))

READ_INTERVAL_SECONDS = float(os.getenv("READ_INTERVAL_SECONDS", "2"))
SEND_TIMEOUT_SECONDS = float(os.getenv("SEND_TIMEOUT_SECONDS", "3"))
SIMULATION_MODE = os.getenv("SIMULATION_MODE", "0") == "1"
MQ_ACTIVE_LEVEL = int(os.getenv("MQ_ACTIVE_LEVEL", "1"))
SEA_LEVEL_PRESSURE_HPA = float(os.getenv("SEA_LEVEL_PRESSURE_HPA", "1013.25"))

DHT_GPIO = int(os.getenv("DHT_GPIO", "${dhtGpio}"))
MQ135_DOUT_GPIO = int(os.getenv("MQ135_DOUT_GPIO", "${mq135Gpio}"))
MQ2_DOUT_GPIO = int(os.getenv("MQ2_DOUT_GPIO", "${mq2Gpio}"))
RED_LED_GPIO = int(os.getenv("RED_LED_GPIO", "${redLedGpio}"))
GREEN_LED_GPIO = int(os.getenv("GREEN_LED_GPIO", "${greenLedGpio}"))

OLED_WIDTH = 128
OLED_HEIGHT = 64
BMP280_I2C_ADDRESSES = (0x76, 0x77)

PIN_MAP = ${pinMapJson}

THRESHOLDS = {
    "temperature_c": {
        "warning_high": 32.0,
        "critical_high": 40.0,
        "warning_low": 10.0,
        "critical_low": 5.0,
        "spike_delta": 3.0,
    },
    "humidity_percent": {
        "warning_high": 75.0,
        "critical_high": 90.0,
        "warning_low": 25.0,
        "critical_low": 15.0,
        "spike_delta": 10.0,
    },
    "pressure_hpa": {
        "warning_low": 980.0,
        "warning_high": 1035.0,
        "critical_low": 950.0,
        "critical_high": 1060.0,
        "spike_delta": 3.0,
    },
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def to_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def fmt(value):
    value = to_float(value)
    return "--" if value is None else f"{value:.1f}"


def yes_no(value):
    if value is True:
        return "YES"
    if value is False:
        return "NO"
    return "--"


def load_editor_state():
    if not EDITOR_STATE_FILE.exists():
        return {}
    try:
        return json.loads(EDITOR_STATE_FILE.read_text(encoding="utf-8") or "{}")
    except Exception:
        return {}


def save_editor_state(project_id, api_base_url):
    try:
        EDITOR_STATE_FILE.write_text(
            json.dumps(
                {
                    "active_project_id": project_id,
                    "api_base_url": api_base_url,
                    "updated_at": utc_now_iso(),
                },
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
    except Exception as exc:
        logging.warning("Impossible de sauvegarder l'état éditeur: %s", exc)


def normalize_project_id(value):
    if value in (None, "", "None"):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def resolve_project_id():
    for env_name in ("IOT_PROJECT_ID", "IOT_ACTIVE_PROJECT_ID", "PROJECT_ID", "VITE_PROJECT_ID", "REACT_APP_PROJECT_ID"):
        project_id = normalize_project_id(os.getenv(env_name))
        if project_id:
            return project_id

    state = load_editor_state()
    project_id = normalize_project_id(state.get("active_project_id") or state.get("project_id"))
    if project_id:
        return project_id

    project_id = normalize_project_id(DEFAULT_PROJECT_ID_FROM_EDITOR)
    if project_id:
        return project_id

    print("Aucun project_id actif. Lance par exemple : IOT_PROJECT_ID=1 python3 air_quality_pi5.py")
    sys.exit(3)


def resolve_api_base_url():
    state = load_editor_state()
    value = (
        os.getenv("IOT_API_BASE_URL")
        or os.getenv("API_BASE_URL")
        or state.get("api_base_url")
        or DEFAULT_API_BASE_URL_FROM_EDITOR
        or "http://127.0.0.1:5000"
    )
    return str(value).rstrip("/").replace("/api", "")


PROJECT_ID = resolve_project_id()
API_BASE_URL = resolve_api_base_url()
API_URL = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/simulation-data"
save_editor_state(PROJECT_ID, API_BASE_URL)


class Hardware:
    def __init__(self):
        self.red_led = None
        self.green_led = None
        self.mq135 = None
        self.mq2 = None
        self.dht = None
        self.i2c = None
        self.bmp280 = None
        self.bmp280_address = None
        self.oled = None
        self.oled_image = None
        self.oled_draw = None
        self.oled_font = None
        self.notes = []

        self.setup_gpio()
        self.setup_dht22()
        self.setup_i2c()
        self.setup_bmp280()
        self.setup_oled()

    def setup_gpio(self):
        try:
            from gpiozero import DigitalInputDevice, LED

            self.red_led = LED(RED_LED_GPIO)
            self.green_led = LED(GREEN_LED_GPIO)
            self.mq135 = DigitalInputDevice(MQ135_DOUT_GPIO, pull_up=False)
            self.mq2 = DigitalInputDevice(MQ2_DOUT_GPIO, pull_up=False)
            logging.info("GPIO OK : MQ-135, MQ-2, LED rouge, LED verte")
        except Exception as exc:
            self.notes.append(f"GPIO non initialisé: {exc}")
            logging.warning("GPIO non initialisé: %s", exc)

    def setup_dht22(self):
        try:
            import board
            import adafruit_dht

            board_pin = getattr(board, f"D{DHT_GPIO}")
            self.dht = adafruit_dht.DHT22(board_pin, use_pulseio=False)
            logging.info("DHT22 OK sur GPIO%s", DHT_GPIO)
        except Exception as exc:
            self.notes.append(f"DHT22 non initialisé: {exc}")
            logging.warning("DHT22 non initialisé: %s", exc)

    def setup_i2c(self):
        try:
            import board

            self.i2c = board.I2C()
            logging.info("Bus I2C OK : GPIO2 SDA, GPIO3 SCL")
        except Exception as exc:
            self.notes.append(f"I2C non initialisé: {exc}")
            logging.warning("I2C non initialisé: %s", exc)

    def setup_bmp280(self):
        if self.i2c is None:
            return
        try:
            import adafruit_bmp280

            for address in BMP280_I2C_ADDRESSES:
                try:
                    self.bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(self.i2c, address=address)
                    self.bmp280.sea_level_pressure = SEA_LEVEL_PRESSURE_HPA
                    self.bmp280_address = address
                    logging.info("BMP280 OK à l'adresse 0x%02X", address)
                    return
                except Exception:
                    pass
            raise RuntimeError("BMP280 introuvable sur 0x76 ou 0x77")
        except Exception as exc:
            self.notes.append(f"BMP280 non initialisé: {exc}")
            logging.warning("BMP280 non initialisé: %s", exc)

    def setup_oled(self):
        if self.i2c is None:
            return
        try:
            import adafruit_ssd1306
            from PIL import Image, ImageDraw, ImageFont

            self.oled = adafruit_ssd1306.SSD1306_I2C(OLED_WIDTH, OLED_HEIGHT, self.i2c)
            self.oled.fill(0)
            self.oled.show()
            self.oled_image = Image.new("1", (OLED_WIDTH, OLED_HEIGHT))
            self.oled_draw = ImageDraw.Draw(self.oled_image)
            self.oled_font = ImageFont.load_default()
            logging.info("OLED I2C OK")
        except Exception as exc:
            self.notes.append(f"OLED non initialisé: {exc}")
            logging.warning("OLED non initialisé: %s", exc)

    def read_dht22(self):
        data = {"available": self.dht is not None, "temperature_c": None, "humidity_percent": None, "error": None}
        if self.dht is None:
            return data
        try:
            data["temperature_c"] = to_float(self.dht.temperature)
            data["humidity_percent"] = to_float(self.dht.humidity)
        except RuntimeError as exc:
            data["error"] = str(exc)
        except Exception as exc:
            data["error"] = str(exc)
        return data

    def read_bmp280(self):
        data = {
            "available": self.bmp280 is not None,
            "i2c_address": f"0x{self.bmp280_address:02X}" if self.bmp280_address else None,
            "temperature_c": None,
            "pressure_hpa": None,
            "altitude_m": None,
            "error": None,
        }
        if self.bmp280 is None:
            return data
        try:
            data["temperature_c"] = round(float(self.bmp280.temperature), 2)
            data["pressure_hpa"] = round(float(self.bmp280.pressure), 2)
            data["altitude_m"] = round(float(self.bmp280.altitude), 2)
        except Exception as exc:
            data["error"] = str(exc)
        return data

    def read_mq(self, device):
        data = {
            "available": device is not None,
            "digital_raw": None,
            "gas_detected": None,
            "active_level": MQ_ACTIVE_LEVEL,
            "analog_value": None,
            "analog_note": "AOUT non connecté. Pour une vraie valeur analogique/ppm, ajouter un ADC MCP3008 ou ADS1115.",
            "error": None,
        }
        if device is None:
            return data
        try:
            raw = int(device.value)
            data["digital_raw"] = raw
            data["gas_detected"] = raw == MQ_ACTIVE_LEVEL
        except Exception as exc:
            data["error"] = str(exc)
        return data

    def read_all(self):
        if SIMULATION_MODE:
            return simulate_sensors("simulation")

        sensors = {
            "mode": "hardware",
            "dht22": self.read_dht22(),
            "bmp280": self.read_bmp280(),
            "mq135": self.read_mq(self.mq135),
            "mq2": self.read_mq(self.mq2),
            "hardware_notes": self.notes,
        }

        has_real = any(sensors[name]["available"] for name in ["dht22", "bmp280", "mq135", "mq2"])
        if not has_real:
            fallback = simulate_sensors("simulation_fallback")
            fallback["hardware_notes"] = self.notes
            return fallback
        return sensors

    def set_leds(self, status):
        state = {"red_led_gpio": RED_LED_GPIO, "green_led_gpio": GREEN_LED_GPIO, "red": "off", "green": "off"}
        try:
            if status == "critical":
                if self.red_led:
                    self.red_led.on()
                if self.green_led:
                    self.green_led.off()
                state.update({"red": "on", "green": "off", "meaning": "danger critique"})
            elif status == "warning":
                if self.red_led:
                    self.red_led.off()
                if self.green_led:
                    self.green_led.on()
                state.update({"red": "off", "green": "on", "meaning": "pré-alerte / pic montant"})
            else:
                if self.red_led:
                    self.red_led.off()
                if self.green_led:
                    self.green_led.off()
                state.update({"red": "off", "green": "off", "meaning": "normal"})
        except Exception as exc:
            state["error"] = str(exc)
        return state

    def show_oled(self, payload):
        if not self.oled or self.oled_draw is None or self.oled_image is None:
            return
        try:
            sensors = payload["sensors"]
            status = payload["analysis"]["global_status"].upper()
            dht = sensors.get("dht22", {})
            bmp = sensors.get("bmp280", {})
            mq135 = sensors.get("mq135", {})
            mq2 = sensors.get("mq2", {})

            temp = dht.get("temperature_c") or bmp.get("temperature_c")
            humidity = dht.get("humidity_percent")
            pressure = bmp.get("pressure_hpa")

            self.oled_draw.rectangle((0, 0, OLED_WIDTH, OLED_HEIGHT), outline=0, fill=0)
            self.oled_draw.text((0, 0), f"AIR: {status}", font=self.oled_font, fill=255)
            self.oled_draw.text((0, 12), f"T: {fmt(temp)} C", font=self.oled_font, fill=255)
            self.oled_draw.text((0, 24), f"H: {fmt(humidity)} %", font=self.oled_font, fill=255)
            self.oled_draw.text((0, 36), f"P: {fmt(pressure)} hPa", font=self.oled_font, fill=255)
            self.oled_draw.text((0, 48), f"M135:{yes_no(mq135.get('gas_detected'))} M2:{yes_no(mq2.get('gas_detected'))}", font=self.oled_font, fill=255)
            self.oled.image(self.oled_image)
            self.oled.show()
        except Exception as exc:
            logging.warning("Erreur OLED: %s", exc)

    def cleanup(self):
        try:
            if self.red_led:
                self.red_led.off()
                self.red_led.close()
            if self.green_led:
                self.green_led.off()
                self.green_led.close()
            if self.mq135:
                self.mq135.close()
            if self.mq2:
                self.mq2.close()
            if self.dht:
                self.dht.exit()
            if self.oled:
                self.oled.fill(0)
                self.oled.show()
        except Exception:
            pass


def simulate_sensors(mode):
    mq135_alert = random.random() < 0.10
    mq2_alert = random.random() < 0.08
    temp = round(random.uniform(24, 36), 2)
    humidity = round(random.uniform(45, 82), 2)
    pressure = round(random.uniform(990, 1028), 2)

    return {
        "mode": mode,
        "dht22": {"available": True, "temperature_c": temp, "humidity_percent": humidity, "error": None},
        "bmp280": {"available": True, "i2c_address": "simulated", "temperature_c": temp, "pressure_hpa": pressure, "altitude_m": round(random.uniform(1100, 1300), 2), "error": None},
        "mq135": {"available": True, "digital_raw": MQ_ACTIVE_LEVEL if mq135_alert else 1 - MQ_ACTIVE_LEVEL, "gas_detected": mq135_alert, "active_level": MQ_ACTIVE_LEVEL, "analog_value": None, "analog_note": "simulation", "error": None},
        "mq2": {"available": True, "digital_raw": MQ_ACTIVE_LEVEL if mq2_alert else 1 - MQ_ACTIVE_LEVEL, "gas_detected": mq2_alert, "active_level": MQ_ACTIVE_LEVEL, "analog_value": None, "analog_note": "simulation", "error": None},
        "hardware_notes": ["Mode simulation ou fallback."],
    }


def add_alert(alerts, level, sensor, field, value, message):
    alerts.append({"level": level, "sensor": sensor, "field": field, "value": value, "message": message})


def check_threshold(alerts, sensor, field, value, threshold):
    value = to_float(value)
    if value is None:
        return

    if value >= threshold.get("critical_high", 10**9):
        add_alert(alerts, "critical", sensor, field, value, f"{field} dépasse le seuil critique haut")
    elif value >= threshold.get("warning_high", 10**9):
        add_alert(alerts, "warning", sensor, field, value, f"{field} approche le seuil critique haut")

    if value <= threshold.get("critical_low", -10**9):
        add_alert(alerts, "critical", sensor, field, value, f"{field} dépasse le seuil critique bas")
    elif value <= threshold.get("warning_low", -10**9):
        add_alert(alerts, "warning", sensor, field, value, f"{field} approche le seuil critique bas")


def check_spike(alerts, previous, key, sensor, field, value, delta_limit):
    value = to_float(value)
    if value is None:
        return

    old = previous.get(key)
    if old is not None:
        delta = value - old
        if abs(delta) >= delta_limit:
            direction = "hausse" if delta > 0 else "baisse"
            add_alert(alerts, "warning", sensor, field, value, f"Pic détecté : {direction} rapide de {delta:.2f}")
    previous[key] = value


def evaluate(sensors, previous):
    alerts = []
    dht = sensors.get("dht22", {})
    bmp = sensors.get("bmp280", {})
    mq135 = sensors.get("mq135", {})
    mq2 = sensors.get("mq2", {})

    check_threshold(alerts, "DHT22", "temperature_c", dht.get("temperature_c"), THRESHOLDS["temperature_c"])
    check_threshold(alerts, "DHT22", "humidity_percent", dht.get("humidity_percent"), THRESHOLDS["humidity_percent"])
    check_threshold(alerts, "BMP280", "pressure_hpa", bmp.get("pressure_hpa"), THRESHOLDS["pressure_hpa"])

    if mq135.get("gas_detected") is True:
        add_alert(alerts, "critical", "MQ-135", "DOUT", mq135.get("digital_raw"), "Gaz/pollution détecté par MQ-135")
    if mq2.get("gas_detected") is True:
        add_alert(alerts, "critical", "MQ-2", "DOUT", mq2.get("digital_raw"), "Fumée/gaz inflammable détecté par MQ-2")

    check_spike(alerts, previous, "dht.temperature", "DHT22", "temperature_c", dht.get("temperature_c"), THRESHOLDS["temperature_c"]["spike_delta"])
    check_spike(alerts, previous, "dht.humidity", "DHT22", "humidity_percent", dht.get("humidity_percent"), THRESHOLDS["humidity_percent"]["spike_delta"])
    check_spike(alerts, previous, "bmp.pressure", "BMP280", "pressure_hpa", bmp.get("pressure_hpa"), THRESHOLDS["pressure_hpa"]["spike_delta"])

    has_critical = any(a["level"] == "critical" for a in alerts)
    has_warning = any(a["level"] == "warning" for a in alerts)

    if has_critical:
        status = "critical"
        recommendation = "Danger détecté : aérer, vérifier la source et intervenir rapidement."
    elif has_warning:
        status = "warning"
        recommendation = "Pré-alerte : les valeurs montent ou approchent un seuil critique."
    else:
        status = "normal"
        recommendation = "Situation normale."

    return {"global_status": status, "alerts_count": len(alerts), "alerts": alerts, "recommendation": recommendation, "thresholds": THRESHOLDS}


def build_payload(sensors, analysis, leds):
    return {
        "source": "Raspberry Pi 5",
        "project_id": PROJECT_ID,
        "timestamp": time.time(),
        "datetime_utc": utc_now_iso(),
        "api_url": API_URL,
        "pins": PIN_MAP,
        "sensors": sensors,
        "analysis": analysis,
        "leds": leds,
        "config": {
            "read_interval_seconds": READ_INTERVAL_SECONDS,
            "mq_active_level": MQ_ACTIVE_LEVEL,
            "simulation_mode": SIMULATION_MODE,
            "bmp280_i2c_addresses": [f"0x{x:02X}" for x in BMP280_I2C_ADDRESSES],
        },
    }


def send_to_api(payload):
    try:
        response = requests.post(API_URL, json=payload, timeout=SEND_TIMEOUT_SECONDS)
        try:
            body = response.json()
        except Exception:
            body = response.text[:200]
        logging.info("API HTTP %s | %s", response.status_code, body)
    except Exception as exc:
        logging.error("Erreur API: %s", exc)


def log_resume(payload):
    sensors = payload["sensors"]
    analysis = payload["analysis"]
    dht = sensors.get("dht22", {})
    bmp = sensors.get("bmp280", {})
    mq135 = sensors.get("mq135", {})
    mq2 = sensors.get("mq2", {})

    temp = dht.get("temperature_c") or bmp.get("temperature_c")
    humidity = dht.get("humidity_percent")
    pressure = bmp.get("pressure_hpa")

    logging.info(
        "Projet=%s | Etat=%s | T=%s°C | H=%s%% | P=%shPa | MQ135=%s | MQ2=%s | LED_R=%s | LED_V=%s",
        PROJECT_ID,
        analysis["global_status"],
        fmt(temp),
        fmt(humidity),
        fmt(pressure),
        yes_no(mq135.get("gas_detected")),
        yes_no(mq2.get("gas_detected")),
        payload["leds"].get("red"),
        payload["leds"].get("green"),
    )


def main():
    logging.info("Démarrage surveillance qualité de l'air")
    logging.info("PROJECT_ID = %s", PROJECT_ID)
    logging.info("API_URL = %s", API_URL)

    hardware = Hardware()
    previous_values = {}

    try:
        while True:
            sensors = hardware.read_all()
            analysis = evaluate(sensors, previous_values)
            leds = hardware.set_leds(analysis["global_status"])
            payload = build_payload(sensors, analysis, leds)

            hardware.show_oled(payload)
            log_resume(payload)
            send_to_api(payload)

            time.sleep(READ_INTERVAL_SECONDS)
    except KeyboardInterrupt:
        logging.info("Arrêt demandé")
    finally:
        hardware.cleanup()
        logging.info("Nettoyage terminé")


if __name__ == "__main__":
    main()
`;
}

function ValidationBox({ validation }) {
  if (!validation) return null;

  return (
    <div className={validation.ok ? "pi-validation ok" : "pi-validation warning"}>
      <strong>{validation.ok ? "Code prêt" : "Action nécessaire"}</strong>
      <p>{validation.message}</p>

      {validation.missingModules?.length > 0 && (
        <>
          <ul>
            {validation.missingModules.map((module) => (
              <li key={module.module}>
                <code>{module.module}</code> → <code>{module.package}</code>
              </li>
            ))}
          </ul>
          <pre>{validation.installCommand}</pre>
        </>
      )}
    </div>
  );
}

export default function PiConfigModal({
  item,
  items,
  wires,
  currentProjectId,
  currentProjectName,
  projectApiBaseUrl,
  savedCode = "",
  onClose,
  onApply,
}) {
  const mappings = useMemo(() => generatePinMappings(item, items, wires), [item, items, wires]);
  const generatedCode = useMemo(
    () => generatePythonCode({ mappings, currentProjectId, currentProjectName, projectApiBaseUrl }),
    [mappings, currentProjectId, currentProjectName, projectApiBaseUrl]
  );

  const [code, setCode] = useState(savedCode || generatedCode);
  const [validation, setValidation] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedCode() {
      if (!currentProjectId || !projectApiBaseUrl) return;
      try {
        const response = await axios.get(`${projectApiBaseUrl}/projects/${currentProjectId}/raspberry-code`);
        if (!cancelled && response.data?.code) {
          setCode(response.data.code);
          setValidation(response.data.validation || null);
        }
      } catch {
        // Aucun code sauvegardé : on garde le code généré.
      }
    }

    loadSavedCode();

    return () => {
      cancelled = true;
    };
  }, [currentProjectId, projectApiBaseUrl]);

  async function validateCode() {
    if (!projectApiBaseUrl) return null;
    setChecking(true);
    try {
      const response = await axios.post(`${projectApiBaseUrl}/python/validate`, { code });
      setValidation(response.data);
      return response.data;
    } catch (error) {
      const fallback = error?.response?.data || {
        ok: false,
        message: "Impossible d'interpréter le code. Vérifie que le backend Flask est lancé.",
      };
      setValidation(fallback);
      return fallback;
    } finally {
      setChecking(false);
    }
  }

  async function applyCode() {
    const result = await validateCode();
    onApply(code, result);
  }

  function regenerateCode() {
    setCode(generatedCode);
    setValidation(null);
  }

  return (
    <div className="pi-page">
      <header className="pi-page-header">
        <button className="pi-back-btn" onClick={onClose}>← Retourner vers l’éditeur</button>
        <div>
          <h1>Configuration Raspberry Pi 5</h1>
          <p>
            Projet actif : <strong>{currentProjectId || "non sauvegardé"}</strong>
            {currentProjectName ? ` · ${currentProjectName}` : ""}
          </p>
        </div>
        <button className="pi-apply-top-btn" onClick={applyCode}>Appliquer / Téléverser</button>
      </header>

      <main className="pi-page-main">
        <section className="pi-page-left">
          <div className="pi-config-card">
            <h3>Mapping automatique</h3>
            {mappings.length === 0 && <p>Aucune liaison vers le Raspberry Pi n’est encore détectée.</p>}
            {mappings.map((mapping) => (
              <div key={`${mapping.constant}-${mapping.itemId}`} className="pi-pin-line">
                <span style={{ background: mapping.value === "GND" ? "#222" : mapping.value === "5V" ? "#ff0000" : "#22c55e" }} />
                <div>
                  <strong>{mapping.constant}</strong>
                  <small>{mapping.componentName} · {mapping.sensorPin}</small>
                </div>
                <em>→</em>
                <div>
                  <strong>{mapping.value}</strong>
                  <small>{mapping.rpiPinLabel || mapping.rpiPinName}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="pi-config-card">
            <h3>Projet actif permanent</h3>
            <p>
              L’éditeur sauvegarde maintenant l’ID actif dans localStorage et dans le backend
              via <code>/api/editor-env</code>. Le script Raspberry Pi relit ensuite
              <code>IOT_PROJECT_ID</code>, <code>PROJECT_ID</code> ou le fichier
              <code>~/.iot_air_editor_state.json</code>.
            </p>
            <pre className="pi-install-box">IOT_PROJECT_ID={currentProjectId || 1} python3 air_quality_pi5.py</pre>
          </div>

          <div className="pi-config-card">
            <h3>Modules Python</h3>
            <p>Le bouton “Interpréter / vérifier” contrôle la syntaxe et les imports. Si un module manque, l’éditeur affiche la commande pip exacte.</p>
            <ValidationBox validation={validation} />
          </div>

          <div className="pi-config-card">
            <h3>Liaisons recommandées</h3>
            <ul className="pi-guide-list">
              <li>DHT22 DATA → GPIO4</li>
              <li>MQ-135 DOUT → GPIO17</li>
              <li>MQ-2 DOUT → GPIO27</li>
              <li>BMP280 SDA → GPIO2 SDA, SCL → GPIO3 SCL</li>
              <li>OLED SDA → GPIO2 SDA, SCL → GPIO3 SCL</li>
              <li>LED rouge anode → GPIO22, cathode → GND</li>
              <li>LED verte anode → GPIO23, cathode → GND</li>
              <li>AOUT analogique → ADC externe comme MCP3008 ou ADS1115</li>
            </ul>
          </div>
        </section>

        <section className="pi-page-code">
          <div className="pi-code-toolbar">
            <strong>Code Raspberry Pi fonctionnel</strong>
            <button onClick={regenerateCode}>Régénérer</button>
            <button onClick={validateCode} disabled={checking}>{checking ? "Vérification..." : "Interpréter / vérifier"}</button>
          </div>

          <textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} />

          <div className="pi-modal-actions">
            <button className="pi-secondary-btn" onClick={onClose}>Retourner vers l’éditeur</button>
            <button className="pi-apply-btn" onClick={applyCode}>Appliquer / Téléverser</button>
          </div>
        </section>
      </main>
    </div>
  );
}
