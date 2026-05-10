# Toast Notification System Audit

## Overview
Your application uses a **dual notification system**:
1. **Frontend**: Sonner toast library for transient UI notifications
2. **Backend**: Socket.IO-based real-time notifications with database persistence

---

## Frontend Toast System (Sonner)

### Configuration Files

#### 1. **`src/components/ui/sonner.tsx`** - Toast Component Wrapper
- **Library**: Sonner (toast notification library)
- **Theme**: Respects system theme (light/dark/system) via `next-themes`
- **Position**: Bottom-left
- **Styling**: Uses CSS variables for theming
  - `--normal-bg`: Popover background
  - `--normal-text`: Popover foreground
  - `--normal-border`: Border color
- **Features**: `richColors` enabled for colored toast variants

#### 2. **`src/components/ui/conditional-toaster.tsx`** - Conditional Rendering
- **Purpose**: Conditionally renders the Toaster component
- **Logic**: Excludes toaster from login pages (they have minimal toaster)
- **Position**: Bottom-left
- **Rich Colors**: Enabled for better visual distinction

### Usage Patterns

#### Common Toast Methods
```typescript
import { toast } from "sonner";

// Success
toast.success("Query berhasil disimpan", {
  description: `Query "${query.name}" telah disimpan`,
});

// Error
toast.error("Gagal menyimpan query", {
  description: "Silakan coba lagi",
});

// Info
toast.info(`${user.name} telah login`, {
  description: `Role: ${role}`,
});
```

#### Toast Usage Locations (50+ instances found)
- **Hooks**: `use-admin-users.ts`, `use-login-notifications.ts`, `use-unsaved-changes-warning.ts`
- **Components**: 
  - Inquiry data: `simpan-modal.tsx`
  - Transfer daerah: `rekonsilisasi-data-tab.tsx`, `penilaian-iku/` modals
  - TPID: `rekam-tpid.tsx`, `modal-tpid.tsx`
  - Satker: `dipa-download-tab.tsx`
  - Pengendalian belanja: `pengendalian-belanja.tsx`
  - Monev: Various monitoring components
  - MBG: `SearchAutocomplete.tsx`

### Toast Features Used
- ✅ Success notifications
- ✅ Error notifications
- ✅ Info notifications
- ✅ Custom descriptions
- ✅ Rich colors (success=green, error=red, info=blue)
- ✅ Auto-dismiss (default 5 seconds)
- ✅ Position control (bottom-left)

### Fallback Mechanism
In `useSocket.ts` and `socket-client.ts`, there's a fallback for environments where Sonner isn't available:
```typescript
if (typeof window !== 'undefined' && (window as any).toast) {
  (window as any).toast.error(message, {
    duration: 5000,
    position: 'top-center'
  });
} else {
  alert(message); // Fallback to browser alert
}
```

---

## Backend Notification System

### Architecture

#### 1. **Database Models**
- **Notification**: Stores notification records
  - `id`: UUID
  - `title`: Notification title
  - `message`: Notification content
  - `type`: 'info' | 'error' | 'success' | 'warning' | 'message' | 'mention' | 'system'
  - `priority`: 'low' | 'medium' | 'high'
  - `sender_id`: User who created the notification
  - `recipients`: 'all' or array of user IDs
  - `expires_at`: Optional expiration timestamp
  - `created_at`, `updated_at`: Timestamps

- **NotificationRead**: Tracks read status per user
  - `notification_id`: Reference to Notification
  - `user_id`: User who read it
  - `read_at`: When it was marked as read

#### 2. **API Routes** (`src/modules/messaging/routes/notification.routes.ts`)

| Method | Endpoint | Auth | Permission | Purpose |
|--------|----------|------|-----------|---------|
| GET | `/` | ✅ | - | List user's notifications |
| GET | `/unread-count` | ✅ | - | Get unread count |
| GET | `/admin` | ✅ | notifications:viewAll | Admin list all notifications |
| PUT | `/:id/read` | ✅ | - | Mark single as read |
| PUT | `/read/all` | ✅ | - | Mark all as read |
| POST | `/` | ✅ | notifications:create | Create notification (admin only) |
| DELETE | `/:id` | ✅ | notifications:delete | Delete notification (admin only) |

