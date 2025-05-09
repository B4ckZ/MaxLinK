#include <SPI.h>
#include <Ethernet.h>
#include <Settimino.h>

// Définition des broches pour le module Ethernet W5500
#define W5500_CS  15   // GPIO15 - Chip Select pour W5500
#define W5500_RST 13   // GPIO13 - Reset pour W5500

// Définition des broches pour le lecteur de code-barres (si utilisé)
#define BARCODE_RX 12  // GPIO12 (D12)
#define BARCODE_TX 11  // GPIO11 (D11)

// Configuration pour une connexion point à point
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress espIP(192, 168, 0, 10);      // IP pour l'ESP32
IPAddress plcIP(192, 168, 0, 1);       // IP de l'automate Siemens
IPAddress subnet(255, 255, 255, 0);    // Masque de sous-réseau

// Paramètres de communication avec l'automate
#define PLC_RACK    0  // Généralement 0 pour S7-1200/1500
#define PLC_SLOT    1  // Généralement 1 pour S7-1200/1500
#define MAX_DB_NUM  100 // Nombre max de DBs à scanner

// Variables pour la communication avec l'automate
S7Client s7client;
unsigned long lastPLCCheck = 0;
const unsigned long plcCheckInterval = 500;  // Vérifier l'automate chaque 500ms

// Variables pour mémoriser les dernières valeurs
byte lastInputs[128] = {0};       // Entrées (I)
byte lastOutputs[128] = {0};      // Sorties (Q)
byte lastFlags[128] = {0};        // Flags/Merkers (M)
byte lastTimers[64] = {0};        // Timers (T)
byte lastCounters[64] = {0};      // Compteurs (C)
byte* lastDBs[MAX_DB_NUM] = {NULL}; // Blocs de données (DB)
int lastDBSizes[MAX_DB_NUM] = {0};  // Tailles des blocs de données

// Mode de scan
bool scanMode = true;            // Mode scan automatique (true) ou manuel (false)
int currentScanDBNumber = 1;     // DB actuel en cours de scan
bool initialScanComplete = false;// Indique si le scan initial est terminé

// Variables pour les données de scan
unsigned long scanStartTime = 0;
unsigned long totalChanges = 0;
unsigned long sessionStartTime = 0;

// Créez une instance pour la communication série du lecteur de code-barres (si utilisé)
SoftwareSerial barcodeSerial(BARCODE_RX, BARCODE_TX);

void setup() {
  // Initialiser la communication série pour le débogage et l'affichage
  Serial.begin(115200);
  Serial.println("\n\n====================================================");
  Serial.println("         SIEMENS S7 PLC DATA SCANNER");
  Serial.println("====================================================");
  Serial.println("Démarrage du scanner complet pour automate Siemens");
  Serial.println("Connexion directe via W5500");
  
  // Initialiser la communication série pour le lecteur de code-barres (si utilisé)
  barcodeSerial.begin(9600);
  
  // Initialiser la broche de reset pour le W5500
  pinMode(W5500_RST, OUTPUT);
  digitalWrite(W5500_RST, LOW);
  delay(100);
  digitalWrite(W5500_RST, HIGH);
  delay(500);
  
  // Initialiser Ethernet
  Ethernet.init(W5500_CS);
  
  Serial.println("\n[SYSTEM] Démarrage du système - Scanner complet activé");
  
  // Démarrer Ethernet avec IP fixe
  Serial.println("[ETHERNET] Configuration point à point en cours...");
  
  Ethernet.begin(mac, espIP, IPAddress(0, 0, 0, 0), IPAddress(0, 0, 0, 0), subnet);
  
  Serial.print("[ETHERNET] IP de l'ESP32: ");
  Serial.println(Ethernet.localIP());
  
  // Donner du temps à l'interface Ethernet
  delay(1000);
  
  // Essayer de se connecter à l'automate
  connectToPLC();
  
  // Enregistrer l'heure de début de session
  sessionStartTime = millis();
}

