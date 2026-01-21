# ExoticVeg360 Backend API

Backend API server for the ExoticVeg360 mobile application.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcryptjs for password hashing

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── vegetable.controller.js
│   │   ├── order.controller.js
│   │   ├── specialOrder.controller.js
│   │   └── trader.controller.js
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   └── validate.js       # Request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Vegetable.js
│   │   ├── Order.js
│   │   └── SpecialOrder.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── vegetable.routes.js
│   │   ├── order.routes.js
│   │   ├── specialOrder.routes.js
│   │   └── trader.routes.js
│   └── server.js             # Entry point
├── uploads/                   # File uploads directory
├── .env                       # Environment variables
├── .env.example              # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Setup

### Prerequisites

- Node.js v18 or higher
- MongoDB (local or Atlas)

### Installation

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):

   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env`:

   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/exoticveg360
   JWT_SECRET=your-secret-key-here
   ```

5. Start the server:

   ```bash
   # Development (with hot reload)
   npm run dev

   # Production
   npm start
   ```

## 📚 API Endpoints

### Authentication

| Method | Endpoint             | Description       | Auth |
| ------ | -------------------- | ----------------- | ---- |
| POST   | `/api/auth/register` | Register new user | No   |
| POST   | `/api/auth/login`    | Login user        | No   |
| GET    | `/api/auth/me`       | Get current user  | Yes  |
| PUT    | `/api/auth/password` | Update password   | Yes  |
| POST   | `/api/auth/logout`   | Logout            | Yes  |
| GET    | `/api/auth/verify`   | Verify token      | Yes  |

### Users

| Method | Endpoint             | Description        | Auth  |
| ------ | -------------------- | ------------------ | ----- |
| GET    | `/api/users`         | Get all users      | Admin |
| GET    | `/api/users/:id`     | Get user by ID     | Yes   |
| PUT    | `/api/users/profile` | Update own profile | Yes   |
| PUT    | `/api/users/:id`     | Update user        | Admin |
| DELETE | `/api/users/:id`     | Delete user        | Admin |

### Vegetables

| Method | Endpoint                     | Description        | Auth   |
| ------ | ---------------------------- | ------------------ | ------ |
| GET    | `/api/vegetables`            | Get all vegetables | No     |
| GET    | `/api/vegetables/:id`        | Get vegetable      | No     |
| GET    | `/api/vegetables/categories` | Get categories     | No     |
| POST   | `/api/vegetables`            | Add vegetable      | Trader |
| PUT    | `/api/vegetables/:id`        | Update vegetable   | Trader |
| DELETE | `/api/vegetables/:id`        | Delete vegetable   | Trader |

### Orders

| Method | Endpoint                 | Description    | Auth   |
| ------ | ------------------------ | -------------- | ------ |
| GET    | `/api/orders`            | Get orders     | Yes    |
| GET    | `/api/orders/:id`        | Get order      | Yes    |
| GET    | `/api/orders/stats`      | Get statistics | Yes    |
| POST   | `/api/orders`            | Create order   | Yes    |
| PUT    | `/api/orders/:id/status` | Update status  | Trader |
| PUT    | `/api/orders/:id/cancel` | Cancel order   | Yes    |

### Special Orders

| Method | Endpoint                                  | Description        | Auth   |
| ------ | ----------------------------------------- | ------------------ | ------ |
| GET    | `/api/special-orders`                     | Get special orders | Yes    |
| GET    | `/api/special-orders/:id`                 | Get special order  | Yes    |
| POST   | `/api/special-orders`                     | Create request     | Yes    |
| POST   | `/api/special-orders/:id/quote`           | Submit quote       | Trader |
| PUT    | `/api/special-orders/:id/accept/:quoteId` | Accept quote       | Yes    |
| PUT    | `/api/special-orders/:id/close`           | Close order        | Yes    |

### Traders

| Method | Endpoint                       | Description     | Auth   |
| ------ | ------------------------------ | --------------- | ------ |
| GET    | `/api/traders`                 | Get all traders | No     |
| GET    | `/api/traders/:id`             | Get trader      | No     |
| GET    | `/api/traders/dashboard/stats` | Trader stats    | Trader |
| PUT    | `/api/traders/:id/verify`      | Verify trader   | Admin  |

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## 👥 User Roles

- **buyer**: Regular customers who can browse, order, and create special requests
- **trader**: Vendors who can list vegetables, manage orders, and submit quotes
- **admin**: Full access to all resources and user management

## 🧪 Testing

Test the API using the health endpoint:

```bash
curl http://localhost:3001/api/health
```

## 📝 License

ISC
