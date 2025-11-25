# AnythingLLM Development Guide

## Fast Embed Widget Development (No Docker Rebuild)

### Setup Volume Mount
Add this line to your `docker/docker-compose.yml` volumes section:
```yaml
volumes:
  - "../frontend/public/embed:/app/frontend/public/embed"  # Fast dev: mount embed files
```

### Development Cycle
With the volume mount, your development cycle becomes:

1. **Make embed changes** (components, settings, styling, etc.)
   ```bash
   cd /home/srvadmin/KI_Apps_Pipelines/Apps/anythingllm-embed
   # Edit files in src/
   ```

2. **Build & publish embed widget**
   ```bash
   npm run build:publish
   ```

3. **Restart container** (picks up new files immediately)
   ```bash
   cd /home/srvadmin/KI_Apps_Pipelines/Apps/anything-llm/docker
   docker-compose down && docker-compose up -d
   ```

4. **Test immediately** - No image rebuild needed!

### Benefits
✅ **Instant testing** - Changes are live without rebuilding
✅ **Fast iteration** - Edit → Build → Restart → Test
✅ **Production-ready** - When ready, rebuild image and remove volume mount

### Production Deployment
When ready for production:

1. **Remove volume mount** from docker-compose.yml
2. **Rebuild image** with changes baked in:
   ```bash
   docker build -f docker/Dockerfile -t kufer/anythingllm-kufer:VERSION .
   ```

## Testing Different Configurations

### Test Bubble Positioning
- **Right positioning**: Set `data-position="bottom-right"` (bubbles point left)
- **Left positioning**: Set `data-position="bottom-left"` (bubbles point right)

### Test German Defaults
Burger menu items automatically show German text with English fallbacks:
- **German**: "Chat zurücksetzen", "E-Mail Support", "Sitzungs-ID"
- **English fallback**: "Reset Chat", "Email Support", "Session ID"

### Test Website Clickability
- **Before**: Website blocked when chat open (full-screen overlay)
- **After**: Website remains clickable when chat open