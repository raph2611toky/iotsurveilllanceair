const RPI5_PIN_DEFINITIONS = [
  { number: 1, name: "3V3", label: "Pin 1 · 3.3V power", color: "#ff7a30" },
  { number: 2, name: "5V", label: "Pin 2 · 5V power", color: "#ff0000" },
  { number: 3, name: "GPIO2 SDA", label: "Pin 3 · GPIO2 SDA", color: "#0055ff" },
  { number: 4, name: "5V", label: "Pin 4 · 5V power", color: "#ff0000" },
  { number: 5, name: "GPIO3 SCL", label: "Pin 5 · GPIO3 SCL", color: "#00aa00" },
  { number: 6, name: "GND", label: "Pin 6 · Ground", color: "#222222" },
  { number: 7, name: "GPIO4", label: "Pin 7 · GPIO4", color: "#ffaa00" },
  { number: 8, name: "GPIO14 TXD", label: "Pin 8 · GPIO14 TXD", color: "#aa00ff" },
  { number: 9, name: "GND", label: "Pin 9 · Ground", color: "#222222" },
  { number: 10, name: "GPIO15 RXD", label: "Pin 10 · GPIO15 RXD", color: "#ff00aa" },
  { number: 11, name: "GPIO17", label: "Pin 11 · GPIO17", color: "#ffaa00" },
  { number: 12, name: "GPIO18", label: "Pin 12 · GPIO18 PWM", color: "#ffaa00" },
  { number: 13, name: "GPIO27", label: "Pin 13 · GPIO27", color: "#ffaa00" },
  { number: 14, name: "GND", label: "Pin 14 · Ground", color: "#222222" },
  { number: 15, name: "GPIO22", label: "Pin 15 · GPIO22", color: "#ffaa00" },
  { number: 16, name: "GPIO23", label: "Pin 16 · GPIO23", color: "#ffaa00" },
  { number: 17, name: "3V3", label: "Pin 17 · 3.3V power", color: "#ff7a30" },
  { number: 18, name: "GPIO24", label: "Pin 18 · GPIO24", color: "#ffaa00" },
  { number: 19, name: "GPIO10 MOSI", label: "Pin 19 · GPIO10 MOSI", color: "#00aaff" },
  { number: 20, name: "GND", label: "Pin 20 · Ground", color: "#222222" },
  { number: 21, name: "GPIO9 MISO", label: "Pin 21 · GPIO9 MISO", color: "#00aaff" },
  { number: 22, name: "GPIO25", label: "Pin 22 · GPIO25", color: "#ffaa00" },
  { number: 23, name: "GPIO11 SCLK", label: "Pin 23 · GPIO11 SCLK", color: "#00aaff" },
  { number: 24, name: "GPIO8 CE0", label: "Pin 24 · GPIO8 CE0", color: "#00aaff" },
  { number: 25, name: "GND", label: "Pin 25 · Ground", color: "#222222" },
  { number: 26, name: "GPIO7 CE1", label: "Pin 26 · GPIO7 CE1", color: "#00aaff" },
  { number: 27, name: "GPIO0 ID_SD", label: "Pin 27 · GPIO0 ID_SD", color: "#ffaa00" },
  { number: 28, name: "GPIO1 ID_SC", label: "Pin 28 · GPIO1 ID_SC", color: "#ffaa00" },
  { number: 29, name: "GPIO5", label: "Pin 29 · GPIO5", color: "#ffaa00" },
  { number: 30, name: "GND", label: "Pin 30 · Ground", color: "#222222" },
  { number: 31, name: "GPIO6", label: "Pin 31 · GPIO6", color: "#ffaa00" },
  { number: 32, name: "GPIO12 PWM0", label: "Pin 32 · GPIO12 PWM0", color: "#ffaa00" },
  { number: 33, name: "GPIO13 PWM1", label: "Pin 33 · GPIO13 PWM1", color: "#ffaa00" },
  { number: 34, name: "GND", label: "Pin 34 · Ground", color: "#222222" },
  { number: 35, name: "GPIO19 PCM_FS", label: "Pin 35 · GPIO19 PCM_FS", color: "#ffaa00" },
  { number: 36, name: "GPIO16", label: "Pin 36 · GPIO16", color: "#ffaa00" },
  { number: 37, name: "GPIO26", label: "Pin 37 · GPIO26", color: "#ffaa00" },
  { number: 38, name: "GPIO20 PCM_DIN", label: "Pin 38 · GPIO20 PCM_DIN", color: "#ffaa00" },
  { number: 39, name: "GND", label: "Pin 39 · Ground", color: "#222222" },
  { number: 40, name: "GPIO21 PCM_DOUT", label: "Pin 40 · GPIO21 PCM_DOUT", color: "#ffaa00" },
];

