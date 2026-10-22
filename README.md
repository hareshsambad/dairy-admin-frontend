# 🥛 Milk Management — Admin Panel Frontend

Modern React 19 + Vite + Tailwind CSS admin dashboard for dairy distributors to manage customers, track milk deliveries, and send automated billing notifications via WhatsApp Business API.

## Features

- **Dashboard & Analytics:** Overview of customers, daily milk liters, daily revenue, and average price per liter.
- **Customer Management:** View, sort, search, and manage customer records and unique account IDs.
- **WhatsApp Cloud API Integration:**
  - **Daily Milk Update:** Send instant delivery confirmations (liters, session, rate, and amount).
  - **Monthly Billing Statement:** Generate monthly billing summaries with net payable totals and payment instructions.
- **Authentication:** Protected admin dashboard routes using JWT authentication.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS + Radix UI primitives
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Deployment:** Vercel

## Environment Configuration

- `VITE_API_BASE_URL`: Base URL for the NestJS dairy backend API.
