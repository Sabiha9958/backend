# Complaint Management System - Backend API

A comprehensive complaint management system built with **Node.js**, **Express.js**, and **MongoDB**.

---

## 🚀 Features

- 🔐 **JWT Authentication** – Secure user authentication with role-based access control
- 👥 **User Management** – Admin, Staff, and User roles with different permissions
- 📝 **Complaint Management** – Create, update, track, and resolve complaints
- 📊 **Dashboard Statistics** – Real-time analytics and reporting
- 📎 **File Attachments** – Upload and manage complaint attachments
- 🔍 **Advanced Search** – Filter and search complaints by multiple criteria
- 📜 **Audit Trail** – Complete status history tracking
- 🔒 **Security** – Rate limiting, Helmet, CORS protection
- 📱 **RESTful API** – Clean and well-documented endpoints

---

## 🛠 Tech Stack

- **Runtime:** Node.js v18+
- **Framework:** Express.js v4
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **File Uploads:** Multer
- **Security:** Helmet, CORS, bcryptjs
- **Rate Limiting:** express-rate-limit

---

## 📋 Prerequisites

- Node.js v18 or higher
- MongoDB v6 or higher
- npm v9 or higher

---

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/complaint-management-system.git
   cd complaint-management-system
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables** in `.env` file
4. **Run the server**
   ```bash
   npm run dev
   ```

---

## 📑 API Endpoints (Structured)

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint           | Description              |
| ------ | ------------------ | ------------------------ |
| POST   | `/register`        | Register new user        |
| POST   | `/login`           | Login user               |
| POST   | `/logout`          | Logout user              |
| GET    | `/me`              | Get current user profile |
| PUT    | `/change-password` | Change password          |

---

### 👤 Users (`/api/users`)

**User Endpoints**
| Method | Endpoint | Description |
|--------|----------------|--------------------------|
| GET | `/me` | Get own profile |
| PUT | `/me` | Update profile |
| PUT | `/me/profile` | Update profile with avatar |
| POST | `/me/avatar` | Upload avatar |
| DELETE | `/me/avatar` | Delete avatar |
| POST | `/me/cover` | Upload cover image |

**Admin Endpoints**
| Method | Endpoint | Description |
|--------|------------|--------------------------|
| GET | `/` | List all users |
| GET | `/:id` | Get user by ID |
| PUT | `/:id` | Update user by ID |
| DELETE | `/:id` | Delete user by ID |
| GET | `/stats` | User statistics |
| POST | `/bulk` | Bulk actions on users |

---

### 📝 Complaints (`/api/complaints`)

**General**
| Method | Endpoint | Description |
|--------|------------|--------------------------|
| POST | `/` | Create complaint |
| GET | `/` | List all complaints |
| GET | `/my` | Get my complaints |
| GET | `/:id` | Get complaint by ID |
| PUT | `/:id` | Update complaint |
| DELETE | `/:id` | Delete complaint |
| PATCH | `/:id/status` | Update complaint status (Admin) |

**Comments & Attachments**
| Method | Endpoint | Description |
|--------|---------------------------|--------------------------|
| GET | `/:id/comments` | Get comments for complaint |
| POST | `/:id/comments` | Add comment to complaint |
| GET | `/:id/attachments/:aid` | Download attachment |
| POST | `/:id/attachments` | Add attachment |
| DELETE | `/:id/attachments/:aid` | Delete attachment |

**Admin Reports**
| Method | Endpoint | Description |
|--------|----------------|--------------------------|
| GET | `/stats` | Complaint statistics |
| GET | `/export/csv` | Export complaints as CSV |

---

## 🔑 Improvements in This Version

- ✅ Converted endpoints into **tables** for quick reference.
- ✅ Grouped endpoints by **Authentication, Users, Complaints**.
- ✅ Clear separation of **User vs Admin endpoints**.
- ✅ Professional formatting for README or project documentation.