void loop() {
  // Vérifier si des données sont disponibles depuis le lecteur de code-barres (si utilisé)
  if (barcodeSerial.available()) {
    String barcode = barcodeSerial.readStringUntil('\n');
    barcode.trim();
    
    if (barcode.length() > 0) {
      Serial.print("[SCANNER] Code-barres détecté: ");
      Serial.println(barcode);
      
      // Commandes spéciales via code-barres
      if (barcode == "SCAN_MODE_AUTO") {
        scanMode = true;
        Serial.println("[CONFIG] Mode scan automatique activé");
      } else if (barcode == "SCAN_MODE_MANUAL") {
        scanMode = false;
        Serial.println("[CONFIG] Mode scan manuel activé");
      } else if (barcode.startsWith("SCAN_DB_")) {
        // Format: SCAN_DB_123 pour scanner DB123
        int dbNum = barcode.substring(8).toInt();
        if (dbNum > 0 && dbNum < MAX_DB_NUM) {
          Serial.print("[CONFIG] Scan forcé du DB");
          Serial.println(dbNum);
          scanSpecificDB(dbNum);
        }
      }
    }
  }
  
  // Vérifier la connexion avec l'automate
  if (millis() - lastPLCCheck > plcCheckInterval) {
    lastPLCCheck = millis();
    
    // Vérifier la connexion Ethernet
    if (Ethernet.linkStatus() == LinkOFF) {
      Serial.println("[ETHERNET] ERREUR: Câble Ethernet déconnecté");
      delay(1000);
      return;
    }
    
    // Si nous sommes connectés à l'automate
    if (s7client.Connected()) {
      if (!initialScanComplete) {
        // Premier scan complet lors de la connexion initiale
        performFullScan();
        initialScanComplete = true;
      } else if (scanMode) {
        // Mode automatique: scanner toutes les zones de mémoire
        scanPLCMemory();
      } else {
        // Mode manuel: scanner le bloc de données courant
        scanNextDB();
      }
      
      // Afficher périodiquement des statistiques
      if (millis() - scanStartTime > 60000) { // Toutes les minutes
        displayStatistics();
        scanStartTime = millis();
      }
    } else {
      Serial.println("[PLC] ERREUR: Non connecté, tentative de reconnexion...");
      connectToPLC();
    }
  }
  
  delay(10);
}

void connectToPLC() {
  Serial.print("[PLC] Connexion à l'automate à l'adresse ");
  Serial.println(ipToString(plcIP));
  
  int result = s7client.ConnectTo(plcIP, PLC_RACK, PLC_SLOT);
  
  if (result == 0) {
    Serial.println("[PLC] Connecté avec succès à l'automate");
    
    // Lire les informations sur l'automate
    TS7CpuInfo cpuInfo;
    if (s7client.GetCpuInfo(&cpuInfo) == 0) {
      Serial.print("[PLC] Type CPU: ");
      Serial.println(cpuInfo.ModuleTypeName);
      
      Serial.print("[PLC] Version firmware: ");
      Serial.print(cpuInfo.FWVersion.V1);
      Serial.print(".");
      Serial.println(cpuInfo.FWVersion.V2);
      
      Serial.print("[PLC] Numéro de série: ");
      Serial.println(cpuInfo.SerialNumber);
    }
    
    // Lire l'état de l'automate
    int plcStatus;
    if (s7client.GetPlcStatus(&plcStatus) == 0) {
      Serial.print("[PLC] État de l'automate: ");
      switch (plcStatus) {
        case S7CpuStatusRun:  Serial.println("RUN"); break;
        case S7CpuStatusStop: Serial.println("STOP"); break;
        default:              Serial.println("INCONNU"); break;
      }
    }
    
    // Réinitialiser le scan
    initialScanComplete = false;
    currentScanDBNumber = 1;
  } else {
    Serial.print("[PLC] ERREUR: Échec de connexion à l'automate, code: ");
    Serial.println(result);
  }
}

