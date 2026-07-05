# CivicFix — Civic Issue Reporting System

A modern MERN application for citizens to report local issues and follow them through resolution. The included UI has a landing page, citizen dashboard, complaint workflow, timeline, notifications, search, charts, and responsive layouts. The API provides JWT auth, role-based complaint management, admin status updates, and dashboard summaries.

## Project structure

```text
civic/
|-- frontend/               React and Vite frontend
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- index.css
|   |-- public/
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   `-- vercel.json
|-- backend/                Express and MongoDB API
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- uploads/
|   |-- .env.example
|   |-- package.json
|   `-- server.js
|-- .gitignore
|-- package.json            Workspace commands
|-- render.yaml             Render deployment
`-- README.md
```


