const RPI5_PIN_DEFINITIONS = [
  { number: 1, name: "3.3V", label: "3V3 power", color: "#ff7a30" },
  { number: 2, name: "5V", label: "5V power", color: "#ff0000" },
  { number: 3, name: "GPIO2 SDA", label: "GPIO 2 SDA", color: "#0055ff" },
  { number: 4, name: "5V", label: "5V power", color: "#ff0000" },
  { number: 5, name: "GPIO3 SCL", label: "GPIO 3 SCL", color: "#00aa00" },
  { number: 6, name: "GND", label: "Ground", color: "#222222" },
  { number: 7, name: "GPIO4", label: "GPIO 4", color: "#ff9900" },
  { number: 8, name: "GPIO14 TXD", label: "GPIO 14 TXD", color: "#aa00ff" },
  { number: 9, name: "GND", label: "Ground", color: "#222222" },
  { number: 10, name: "GPIO15 RXD", label: "GPIO 15 RXD", color: "#ff00aa" },
  { number: 11, name: "GPIO17", label: "GPIO 17", color: "#ff9900" },
  { number: 12, name: "GPIO18 PWM", label: "GPIO 18 PWM", color: "#ff9900" },
  { number: 13, name: "GPIO27", label: "GPIO 27", color: "#ff9900" },
  { number: 14, name: "GND", label: "Ground", color: "#222222" },
  { number: 15, name: "GPIO22", label: "GPIO 22", color: "#ff9900" },
  { number: 16, name: "GPIO23", label: "GPIO 23", color: "#ff9900" },
  { number: 17, name: "3.3V", label: "3V3 power", color: "#ff7a30" },
  { number: 18, name: "GPIO24", label: "GPIO 24", color: "#ff9900" },
  { number: 19, name: "GPIO10 MOSI", label: "GPIO 10 MOSI", color: "#ffaa00" },
  { number: 20, name: "GND", label: "Ground", color: "#222222" },
  { number: 21, name: "GPIO9 MISO", label: "GPIO 9 MISO", color: "#ffaa00" },
  { number: 22, name: "GPIO25", label: "GPIO 25", color: "#ff9900" },
  { number: 23, name: "GPIO11 SCLK", label: "GPIO 11 SCLK", color: "#ffaa00" },
  { number: 24, name: "GPIO8 CE0", label: "GPIO 8 CE0", color: "#ffaa00" },
  { number: 25, name: "GND", label: "Ground", color: "#222222" },
  { number: 26, name: "GPIO7 CE1", label: "GPIO 7 CE1", color: "#ffaa00" },
  { number: 27, name: "GPIO0 ID_SD", label: "GPIO 0 ID_SD", color: "#0055ff" },
  { number: 28, name: "GPIO1 ID_SC", label: "GPIO 1 ID_SC", color: "#00aa00" },
  { number: 29, name: "GPIO5", label: "GPIO 5", color: "#ff9900" },
  { number: 30, name: "GND", label: "Ground", color: "#222222" },
  { number: 31, name: "GPIO6", label: "GPIO 6", color: "#ff9900" },
  { number: 32, name: "GPIO12 PWM0", label: "GPIO 12 PWM0", color: "#ff9900" },
  { number: 33, name: "GPIO13 PWM1", label: "GPIO 13 PWM1", color: "#ff9900" },
  { number: 34, name: "GND", label: "Ground", color: "#222222" },
  { number: 35, name: "GPIO19 PCM_FS", label: "GPIO 19 PCM_FS", color: "#ff9900" },
  { number: 36, name: "GPIO16", label: "GPIO 16", color: "#ff9900" },
  { number: 37, name: "GPIO26", label: "GPIO 26", color: "#ff9900" },
  { number: 38, name: "GPIO20 PCM_DIN", label: "GPIO 20 PCM_DIN", color: "#ff9900" },
  { number: 39, name: "GND", label: "Ground", color: "#222222" },
  { number: 40, name: "GPIO21 PCM_DOUT", label: "GPIO 21 PCM_DOUT", color: "#ff9900" },
];

function createRpi5Pins() {
  const startX = 46;
  const step = 9.9;
  const topY = 30;
  const bottomY = 42;

  return RPI5_PIN_DEFINITIONS.map((pin) => {
    const column = Math.floor((pin.number - 1) / 2);
    const x = Number((startX + column * step).toFixed(2));
    const y = pin.number % 2 === 1 ? topY : bottomY;

    return { ...pin, x, y };
  });
}

