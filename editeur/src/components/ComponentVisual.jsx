import "./visuals/RealParts.css";

import RaspberryPi5Svg from "./visuals/RaspberryPi5Svg";
import BreadboardSvg from "./visuals/BreadboardSvg";
import Dht22Svg from "./visuals/Dht22Svg";
import MqSensorSvg from "./visuals/MqSensorSvg";
import PressureSensorSvg from "./visuals/PressureSensorSvg";
import SoilMoistureSvg from "./visuals/SoilMoistureSvg";

import {
  Bmp280Svg,
  PirSvg,
  WifiSvg,
  RelaySvg,
  BuzzerSvg,
  OledSvg,
  ResistorSvg,
  LedSvg,
  JumperSvg,
  CapacitorSvg,
  TransistorSvg,
  PowerSvg,
  GndSvg,
  GenericSvg,
} from "./visuals/OtherPartsSvg";

function getPinUniqueKey(pin) {
  return pin.pinKey || pin.key || pin.id || `pin-${pin.number || pin.pinName || pin.name}-${pin.x}-${pin.y}`;
}

function Pin({
  pin,
  disabled = false,
  onPinMouseDown,
  onPinMouseEnter,
  onPinMouseLeave,
}) {
  const pinLabel = pin.label || pin.name;
  const pinKey = getPinUniqueKey(pin);

  return (
    <button
      className={disabled ? "pin pin-disabled" : "pin"}
      title={disabled ? `${pinLabel} déjà connecté` : pinLabel}
      data-pin-label={disabled ? `${pinLabel} déjà connecté` : pinLabel}
      data-pin-key={pinKey}
      disabled={disabled}
      style={{
        left: pin.x,
        top: pin.y,
        background: disabled ? "#9ca3af" : pin.color,
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (disabled) return;

        if (onPinMouseDown) {
          onPinMouseDown(pin, event);
        }
      }}
      onMouseEnter={() => {
        if (onPinMouseEnter) onPinMouseEnter(pin);
      }}
      onMouseLeave={() => {
        if (onPinMouseLeave) onPinMouseLeave(pin);
      }}
    />
  );
}

function ComponentFrame({
  component,
  disabledPinKeys = new Set(),
  onPinMouseDown,
  onPinMouseEnter,
  onPinMouseLeave,
  children,
}) {
  return (
    <div
      className="real-component-frame"
      style={{
        width: component.width,
        height: component.height,
      }}
    >
      {children}

      {component.type !== "rpi5" && component.type !== "breadboard" && component.poweredIndicator && (
        <div className={`component-power-leds ${component.powerLedColor || "green"}`} aria-hidden="true">
          {Array.from({ length: component.powerLedCount || 2 }).map((_, index) => (
            <span key={`power-led-${component.type}-${index}`} />
          ))}
        </div>
      )}

      {component.type !== "rpi5" && component.type !== "breadboard" && (
        <div className="component-male-header-layer" aria-hidden="true">
          {component.pins?.map((pin) => {
            const pinKey = getPinUniqueKey(pin);
            return (
              <span
                key={`male-${component.type}-${pinKey}`}
                className="component-male-pin"
                style={{
                  left: pin.x,
                  top: pin.y,
                  borderColor: pin.color || "#8a6a22",
                }}
              />
            );
          })}
        </div>
      )}

      {component.pins?.map((pin) => {
        const pinKey = getPinUniqueKey(pin);

        return (
          <Pin
            key={`${component.type}-${pinKey}`}
            pin={pin}
            disabled={disabledPinKeys.has(pinKey)}
            onPinMouseDown={onPinMouseDown}
            onPinMouseEnter={onPinMouseEnter}
            onPinMouseLeave={onPinMouseLeave}
          />
        );
      })}
    </div>
  );
}

function getLiveValue(type, sensorData, running) {
  if (!running || !sensorData) return null;

  if (type === "dht22") {
    return `${sensorData.temperature}°C / ${sensorData.humidity}%`;
  }

  if (type === "mq135") {
    return `${sensorData.co2} ppm`;
  }

  if (type === "mq2") {
    return `${sensorData.smoke} ppm`;
  }

  if (type === "bmp280") {
    return `${sensorData.pressure || 1013} hPa`;
  }

  if (type === "pir") {
    return sensorData.label || "Calme";
  }

  if (type === "soil") {
    return `${sensorData.humidity}%`;
  }

  if (type === "pressure") {
    return `${sensorData.pressure || 1013} hPa`;
  }

  return null;
}

