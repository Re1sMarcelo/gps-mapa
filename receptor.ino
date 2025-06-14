#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>

// Configurações LoRa (DEVEM SER IGUAIS AO TRANSMISSOR)
#define LORA_SS 18
#define LORA_RST 23
#define LORA_DIO0 26
#define LORA_FREQUENCY 915E6
#define LORA_SPREADING_FACTOR 7
#define LORA_BANDWIDTH 125E3

// WiFi
const char* ssid = "Athayde";
const char* password = "jkm220479";

// Servidor Node.js
const char* serverURL = "http://192.168.0.108:3000/api/localizacoes";

// Variáveis para controle de conexão
unsigned long lastWifiAttempt = 0;
const long wifiReconnectInterval = 10000; // 10 segundos

void setup() {
  Serial.begin(115200);
  while (!Serial); // Aguarda porta serial estar pronta

  initLoRa();
  connectToWiFi();
}

void loop() {
  // Verifica e mantém conexão WiFi
  if (WiFi.status() != WL_CONNECTED && 
      millis() - lastWifiAttempt > wifiReconnectInterval) {
    connectToWiFi();
  }

  // Processa pacotes LoRa
  processLoRaPackets();
  
  delay(100); // Pequeno delay para evitar sobrecarga
}

void initLoRa() {
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("Falha ao iniciar LoRa!");
    while (1);
  }
  
  // Configura parâmetros idênticos ao transmissor
  LoRa.setSpreadingFactor(LORA_SPREADING_FACTOR);
  LoRa.setSignalBandwidth(LORA_BANDWIDTH);
  
  Serial.println("LoRa inicializado com sucesso!");
}

void connectToWiFi() {
  Serial.println("\nConectando ao WiFi...");
  WiFi.disconnect();
  WiFi.begin(ssid, password);
  
  lastWifiAttempt = millis();
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado!");
    Serial.print("Endereço IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFalha na conexão WiFi!");
  }
}

void processLoRaPackets() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    Serial.println("\n--- Pacote LoRa Recebido ---");
    Serial.print("Tamanho: ");
    Serial.print(packetSize);
    Serial.println(" bytes");
    Serial.print("RSSI: ");
    Serial.print(LoRa.packetRssi());
    Serial.println(" dBm");
    
    // Lê os dados
    String dados = "";
    while (LoRa.available()) {
      dados += (char)LoRa.read();
    }
    
    Serial.print("Dados brutos: ");
    Serial.println(dados);

    // Processa os dados
    if (dados == "NO_FIX;NO_FIX") {
      Serial.println("[GPS] Sem sinal válido");
      return;
    }

    int separatorIndex = dados.indexOf(';');
    if (separatorIndex == -1) {
      Serial.println("Formato inválido - separador ';' não encontrado");
      return;
    }
    
    String latitude = dados.substring(0, separatorIndex);
    String longitude = dados.substring(separatorIndex + 1);

    // Valida coordenadas
    if (!isValidCoordinate(latitude.toFloat()) || !isValidCoordinate(longitude.toFloat())) {
      Serial.println("Coordenadas inválidas recebidas");
      return;
    }

    Serial.print("Latitude: ");
    Serial.println(latitude);
    Serial.print("Longitude: ");
    Serial.println(longitude);

    // Envia para o servidor
    sendToServer(latitude, longitude);
  }
}

bool isValidCoordinate(float coord) {
  // Verifica se a coordenada está dentro de limites geográficos plausíveis
  return (coord >= -90 && coord <= 90); // Para latitude, longitude seria -180 a 180
}

void sendToServer(String latitude, String longitude) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado - não foi possível enviar dados");
    return;
  }

  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  String postData = "latitude=" + latitude + "&longitude=" + longitude;
  
  Serial.println("Enviando para o servidor...");
  int httpResponseCode = http.POST(postData);
  
  if (httpResponseCode > 0) {
    Serial.print("Código de resposta HTTP: ");
    Serial.println(httpResponseCode);
    Serial.print("Resposta: ");
    Serial.println(http.getString());
  } else {
    Serial.print("Erro no HTTP POST: ");
    Serial.println(httpResponseCode);
    Serial.print("Mensagem: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
}