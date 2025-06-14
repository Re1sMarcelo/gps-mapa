#include <HardwareSerial.h>
#include <TinyGPS++.h>
#include <LoRa.h>

// Configuração GPS
#define GPS_RX_PIN 16  // TX do GPS -> GPIO16
#define GPS_TX_PIN 17  // RX do GPS -> GPIO17
#define GPS_BAUD 9600  // Baud rate do GPS

// Configuração LoRa
#define LORA_SS 18
#define LORA_RST 23
#define LORA_DIO0 26
#define LORA_FREQUENCY 915E6  // 915MHz para Brasil

HardwareSerial gpsSerial(1);
TinyGPSPlus gps;

void setup() {
  Serial.begin(115200);
  while (!Serial); // Aguarda serial no USB
  
  Serial.println("Iniciando sistema GPS-LoRa...");
  
  // Inicializa comunicação com GPS
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  
  // Inicializa LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("Falha ao iniciar LoRa!");
    while (1);
  }
  
  LoRa.setTxPower(20);
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E3);
  
  Serial.println("Aguardando sinal GPS...");
}

void loop() {
  // Processa dados GPS
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }
  
  // Mostra informações a cada 2 segundos
  static uint32_t lastUpdate = 0;
  if (millis() - lastUpdate >= 2000) {
    lastUpdate = millis();
    displayGPSInfo();
  }
}

void displayGPSInfo() {
  if (!gps.location.isValid()) {
    static bool waitingMessageShown = false;
    if (!waitingMessageShown) {
      Serial.println("Aguardando sinal GPS...");
      waitingMessageShown = true;
    }
    return;
  }

  // Exibe informações formatadas quando tem sinal
  Serial.println("\n--- Status GPS ---");
  Serial.print("Satélites: ");
  Serial.print(gps.satellites.value());
  Serial.print(" | HDOP: ");
  if (gps.hdop.isValid()) {
    Serial.print(gps.hdop.value());
  } else {
    Serial.print("9999");
  }
  Serial.print(" | Idade: ");
  Serial.print(gps.location.age());
  Serial.println(" ms");
  
  Serial.print("Latitude: ");
  Serial.print(gps.location.lat(), 6);
  Serial.print(" | Longitude: ");
  Serial.print(gps.location.lng(), 6);
  Serial.print(" | Precisão: ±");
  
  // Estimativa de precisão baseada no HDOP (aproximadamente 5m por unidade HDOP)
  if (gps.hdop.isValid()) {
    Serial.print(gps.hdop.hdop() * 5, 0);
  } else {
    Serial.print("500");
  }
  Serial.println("m");

  // Prepara e envia mensagem LoRa
  String loraMessage = String(gps.location.lat(), 6) + ";" + String(gps.location.lng(), 6);
  
  LoRa.beginPacket();
  LoRa.print(loraMessage);
  LoRa.endPacket();
  
  Serial.println("Enviado via LoRa: " + loraMessage);
  Serial.println("------------------");
}