# MINI PROJECT RECORD FORMAT – 2025 BATCH
## PROJECT TITLE: CivicFix — Civic Issue Reporting System

*(Note: Formatting follows the prescribed PDF guidelines for Section Headings and Regular Text)*

### 1. Cover Page
*(Please refer to the standard college format for the cover page. Details to include: Project Title "CivicFix", Name of Student, Reg No, Department of MCA, College Name, Month-Year)*

### 2. Certificate of the Head Of Department
*(Please refer to the standard college format for the Certificate of HOD)*

### 3. Certificate of the Internal project guide
*(Please refer to the standard college format for the Certificate of Internal Guide)*

### 4. Declaration : By student
I, **[NAME OF STUDENT]**, hereby declare that the project work entitled **"CivicFix — Civic Issue Reporting System"** is an authenticated work carried out by me at **[COLLEGE NAME/COMPANY]** under the guidance of **[NAME OF GUIDE]** for the partial fulfilment of the course MASTER OF COMPUTER APPLICATIONS. This work has not been submitted for similar purpose anywhere else except to **[NAME OF COLLEGE]**.
I understand that detection of any such copying is liable to be punished in any way the school deems fit.

**[NAME OF STUDENT]**
Signature

### 5. Acknowledgment 
*(To be filled by the student acknowledging the guide, HOD, principal, and others)*

### 6. Table of Contents
*(To be generated based on the chapters below)*

### 7. Abstract
CivicFix is a modern, responsive web application designed for citizens to seamlessly report local civic issues and track them through resolution. Reporting issues to municipal authorities is often tedious, opaque, and lacks real-time updates. CivicFix solves this by providing a unified platform where citizens can submit complaints with location data and images, while administrators can efficiently route and manage them. The system features an AI routing mechanism utilizing a Python ML Microservice that performs Image Analysis (luminance, edge density, color distribution) and Location Analysis (sensitive zones, traffic infrastructure) to automatically classify, generate descriptions, and determine the severity of issues. Using the MERN stack (MongoDB, Express, React, Node.js), CivicFix offers role-based access, JWT authentication, interactive maps, and detailed dashboard analytics, ensuring a transparent, automated, and streamlined civic maintenance pipeline.

---

## CHAPTER 1: INTRODUCTION

### 1.1 Introduction
CivicFix is an intelligent Civic Issue Reporting System that connects citizens with municipal departments to improve local infrastructure and services. By offering an accessible digital platform, it bridges the communication gap between the public and administrative bodies.

### 1.2 Problem Statement
Traditional civic issue reporting mechanisms are largely manual, lacking transparency and quick routing. Citizens face difficulties tracking their complaints, and authorities struggle to prioritize issues effectively. There is a need for an automated system that captures precise locations, visual evidence, and intelligently analyzes the severity of the issue to route it to the correct department.

### 1.3 Scope and Relevance of the Project
The project covers citizen registration, complaint submission, AI-based issue analysis, and an administrative dashboard for complaint management. It is highly relevant for smart city initiatives, promoting e-governance, transparency, and rapid response to civic infrastructural problems.

### 1.4 Objectives
- To develop a citizen-facing portal for easy submission of complaints with geolocation and images.
- To implement an AI/ML engine for automated image and location analysis to determine complaint severity and category.
- To create a secure admin dashboard for authorities to track, update, and manage complaint resolutions.
- To provide real-time updates and notifications to citizens regarding their complaint status.

---

## CHAPTER 2: SYSTEM ANALYSIS

### 2.1 Introduction
System analysis involves understanding the requirements of the civic reporting domain and defining how CivicFix addresses the shortcomings of current methodologies.

### 2.2 Existing System
Currently, citizens report issues via phone calls, physical written applications, or disjointed municipal websites that do not offer real-time tracking or evidence uploads.
**Limitations of Existing System:**
- Manual sorting and routing of complaints lead to delays.
- Lack of transparency and status tracking for the citizen.
- Absence of priority or severity analysis out-of-the-box.

### 2.3 Proposed System
CivicFix proposes a MERN stack web application enhanced with a Python ML microservice. Citizens upload complaints with images and GPS locations, which are instantly analyzed by an AI engine to determine severity and assigned to the relevant department.
**Advantages of Proposed System:**
- Automated AI-driven categorization and severity scoring.
- Transparent timeline tracking for users.
- Comprehensive administrative dashboards with analytics and visual charts.

### 2.4 Feasibility Study
- **Technical Feasibility:** Highly feasible using established MERN technologies and Python for ML.
- **Operational Feasibility:** Automates manual routing and offers an intuitive UI, requiring minimal training for admin staff.
- **Economic Feasibility:** Built on open-source tools (React, Node, MongoDB, Python), making it cost-effective to deploy and maintain.

