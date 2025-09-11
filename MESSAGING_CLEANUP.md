# Messaging System Cleanup

This document explains the messaging system cleanup functionality that ensures proper state management when users log out or switch accounts.

## Problem

When users log out and log in with different accounts, the messaging system was retaining state from the previous user, causing:
- Previous user's conversations to remain visible
- Cached messages from the wrong user
- Stale unread counts and typing indicators
- Persistent message queue data

## Solution

A comprehensive cleanup system that clears all messaging-related state on auth events.

## Components

### 1. Messaging Cleanup Utility (`src/utils/messaging-cleanup.ts`)

Central utility that handles clearing all messaging state:

- **Zustand Stores**: Clears messaging UI, typing indicators, and unread badges stores
- **React Query Cache**: Removes all messaging-related query data
- **Temp Messages**: Clears temporary conversation messages
- **Message Queue**: Clears persistent IndexedDB message queue

### 2. Auth Event Listener (`src/components/messaging/messaging-auth-listener.tsx`)

Component that listens to auth events and triggers cleanup:

- Listens for `auth:logout` events
- Listens for `auth:login` events (to handle account switching)
- Automatically triggers comprehensive cleanup

### 3. Enhanced Stores

Updated stores with cleanup methods:

- **Temp Messages Store**: Added `clearAllTempMessages()` function
- **Message Queue**: Added `clearAllMessages()` method

## Integration

The `MessagingAuthListener` component is integrated into the main app layout (`src/app/layout.tsx`) so it works across the entire application, not just messaging pages.

## Usage

The cleanup happens automatically when:
1. User logs out
2. User logs in (to handle account switching)

No manual intervention required - the system automatically detects auth events and cleans up messaging state.

## What Gets Cleared

1. **Active conversation selection**
2. **Message input state**
3. **Conversation UI states**
4. **Typing indicators**
5. **Unread message counts**
6. **React Query cached conversations and messages**
7. **Temporary conversation messages**
8. **Persistent message queue (IndexedDB)**

## Benefits

- Clean slate for each user session
- No data leakage between user accounts
- Prevents stale UI state
- Ensures fresh messaging experience
- No manual page refresh required