void performFullScan() {
  Serial.println("\n[SCAN] Démarrage du scan initial complet de l'automate...");
  
  // Scan des entrées (I)
  byte inputs[128];
  if (s7client.EBRead(0, sizeof(inputs), inputs) == 0) {
    memcpy(lastInputs, inputs, sizeof(inputs));
    Serial.println("[SCAN] Entrées (I) initialisées");
    
    // Afficher les entrées actives
    for (int byteIndex = 0; byteIndex < sizeof(inputs); byteIndex++) {
      if (inputs[byteIndex] != 0) {
        Serial.print("[I] Octet I");
        Serial.print(byteIndex);
        Serial.print(" = 0x");
        if (inputs[byteIndex] < 16) Serial.print("0"); // Afficher les zéros de tête
        Serial.println(inputs[byteIndex], HEX);
        
        // Afficher les bits individuels
        for (int bitIndex = 0; bitIndex < 8; bitIndex++) {
          if (inputs[byteIndex] & (1 << bitIndex)) {
            Serial.print("    I");
            Serial.print(byteIndex);
            Serial.print(".");
            Serial.print(bitIndex);
            Serial.println(" = 1");
          }
        }
      }
    }
  } else {
    Serial.println("[SCAN] Échec de lecture des entrées");
  }
  
  // Scan des sorties (Q)
  byte outputs[128];
  if (s7client.ABRead(0, sizeof(outputs), outputs) == 0) {
    memcpy(lastOutputs, outputs, sizeof(outputs));
    Serial.println("[SCAN] Sorties (Q) initialisées");
    
    // Afficher les sorties actives
    for (int byteIndex = 0; byteIndex < sizeof(outputs); byteIndex++) {
      if (outputs[byteIndex] != 0) {
        Serial.print("[Q] Octet Q");
        Serial.print(byteIndex);
        Serial.print(" = 0x");
        if (outputs[byteIndex] < 16) Serial.print("0");
        Serial.println(outputs[byteIndex], HEX);
        
        // Afficher les bits individuels
        for (int bitIndex = 0; bitIndex < 8; bitIndex++) {
          if (outputs[byteIndex] & (1 << bitIndex)) {
            Serial.print("    Q");
            Serial.print(byteIndex);
            Serial.print(".");
            Serial.print(bitIndex);
            Serial.println(" = 1");
          }
        }
      }
    }
  } else {
    Serial.println("[SCAN] Échec de lecture des sorties");
  }
  
  // Scan des marqueurs/flags (M)
  byte flags[128];
  if (s7client.MBRead(0, sizeof(flags), flags) == 0) {
    memcpy(lastFlags, flags, sizeof(flags));
    Serial.println("[SCAN] Marqueurs (M) initialisés");
    
    // Afficher les marqueurs actifs
    for (int byteIndex = 0; byteIndex < sizeof(flags); byteIndex++) {
      if (flags[byteIndex] != 0) {
        Serial.print("[M] Octet M");
        Serial.print(byteIndex);
        Serial.print(" = 0x");
        if (flags[byteIndex] < 16) Serial.print("0");
        Serial.println(flags[byteIndex], HEX);
      }
    }
  } else {
    Serial.println("[SCAN] Échec de lecture des marqueurs");
  }
  
  // Initialiser les blocs de données - recherche des DBs existants
  Serial.println("[SCAN] Recherche des blocs de données existants...");
  
  int dbFoundCount = 0;
  
  for (int dbNum = 1; dbNum < MAX_DB_NUM; dbNum++) {
    // Vérifier si le DB existe en essayant de lire sa taille
    TS7BlockInfo blockInfo;
    int result = s7client.GetAgBlockInfo(S7BlockType::Block_DB, dbNum, &blockInfo);
    
    if (result == 0) {
      int size = blockInfo.MC7Size;
      if (size > 0) {
        dbFoundCount++;
        
        Serial.print("[SCAN] DB");
        Serial.print(dbNum);
        Serial.print(" trouvé, taille: ");
        Serial.print(size);
        Serial.println(" octets");
        
        // Le DB existe, allouer de la mémoire et lire les données
        if (lastDBs[dbNum] != NULL) {
          free(lastDBs[dbNum]);
        }
        
        lastDBs[dbNum] = (byte*)malloc(size);
        lastDBSizes[dbNum] = size;
        
        if (lastDBs[dbNum] != NULL) {
          if (s7client.DBRead(dbNum, 0, size, lastDBs[dbNum]) == 0) {
            // Afficher un aperçu des données (seulement les 16 premiers octets)
            int previewSize = min(16, size);
            Serial.print("    Aperçu des données: ");
            for (int i = 0; i < previewSize; i++) {
              if (lastDBs[dbNum][i] < 16) Serial.print("0");
              Serial.print(lastDBs[dbNum][i], HEX);
              Serial.print(" ");
            }
            if (size > previewSize) Serial.print("...");
            Serial.println();
          } else {
            Serial.println("    Échec de lecture des données");
          }
        } else {
          Serial.println("    Échec d'allocation mémoire");
        }
      }
    }
  }
  
  Serial.print("[SCAN] Scan initial terminé. ");
  Serial.print(dbFoundCount);
  Serial.println(" blocs de données trouvés.");
  Serial.println("====================================================");
  Serial.println("Scanner prêt - Surveillance des changements en cours");
  Serial.println("====================================================\n");
  
  // Initialiser le temps de départ pour les statistiques
  scanStartTime = millis();
}

