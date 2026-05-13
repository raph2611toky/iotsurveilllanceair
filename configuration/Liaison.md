```text
DHT22
VCC  → 3.3V ou 5V
DATA → GPIO4
GND  → GND

MQ-135
VCC  → 5V
GND  → GND
DOUT → GPIO17
AOUT → ADC externe, pas directement Raspberry Pi

MQ-2
VCC  → 5V
GND  → GND
DOUT → GPIO27
AOUT → ADC externe, pas directement Raspberry Pi

BMP280
VCC → 3.3V
GND → GND
SDA → GPIO2 SDA
SCL → GPIO3 SCL

OLED I2C
VCC → 3.3V
GND → GND
SDA → GPIO2 SDA
SCL → GPIO3 SCL

Buzzer
+   → GPIO18 ou GPIO23
-   → GND
```