#### 3. **Controller Functions** (`src/modules/messaging/controllers/notification.controller.ts`)

**listMyNotifications()**
- Fetches notifications targeted to user or 'all'
- Filters expired notifications
- Includes read status
- Returns sender info

**getUnreadCount()**
- Counts unread notifications for user
- Respects expiration

**markAsRead()**
- Creates NotificationRead record
- Validates user is target recipient

**markAllAsRead()**
- Bulk creates read records
- Ignores duplicates

**createNotification()**
- Admin-only (super_admin, co_admin)
- Normalizes recipients (usernames → IDs or 'all')
- Broadcasts via Socket.IO:
  - `notification:new` (legacy)
  - `notification:new:v2` (current)

**deleteNotification()**
- Admin-only
- Cascades delete to NotificationRead records

#### 4. **Socket.IO Service** (`src/modules/messaging/services/notificationService.ts`)

**Real-time Broadcasting Methods**

| Method | Purpose | Event |
|--------|---------|-------|
| `broadcastNewMessage()` | Send message to conversation | MESSAGE_SENT |
| `broadcastConversationCreated()` | Notify participants of new conversation | CONVERSATION_CREATED |
| `broadcastMessageDelivered()` | Confirm message delivery | MESSAGE_DELIVERED |
| `notifyUserNewMessage()` | Direct notification for new message | NEW_MESSAGE_NOTIFICATION |
| `broadcastPresenceChange()` | User online/offline status | USER_PRESENCE_CHANGED |
| `broadcastMessagesRead()` | Message read status | MESSAGE_READ |
| `broadcastTypingStart()` | User typing indicator | TYPING_START |
| `broadcastTypingStop()` | User stopped typing | TYPING_STOP |

**Socket Management**
- `joinConversationRoom()`: Add user to conversation room
- `leaveConversationRoom()`: Remove user from conversation room
- `isRecipientInRoom()`: Check if user is in conversation
- `getUserSocket()`: Get socket instance for user

**Response Helpers**
- `sendSuccess()`: Send success response
- `sendSocketError()`: Send error response
- `sendCallbackError()`: Send error via callback

### Socket Events

From `src/types/socket-events.ts`:
```typescript
NOTIFICATION_CREATE: "notification:create"
NOTIFICATION_CREATED: "notification:created"
NOTIFICATION_ERROR: "notification:error"
NOTIFICATION_NEW: "notification:new"
NOTIFICATION_NEW_V2: "notification:new:v2"
NEW_MESSAGE_NOTIFICATION: "notification:new:message"
```

### RBAC Permissions

From `src/shared/rbac.ts`:
```typescript
notifications: {
  super_admin: { viewAll: true, create: true, delete: true },
  co_admin: { viewAll: true, create: true, delete: false },
  user: { viewAll: true, create: true, delete: false },
  // Other roles: viewAll: false, create: false, delete: false
}
```

---

## Frontend Notification Store (Zustand)

### Location: `src/stores/notification-store.ts`

**Purpose**: Manages in-app notification state (separate from Sonner toasts)

**State Structure**
```typescript
{
  notifications: NotificationItem[],      // All notifications
  unreadCount: number,                    // Unread count
  activeToasts: Set<string>,              // Currently visible toasts
  settings: NotificationSettings,         // User preferences
  browserPermission: NotificationPermission | null,
  lastSoundPlayed: number                 // For throttling
}
```

**Notification Types**
- message, mention, system, error, success, warning, info

**Settings**
- `enabled`: Master toggle
- `soundEnabled`: Play notification sound
- `desktopEnabled`: Browser notifications
- `messageNotifications`: Toggle message notifications
- `mentionNotifications`: Toggle mention notifications
- `systemNotifications`: Toggle system notifications
- `doNotDisturbMode`: DND mode with time range
- `doNotDisturbStart/End`: DND time window (HH:MM format)

**Key Actions**
- `addNotification()`: Add new notification
- `markAsRead()`: Mark single as read
- `markAllAsRead()`: Mark all as read
- `removeNotification()`: Remove notification
- `clearAllNotifications()`: Clear all
- `showToast()`: Show toast for notification
- `hideToast()`: Hide toast
- `updateSettings()`: Update user preferences
- `requestBrowserPermission()`: Request desktop notification permission
- `showBrowserNotification()`: Show browser notification
- `playNotificationSound()`: Play sound (throttled to 1s)

