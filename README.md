# 💇‍♀️ Velvet Saloon - Salon Appointment Booking Platform

**Velvet Saloon** is a full-stack, role-based salon appointment booking platform where customers can explore salon services, view detailed service information, request appointments online, and pay securely via Stripe. Salon administrators have full control over service management, appointment approvals, user access, and payment tracking.

---

## 🌐 Project Links

* **Live Website:** [https://velvet-salon-frontend-fawn.vercel.app/](https://velvet-salon-frontend-fawn.vercel.app/) 
* **Client Repository:** [https://github.com/fayjullahhemon-2025/Velvet-Salon-frontend.git](https://github.com/fayjullahhemon-2025/Velvet-Salon-frontend.git) 
* **Server Repository:** [https://github.com/fayjullahhemon-2025/Velvet-Salon-backend.git](https://github.com/fayjullahhemon-2025/Velvet-Salon-backend.git) 

---
## Demo users:
# Admin
Email: [admin@velvet.com]
Password: [Admin1234]

# Customer
Email: [customer@velvet.com]
Password: [Emon1234]

# Blocked customer
Email: [customer@velvet.com]
Password: [Emon1234]
---
## ✨ Important Features

### 👤 Customer Features
* **Service Exploration:** Browse active salon services with real-time search by name, category filtering (Haircut & Styling, Hair Coloring, Facial & Skincare, Makeup, Spa & Massage, etc.), and price sorting.
* **Appointment Booking:** View detailed service descriptions, pricing, and duration, and request appointments by selecting preferred dates and available time slots (with conflict prevention).
* **Appointment Management:** Track appointment statuses (`Pending`, `Confirmed`, `Cancelled`), view booking history, and cancel pending requests.
* **Secure Stripe Payments:** Pay for confirmed appointments seamlessly through Stripe Checkout with automated status updates via verified Stripe webhooks.
* **Customer Dashboard & Profile:** View appointment summary metrics and update personal profile details and profile images.

### 🛡️ Admin Features
* **Admin Analytics Overview:** Monitor key metrics including total registered customers, active services, pending/confirmed appointments, and successful payments.
* **Service Management:** Create, update, delete, and toggle the active/inactive status of salon services with direct image uploads hosted via ImgBB.
* **Appointment Control:** Review all customer appointment requests, confirm pending bookings, or cancel appointments.
* **User Management:** View registered customers and block/unblock user accounts to enforce platform security.
* **Transaction Monitoring:** View read-only payment transaction records linked to Stripe Checkout sessions.

### 🔐 Security & Architecture
* **Role-Based Access Control (RBAC):** Strict client-side route protection and server-side JWT/session verification middleware separating Customer and Admin privileges.
* **Authentication:** Powered by **Better Auth** supporting Email/Password registration (with strong password validation) and Google OAuth.

---

## 🛠️ Technology Stack

### Frontend (Client)
* **Framework:** Next.js (App Router)
* **Language:** TypeScript / JavaScript
* **Styling & UI:** Tailwind CSS, Responsive Design, Toast Notifications
* **Authentication:** Better Auth Client & Google OAuth

### Backend (Server)
* **Runtime & Framework:** Node.js, Express.js
* **Database:** MongoDB with Mongoose
* **Authentication & Security:** Better Auth, JWT Verification Middleware
* **Payments:** Stripe Checkout & Webhooks
* **Image Hosting:** ImgBB API

---

## ⚙️ Required Environment Variables

Create a `.env.local` file in the **client** root directory and a `.env` file in the **server** root directory. **Never commit `.env` files to GitHub.**

### Client Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_IMGBB_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Server Environment Variables (`.env`)
```env
PORT=
NODE_ENV=
CLIENT_URL=
MONGODB_URI=
JWT_SECRET=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
IMGBB_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 🚀 Installation & Running Locally

### Prerequisites
* Node.js (v18 or higher recommended)
* npm or yarn
* MongoDB Atlas URI or local MongoDB instance
* Stripe Account (Test Mode keys & Stripe CLI for local webhook testing)
* ImgBB API Key & Google OAuth Credentials

---

### 1. Clone the Repositories

```bash
# Clone the client repository
git clone https://github.com/your-username/salonbook-client.git

# Clone the server repository
git clone https://github.com/your-username/salonbook-server.git
```

---

### 2. Setup & Run the Backend (Server)

```bash
# Navigate to the server directory
cd salonbook-server

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# (Fill in your MongoDB, Better Auth, Stripe, Google, and ImgBB variables in .env)

# Start the development server
npm run dev
```
The backend server will start on `http://localhost:5000` (or your configured `PORT`).

*(Optional)* **Testing Stripe Webhooks Locally:**
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

---

### 3. Setup & Run the Frontend (Client)

```bash
# Navigate to the client directory
cd salonbook-client

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# (Fill in your API URL, Better Auth, Google, ImgBB, and Stripe keys in .env.local)

# Start the Next.js development server
npm run dev
```
The frontend application will run on `http://localhost:3000`.

---

## 🗄️ Database Schema Overview

The application uses four core MongoDB collections:
1. **`users`**: Managed by Better Auth (`name`, `email`, `image`, `role`, `isBlocked`).
2. **`services`**: Salon offerings (`serviceName`, `category`, `description`, `price`, `duration`, `image`, `status`, `createdAt`).
3. **`appointments`**: Customer bookings (`serviceId`, `customerId`, `appointmentDate`, `timeSlot`, `message`, `servicePrice`, `paymentStatus`, `status`, `createdAt`).
4. **`transactions`**: Verified Stripe payment logs (`appointmentId`, `customerId`, `amount`, `currency`, `stripeSessionId`, `status`, `createdAt`).

---

## 📄 License

This project was built as part of the **SalonBook (Assignment 9 - Category: 002)** technical assessment.