function createRpi5Pins() {
  const startX = 56;
  const step = 12.8;
  const topY = 28;
  const bottomY = 46;

  return RPI5_PIN_DEFINITIONS.map((pin) => {
    const column = Math.floor((pin.number - 1) / 2);
    const x = Number((startX + column * step).toFixed(2));
    const y = pin.number % 2 === 1 ? topY : bottomY;

    return {
      ...pin,
      key: `RPI5-PIN-${pin.number}`,
      x,
      y,
    };
  });
}

function createBreadboardPins() {
  const pins = [];
  const leftLetters = ["A", "B", "C", "D", "E"];
  const rightLetters = ["F", "G", "H", "I", "J"];

  for (let row = 1; row <= 30; row += 1) {
    const y = Number((40 + (row - 1) * 6.2).toFixed(2));

    pins.push({
      key: `BB-LEFT-RAIL-PLUS-${row}`,
      name: `L+${row}`,
      label: `Rail gauche + ${row}`,
      x: 34,
      y,
      color: "#ff0000",
    });

    pins.push({
      key: `BB-LEFT-RAIL-MINUS-${row}`,
      name: `L-${row}`,
      label: `Rail gauche - ${row}`,
      x: 59,
      y,
      color: "#0055ff",
    });

    pins.push({
      key: `BB-RIGHT-RAIL-PLUS-${row}`,
      name: `R+${row}`,
      label: `Rail droite + ${row}`,
      x: 362,
      y,
      color: "#ff0000",
    });

    pins.push({
      key: `BB-RIGHT-RAIL-MINUS-${row}`,
      name: `R-${row}`,
      label: `Rail droite - ${row}`,
      x: 387,
      y,
      color: "#0055ff",
    });

    leftLetters.forEach((letter, index) => {
      pins.push({
        key: `BB-LEFT-${letter}${row}`,
        name: `${letter}${row}`,
        label: `Breadboard gauche ${letter}${row}`,
        x: 116 + index * 22,
        y,
        color: "#8a6a22",
      });
    });

    rightLetters.forEach((letter, index) => {
      pins.push({
        key: `BB-RIGHT-${letter}${row}`,
        name: `${letter}${row}`,
        label: `Breadboard droite ${letter}${row}`,
        x: 246 + index * 22,
        y,
        color: "#8a6a22",
      });
    });
  }

  return pins;
}

function pins(list) {
  return list.map((pin, index) => ({
    key: pin.key || `${pin.name}-${index}`,
    ...pin,
  }));
}

export const componentGroups = [
  "Carte principale",
  "Capteurs environnement",
  "Communication",
  "Actionneurs",
  "Connexion",
  "Composants passifs",
  "Alimentation",
];

