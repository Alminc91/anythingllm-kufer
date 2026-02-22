-- ================================================================
-- DSGVO Chat Retention Test - CLEANUP
-- ================================================================
-- Entfernt alle Test-Daten nach dem Test
--
-- VERWENDUNG:
-- sqlite3 storage/anythingllm.db < test-retention-cleanup.sql
-- ================================================================

.print ''
.print '========================================'
.print 'CLEANUP: Test-Daten entfernen...'
.print '========================================'
.print ''

-- Test-Chats löschen
DELETE FROM embed_chats WHERE session_id LIKE 'test-session%';

.print '✓ Test-Chats gelöscht'

-- Test Event-Logs löschen (optional)
DELETE FROM event_logs
WHERE event = 'embed_chats_auto_deleted'
AND occurredAt > datetime('now', '-1 hour');

.print '✓ Test Event-Logs gelöscht'

-- Retention-Werte zurücksetzen (optional, nur wenn Sie die Werte geändert haben)
-- UPDATE embed_configs SET chat_retention_days = NULL WHERE id IN (1,2,3,4);

.print ''
.print '✅ Cleanup abgeschlossen!'
.print ''
