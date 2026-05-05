# Refactor TODO — IT Ticketing App

## Phase 1 — Backend Foundation
- [x] `backend/prisma/schema.prisma` — Update enums, add AuditLog & Notification models
- [x] `backend/src/middleware/rateLimiter.js` — Add granular limiters
- [x] `backend/src/routes/ticket.routes.js` — New endpoints & validations
- [x] `backend/src/controllers/ticket.controller.js` — State machine, comments, audit log
- [x] `backend/src/controllers/dashboard.controller.js` — Unified KPI endpoint
- [x] `backend/src/routes/dashboard.routes.js` — Single GET /
- [x] `backend/src/controllers/user.controller.js` — Allow email change in profile
- [x] `backend/src/controllers/notification.controller.js` — New file
- [x] `backend/src/routes/notification.routes.js` — New file
- [x] `backend/src/server.js` — Register notification route

## Phase 2 — Frontend Dependencies & Config
- [x] `frontend/package.json` — Add framer-motion, sonner, lucide-react, clsx, tailwind-merge, react-dropzone, date-fns
- [x] `frontend/tailwind.config.js` — Status/priority colors, keyframes
- [x] `frontend/src/index.css` — Animation utilities
- [x] `frontend/src/api/axios.js` — Toast on 500, silent 401 handling

## Phase 3 — Frontend Layout & Components
- [x] `frontend/src/App.jsx` — Layout + AnimatePresence
- [x] `frontend/src/components/Sidebar.jsx` — New
- [x] `frontend/src/components/Header.jsx` — New
- [x] `frontend/src/components/Layout.jsx` — New
- [x] `frontend/src/components/StatusBadge.jsx` — New
- [x] `frontend/src/components/PriorityBadge.jsx` — New
- [x] `frontend/src/components/KpiCard.jsx` — New
- [x] `frontend/src/components/Skeleton.jsx` — New
- [x] `frontend/src/components/DataTable.jsx` — New
- [x] `frontend/src/components/FileDropzone.jsx` — New
- [x] `frontend/src/components/TicketTimeline.jsx` — New
- [x] `frontend/src/components/CommentThread.jsx` — New
- [x] `frontend/src/components/ConfirmModal.jsx` — New
- [x] `frontend/src/components/ProtectedRoute.jsx` — Enhance roles

## Phase 4 — Frontend Pages
- [x] `frontend/src/pages/Login.jsx` — Redesign
- [x] `frontend/src/pages/Dashboard.jsx` — Redesign
- [x] `frontend/src/pages/TicketsList.jsx` — Redesign
- [x] `frontend/src/pages/TicketDetail.jsx` — Redesign
- [x] `frontend/src/pages/NewTicket.jsx` — Multi-step redesign
- [x] `frontend/src/pages/Profile.jsx` — Editable redesign
- [x] `frontend/src/pages/Users.jsx` — Admin table redesign
- [x] `frontend/src/pages/Categories.jsx` — New admin page

## Phase 5 — Integration & Polish
- [x] Wire new API endpoints
- [x] Notification polling hook
- [x] Final build check

