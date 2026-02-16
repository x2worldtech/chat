# chat

## Overview
A modern, mobile-optimized chat application with end-to-end encryption for 1:1 and group chats. The user interface is designed in dark mode (black-white) and fully in English.

## Authentication
- Users log in with their Internet Identity
- Each user is identified by their Principal ID
- Users can set a unique username once

## Login Page Design
- Large, bright white, rotating 3D globe (Earth) in the center using Three.js with React Three Fiber
- Black background with white elements maintaining the privacy-focused black-white-gray theme
- Visually striking and modern 3D animation that is smooth and performant across devices
- No scrolling capability - all scrolling and overscroll behaviors are disabled on the login screen
- Fixed viewport with no vertical or horizontal scrolling
- 3D animated background creates a strong sense of connectivity and security without interfering with login functionality
- Main heading displays "Secure Chat" with animated text effect that gradually replaces letters with "*" one by one, creating a visual effect of text being secured or hidden
- Text animation loops smoothly and subtly, maintaining the minimalist black-white-gray aesthetic
- Login button is prominently displayed
- No additional information, messaging, or content beyond the heading and login button

## User Management
- Users can search by username or Principal ID
- Display user profiles with username and Principal ID
- Ability to find and add contacts

## Profile Management
- Profile dropdown menu in the header with "Profile" section
- Users can upload a custom profile picture
- Users can add and edit a short biography
- Profile picture and biography are displayed in the profile menu
- Profile picture and biography are available for future features (e.g., display in chat lists or chat windows)

## Chat Functionality
- 1:1 chats between two users
- Group chats with multiple participants
- Send and receive text messages
- Chronological display of messages with newest messages at the bottom of the chat window
- Older messages are displayed above newer ones and scrolled upward
- Automatic scrolling to the bottom when opening a chat or receiving new messages
- Real-time message transmission
- Optimistic message sending: when a user sends a message, it appears instantly in the chat UI without any loading time or pending indicator, even if the backend processing takes longer
- Messages are optimistically added to the chat window immediately after sending, and only removed or updated if the backend returns an error
- No visual pending indicators or delays for sent messages to ensure seamless, instant chat flow

## Chat Creation Rules
- Only one 1:1 chat can exist between any two users (identified by username or Principal ID)
- When attempting to create a new 1:1 chat, the system first checks if a chat already exists between the two users
- If an existing chat is found, the user is navigated to that existing chat instead of creating a duplicate
- The frontend validates for existing chats before attempting creation
- The backend enforces this rule at the API level to prevent duplicate chats even if called directly
- Group chats are not affected by this rule and can be created normally

## Message Actions
- Long-press (touch and mouse) action on chat messages opens a contextual menu below the message
- Context menu options: "Copy", "Reply", "Forward", and "Delete"
- "Copy" copies the message content to the clipboard
- "Reply" allows the user to quote the selected message in the input field
- "Forward" opens a dialog to select another chat to forward the message to
- "Delete" opens a submenu with deletion options based on message ownership:
  - For messages sent by the current user: both "Delete for everyone" and "Delete for me" options are available
  - For messages sent by other users: only "Delete for me" option is available
