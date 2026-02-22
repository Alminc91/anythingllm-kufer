-- ================================================================
-- DSGVO Chat Retention Test - VERIFICATION
-- ================================================================
-- Dieses Script prüft ob die Löschung korrekt funktioniert hat
--
-- VERWENDUNG:
-- 1. NACHDEM Sie "node jobs/cleanup-old-embed-chats.js" ausgeführt haben
-- 2. sqlite3 storage/anythingllm.db < test-retention-verify.sql
-- ================================================================

.print ''
.print '========================================'
.print 'TEST RESULTS NACH CLEANUP:'
.print '========================================'
.print ''

-- ================================================================
-- Test 1: 7-Tage-Retention
-- ================================================================
.print '✓ Test 1: 7-Tage-Retention (Embed #1)'
.print '  Erwartung: 1 Chat (5-Tage-Chat bleibt, 10-Tage-Chat gelöscht)'

SELECT
  COUNT(*) as actual_count,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASSED'
    ELSE '❌ FAILED'
  END as result
FROM embed_chats
WHERE embed_id = 1 AND session_id LIKE 'test-session%';

.print ''
.print '  Details:'
SELECT
  prompt,
  DATE(createdAt) as created_date,
  ROUND(julianday('now') - julianday(createdAt)) as age_days
FROM embed_chats
WHERE embed_id = 1 AND session_id LIKE 'test-session%';

-- ================================================================
-- Test 2: 30-Tage-Retention
-- ================================================================
.print ''
.print '✓ Test 2: 30-Tage-Retention (Embed #2)'
.print '  Erwartung: 1 Chat (20-Tage-Chat bleibt, 40-Tage-Chat gelöscht)'

SELECT
  COUNT(*) as actual_count,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASSED'
    ELSE '❌ FAILED'
  END as result
FROM embed_chats
WHERE embed_id = 2 AND session_id LIKE 'test-session%';

.print ''
.print '  Details:'
SELECT
  prompt,
  DATE(createdAt) as created_date,
  ROUND(julianday('now') - julianday(createdAt)) as age_days
FROM embed_chats
WHERE embed_id = 2 AND session_id LIKE 'test-session%';

-- ================================================================
-- Test 3: 90-Tage-Retention
-- ================================================================
.print ''
.print '✓ Test 3: 90-Tage-Retention (Embed #3)'
.print '  Erwartung: 1 Chat (60-Tage-Chat bleibt, 100-Tage-Chat gelöscht)'

SELECT
  COUNT(*) as actual_count,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASSED'
    ELSE '❌ FAILED'
  END as result
FROM embed_chats
WHERE embed_id = 3 AND session_id LIKE 'test-session%';

.print ''
.print '  Details:'
SELECT
  prompt,
  DATE(createdAt) as created_date,
  ROUND(julianday('now') - julianday(createdAt)) as age_days
FROM embed_chats
WHERE embed_id = 3 AND session_id LIKE 'test-session%';

-- ================================================================
-- Test 4: Unbegrenzt (null)
-- ================================================================
.print ''
.print '✓ Test 4: Unbegrenzt/NULL (Embed #4)'
.print '  Erwartung: 1 Chat (365-Tage-Chat bleibt, trotz Alter!)'

SELECT
  COUNT(*) as actual_count,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASSED'
    ELSE '❌ FAILED'
  END as result
FROM embed_chats
WHERE embed_id = 4 AND session_id LIKE 'test-session%';

.print ''
.print '  Details:'
SELECT
  prompt,
  DATE(createdAt) as created_date,
  ROUND(julianday('now') - julianday(createdAt)) as age_days
FROM embed_chats
WHERE embed_id = 4 AND session_id LIKE 'test-session%';

-- ================================================================
-- Event Logs prüfen
-- ================================================================
.print ''
.print '========================================'
.print 'EVENT LOGS:'
.print '========================================'
.print '(Sollte 3 Einträge zeigen: embed_chats_auto_deleted)'
.print ''

SELECT
  event,
  json_extract(metadata, '$.embedId') as embed_id,
  json_extract(metadata, '$.deletedCount') as deleted_count,
  json_extract(metadata, '$.retentionDays') as retention_days,
  datetime(occurredAt, 'localtime') as occurred_at
FROM event_logs
WHERE event = 'embed_chats_auto_deleted'
ORDER BY occurredAt DESC
LIMIT 10;

-- ================================================================
-- ZUSAMMENFASSUNG
-- ================================================================
.print ''
.print '========================================'
.print 'ZUSAMMENFASSUNG:'
.print '========================================'

SELECT
  'Total Tests' as metric,
  4 as value
UNION ALL
SELECT
  'Expected Deletions' as metric,
  3 as value  -- (10d, 40d, 100d Chats)
UNION ALL
SELECT
  'Expected Remaining' as metric,
  4 as value  -- (5d, 20d, 60d, 365d Chats)
UNION ALL
SELECT
  'Actual Deletions' as metric,
  (
    SELECT COALESCE(SUM(CAST(json_extract(metadata, '$.deletedCount') AS INTEGER)), 0)
    FROM event_logs
    WHERE event = 'embed_chats_auto_deleted'
    AND occurredAt > datetime('now', '-1 minute')
  ) as value
UNION ALL
SELECT
  'Actual Remaining' as metric,
  (
    SELECT COUNT(*)
    FROM embed_chats
    WHERE session_id LIKE 'test-session%'
  ) as value;

.print ''
.print '========================================'
.print 'CLEANUP (Test-Daten entfernen):'
.print '========================================'
.print 'Um Test-Daten zu löschen, führen Sie aus:'
.print '  sqlite3 storage/anythingllm.db < test-retention-cleanup.sql'
.print '========================================'
.print ''
