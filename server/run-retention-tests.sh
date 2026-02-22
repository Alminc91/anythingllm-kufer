#!/bin/bash
# ================================================================
# DSGVO Chat Retention - Automatischer Test Runner
# ================================================================
# Führt alle Retention-Tests automatisch aus
#
# VERWENDUNG:
#   chmod +x run-retention-tests.sh
#   ./run-retention-tests.sh
# ================================================================

set -e  # Stop on error

echo ""
echo "========================================"
echo "DSGVO Chat Retention - Test Suite"
echo "========================================"
echo ""

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ================================================================
# Schritt 1: Test-Daten einfügen
# ================================================================
echo -e "${YELLOW}Schritt 1/4: Test-Daten einfügen...${NC}"
sqlite3 storage/anythingllm.db < test-retention.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test-Daten erfolgreich eingefügt${NC}"
else
    echo -e "${RED}✗ Fehler beim Einfügen der Test-Daten${NC}"
    exit 1
fi

echo ""

# ================================================================
# Schritt 2: Cleanup-Job ausführen
# ================================================================
echo -e "${YELLOW}Schritt 2/4: Cleanup-Job ausführen...${NC}"
node jobs/cleanup-old-embed-chats.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Cleanup-Job erfolgreich ausgeführt${NC}"
else
    echo -e "${RED}✗ Fehler beim Ausführen des Cleanup-Jobs${NC}"
    exit 1
fi

echo ""

# ================================================================
# Schritt 3: Ergebnisse prüfen
# ================================================================
echo -e "${YELLOW}Schritt 3/4: Ergebnisse prüfen...${NC}"
sqlite3 storage/anythingllm.db < test-retention-verify.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Ergebnis-Prüfung abgeschlossen${NC}"
else
    echo -e "${RED}✗ Fehler bei der Ergebnis-Prüfung${NC}"
    exit 1
fi

echo ""

# ================================================================
# Schritt 4: Cleanup (optional)
# ================================================================
echo -e "${YELLOW}Schritt 4/4: Test-Daten aufräumen?${NC}"
read -p "Möchten Sie die Test-Daten jetzt entfernen? (j/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[JjYy]$ ]]; then
    sqlite3 storage/anythingllm.db < test-retention-cleanup.sql
    echo -e "${GREEN}✓ Test-Daten entfernt${NC}"
else
    echo -e "${YELLOW}⚠ Test-Daten NICHT entfernt (Sie können sie manuell mit test-retention-cleanup.sql entfernen)${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ Alle Tests abgeschlossen!${NC}"
echo "========================================"
echo ""
