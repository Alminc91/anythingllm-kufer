# AnythingLLM Role-Based Access Control (RBAC) Upgrade Path

## Current State (v2.2)

| Role | Use AI | View Embed Chats | View All Workspace Chats | Modify Settings | Create Users |
|------|--------|------------------|-------------------------|-----------------|--------------|
| **Default** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Manager** | ✅ | ✅ | ✅ | ✅ | ✅ (default/manager only) |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ (all roles) |

### Typical Client Setup (v2.2)
- **Most clients**: 1 default user account
- **Advanced clients**: Manager role (on request, with awareness of risks)
- **Admin**: Reserved for us (technical management)

### What Each Role Can Do (v2.2)

**Default:**
- Use AI chat in assigned workspaces
- View embed widget configurations (read-only)
- View embed chat history (website visitor conversations)
- View all workspace chat history (quality control)
- Cannot change any settings
- Cannot create users

**Manager:**
- Everything default can do
- Modify workspace settings (except messagesLimit)
- Create/delete default and manager users
- Cannot create workspaces
- Cannot modify messagesLimit (billing protection)

**Admin (us):**
- Full access
- Create workspaces
- Modify messagesLimit
- All settings

---

## Future State (v2.3+) - When Clients Need Private AI Users

**Trigger**: A client says "I need staff to use AI internally, but they shouldn't see each other's chats or customer data"

### New Role Structure

| Role | Use AI | View Own Chats | View All Chats | View Embed Chats | Modify Settings | Create Users |
|------|--------|----------------|----------------|------------------|-----------------|--------------|
| **Basic** (new) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Default** → renamed **Supervisor** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (basic only) |
| **Manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (basic/supervisor) |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (all) |

### Role Descriptions (Future)

**Basic (new role):**
- Internal AI users (staff members)
- Only see their own conversations
- No access to embed/customer data
- No settings access
- Pure AI consumer role

**Supervisor (renamed from Default):**
- Quality control role
- See all chats for oversight
- Can create/manage basic users
- Cannot modify workspace settings
- Ideal for: team leads, QA staff

**Manager:**
- Full customization access
- Can modify workspace settings
- Can create supervisors and basic users
- For: advanced clients who understand the risks

**Admin:**
- Reserved for us
- Workspace creation
- Billing (messagesLimit) control

---

## Upgrade Process

### When to Upgrade
- Client specifically requests private AI access for multiple staff
- Client has 5+ users who need individual accounts
- Privacy/compliance requirements demand chat separation

### How to Upgrade (No Account Migration Needed!)

1. **Update code** to:
   - Add "basic" role to middleware
   - Rename "default" to "supervisor" in UI (database value stays "default")
   - Allow "default" role to create "basic" users
   - Restrict "basic" role from viewing all chats

2. **Build new Docker image** (v2.3)

3. **Pull and restart** client containers

4. **Existing "default" users automatically become supervisors** - no database changes!

### Why This Works
- Role is stored as string in database: `user.role = "default"`
- Code defines what each role string can do
- Changing code = changing permissions for all existing users with that role
- UI label can differ from database value

---

## Example Client Scenarios

### Scenario 1: Basic Client (90% of clients)
**Setup**: 1 default user
**Permissions**: See everything, modify nothing
**Upgrade needed**: No

### Scenario 2: School with AI for Teachers (Future)
**Setup**:
- 1 supervisor (was default) - school admin
- 12 basic users - teachers

**Permissions**:
- Supervisor: Creates teacher accounts, monitors all chats for quality
- Teachers: Use AI privately, only see own chats

**Upgrade needed**: Yes (v2.3)

### Scenario 3: Advanced Client Wants Full Control
**Setup**: 1 manager user
**Permissions**: Full settings access, user management
**Upgrade needed**: No (already available)

---

## Security Notes

- **messagesLimit**: Always admin-only (billing protection)
- **Workspace creation**: Always admin-only (billing protection)
- **Password requirements**: 12+ chars, uppercase, lowercase, number (env configured)
- **Role hierarchy**: basic < supervisor/default < manager < admin

---

## Quick Reference: Database Role Values

| Database Value | Current Name (v2.2) | Future Name (v2.3+) |
|----------------|---------------------|---------------------|
| `default` | Default | Supervisor |
| `manager` | Manager | Manager |
| `admin` | Admin | Admin |
| `basic` | (doesn't exist) | Basic |

The database value for existing users never changes - only what that value means in code.