void scanPLCMemory() {
  // Scan des entrées (I)
  byte inputs[128];
  if (s7client.EBRead(0, sizeof(inputs), inputs) == 0) {
    checkForChanges("I", inputs, lastInputs, sizeof(inputs));
  }
  
  // Scan des sorties (Q)
  byte outputs[128];
  if (s7client.ABRead(0, sizeof(outputs), outputs) == 0) {
    checkForChanges("Q", outputs, lastOutputs, sizeof(outputs));
  }
  
  // Scan des marqueurs/flags (M)
  byte flags[128];
  if (s7client.MBRead(0, sizeof(flags), flags) == 0) {
    checkForChanges("M", flags, lastFlags, sizeof(flags));
  }
  
  // Scan du prochain DB
  scanNextDB();
}

void scanNextDB() {
  // Passer au prochain DB
  currentScanDBNumber++;
  if (currentScanDBNumber >= MAX_DB_NUM) {
    currentScanDBNumber = 1;
  }
  
  // Vérifier si ce DB a été initialisé
  if (lastDBs[currentScanDBNumber] != NULL && lastDBSizes[currentScanDBNumber] > 0) {
    scanSpecificDB(currentScanDBNumber);
  }
}

void scanSpecificDB(int dbNum) {
  if (dbNum < 1 || dbNum >= MAX_DB_NUM) return;
  
  // Si ce DB n'a pas encore été initialisé, vérifier s'il existe
  if (lastDBs[dbNum] == NULL) {
    TS7BlockInfo blockInfo;
    int result = s7client.GetAgBlockInfo(S7BlockType::Block_DB, dbNum, &blockInfo);
    
    if (result == 0) {
      int size = blockInfo.MC7Size;
      if (size > 0) {
        lastDBs[dbNum] = (byte*)malloc(size);
        lastDBSizes[dbNum] = size;
        
        if (lastDBs[dbNum] != NULL) {
          // Initialiser avec des zéros
          memset(lastDBs[dbNum], 0, size);
          
          Serial.print("[DB] Nouveau DB");
          Serial.print(dbNum);
          Serial.print(" découvert, taille: ");
          Serial.print(size);
          Serial.println(" octets");
        }
      } else {
        return; // DB existe mais taille nulle
      }
    } else {
      return; // DB n'existe pas
    }
  }
  
  // Lire le contenu du DB
  int size = lastDBSizes[dbNum];
  byte* newData = (byte*)malloc(size);
  
  if (newData != NULL) {
    int result = s7client.DBRead(dbNum, 0, size, newData);
    
    if (result == 0) {
      // Vérifier les changements
      checkForChangesInDB(dbNum, newData, lastDBs[dbNum], size);
    } else {
      // Uniquement afficher une erreur si le DB était valide auparavant
      // (évite les messages d'erreur constants pour des DBs non existants)
      if (lastDBs[dbNum] != NULL) {
        Serial.print("[DB] Erreur lecture DB");
        Serial.print(dbNum);
        Serial.print(": ");
        Serial.println(result);
      }
    }
    
    free(newData);
  }
}

void checkForChanges(const String &prefix, byte *newData, byte *oldData, int length) {
  bool anyChanges = false;
  
  for (int byteIndex = 0; byteIndex < length; byteIndex++) {
    if (newData[byteIndex] != oldData[byteIndex]) {
      // Trouver quels bits ont changé
      byte changedBits = newData[byteIndex] ^ oldData[byteIndex];
      
      for (int bitIndex = 0; bitIndex < 8; bitIndex++) {
        if (changedBits & (1 << bitIndex)) {
          // Ce bit a changé
          bool newState = (newData[byteIndex] & (1 << bitIndex)) != 0;
          bool oldState = (oldData[byteIndex] & (1 << bitIndex)) != 0;
          
          // Créer la description de l'adresse (ex: "I0.1" ou "Q2.3")
          String address = prefix + String(byteIndex) + "." + String(bitIndex);
          
          // Afficher le changement
          Serial.print("[");
          Serial.print(getTimeString());
          Serial.print("] ");
          Serial.print(address);
          Serial.print(" : ");
          Serial.print(oldState ? "1" : "0");
          Serial.print(" -> ");
          Serial.println(newState ? "1" : "0");
          
          anyChanges = true;
          totalChanges++;
        }
      }
    }
  }
  
  // Mettre à jour les anciennes valeurs
  memcpy(oldData, newData, length);
}

