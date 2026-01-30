# Isai Café - Full Stack Web Application

A modern, full-stack café website with table reservation system, menu display, and event booking capabilities.

## 🚀 Features

- **Menu Display**: Beautiful animated menu cards with images, descriptions, and prices
- **Table Reservation System**:
  - Real-time table availability checking
  - Seat-locking mechanism to prevent double bookings
  - 5-minute lock timer for reservation confirmation
  - Concurrency-safe booking logic using pessimistic locking
- **User Authentication**: Register and login functionality with JWT tokens
- **Responsive Design**: Mobile-friendly UI with beautiful animations
- **Event Booking**: Book the café for private events

## 🛠 Tech Stack

### Frontend

- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide Icons** - Icon library

### Backend

- **FastAPI** - Python web framework
- **MongoDB** - Database
- **Motor** - Async MongoDB driver
- **JWT** - Authentication
- **Passlib + bcrypt** - Password hashing

## 📦 Installation

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or MongoDB Atlas)

### Backend Setup

1. Navigate to the backend folder:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
```

3. Activate the virtual environment:

```bash
# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Create a `.env` file with your configuration:

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="Cafe-database"
CORS_ORIGINS="http://localhost:3000"
SECRET_KEY="your-super-secret-key-here"
```

6. Seed the database:

```bash
python seed_data.py
```

7. Start the server:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
MONGO_URL=mongodb://localhost:27017
DB_NAME=Cafe-database
```

4. Start the development server:

```bash
npm run dev
```

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Tables

- `GET /api/tables` - Get all tables
- `GET /api/tables/{id}` - Get specific table

### Reservations

- `POST /api/reservations/available-tables` - Check available tables for date/time
- `POST /api/reservations/lock` - Lock a table (5-minute hold)
- `POST /api/reservations/confirm` - Confirm a locked reservation
- `DELETE /api/reservations/{id}/cancel` - Cancel a reservation
- `GET /api/reservations/my` - Get user's reservations

### Menu

- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Add menu item (admin only)

## 🔒 Concurrency-Safe Booking System

The reservation system implements a two-phase booking mechanism:

1. **Lock Phase**: When a user selects a table, it's locked for 5 minutes using pessimistic locking
2. **Confirm Phase**: User confirms the reservation within the lock period
3. **Automatic Cleanup**: Expired locks are automatically released by a background task

### Key Features:

- Pessimistic locking prevents race conditions
- Database indexes for optimal performance
- Atomic operations for data consistency
- Background task for expired lock cleanup

## 🚀 Production Deployment

### Backend (e.g., Railway, Render, or VPS)

1. Set environment variables for production
2. Use a production ASGI server: `gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker`
3. Enable HTTPS
4. Use MongoDB Atlas or a managed MongoDB service

### Frontend (e.g., Vercel, Netlify)

1. Build the production bundle: `npm run build`
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
3. Deploy to your preferred platform

## 📝 Test Credentials

After running `seed_data.py`:

- **Admin**: `admin@lumiere.com` / `admin123`
- **Customer**: `customer@example.com` / `customer123`

## 📁 Project Structure

```
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── seed_data.py       # Database seeding script
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Environment variables
│
└── frontend/
    ├── app/
    │   ├── page.js        # Home page
    │   ├── menu/          # Menu page
    │   ├── reservations/  # Table reservation page
    │   ├── about/         # About page
    │   ├── events/        # Events page
    │   └── contact/       # Contact page
    ├── components/        # Reusable UI components
    └── .env.local         # Environment variables
```

## 📄 License

MIT License - Feel free to use this project for your own café website!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