- "Delete for everyone" removes the message from the backend completely, making it disappear for all participants (only available for the sender's own messages)
- "Delete for me" marks the message as hidden for the current user only, while keeping it visible for other participants
- UI updates immediately to reflect the deletion action without waiting for backend confirmation
- Message input and chat remain fully usable while the context menu is open
- Mobile-friendly and visually consistent with the app's dark theme

## Chat List
- Vertically scrollable list of all existing chats
- Display of the last message and timestamp for each chat
- Sorting chats by last activity (newest on top)
- Distinction between 1:1 chats and group chats in the display
- Always visible in the main view of the application

## Chat List Actions
- Swipe-to-left gesture on each chat item in the main chat overview list
- Swiping left reveals two action boxes on the right side: "Delete" and "Archive"
- When "Delete" is tapped, a dialog appears with two options:
  - "Delete for me": removes the chat only for the current user, chat remains visible for the other participant
  - "Delete for everyone": removes the chat for both users completely
- Chat list updates instantly after deletion action without waiting for backend confirmation
- Deleted chats are immediately removed from the current user's chat list view
- Archive functionality for organizing chats (future implementation)

## Encryption
- End-to-end encryption of all messages with VetKeys
- Secure key management for each chat
- Encrypted storage of messages

## Group Management
- Create new groups
- Invite users by username or Principal ID
- Display group participants
- Leave groups

## Backend Data Storage
- User data (Principal ID, username, profile picture, biography)
- Chat metadata (participants, creation date, last activity)
- Encrypted messages with timestamp and sender information
- Group memberships
- VetKeys encryption keys
- Chat overview data for the list (last message, timestamp)
- Message deletion status tracking for individual users (which messages each user has hidden)
- Global message deletion status (which messages have been deleted for everyone)
- Chat participant tracking to enforce unique 1:1 chat rule
- Chat deletion status tracking for individual users (which chats each user has deleted for themselves)
- Global chat deletion status (which chats have been deleted for everyone)

## User Interface
- Dark design (black-white)
- Mobile-first responsive design
- Intuitive navigation between chats
- Vertically scrollable chat list with last messages and timestamps
- Simple user search and invitation
- English user interface
- No popup notifications or small status messages (like "Chat created" or similar) are displayed
- No pull-to-refresh functionality - users cannot refresh the app or chat list by pulling down on the screen
- All chat and message updates occur exclusively through automatic background polling or other non-manual update mechanisms
- Text selection is disabled globally across the application, except for message action functionality
- Fixed footer in the chat window with:
  - "+" button on the left for sending images and files
  - Message input field in the center, which is fully clickable and opens the mobile keyboard when tapped
  - Send button on the right
  - Always visible and fixed at the bottom, independent of scrolling or page position
  - Never disappears under the URL bar or requires scrolling to access
  - Works seamlessly on mobile and desktop devices
- Extended chat footer with sliding menu:
  - When tapping the "+" button, a sliding menu appears above the message input
  - The menu shows icons for "Photo", "Camera", "Document", and "Poll"
  - The message input field remains visible and usable while the icon menu is open
  - When the icon menu is open, the "+" button is replaced by a keyboard icon
  - Clicking the keyboard icon or the message input field closes the icon menu and returns to normal input mode
  - Modern, mobile-friendly design in the existing black-white-gray theme
- User search results show Principal IDs in smaller font size, optimized for mobile devices and truncated or wrapped as needed
- Chat messages are displayed in chronological order, with the newest messages appearing at the bottom of the chat window
- When opening a chat or receiving new messages, the view automatically scrolls to the bottom to make the most recent messages visible
- Header menu with clickable Principal ID:
  - The user's Principal ID in the header menu is clickable
  - Clicking on the Principal ID automatically copies it to the clipboard
  - Visual feedback through subtle inline confirmation (e.g., brief text change or icon change) without popup notifications
  - Confirmation message in English (e.g., "Copied" or similar)
- Profile dropdown menu in the header:
  - "Profile" section in the dropdown menu
  - Profile picture upload functionality with mobile-optimized user interface
  - Biography input field for adding and editing a short description
  - Display of current profile picture and biography in the profile menu
  - Responsive design for mobile and desktop devices in the black-white-gray theme

## Backend Operations
- User registration and management
- Profile picture upload and storage
- Biography management (add, edit, retrieve)
- Chat creation and management with duplicate prevention for 1:1 chats
- Check for existing 1:1 chats between two users before creation
- Message sending and retrieval
- Message deletion with two modes and ownership validation:
  - Global deletion: completely remove message from backend for all participants (only allowed for the message sender)
  - User-specific deletion: mark message as hidden for specific user while preserving for others (available for any user)
- Backend enforces that only the sender of a message can perform global deletion
- Message forwarding between chats
- User search by name or Principal ID
- Group membership management
- VetKeys key management
- Retrieve chat list with metadata (last message, timestamp, participants)
- Sort chats by last activity
- Filter messages based on user-specific deletion status when retrieving chat history
- API-level enforcement of unique 1:1 chat rule to prevent duplicate creation
- Chat deletion with two modes:
  - User-specific chat deletion: mark chat as hidden for specific user while preserving for other participants
  - Global chat deletion: completely remove chat from backend for all participants
- Filter chat list based on user-specific deletion status when retrieving chat overview
- Chat deletion status tracking and enforcement at API level