export const componentsData = {
  rpi5: {
    type: "rpi5",
    name: "Raspberry Pi 5",
    category: "Carte principale",
    description: "Carte principale qui reçoit les données des capteurs et les transmet vers une API REST.",
    emoji: "RPi",
    chipColor: "#149464",
    chipBg: "#e8fff5",
    width: 520,
    height: 340,
    pins: createRpi5Pins(),
  },

  breadboard: {
    type: "breadboard",
    name: "Breadboard",
    category: "Carte principale",
    description: "Plaque d’essai utilisée pour relier les composants sans soudure.",
    emoji: "BB",
    chipColor: "#c9a227",
    chipBg: "#fff8df",
    width: 420,
    height: 260,
    pins: createBreadboardPins(),
  },

  dht22: {
    type: "dht22",
    name: "DHT22",
    category: "Capteurs environnement",
    description: "Capteur de température et d’humidité.",
    emoji: "TH",
    chipColor: "#1e7a34",
    chipBg: "#e8f8ec",
    width: 95,
    height: 145,
    pins: pins([
      { key: "DHT22-VCC", name: "VCC", label: "DHT22 VCC", x: 22, y: 134, color: "#ff0000" },
      { key: "DHT22-DATA", name: "DATA", label: "DHT22 DATA", x: 47, y: 134, color: "#0055ff" },
      { key: "DHT22-GND", name: "GND", label: "DHT22 GND", x: 72, y: 134, color: "#222222" },
    ]),
  },

  mq135: {
    type: "mq135",
    name: "MQ-135",
    category: "Capteurs environnement",
    description: "Capteur de qualité de l’air, CO₂, gaz et pollution.",
    emoji: "AIR",
    chipColor: "#2368a0",
    chipBg: "#e7f3ff",
    width: 140,
    height: 105,
    pins: pins([
      { key: "MQ135-VCC", name: "VCC", label: "MQ-135 VCC", x: 122, y: 28, color: "#ff0000" },
      { key: "MQ135-GND", name: "GND", label: "MQ-135 GND", x: 122, y: 45, color: "#222222" },
      { key: "MQ135-DOUT", name: "DOUT", label: "MQ-135 DOUT", x: 122, y: 62, color: "#ffaa00" },
      { key: "MQ135-AOUT", name: "AOUT", label: "MQ-135 AOUT vers ADC", x: 122, y: 79, color: "#00aaff" },
    ]),
  },

  mq2: {
    type: "mq2",
    name: "MQ-2",
    category: "Capteurs environnement",
    description: "Capteur de fumée et gaz inflammables.",
    emoji: "SMK",
    chipColor: "#c45a08",
    chipBg: "#fff0dc",
    width: 140,
    height: 105,
    pins: pins([
      { key: "MQ2-VCC", name: "VCC", label: "MQ-2 VCC", x: 122, y: 28, color: "#ff0000" },
      { key: "MQ2-GND", name: "GND", label: "MQ-2 GND", x: 122, y: 45, color: "#222222" },
      { key: "MQ2-DOUT", name: "DOUT", label: "MQ-2 DOUT", x: 122, y: 62, color: "#ffaa00" },
      { key: "MQ2-AOUT", name: "AOUT", label: "MQ-2 AOUT vers ADC", x: 122, y: 79, color: "#00aaff" },
    ]),
  },

  bmp280: {
    type: "bmp280",
    name: "BMP280",
    category: "Capteurs environnement",
    description: "Capteur de pression atmosphérique et température via I2C.",
    emoji: "PRS",
    chipColor: "#1558a0",
    chipBg: "#e7f3ff",
    width: 95,
    height: 75,
    pins: pins([
      { key: "BMP280-VCC", name: "VCC", label: "BMP280 VCC 3.3V", x: 15, y: 64, color: "#ff0d0d" },
      { key: "BMP280-GND", name: "GND", label: "BMP280 GND", x: 35, y: 64, color: "#222222" },
      { key: "BMP280-SCL", name: "SCL", label: "BMP280 SCL", x: 55, y: 64, color: "#00aa00" },
      { key: "BMP280-SDA", name: "SDA", label: "BMP280 SDA", x: 75, y: 64, color: "#0055ff" },
    ]),
  },

  pressure: {
    type: "pressure",
    name: "Capteur pression",
    category: "Capteurs environnement",
    description: "Capteur de pression générique.",
    emoji: "P",
    chipColor: "#111827",
    chipBg: "#eeeeee",
    width: 95,
    height: 80,
    pins: pins([
      { key: "PRESSURE-VCC", name: "VCC", label: "Pression VCC", x: 15, y: 70, color: "#ff0000" },
      { key: "PRESSURE-GND", name: "GND", label: "Pression GND", x: 35, y: 70, color: "#222222" },
      { key: "PRESSURE-SIG", name: "SIG", label: "Pression Signal", x: 55, y: 70, color: "#0055ff" },
    ]),
  },

  soil: {
    type: "soil",
    name: "Humidité sol",
    category: "Capteurs environnement",
    description: "Capteur d’humidité du sol.",
    emoji: "SOL",
    chipColor: "#8a6a22",
    chipBg: "#fff4d0",
    width: 95,
    height: 150,
    pins: pins([
      { key: "SOIL-VCC", name: "VCC", label: "Humidité sol VCC", x: 20, y: 140, color: "#ff0000" },
      { key: "SOIL-GND", name: "GND", label: "Humidité sol GND", x: 45, y: 140, color: "#222222" },
      { key: "SOIL-SIG", name: "SIG", label: "Humidité sol Signal", x: 70, y: 140, color: "#0055ff" },
    ]),
  },

  pir: {
    type: "pir",
    name: "PIR",
    category: "Capteurs environnement",
    description: "Capteur de mouvement.",
    emoji: "PIR",
    chipColor: "#6b35b0",
    chipBg: "#eee5ff",
    width: 95,
    height: 90,
    pins: pins([
      { key: "PIR-VCC", name: "VCC", label: "PIR VCC", x: 25, y: 80, color: "#ff0000" },
      { key: "PIR-OUT", name: "OUT", label: "PIR OUT", x: 48, y: 80, color: "#ffaa00" },
      { key: "PIR-GND", name: "GND", label: "PIR GND", x: 71, y: 80, color: "#222222" },
    ]),
  },

  wifi: {
    type: "wifi",
    name: "Module Wi-Fi",
    category: "Communication",
    description: "Module de communication Wi-Fi.",
    emoji: "WiFi",
    chipColor: "#0f7a6b",
    chipBg: "#e7fbf7",
    width: 105,
    height: 75,
    pins: pins([
      { key: "WIFI-VCC", name: "VCC", label: "Wi-Fi VCC", x: 18, y: 65, color: "#ff0000" },
      { key: "WIFI-GND", name: "GND", label: "Wi-Fi GND", x: 40, y: 65, color: "#222222" },
      { key: "WIFI-TX", name: "TX", label: "Wi-Fi TX", x: 62, y: 65, color: "#aa00ff" },
      { key: "WIFI-RX", name: "RX", label: "Wi-Fi RX", x: 84, y: 65, color: "#ff00aa" },
    ]),
  },

  bluetooth: {
    type: "bluetooth",
    name: "Module Bluetooth",
    category: "Communication",
    description: "Module de communication Bluetooth.",
    emoji: "BT",
    chipColor: "#1558a0",
    chipBg: "#e7f3ff",
    width: 105,
    height: 75,
    pins: pins([
      { key: "BT-VCC", name: "VCC", label: "Bluetooth VCC", x: 18, y: 65, color: "#ff0000" },
      { key: "BT-GND", name: "GND", label: "Bluetooth GND", x: 40, y: 65, color: "#222222" },
      { key: "BT-TX", name: "TX", label: "Bluetooth TX", x: 62, y: 65, color: "#aa00ff" },
      { key: "BT-RX", name: "RX", label: "Bluetooth RX", x: 84, y: 65, color: "#ff00aa" },
    ]),
  },

  oled: {
    type: "oled",
    name: "OLED I2C",
    category: "Actionneurs",
    description: "Petit écran OLED pour afficher les valeurs mesurées.",
    emoji: "OLED",
    chipColor: "#1558a0",
    chipBg: "#e7f3ff",
    width: 120,
    height: 80,
    pins: pins([
      { key: "OLED-VCC", name: "VCC", label: "OLED VCC", x: 20, y: 70, color: "#ff7a30" },
      { key: "OLED-GND", name: "GND", label: "OLED GND", x: 45, y: 70, color: "#222222" },
      { key: "OLED-SCL", name: "SCL", label: "OLED SCL", x: 70, y: 70, color: "#00aa00" },
      { key: "OLED-SDA", name: "SDA", label: "OLED SDA", x: 95, y: 70, color: "#0055ff" },
    ]),
  },

  relay: {
    type: "relay",
    name: "Relais",
    category: "Actionneurs",
    description: "Relais pour activer un ventilateur ou une alarme.",
    emoji: "REL",
    chipColor: "#6b35b0",
    chipBg: "#eee5ff",
    width: 115,
    height: 75,
    pins: pins([
      { key: "RELAY-VCC", name: "VCC", label: "Relais VCC", x: 18, y: 65, color: "#ff0000" },
      { key: "RELAY-GND", name: "GND", label: "Relais GND", x: 40, y: 65, color: "#222222" },
      { key: "RELAY-IN", name: "IN", label: "Relais IN", x: 62, y: 65, color: "#ffaa00" },
    ]),
  },

  fan: {
    type: "fan",
    name: "Ventilateur",
    category: "Actionneurs",
    description: "Ventilateur d’extraction d’air. Il se déclenche uniquement lorsque MQ-135 ou MQ-2 détecte gaz, pollution ou fumée.",
    emoji: "FAN",
    chipColor: "#0f766e",
    chipBg: "#dcfce7",

    // Cadre agrandi pour éviter la superposition des pins, du texte et du rendu visuel.
    width: 190,
    height: 150,

    // Pins placées sur le côté gauche, comme les autres composants à connexion latérale.
    // x reste très proche du bord, y est espacé pour éviter toute confusion visuelle.
    pins: pins([
      { key: "FAN-VCC", name: "VCC", label: "Ventilateur VCC 5V", x: 8, y: 46, color: "#ff0000" },
      { key: "FAN-GND", name: "GND", label: "Ventilateur GND", x: 8, y: 76, color: "#222222" },
      { key: "FAN-IN", name: "IN", label: "Ventilateur IN/PWM", x: 8, y: 106, color: "#ffaa00" },
    ]),
  },

  cooler: {
    type: "cooler",
    name: "Module refroidissement",
    category: "Actionneurs",
    description: "Module de refroidissement ou Peltier. Il démarre lors d’un pic de température.",
    emoji: "COOL",
    chipColor: "#0ea5e9",
    chipBg: "#e0f2fe",

    // Cadre légèrement agrandi pour laisser une colonne propre aux pins.
    width: 170,
    height: 130,

    // Pins latérales gauche : les fils partent proprement du bord sans couvrir le label.
    pins: pins([
      { key: "COOLER-VCC", name: "VCC", label: "Refroidissement VCC 5V", x: 8, y: 42, color: "#ff0000" },
      { key: "COOLER-GND", name: "GND", label: "Refroidissement GND", x: 8, y: 68, color: "#222222" },
      { key: "COOLER-IN", name: "IN", label: "Refroidissement IN", x: 8, y: 94, color: "#ffaa00" },
    ]),
  },

  buzzer: {
    type: "buzzer",
    name: "Buzzer",
    category: "Actionneurs",
    description: "Buzzer d’alerte sonore.",
    emoji: "BZ",
    chipColor: "#b52020",
    chipBg: "#fdecec",
    width: 80,
    height: 75,
    pins: pins([
      { key: "BUZZER-PLUS", name: "+", label: "Buzzer +", x: 25, y: 65, color: "#ff0000" },
      { key: "BUZZER-MINUS", name: "-", label: "Buzzer -", x: 55, y: 65, color: "#222222" },
    ]),
  },

  led_r: {
    type: "led_r",
    name: "LED rouge",
    category: "Actionneurs",
    description: "LED rouge pour alerte.",
    emoji: "LED",
    chipColor: "#b52020",
    chipBg: "#fdecec",
    width: 55,
    height: 75,
    pins: pins([
      { key: "LED-R-ANODE", name: "A", label: "LED rouge Anode +", x: 20, y: 65, color: "#ff0000" },
      { key: "LED-R-CATHODE", name: "K", label: "LED rouge Cathode -", x: 36, y: 65, color: "#222222" },
    ]),
  },

  led_g: {
    type: "led_g",
    name: "LED verte",
    category: "Actionneurs",
    description: "LED verte pour état normal.",
    emoji: "LED",
    chipColor: "#1e7a34",
    chipBg: "#e8f8ec",
    width: 55,
    height: 75,
    pins: pins([
      { key: "LED-G-ANODE", name: "A", label: "LED verte Anode +", x: 20, y: 65, color: "#ff0000" },
      { key: "LED-G-CATHODE", name: "K", label: "LED verte Cathode -", x: 36, y: 65, color: "#222222" },
    ]),
  },

  jumper: {
    type: "jumper",
    name: "Fil jumper",
    category: "Connexion",
    description: "Fil jumper physique. Les vrais câbles sont créés par liaison entre pins.",
    emoji: "JMP",
    chipColor: "#c9a227",
    chipBg: "#fff8df",
    width: 95,
    height: 40,
    pins: pins([
      { key: "JUMPER-A", name: "A", label: "Extrémité A", x: 10, y: 20, color: "#ff0000" },
      { key: "JUMPER-B", name: "B", label: "Extrémité B", x: 85, y: 20, color: "#0055ff" },
    ]),
  },

  res220: {
    type: "res220",
    name: "Résistance 220Ω",
    category: "Composants passifs",
    description: "Résistance 220 ohms, utile pour LED.",
    emoji: "220",
    chipColor: "#8a6a22",
    chipBg: "#fff4d0",
    width: 90,
    height: 35,
    pins: pins([
      { key: "RES220-A", name: "A", label: "Résistance 220Ω A", x: 8, y: 18, color: "#8a6a22" },
      { key: "RES220-B", name: "B", label: "Résistance 220Ω B", x: 82, y: 18, color: "#8a6a22" },
    ]),
  },

  res10k: {
    type: "res10k",
    name: "Résistance 10kΩ",
    category: "Composants passifs",
    description: "Résistance 10k ohms, utile en pull-up.",
    emoji: "10K",
    chipColor: "#8a6a22",
    chipBg: "#fff4d0",
    width: 90,
    height: 35,
    pins: pins([
      { key: "RES10K-A", name: "A", label: "Résistance 10kΩ A", x: 8, y: 18, color: "#8a6a22" },
      { key: "RES10K-B", name: "B", label: "Résistance 10kΩ B", x: 82, y: 18, color: "#8a6a22" },
    ]),
  },

  cap100: {
    type: "cap100",
    name: "Condensateur",
    category: "Composants passifs",
    description: "Condensateur pour filtrage ou stabilisation.",
    emoji: "CAP",
    chipColor: "#6b35b0",
    chipBg: "#eee5ff",
    width: 55,
    height: 75,
    pins: pins([
      { key: "CAP100-PLUS", name: "+", label: "Condensateur +", x: 22, y: 65, color: "#ff0000" },
      { key: "CAP100-MINUS", name: "-", label: "Condensateur -", x: 36, y: 65, color: "#222222" },
    ]),
  },

  transistor: {
    type: "transistor",
    name: "Transistor",
    category: "Composants passifs",
    description: "Transistor de commande.",
    emoji: "TR",
    chipColor: "#111827",
    chipBg: "#eeeeee",
    width: 65,
    height: 75,
    pins: pins([
      { key: "TRANSISTOR-C", name: "C", label: "Collecteur", x: 20, y: 65, color: "#ffaa00" },
      { key: "TRANSISTOR-B", name: "B", label: "Base", x: 32, y: 65, color: "#0055ff" },
      { key: "TRANSISTOR-E", name: "E", label: "Émetteur", x: 44, y: 65, color: "#222222" },
    ]),
  },

  power: {
    type: "power",
    name: "Alimentation",
    category: "Alimentation",
    description: "Source d’alimentation virtuelle.",
    emoji: "PWR",
    chipColor: "#c9a227",
    chipBg: "#fff8df",
    width: 95,
    height: 75,
    pins: pins([
      { key: "POWER-5V", name: "5V", label: "Alimentation 5V", x: 25, y: 65, color: "#ff0000" },
      { key: "POWER-3V3", name: "3V3", label: "Alimentation 3.3V", x: 48, y: 65, color: "#ff7a30" },
      { key: "POWER-GND", name: "GND", label: "Alimentation GND", x: 72, y: 65, color: "#222222" },
    ]),
  },

  gnd: {
    type: "gnd",
    name: "Masse GND",
    category: "Alimentation",
    description: "Point de masse commun.",
    emoji: "GND",
    chipColor: "#222222",
    chipBg: "#eeeeee",
    width: 65,
    height: 55,
    pins: pins([
      { key: "GND-1", name: "GND", label: "Masse GND", x: 32, y: 45, color: "#222222" },
    ]),
  },
};