void checkForChangesInDB(int dbNum, byte *newData, byte *oldData, int length) {
  bool anyChanges = false;
  int changesCount = 0;
  
  // Vérifier les changements octet par octet
  for (int byteIndex = 0; byteIndex < length; byteIndex++) {
    if (newData[byteIndex] != oldData[byteIndex]) {
      changesCount++;
      
      // Formater l'adresse comme DB1.DBB2
      String address = "DB" + String(dbNum) + ".DBB" + String(byteIndex);
      
      // Afficher le changement avec l'heure
      Serial.print("[");
      Serial.print(getTimeString());
      Serial.print("] ");
      Serial.print(address);
      Serial.print(" : 0x");
      if (oldData[byteIndex] < 16) Serial.print("0");
      Serial.print(oldData[byteIndex], HEX);
      Serial.print(" -> 0x");
      if (newData[byteIndex] < 16) Serial.print("0");
      Serial.println(newData[byteIndex], HEX);
      
      // Limiter le nombre de changements affichés pour éviter de submerger le terminal
      if (changesCount >= 20) {
        Serial.print("[");
        Serial.print(getTimeString());
        Serial.print("] DB");
        Serial.print(dbNum);
        Serial.print(": ");
        Serial.print(changesCount);
        Serial.println(" changements ou plus détectés");
        break;
      }
      
      anyChanges = true;
      totalChanges++;
    }
  }
  
  // Si des changements ont été trouvés mais tronqués, afficher un résumé
  if (changesCount > 20) {
    Serial.print("[");
    Serial.print(getTimeString());
    Serial.print("] DB");
    Serial.print(dbNum);
    Serial.print(": trop de changements pour affichage complet (");
    Serial.print(changesCount);
    Serial.println(" changements)");
  }
  
  // Mettre à jour les anciennes valeurs
  memcpy(oldData, newData, length);
}

void displayStatistics() {
  unsigned long currentTime = millis();
  unsigned long runningTimeSeconds = (currentTime - sessionStartTime) / 1000;
  
  Serial.println("\n====================================================");
  Serial.println("                STATISTIQUES SCAN");
  Serial.println("====================================================");
  Serial.print("Temps d'exécution: ");
  
  // Formater le temps d'exécution
  unsigned long hours = runningTimeSeconds / 3600;
  unsigned long minutes = (runningTimeSeconds % 3600) / 60;
  unsigned long seconds = runningTimeSeconds % 60;
  
  if (hours > 0) {
    Serial.print(hours);
    Serial.print("h ");
  }
  
  if (hours > 0 || minutes > 0) {
    Serial.print(minutes);
    Serial.print("m ");
  }
  
  Serial.print(seconds);
  Serial.println("s");
  
  Serial.print("Changements détectés: ");
  Serial.println(totalChanges);
  
  // Calculer le nombre de blocs de données actifs
  int activeDBCount = 0;
  for (int i = 0; i < MAX_DB_NUM; i++) {
    if (lastDBs[i] != NULL) {
      activeDBCount++;
    }
  }
  
  Serial.print("Blocs de données actifs: ");
  Serial.println(activeDBCount);
  
  // Taux de changement par minute
  float changesPerMinute = (float)totalChanges / (runningTimeSeconds / 60.0);
  Serial.print("Taux de changements: ");
  Serial.print(changesPerMinute, 2);
  Serial.println(" par minute");
  
  Serial.println("====================================================\n");
}

String getTimeString() {
  // Générer un format d'horodatage simple basé sur millis()
  unsigned long ms = millis();
  unsigned long seconds = ms / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  
  // Formater comme HH:MM:SS
  char timeStr[9];
  sprintf(timeStr, "%02lu:%02lu:%02lu", hours % 24, minutes % 60, seconds % 60);
  return String(timeStr);
}

String ipToString(IPAddress ip) {
  return String(ip[0]) + "." + String(ip[1]) + "." + String(ip[2]) + "." + String(ip[3]);
}