function createBreadboardPins() {
  const pins = [];
  const leftLetters = ["A", "B", "C", "D", "E"];
  const rightLetters = ["F", "G", "H", "I", "J"];

  for (let row = 1; row <= 30; row += 1) {
    const y = Number((40 + (row - 1) * 6.2).toFixed(2));

    pins.push({ name: `L+${row}`, label: `Rail gauche + ${row}`, x: 34, y, color: "#ff0000" });
    pins.push({ name: `L-${row}`, label: `Rail gauche - ${row}`, x: 59, y, color: "#0055ff" });
    pins.push({ name: `R+${row}`, label: `Rail droite + ${row}`, x: 362, y, color: "#ff0000" });
    pins.push({ name: `R-${row}`, label: `Rail droite - ${row}`, x: 387, y, color: "#0055ff" });

    leftLetters.forEach((letter, index) => {
      pins.push({
        name: `${letter}${row}`,
        label: `Breadboard ${letter}${row}`,
        x: 116 + index * 22,
        y,
        color: "#8a6a22",
      });
    });

    rightLetters.forEach((letter, index) => {
      pins.push({
        name: `${letter}${row}`,
        label: `Breadboard ${letter}${row}`,
        x: 246 + index * 22,
        y,
        color: "#8a6a22",
      });
    });
  }

  return pins;
}

