```text
DHT22
VCC  → Breadboard F10 
DATA → GPIO4
GND  → Breadboard D5


MQ-135
VCC  → Breadboard F7
GND  → Breadboard E1
DOUT → GPIO17
AOUT → 



MQ-2
VCC  → Breadboard F4
GND  → Breadboard E2
DOUT → GPIO27
AOUT → 



BMP280
VCC → Breadboard F15 
GND → Breadboard E7
SDA → Breadboard A3 
SCL → Breadboard B4


OLED I2C
VCC → Breadboard F30
GND → Breadboard E24
SDA → Breadboard A7 
SCL → Breadboard B8 

Breadboard → Raspberry pi
F13 → Vcc 5V
E13 → GND
A1 → GPIO2 SDA
B1 → GPIO3 SCL

LED rouge
GPIO22 → Anode LED rouge
Cathode LED rouge → GND

LED verte
GPIO23 → Anode LED verte
Cathode LED verte → GND

Ventilateur
GPIO18 → IN/PWM ventilateur
VCC ventilateur → 5V
GND ventilateur → GND

Refroidissement
GPIO24 → IN module refroidissement
VCC refroidissement → 5V ou alimentation externe
GND refroidissement → GND commun
```