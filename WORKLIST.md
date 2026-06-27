# CivicFix Implementation Worklist

Legend: `[x]` completed, `[-]` in progress/partial, `[ ]` pending.

## Project foundation

- [x] React, Vite, React Router frontend
- [x] Node.js, Express, MongoDB and Mongoose backend
- [x] Production `frontend/` and `backend/` structure
- [x] Root development, installation and build commands
- [x] Vercel and Render deployment configuration
- [x] Environment variable templates and secret exclusions
- [x] Responsive custom design system
- [x] Split major frontend features into reusable pages, components and services
- [-] Move backend route logic into MVC controllers and services

## Authentication and users

- [x] Citizen registration, login and logout
- [x] JWT authentication
- [x] bcrypt password hashing
- [x] Citizen/admin role-based access control
- [x] Profile read and edit API
- [x] Profile fields for avatar and preferred language
- [x] Forgot-password and token-based reset API
- [x] Optional SMTP email service
- [x] Profile management frontend
- [x] Profile-picture upload frontend
- [x] Forgot-password and reset-password frontend
- [ ] OTP verification
- [ ] Google reCAPTCHA

## Complaints

- [x] Complaint database model and required categories
- [x] Submitted, Under Review, Assigned, In Progress, Resolved and Rejected statuses
- [x] Create, list, view, edit and delete APIs
- [x] Citizens can only edit/delete submitted complaints
- [x] Title, description, category, address, coordinates, images, contact and anonymous fields
- [x] Complaint references, timestamps and status timeline storage
- [x] Admin status, priority, assignment, department, remarks and completion-image API fields
- [x] Search plus category, status, priority, ward, department and date API filters
- [x] Pagination
- [x] Complaint details and timeline frontend page
- [x] Citizen edit/delete controls
- [x] Admin complaint status, priority, department, assignment and remarks frontend

## Images and maps

- [x] Multer memory uploads
- [x] Cloudinary multiple-image upload
- [x] Image file type, count and size limits
- [x] Cloudinary automatic quality and format optimization
- [x] React Leaflet dependency installed
- [x] Interactive OpenStreetMap location selector
- [x] Complaint marker map and current-location control
- [x] Image previews and removal before upload
- [ ] Completion-image upload interface
- [x] Profile-avatar upload interface

## Dashboards and reports

- [x] Citizen totals, open, active and resolved metrics
- [x] Citizen complaint activity chart and recent complaints
- [x] Admin summary API
- [x] Status, priority, monthly and department analytics API
- [x] Dedicated admin dashboard
- [x] Admin pie chart, bar chart and complaint trends
- [x] Department analytics API
- [x] Monthly report chart
- [x] PDF export
- [x] CSV export

## Notifications

- [x] Notification database model
- [x] Notification service for submitted, updated, resolved and remark events
- [x] Notification REST routes
- [x] Notification panel and unread state
- [x] Toast notifications
- [x] Optional email notifications for complaint events through SMTP

## Landing page and interface

- [x] Hero, civic illustration, CTA, statistics and How It Works
- [x] Responsive navbar, sidebar, cards, icons, shadows and charts
- [x] Mobile responsive layouts
- [x] About section
- [x] Features section
- [x] Testimonials section
- [x] Contact section
- [x] Dark mode
- [ ] English/Malayalam switch
- [ ] Loading skeletons
- [x] PWA manifest and service worker

## Security and quality

- [x] Helmet
- [x] CORS allowlist
- [x] API rate limiting
- [x] Production JWT-secret requirement
- [x] Request validation added to authentication and complaint creation
- [x] Upload restrictions
- [-] Complete validation for every update and query endpoint
- [x] Global input sanitization/XSS protection
- [x] Automated backend model tests
- [ ] Automated frontend tests
- [x] Sample MongoDB seed script
- [x] Full API documentation
- [x] Installation and deployment instructions

## Current verification

- [x] Original MVP production build passed
- [x] Dependencies audited with zero known vulnerabilities after installation
- [x] Run final build after current backend/frontend changes
- [ ] End-to-end verification with MongoDB, Cloudinary and SMTP credentials
