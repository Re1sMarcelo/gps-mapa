#include <HardwareSerial.h>
#include <TinyGPS++.h>

#define GPS_RX_PIN 16  // TX do GPS -> GPIO16
#define GPS_TX_PIN 17  // RX do GPS -> GPIO17
#define GPS_BAUD 9600  // Padrão NEO-6M

HardwareSerial gpsSerial(1);
TinyGPSPlus gps;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  
  Serial.println("Recebendo dados do modulo GPS...");
  Serial.println("-------------------------------");
}

void loop() {
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      displayGPSData();
    }
  }
}

void displayGPSData() {
  static unsigned long lastUpdate = 0;
  
  // Atualiza a cada 1 segundo
  if (millis() - lastUpdate >= 2000) {
    lastUpdate = millis();
    
    Serial.println(); // Linha em branco para separar as atualizações
    
    if (gps.location.isValid()) {
      Serial.print("Latitude: ");
      Serial.println(gps.location.lat(), 6);
      
      Serial.print("Longitude: ");
      Serial.println(gps.location.lng(), 6);
    } else {
      Serial.println("Localizacao: Aguardando sinal...");
    }

    if (gps.date.isValid() && gps.time.isValid()) {
      // Ajuste para o horário de Brasília (UTC-3)
      int hora = gps.time.hour() - 3;
      if (hora < 0) hora += 24;
      
      Serial.print("Data/Hora: ");
      Serial.print(gps.date.day());
      Serial.print("/");
      Serial.print(gps.date.month());
      Serial.print("/");
      Serial.print(gps.date.year());
      Serial.print(" ");
      Serial.print(hora);
      Serial.print(":");
      if (gps.time.minute() < 10) Serial.print("0");
      Serial.print(gps.time.minute());
      Serial.print(":");
      if (gps.time.second() < 10) Serial.print("0");
      Serial.println(gps.time.second());
    } else {
      Serial.println("Data/Hora: Aguardando sinal...");
    }
    
    Serial.println("-------------------------------");
  }
}