export const componentsData = {
  rpi5: {
    type: "rpi5",
    name: "Raspberry Pi 5",
    category: "Carte principale",
    emoji: "RPi",
    chipColor: "#0b8b62",
    chipBg: "#e5fff4",
    width: 360,
    height: 240,
    description:
      "Carte principale du système. Les jumpers doivent se connecter directement sur le header GPIO 40 broches du Raspberry Pi 5.",
    specs: {
      CPU: "ARM Cortex-A76 × 4 @ 2.4 GHz",
      RAM: "4 / 8 / 16 GB LPDDR4X",
      GPIO: "40 broches GPIO 3.3 V",
      I2C: "GPIO2 SDA / GPIO3 SCL",
      UART: "GPIO14 TXD / GPIO15 RXD",
      SPI: "GPIO10 MOSI / GPIO9 MISO / GPIO11 SCLK / GPIO8 CE0 / GPIO7 CE1",
      Alimentation: "USB-C 5V ou pins 5V",
      Note: "AOUT nécessite normalement un ADC externe.",
    },
    pins: createRpi5Pins(),
  },

  breadboard: {
    type: "breadboard",
    name: "Breadboard",
    category: "Connexion",
    emoji: "BB",
    chipColor: "#b8920a",
    chipBg: "#fffbe8",
    width: 420,
    height: 260,
    description:
      "Breadboard 830 points vue du haut. Les rails + et - et les trous A-J sont connectables.",
    specs: {
      Points: "830 trous",
      Colonnes: "A-J",
      Lignes: "1-30",
      Rails: "+ et - gauche/droite",
      Pas: "2.54 mm",
    },
    pins: createBreadboardPins(),
  },

  dht22: {
    type: "dht22",
    name: "DHT22",
    category: "Capteur",
    emoji: "DHT",
    chipColor: "#1e7a34",
    chipBg: "#e8f7ea",
    width: 120,
    height: 160,
    description:
      "Capteur de température et d’humidité. Pins connectables : VCC, DATA et GND.",
    specs: {
      Alimentation: "3.3–5 V",
      Interface: "Digital 1-Wire",
      Température: "-40 à +80 °C",
      Humidité: "0 à 100 %",
    },
    pins: [
      { name: "VCC", label: "DHT22 VCC", x: 74, y: 148, color: "#ff0000" },
      { name: "DATA", label: "DHT22 DATA", x: 89, y: 148, color: "#0055ff" },
      { name: "GND", label: "DHT22 GND", x: 104, y: 148, color: "#222222" },
    ],
  },

  mq135: {
    type: "mq135",
    name: "MQ-135",
    category: "Capteur",
    emoji: "AIR",
    chipColor: "#1e4f8f",
    chipBg: "#e3f0fb",
    width: 150,
    height: 120,
    description:
      "Capteur de qualité de l’air avec sorties VCC, GND, DOUT et AOUT.",
    specs: {
      Alimentation: "5 V",
      AOUT: "Sortie analogique",
      DOUT: "Sortie digitale",
      Note: "AOUT nécessite un ADC pour Raspberry Pi réel.",
    },
    pins: [
      { name: "VCC", label: "MQ-135 VCC", x: 142, y: 38, color: "#ff0000" },
      { name: "GND", label: "MQ-135 GND", x: 142, y: 58, color: "#222222" },
      { name: "DOUT", label: "MQ-135 DOUT", x: 142, y: 78, color: "#ffaa00" },
      { name: "AOUT", label: "MQ-135 AOUT", x: 142, y: 98, color: "#00aaff" },
    ],
  },

  mq2: {
    type: "mq2",
    name: "MQ-2",
    category: "Capteur",
    emoji: "GAS",
    chipColor: "#b52020",
    chipBg: "#fdecea",
    width: 150,
    height: 120,
    description:
      "Capteur de fumée/gaz avec sorties VCC, GND, DOUT et AOUT.",
    specs: {
      Alimentation: "5 V",
      AOUT: "Sortie analogique",
      DOUT: "Sortie digitale",
      Note: "AOUT nécessite un ADC pour Raspberry Pi réel.",
    },
    pins: [
      { name: "VCC", label: "MQ-2 VCC", x: 142, y: 38, color: "#ff0000" },
      { name: "GND", label: "MQ-2 GND", x: 142, y: 58, color: "#222222" },
      { name: "DOUT", label: "MQ-2 DOUT", x: 142, y: 78, color: "#ffaa00" },
      { name: "AOUT", label: "MQ-2 AOUT", x: 142, y: 98, color: "#00aaff" },
    ],
  },

  pressure: {
    type: "pressure",
    name: "Capteur pression",
    category: "Capteur",
    emoji: "PRS",
    chipColor: "#333333",
    chipBg: "#eeeeee",
    width: 120,
    height: 170,
    description:
      "Capteur de pression industriel simulé avec pins VCC, SIG et GND.",
    specs: {
      Alimentation: "5–24 V",
      Signal: "Analogique",
    },
    pins: [
      { name: "VCC", label: "Pressure VCC", x: 35, y: 14, color: "#ff0000" },
      { name: "SIG", label: "Pressure Signal", x: 60, y: 14, color: "#0055ff" },
      { name: "GND", label: "Pressure GND", x: 85, y: 14, color: "#222222" },
    ],
  },

  soil: {
    type: "soil",
    name: "Humidité sol",
    category: "Capteur",
    emoji: "SOIL",
    chipColor: "#6b4d22",
    chipBg: "#f7efd9",
    width: 150,
    height: 240,
    description:
      "Capteur d’humidité du sol avec VCC, AOUT, DOUT et GND.",
    specs: {
      Alimentation: "3.3–5 V",
      Sortie: "Analogique / digitale",
    },
    pins: [
      { name: "VCC", label: "Soil VCC", x: 30, y: 10, color: "#ff0000" },
      { name: "AOUT", label: "Soil AOUT", x: 58, y: 10, color: "#00aaff" },
      { name: "DOUT", label: "Soil DOUT", x: 86, y: 10, color: "#ffaa00" },
      { name: "GND", label: "Soil GND", x: 114, y: 10, color: "#222222" },
    ],
  },

  bmp280: {
    type: "bmp280",
    name: "BMP280",
    category: "Capteur",
    emoji: "BMP",
    chipColor: "#1558a0",
    chipBg: "#e3f0fb",
    width: 80,
    height: 90,
    description:
      "Capteur de pression barométrique et température via I2C.",
    specs: {
      Alimentation: "3.3 V",
      Interface: "I2C",
    },
    pins: [
      { name: "VCC", label: "BMP280 VCC", x: 10, y: 82, color: "#ff0000" },
      { name: "SDA", label: "BMP280 SDA", x: 30, y: 82, color: "#0055ff" },
      { name: "SCL", label: "BMP280 SCL", x: 50, y: 82, color: "#00aa00" },
      { name: "GND", label: "BMP280 GND", x: 68, y: 82, color: "#222222" },
    ],
  },

  pir: {
    type: "pir",
    name: "PIR HC-SR501",
    category: "Capteur",
    emoji: "PIR",
    chipColor: "#6b35b0",
    chipBg: "#f3ecfb",
    width: 80,
    height: 90,
    description:
      "Capteur infrarouge passif de mouvement.",
    specs: {
      Alimentation: "4.5–20 V",
      Sortie: "Digital TTL",
    },
    pins: [
      { name: "VCC", label: "PIR VCC", x: 10, y: 82, color: "#ff0000" },
      { name: "OUT", label: "PIR OUT", x: 40, y: 82, color: "#00ccaa" },
      { name: "GND", label: "PIR GND", x: 68, y: 82, color: "#222222" },
    ],
  },

  wifi: {
    type: "wifi",
    name: "ESP8266 Wi-Fi",
    category: "Communication",
    emoji: "WiFi",
    chipColor: "#0f7a6b",
    chipBg: "#e7fbf7",
    width: 110,
    height: 80,
    description:
      "Module Wi-Fi ESP8266 UART.",
    specs: {
      Alimentation: "3.3 V",
      Interface: "UART",
    },
    pins: [
      { name: "VCC", label: "ESP8266 VCC", x: 16, y: 72, color: "#ff0000" },
      { name: "TX", label: "ESP8266 TX", x: 42, y: 72, color: "#aa00ff" },
      { name: "RX", label: "ESP8266 RX", x: 68, y: 72, color: "#ff00aa" },
      { name: "GND", label: "ESP8266 GND", x: 94, y: 72, color: "#222222" },
    ],
  },

  bluetooth: {
    type: "bluetooth",
    name: "HC-05 Bluetooth",
    category: "Communication",
    emoji: "BT",
    chipColor: "#1558a0",
    chipBg: "#ddeeff",
    width: 110,
    height: 80,
    description:
      "Module Bluetooth HC-05 UART.",
    specs: {
      Alimentation: "3.3–5 V",
      Interface: "UART",
    },
    pins: [
      { name: "VCC", label: "HC-05 VCC", x: 16, y: 72, color: "#ff0000" },
      { name: "TX", label: "HC-05 TX", x: 42, y: 72, color: "#aa00ff" },
      { name: "RX", label: "HC-05 RX", x: 68, y: 72, color: "#ff00aa" },
      { name: "GND", label: "HC-05 GND", x: 94, y: 72, color: "#222222" },
    ],
  },

  relay: {
    type: "relay",
    name: "Relais 5V",
    category: "Actionneur",
    emoji: "REL",
    chipColor: "#6b35b0",
    chipBg: "#f3ecfb",
    width: 90,
    height: 75,
    description:
      "Relais électromécanique 5V.",
    specs: {
      Bobine: "5 V DC",
      Charge: "250 VAC 10 A",
    },
    pins: [
      { name: "IN", label: "Relay IN", x: 12, y: 67, color: "#ff8800" },
      { name: "VCC", label: "Relay VCC", x: 40, y: 67, color: "#ff0000" },
      { name: "GND", label: "Relay GND", x: 68, y: 67, color: "#222222" },
    ],
  },

  buzzer: {
    type: "buzzer",
    name: "Buzzer",
    category: "Actionneur",
    emoji: "BUZ",
    chipColor: "#b52020",
    chipBg: "#fdecea",
    width: 62,
    height: 62,
    description:
      "Buzzer d’alerte sonore.",
    specs: {
      Alimentation: "3–5 V",
    },
    pins: [
      { name: "+", label: "Buzzer +", x: 15, y: 54, color: "#ff0000" },
      { name: "−", label: "Buzzer -", x: 47, y: 54, color: "#222222" },
    ],
  },

  oled: {
    type: "oled",
    name: "OLED 0.96",
    category: "Actionneur",
    emoji: "OLED",
    chipColor: "#1558a0",
    chipBg: "#e8f0fb",
    width: 92,
    height: 70,
    description:
      "Écran OLED I2C.",
    specs: {
      Interface: "I2C",
      Résolution: "128×64 px",
    },
    pins: [
      { name: "VCC", label: "OLED VCC", x: 12, y: 62, color: "#ff0000" },
      { name: "GND", label: "OLED GND", x: 34, y: 62, color: "#222222" },
      { name: "SDA", label: "OLED SDA", x: 58, y: 62, color: "#0055ff" },
      { name: "SCL", label: "OLED SCL", x: 80, y: 62, color: "#00aa00" },
    ],
  },

  jumper: {
    type: "jumper",
    name: "Fils jumper",
    category: "Connexion",
    emoji: "WIRE",
    chipColor: "#b52020",
    chipBg: "#fff2f2",
    width: 170,
    height: 86,
    description:
      "Fils Dupont utilisés pour relier les pins.",
    specs: {
      Type: "Dupont",
    },
    pins: [],
  },

  res220: {
    type: "res220",
    name: "Résistance 220 Ω",
    category: "Passif",
    emoji: "220",
    chipColor: "#b8920a",
    chipBg: "#fffbe8",
    width: 80,
    height: 28,
    description:
      "Résistance 220 Ω.",
    specs: {
      Valeur: "220 Ω",
    },
    pins: [],
  },

  res10k: {
    type: "res10k",
    name: "Résistance 10 kΩ",
    category: "Passif",
    emoji: "10K",
    chipColor: "#6b6b6b",
    chipBg: "#f5f5f0",
    width: 80,
    height: 28,
    description:
      "Résistance 10 kΩ.",
    specs: {
      Valeur: "10 kΩ",
    },
    pins: [],
  },

  led_r: {
    type: "led_r",
    name: "LED Rouge",
    category: "Passif",
    emoji: "LED",
    chipColor: "#b52020",
    chipBg: "#fdecea",
    width: 40,
    height: 65,
    description:
      "LED rouge.",
    specs: {
      Couleur: "Rouge",
    },
    pins: [
      { name: "A", label: "LED anode", x: 10, y: 57, color: "#ff0000" },
      { name: "K", label: "LED cathode", x: 30, y: 57, color: "#222222" },
    ],
  },

  led_g: {
    type: "led_g",
    name: "LED Verte",
    category: "Passif",
    emoji: "LED",
    chipColor: "#1e7a34",
    chipBg: "#eaf6ec",
    width: 40,
    height: 65,
    description:
      "LED verte.",
    specs: {
      Couleur: "Verte",
    },
    pins: [
      { name: "A", label: "LED anode", x: 10, y: 57, color: "#00aa00" },
      { name: "K", label: "LED cathode", x: 30, y: 57, color: "#222222" },
    ],
  },

  cap100: {
    type: "cap100",
    name: "Condensateur 100µF",
    category: "Passif",
    emoji: "CAP",
    chipColor: "#6b35b0",
    chipBg: "#f3ecfb",
    width: 42,
    height: 62,
    description:
      "Condensateur électrolytique.",
    specs: {
      Capacité: "100 µF",
    },
    pins: [
      { name: "+", label: "Condensateur +", x: 12, y: 54, color: "#ff0000" },
      { name: "−", label: "Condensateur -", x: 30, y: 54, color: "#222222" },
    ],
  },

  transistor: {
    type: "transistor",
    name: "NPN BC547",
    category: "Passif",
    emoji: "NPN",
    chipColor: "#0f7a6b",
    chipBg: "#e0f5f0",
    width: 52,
    height: 62,
    description:
      "Transistor NPN.",
    specs: {
      Type: "BC547",
    },
    pins: [
      { name: "B", label: "Base", x: 8, y: 54, color: "#ff8800" },
      { name: "C", label: "Collecteur", x: 26, y: 54, color: "#ff2200" },
      { name: "E", label: "Émetteur", x: 44, y: 54, color: "#222222" },
    ],
  },

  power: {
    type: "power",
    name: "Alimentation 5V",
    category: "Alimentation",
    emoji: "5V",
    chipColor: "#c9a227",
    chipBg: "#fff4c7",
    width: 90,
    height: 70,
    description:
      "Alimentation virtuelle 5V.",
    specs: {
      Sortie: "5 V",
    },
    pins: [
      { name: "+5V", label: "Power +5V", x: 25, y: 62, color: "#ff0000" },
      { name: "GND", label: "Power GND", x: 65, y: 62, color: "#222222" },
    ],
  },

  gnd: {
    type: "gnd",
    name: "GND",
    category: "Alimentation",
    emoji: "GND",
    chipColor: "#333333",
    chipBg: "#f5f5f0",
    width: 52,
    height: 42,
    description:
      "Symbole de masse.",
    specs: {
      Potentiel: "0 V",
    },
    pins: [],
  },
};

export const componentGroups = [
  "Carte principale",
  "Capteur",
  "Communication",
  "Actionneur",
  "Connexion",
  "Passif",
  "Alimentation",
];