### 2.5 Software Requirement Specification - Functional Requirements
*(Refer: SRS document)*
Core functions include JWT Authentication, Role-based access control, Complaint CRUD operations, Map integration (Leaflet), Image uploads (Cloudinary), and ML-based analysis.

### 2.6 Software Engineering Paradigm Applied
Agile Software Development methodology was utilized, allowing for iterative development, rapid integration of the AI Microservice, and continuous UI/UX improvements.

---

## CHAPTER 3: SYSTEM ENVIRONMENT

### 3.1 Introduction
This chapter outlines the hardware and software specifications required to develop and deploy CivicFix.

### 3.2 Hardware Requirement Specification
- **Processor:** Intel Core i5 or equivalent (for development)
- **RAM:** 8 GB minimum (16 GB recommended for ML modeling)
- **Storage:** 256 GB SSD

### 3.3 Tools, Platforms
- **Operating System:** Windows/Linux/macOS
- **Front End Tool:** React.js, Vite, React Router, Tailwind CSS (or custom CSS system)
- **Back End Tool:** Node.js, Express.js, MongoDB (Mongoose), Python (FastAPI/Flask) for ML Service

---

## CHAPTER 4: SYSTEM DESIGN

### 4.1 Introduction
System design defines the architecture, database schemas, and interfaces of CivicFix to satisfy the technical requirements.

### 4.2 Database Design
- **Entity Relationship Model:** 
  - `User` (Citizen/Admin)
  - `Complaint` (Details, Status, Images, Coordinates)
  - `AIAnalysis` (Description, Severity Score, Image Data)
  - `Notification` (Event triggers)

### 4.3 Object Oriented Design - UML Diagrams
*(Refer: SDS document)*
- **Use Case Diagram:** Shows interactions like Citizen submitting a complaint, AI analyzing it, and Admin updating status.
- **Class Diagram:** Defines `UserModel`, `ComplaintModel`, and `AiService`.
- **Activity Diagram:** Flow of a complaint from submission -> ML Analysis -> Admin Dashboard -> Resolution.
- **Sequence Diagram:** API request lifecycles.

### 4.4 Input Design
Inputs include user registration forms, complaint forms featuring Leaflet map integration for precise coordinate selection, and multiple image upload fields.

### 4.5 Output Design
Outputs include interactive citizen dashboards, admin analytical charts (pie/bar charts), PDF/CSV reports, and toast/email notifications.

---

## CHAPTER 5: SYSTEM IMPLEMENTATION

### 5.1 Introduction
This phase translates the design into executable code using the chosen tech stack.

### 5.2 Coding
- **Sample Codes:** *(Include snippets of JWT Auth, AI Routing Service `aiRoutingService.js`, Python ML model `model.py` image analysis)*
- **Code Validation and Optimization:** Implementation of global input sanitization, XSS protection, Helmet, API rate limiting, and Cloudinary format optimization.

---

## CHAPTER 6: TESTING 

### 6.1 Introduction
*(Refer: Testing document)*
Testing ensures the system behaves as expected under various conditions.

### 6.2 Test Plan
End-to-end testing of the Citizen -> AI -> Department pipeline.

### 6.3 Testing Strategies - Whitebox & Blackbox
- **Whitebox:** Automated backend model tests, API route validation.
- **Blackbox:** UI responsiveness, map functionality, image upload limits.

### 6.4 Testing Methods & Test Cases
- **Unit Testing:** Individual components like `analyze_image` in Python.
- **Integration Testing:** React frontend communicating with Express backend and Python microservice.

---

## CHAPTER 7: SYSTEM MAINTENANCE

### 7.1 Introduction
Post-deployment maintenance to ensure smooth operation.

### 7.2 Maintenance
Routine updates for Node packages, updating ML training data for better accuracy, and database indexing for performance tuning.

---

## CHAPTER 8: CONCLUSION & SCOPE OF FURTHER DEVELOPMENT

### 8.1 Introduction
CivicFix successfully digitizes and automates civic issue reporting.

### 8.2 Merits of the System
- Reduces manual workload for municipal bodies.
- AI integration provides instant, objective severity assessments.
- Enhances civic transparency.

### 8.3 Limitations of the System
- Requires active internet connection and GPS.
- ML models require constant retraining to adapt to diverse visual conditions.

### 8.4 Summary
The CivicFix project provides a complete, scalable solution for smart cities, demonstrating effective integration of modern web technologies with machine learning to solve real-world administrative bottlenecks.

---

### Appendices
*(Include any supplementary material, setup instructions, API documentation)*

### Glossary
- **JWT:** JSON Web Token
- **MERN:** MongoDB, Express, React, Node
- **ML:** Machine Learning

### Bibliography
- React Documentation (react.dev)
- Node.js Documentation
- Express.js Documentation
- MongoDB Documentation
- OpenCV and Scikit-learn Documentation