export default function ComponentVisual({
  component,
  disabledPinKeys = new Set(),
  onPinMouseDown,
  onPinMouseEnter,
  onPinMouseLeave,
  running = false,
  sensorData = null,
  powered = false,
}) {
  const liveValue = getLiveValue(component.type, sensorData, running);

  const visualComponent = {
    ...component,
    poweredIndicator: Boolean(powered),
    powerLedCount: component.type === "oled" ? 3 : component.type === "relay" ? 1 : 2,
    powerLedColor:
      component.type === "mq2" || component.type === "led_r" ? "red" :
      component.type === "oled" || component.type === "wifi" || component.type === "bluetooth" ? "blue" :
      "green",
  };

  const frameProps = {
    component: visualComponent,
    disabledPinKeys,
    onPinMouseDown,
    onPinMouseEnter,
    onPinMouseLeave,
  };

  switch (component.type) {
    case "rpi5":
      return (
        <ComponentFrame {...frameProps}>
          <RaspberryPi5Svg
            width={component.width}
            height={component.height}
            running={running}
            powered={powered}
          />
        </ComponentFrame>
      );

    case "breadboard":
      return (
        <ComponentFrame {...frameProps}>
          <BreadboardSvg width={component.width} height={component.height} />
        </ComponentFrame>
      );

    case "dht22":
      return (
        <ComponentFrame {...frameProps}>
          <Dht22Svg
            width={component.width}
            height={component.height}
            liveValue={liveValue}
          />
        </ComponentFrame>
      );

    case "mq135":
    case "mq2":
      return (
        <ComponentFrame {...frameProps}>
          <MqSensorSvg
            width={component.width}
            height={component.height}
            type={component.type}
            name={component.name}
            liveValue={liveValue}
          />
        </ComponentFrame>
      );

    case "pressure":
      return (
        <ComponentFrame {...frameProps}>
          <PressureSensorSvg
            width={component.width}
            height={component.height}
            liveValue={liveValue}
          />
        </ComponentFrame>
      );

    case "soil":
      return (
        <ComponentFrame {...frameProps}>
          <SoilMoistureSvg
            width={component.width}
            height={component.height}
            liveValue={liveValue}
          />
        </ComponentFrame>
      );

    case "bmp280":
      return (
        <ComponentFrame {...frameProps}>
          <Bmp280Svg
            width={component.width}
            height={component.height}
            liveValue={liveValue}
          />
        </ComponentFrame>
      );

    case "pir":
      return (
        <ComponentFrame {...frameProps}>
          <PirSvg
            width={component.width}
            height={component.height}
            liveValue={liveValue}
          />
        </ComponentFrame>
      );

    case "wifi":
    case "bluetooth":
      return (
        <ComponentFrame {...frameProps}>
          <WifiSvg
            width={component.width}
            height={component.height}
            type={component.type}
          />
        </ComponentFrame>
      );

    case "relay":
      return (
        <ComponentFrame {...frameProps}>
          <RelaySvg width={component.width} height={component.height} />
        </ComponentFrame>
      );

    case "buzzer":
      return (
        <ComponentFrame {...frameProps}>
          <BuzzerSvg
            width={component.width}
            height={component.height}
            running={powered}
          />
        </ComponentFrame>
      );

    case "oled":
      return (
        <ComponentFrame {...frameProps}>
          <OledSvg
            width={component.width}
            height={component.height}
            sensorData={running ? sensorData : null}
          />
        </ComponentFrame>
      );

    case "res220":
    case "res10k":
      return (
        <ComponentFrame {...frameProps}>
          <ResistorSvg
            width={component.width}
            height={component.height}
            type={component.type}
          />
        </ComponentFrame>
      );

    case "led_r":
    case "led_g":
      return (
        <ComponentFrame {...frameProps}>
          <LedSvg
            width={component.width}
            height={component.height}
            type={component.type}
            running={powered}
          />
        </ComponentFrame>
      );

    case "jumper":
      return (
        <ComponentFrame {...frameProps}>
          <JumperSvg width={component.width} height={component.height} />
        </ComponentFrame>
      );

    case "cap100":
      return (
        <ComponentFrame {...frameProps}>
          <CapacitorSvg width={component.width} height={component.height} />
        </ComponentFrame>
      );

    case "transistor":
      return (
        <ComponentFrame {...frameProps}>
          <TransistorSvg width={component.width} height={component.height} />
        </ComponentFrame>
      );

    case "power":
      return (
        <ComponentFrame {...frameProps}>
          <PowerSvg width={component.width} height={component.height} />
        </ComponentFrame>
      );

    case "gnd":
      return (
        <ComponentFrame {...frameProps}>
          <GndSvg width={component.width} height={component.height} />
        </ComponentFrame>
      );

    default:
      return (
        <ComponentFrame {...frameProps}>
          <GenericSvg
            width={component.width}
            height={component.height}
            name={component.name}
            emoji={component.emoji}
          />
        </ComponentFrame>
      );
  }
}