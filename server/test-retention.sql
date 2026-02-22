-- ================================================================
-- DSGVO Chat Retention Test Script
-- ================================================================
-- Dieses Script testet die automatische Löschung nach Retention-Periode
-- OHNE 7/30/90 Tage warten zu müssen!
--
-- VERWENDUNG:
-- 1. cd anythingllm-kufer/server
-- 2. sqlite3 storage/anythingllm.db < test-retention.sql
-- 3. node jobs/cleanup-old-embed-chats.js
-- 4. Ergebnis prüfen (siehe unten)
-- ================================================================

-- ================================================================
-- SETUP: Test-Daten erstellen
-- ================================================================

-- Test 1: 7-Tage-Retention
-- ----------------------------------------------------------------
-- Embed mit 7-Tage-Retention (falls noch nicht vorhanden)
UPDATE embed_configs SET chat_retention_days = 7 WHERE id = 1;

-- Alter Chat (10 Tage alt) - SOLL GELÖSCHT WERDEN
INSERT INTO embed_chats (prompt, response, session_id, embed_id, include, createdAt)
VALUES (
  'TEST: Alter Chat (10 Tage)',
  '{"text":"Sollte gelöscht werden bei 7-Tage-Retention"}',
  'test-session-old-7d',
  1,
  1,
  datetime('now', '-10 days')
);

-- Neuer Chat (5 Tage alt) - SOLL BLEIBEN
INSERT INTO embed_chats (prompt, response, session_id, embed_id, include, createdAt)
VALUES (
  'TEST: Neuer Chat (5 Tage)',
  '{"text":"Sollte bleiben bei 7-Tage-Retention"}',
  'test-session-new-7d',
  1,
  1,
  datetime('now', '-5 days')
);

-- Test 2: 30-Tage-Retention
-- ----------------------------------------------------------------
-- Embed mit 30-Tage-Retention
UPDATE embed_configs SET chat_retention_days = 30 WHERE id = 2;

-- Alter Chat (40 Tage alt) - SOLL GELÖSCHT WERDEN
INSERT INTO embed_chats (prompt, response, session_id, embed_id, include, createdAt)
VALUES (
  'TEST: Alter Chat (40 Tage)',
  '{"text":"Sollte gelöscht werden bei 30-Tage-Retention"}',
  'test-session-old-30d',
  2,
  1,
  datetime('now', '-40 days')
);

-- Neuer Chat (20 Tage alt) - SOLL BLEIBEN
INSERT INTO embed_chats (prompt, response, session_id, embed_id, include, createdAt)
VALUES (
  'TEST: Neuer Chat (20 Tage)',
  '{"text":"Sollte bleiben bei 30-Tage-Retention"}',
  'test-session-new-30d',
  2,
  1,
  datetime('now', '-20 days')
);

-- Test 3: 90-Tage-Retention
-- ----------------------------------------------------------------
-- Embed mit 90-Tage-Retention
UPDATE embed_configs SET chat_retention_days = 90 WHERE id = 3;

-- Alter Chat (100 Tage alt) - SOLL GELÖSCHT WERDEN
INSERT INTO embed_chats (prompt, response, session_id, embed_id, include, createdAt)
VALUES (
  'TEST: Alter Chat (100 Tage)',
  '{"text":"Sollte gelöscht werden bei 90-Tage-Retention"}',
  'test-session-old-90d',
  3,
  1,
  datetime('now', '-100 days')
);

-- Neuer Chat (60 Tage alt) - SOLL BLEIBEN
INSERT INTO embed_chats (prompt, response, session_id, embed_id, include, createdAt)
VALUES (
  'TEST: Neuer Chat (60 Tage)',
  '{"text":"Sollte bleiben bei 90-Tage-Retention"}',
  'test-session-new-90d',
  3,
  1,
  datetime('now', '-60 days')
);

-- Test 4: Unbegrenzt (null) - KEINE LÖSCHUNG
-- ----------------------------------------------------------------
-- Embed ohne Retention (null)
UPDATE embed_configs SET chat_retention_days = NULL WHERE id = 4;

-- Sehr alter Chat (365 Tage) - SOLL BLEIBEN (weil unbegrenzt)
INSERT INTO embed_chats (prompt, response, session_id, embed_id, include, createdAt)
VALUES (
  'TEST: Sehr alter Chat (365 Tage)',
  '{"text":"Sollte NICHT gelöscht werden (unbegrenzt)"}',
  'test-session-unlimited',
  4,
  1,
  datetime('now', '-365 days')
);

-- ================================================================
-- STATUS VOR CLEANUP
-- ================================================================
.print ''
.print '========================================'
.print 'STATUS VOR CLEANUP:'
.print '========================================'
.print ''

.print 'Embed #1 (7 Tage Retention):'
SELECT COUNT(*) as 'Chats (erwartet: 2)' FROM embed_chats WHERE embed_id = 1 AND session_id LIKE 'test-session%';

.print ''
.print 'Embed #2 (30 Tage Retention):'
SELECT COUNT(*) as 'Chats (erwartet: 2)' FROM embed_chats WHERE embed_id = 2 AND session_id LIKE 'test-session%';

.print ''
.print 'Embed #3 (90 Tage Retention):'
SELECT COUNT(*) as 'Chats (erwartet: 2)' FROM embed_chats WHERE embed_id = 3 AND session_id LIKE 'test-session%';

.print ''
.print 'Embed #4 (Unbegrenzt):'
SELECT COUNT(*) as 'Chats (erwartet: 1)' FROM embed_chats WHERE embed_id = 4 AND session_id LIKE 'test-session%';

.print ''
.print '========================================'
.print 'NÄCHSTER SCHRITT:'
.print '========================================'
.print 'Führen Sie jetzt aus:'
.print '  node jobs/cleanup-old-embed-chats.js'
.print ''
.print 'Dann prüfen Sie das Ergebnis:'
.print '  sqlite3 storage/anythingllm.db < test-retention-verify.sql'
.print '========================================'
.print ''
