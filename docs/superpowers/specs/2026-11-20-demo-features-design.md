# CurioHub demo features: design

Date: 2026-11-20
Status: awaiting approval

## Intent

CurioHub is a portfolio project. It should impress in a ~5-minute demo **and** read as
well-built when a reviewer opens the repo. So: visible real-time features, built on a
codebase that is cleanly structured and covered by tests.

## Goals

1. Restructure the server and the chat UI so features have an obvious home.
2. Real automated tests (`node --test`) for REST and socket behaviour.
3. Five demo features:
   1. Who's-online panel in the chat room
   2. Typing indicator
   3. Emoji reactions on messages
   4. Edit / delete own messages; admins can delete any message
   5. Public landing page at `/`

## Non-goals

- Moderation beyond admin delete (bans, reports, mutes).
- Notifications, unread counts, DMs, threads, file uploads.
- Paginated history beyond the current last-100 messages.
- Client-side test suite (server tests only for now).
- Deployment changes.

## Anti-goals (failure even if it "works")

- Breaking login for the seeded accounts in `curiohub_v2`, or losing existing messages.
- Tests that hit the Atlas database.
- Trusting client-sent identity or permissions anywhere (the server decides who may edit/delete/react).
- Paid services or new external infrastructure.

## Constraints

- Stack stays: React 19 + Vite + Tailwind 4 client; Express 5 + Socket.IO + Mongoose server; ES modules.
- Production DB is MongoDB Atlas free tier (`curiohub_v2`).
- Existing visual style (dark purple theme, Manrope, Material Symbols) is kept.

## Approaches

| | Approach | Trade-off |
|---|---|---|
| A | Bolt features onto existing `server.js` / `Chat.jsx` | Fastest; `server.js` passes 500 lines, `Chat.jsx` becomes one giant component. Reads poorly to a reviewer. |
| **B (chosen)** | Restructure + tests first, then features | Slower start; repo reads well-built, tests protect the message-model changes in features 3–4. |
| — | Rewrite on another framework | Dropped: high cost, shows nothing new. |

Chosen by the owner: **B**, because for a portfolio how the code reads matters nearly as much as what it does.

## Design

### Server structure

```
server/
  server.js            boot only: env check, connect DB, seed rooms, listen
  app.js               createApp(): express app (middleware, routes, SPA catch-all)
  socket/
    index.js           attachSocket(httpServer): io instance + JWT auth middleware
    presence.js        in-memory presence (per room, distinct users) + broadcast
    handlers/
      room.js          joinRoom / leave / disconnect
      chat.js          chatMessage, editMessage, deleteMessage
      typing.js        typing:start / typing:stop
      reactions.js     toggleReaction
  routes/  models/  middleware/  utils/  data/  scripts/   (as today)
  test/
    helpers.js         start app on random port against in-memory Mongo; register/login/connect helpers
    auth.test.js  rooms.test.js  socket.test.js  messages.test.js  stats.test.js
```

`createApp()` / `attachSocket()` are factories so tests can boot the real server
in-process. Behaviour of existing endpoints is unchanged.

### Tests

- Runner: `node --test` (built in, no framework).
- Database: `mongodb-memory-server` (dev dependency) — each test file gets a throwaway
  Mongo. **Never** Atlas.
- Port the 30 checks from the earlier verification script, then add tests per feature.
- `npm test` in `server/`.

### Data model changes (`Message`)

```js
editedAt:  Date | null          // set when edited; UI shows "(edited)"
deletedAt: Date | null          // soft delete; text cleared to "" on delete
deletedBy: ObjectId | null      // who deleted (author or admin)
reactions: [{ emoji: String, user: ObjectId }]   // one row per user+emoji
```

Existing messages need no migration (missing fields read as empty/null).

### Socket events

| Client → server | Rule | Server → room |
|---|---|---|
| `editMessage {messageId, text}` | author only, not deleted, same validation as new messages | `messageUpdated {message}` |
| `deleteMessage {messageId}` | author or `role === 'admin'` | `messageUpdated {message}` (deleted form) |
| `toggleReaction {messageId, emoji}` | any room member; emoji in allow-list; not on deleted messages | `messageUpdated {message}` |
| `typing:start` / `typing:stop` | must be in a room; throttled client-side | `typing {users: [{id,name}]}` to others in room |

- Role is read from the DB in the socket auth step (`socket.data.user.role`), never from the client.
- Every rule failure returns `messageError` to the sender only.
- Message must belong to the socket's current room.
- Reaction allow-list: 👍 ❤️ 😂 😮 😢 🔥.
- Typing: server drops a user from the typing set after 5 s without a refresh, and on send/leave/disconnect.
- Messages broadcast in a single shape (`toPublicMessage()`), also used by `GET /messages`:
  `{_id, type, sender:{_id,name,role}, text, createdAt, editedAt, deletedAt, reactions:[{emoji, count, userIds}]}`.

### Public stats endpoint

`GET /api/stats` (no auth): `{ rooms, onlineNow, messages }` for the landing page.
Counts only — no names or content.

### Client structure

```
client/src/
  hooks/useRoomSocket.js        socket lifecycle, events → state
  components/chat/
    MessageList.jsx  MessageItem.jsx  MessageInput.jsx
    OnlineUsers.jsx  TypingIndicator.jsx  ReactionBar.jsx
  pages/Landing.jsx
  context/  (useAuth moved to its own file to clear the last lint error)
```

`Chat.jsx` becomes layout + composition only.

### Feature UX

- **Online panel:** right sidebar on desktop (avatar, name, admin badge); on mobile a
  "N online" button opens it as a drawer.
- **Typing:** line above the input: "Ana is typing…", "Ana and Bo are typing…", "3 people are typing…".
- **Reactions:** chips under a message (`👍 2`), highlighted if you reacted; hover/long-press shows a 6-emoji picker.
- **Edit/delete:** hover menu on a message (⋯). Edit inline, Enter saves, Esc cancels.
  Deleted messages render as *"This message was deleted"* (no reactions, no menu).
  Admins see delete on every message; an "Admin" badge shows next to admin names.
- **Landing (`/`):** logged-out visitors see hero + one-line pitch, live stats from
  `/api/stats`, a 3-feature strip, and Sign up / Log in buttons. Logged-in users
  are redirected to `/dashboard` as today.

### Build order

1. Server restructure + test harness (no behaviour change; all ported tests green).
2. Client restructure (`Chat.jsx` split, `useAuth` file) — no behaviour change.
3. Online panel → 4. Typing → 5. Edit/delete → 6. Reactions → 7. Stats + landing.

Each step ends with tests green, client lint + build clean, and a browser check.

## Calls made by the builder (owner may override)

- `mongodb-memory-server` for tests (downloads a mongod binary on first `npm test`).
- Soft delete with text cleared, rather than hard delete — keeps conversation flow readable.
- No edit time limit.
- Fixed 6-emoji reaction set instead of a full picker.
- Landing page includes a GitHub repo link in the footer.

## Left to the builder

Exact component styling within the existing theme, copy text on the landing page,
throttle intervals, and test file granularity.