**Features**
- ✅ Persistent storage (Zustand persist middleware)
- ✅ Browser notifications support
- ✅ Sound notifications (throttled)
- ✅ Do Not Disturb mode with time ranges
- ✅ Notification expiration
- ✅ Auto-hide delays
- ✅ Metadata support
- ✅ Devtools integration

**Selectors**
- `useNotifications()`: Get notifications with optional limit
- `useUnreadNotificationCount()`: Get unread count
- `useNotificationSettings()`: Get settings
- `useActiveToasts()`: Get active toast IDs
- `useNotificationActions()`: Get all actions

---

## Integration Points

### Frontend → Backend
1. **API Calls**: Fetch notifications via REST endpoints
2. **Socket.IO**: Real-time notification delivery
3. **Sonner Toasts**: Display transient feedback

### Backend → Frontend
1. **Socket Events**: Broadcast notifications in real-time
2. **REST API**: Fetch notification history
3. **Database**: Persist notifications

### User Flow
```
User Action
    ↓
Backend API/Socket
    ↓
Database (Notification + NotificationRead)
    ↓
Socket.IO Broadcast
    ↓
Frontend Notification Store
    ↓
Sonner Toast Display
```

---

## Best Practices Observed

✅ **Separation of Concerns**
- Sonner for transient UI feedback
- Notification store for persistent notifications
- Socket.IO for real-time delivery

✅ **Accessibility**
- Rich colors for visual distinction
- Descriptions for context
- Keyboard-friendly (Sonner default)

✅ **Performance**
- Sound throttling (1s minimum)
- Notification limit (100 stored)
- Selective socket broadcasting

✅ **Security**
- Admin-only notification creation
- RBAC permission checks
- User-scoped notification filtering

✅ **User Experience**
- Auto-dismiss toasts
- Do Not Disturb mode
- Browser notifications support
- Fallback to alerts

---

## Potential Improvements

### Frontend
1. **Toast Customization**: Consider adding custom toast templates for complex notifications
2. **Toast Persistence**: Add option to persist important toasts
3. **Toast Grouping**: Group similar toasts to reduce clutter
4. **Accessibility**: Add ARIA labels for screen readers

### Backend
1. **Notification Scheduling**: Add scheduled notification support
2. **Notification Templates**: Create reusable notification templates
3. **Notification Analytics**: Track notification delivery/read rates
4. **Notification Preferences**: Per-notification-type user preferences

### Integration
1. **Email Notifications**: Send important notifications via email
2. **SMS Notifications**: Critical alerts via SMS
3. **Notification History**: Better UI for viewing notification history
4. **Notification Search**: Search/filter notifications

---

## Testing

### Frontend Tests Found
- `test/hooks/__tests__/use-saved-queries.test.tsx`: Mocks Sonner toast
- `test/components/inquiry-data/modals/__tests__/simpan-modal.test.tsx`: Tests toast calls
- `test/auth-simplification.test.tsx`: Tests logout toast

### Backend Tests
- No specific notification tests found in provided files
- Recommend adding Jest tests for:
  - Notification creation/deletion
  - Permission checks
  - Socket broadcasting
  - Read status tracking

---

## Configuration Files

### Environment Variables
- `.env.local`: Local development
- `.env.production`: Production settings
- `.env.docker.example`: Docker configuration

### Key Settings
- Backend port: 88 (default)
- Socket.IO: Integrated with Express
- Database: PostgreSQL (dual DB)
- Redis: For caching/sessions

---

## Summary

Your notification system is **well-architected** with:
- ✅ Clean separation between transient (Sonner) and persistent (Store) notifications
- ✅ Real-time delivery via Socket.IO
- ✅ Proper RBAC and permission checks
- ✅ Browser notification support
- ✅ Do Not Disturb mode
- ✅ Comprehensive error handling

The system handles both **user-facing feedback** (Sonner toasts) and **persistent notifications** (database + Socket.IO) effectively.
