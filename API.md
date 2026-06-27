# CivicFix REST API

Base URL: `/api`. Send authenticated requests with `Authorization: Bearer <token>`.

## Authentication and profile

- `POST /auth/register` — register a citizen
- `POST /auth/login` — authenticate
- `POST /auth/forgot-password` — request a reset link
- `POST /auth/reset-password/:token` — set a new password
- `GET /auth/me` — current profile
- `PUT /auth/me` — update profile, avatar URL, or language

## Complaints

- `GET /complaints` — role-scoped list; accepts `search`, `category`, `status`, `priority`, `ward`, `department`, `from`, `to`, `page`, and `limit`
- `POST /complaints` — create complaint
- `GET /complaints/:id` — complaint details and timeline
- `PUT /complaints/:id` — citizen edit while submitted or administrator workflow update
- `DELETE /complaints/:id` — owner delete while submitted
- `GET /complaints/admin/summary` — administrator analytics

## Supporting endpoints

- `POST /uploads` — upload up to five JPG, PNG, or WEBP files to Cloudinary
- `GET /notifications` — current user's notifications
- `PATCH /notifications/read-all` — mark all as read
- `PATCH /notifications/:id/read` — mark one as read
- `GET /departments` — list active departments
- `POST /departments` — administrator creates a department
- `PUT /departments/:id` — administrator updates a department
- `GET /users/assignees` — administrator assignment list
- `GET /users/activity` — administrator activity log
- `GET /reports/complaints.csv` — administrator CSV export
- `GET /stats` — public aggregate statistics
- `GET /health` — service and database health

Validation errors return HTTP `422`. Authentication and authorization errors return `401` and `403`. Missing records return `404`.
