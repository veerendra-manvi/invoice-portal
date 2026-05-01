

```markdown
# 🚀 Invoice Portal

A full-stack **Invoice & Billing Management System** built using **React, PHP, and MySQL**.  
This project allows users to manage clients, create invoices, track payments, and generate downloadable PDFs.

---

## 🌐 Live Demo
🔗 https://invoiceportal.rf.gd

---

## ✨ Features

- 🔐 User Authentication (Register / Login)
- 📊 Dashboard with real-time analytics
- 👥 Client Management (Add / View / Delete)
- 🧾 Invoice Management (Create / View / Edit / Delete)
- 💰 Payment Tracking System
- 📄 High-quality PDF Invoice Download
- 🖨️ Print Invoice Support
- 🔄 Invoice Status Management (Draft, Pending, Paid, Overdue, Cancelled)

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- Axios
- html2canvas (PDF generation)

**Backend**
- PHP (REST APIs)
- PDO (Secure Database Queries)

**Database**
- MySQL

**Hosting**
- InfinityFree (Frontend + Backend)

---

## 📂 Project Structure

```

invoice-portal/
│
├── frontend/      # React Application
├── backend/       # PHP APIs
│   ├── api/
│   └── config/
│
├── README.md
└── .gitignore

````

---

## ⚠️ Important Note

Due to free hosting limitations (**InfinityFree does not support PHP sessions properly**),  
this project uses a **user_id-based authentication system** instead of session-based authentication.

---

## 🚀 How to Run Locally

### 1. Clone the Repository
```bash
git clone https://github.com/veerendra-manvi/invoice-portal.git
cd invoice-portal
````

### 2. Setup Backend

* Place project inside `htdocs` (XAMPP)
* Start Apache & MySQL
* Import database in phpMyAdmin
* Update DB credentials in:

```
backend/config/config.php
```

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📌 Future Improvements

* 🔐 JWT Authentication
* 📧 Email Invoice Sending
* 📱 Mobile Responsive Enhancements
* 📈 Advanced Reports & Charts

---

## 👨‍💻 Author

**Veerendra Manvi**
🔗 GitHub: [https://github.com/veerendra-manvi](https://github.com/veerendra-manvi)

---

## ⭐ If you like this project

Give it a ⭐ on GitHub and share it!

```

---

