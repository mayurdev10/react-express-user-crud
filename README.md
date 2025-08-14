# React Express User CRUD

A modern full-stack user management application demonstrating CRUD operations with authentication. Built with React frontend and Express.js backend, featuring a clean Bootstrap UI and comprehensive form validation.

## 🚀 Features

- **User Authentication**: Secure login/logout system with JWT tokens
- **User Management**: Full CRUD operations (Create, Read, Update, Delete)
- **Role-based Access**: Support for different user roles (user, manager, viewer, admin)
- **Form Validation**: Client-side validation using React Hook Form + Zod
- **Responsive Design**: Modern Bootstrap UI that works on all devices
- **Real-time Updates**: Immediate UI updates after operations
- **Error Handling**: Comprehensive error handling and user feedback
- **Local Storage**: Persistent authentication state
- **Demo Data**: Pre-configured demo user for testing

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **React Hook Form** - Performant forms with validation
- **Zod** - Schema validation
- **Bootstrap 5** - Responsive CSS framework
- **Bootstrap Icons** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **JWT** - JSON Web Token authentication
- **UUID** - Unique identifier generation
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/mayurdev10/react-express-user-crud.git
cd react-express-user-crud
```

### 2. Install backend dependencies
```bash
cd server
npm install
```

### 3. Install frontend dependencies
```bash
cd ../client
npm install
```

## ⚙️ Configuration

### Backend Environment Variables
Create a `.env` file in the `server` directory:
```bash
cp server/env.example server/.env
```
Then edit `server/.env` and update the values:
```env
PORT=4000
JWT_SECRET=your-secret-key-here
```

### Frontend Environment Variables
Create a `.env` file in the `client` directory:
```bash
cp client/env.example client/.env
```
Then edit `client/.env` and update the values:
```env
VITE_API_BASE=http://localhost:4000
```

## 🏃‍♂️ Running the Application

### 1. Start the backend server
```bash
cd server
npm start
```
The server will run on `http://localhost:4000`

### 2. Start the frontend development server
```bash
cd client
npm run dev
```
The frontend will run on `http://localhost:5173`

### 3. Open your browser
Navigate to `http://localhost:5173` to use the application

## 🔐 Default Login Credentials

For demo purposes, you can use these credentials:
- **Email**: `demo@example.com`
- **Password**: `password`

## 📱 Usage

### Authentication
1. **Login**: Use the sign-in form with your credentials
2. **Logout**: Click the logout button in the navigation bar

### User Management
1. **Create User**: Fill out the form on the left panel and click "Create"
2. **View Users**: All users are displayed in the table on the right
3. **Edit User**: Click the "Edit" button next to any user
4. **Delete User**: Click the "Delete" button and confirm the action

## 🏗️ Project Structure

```
react-express-user-crud/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   │   ├── App.jsx        # Main application component
│   │   ├── App.css        # Application styles
│   │   ├── main.jsx       # Application entry point
│   │   └── index.css      # Global styles
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── server/                 # Express.js backend
│   ├── index.js           # Server entry point
│   └── package.json       # Backend dependencies
└── README.md              # This file
```

## 🔧 Available Scripts

### Backend (server directory)
```bash
npm start          # Start the server
npm run dev        # Start the server (same as start)
```

### Frontend (client directory)
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## 🌟 Key Features Explained

### Form Validation
- Uses Zod schemas for type-safe validation
- Real-time validation feedback
- Server-side error handling integration

### Authentication Flow
- JWT token-based authentication
- Secure logout with server communication
- Local storage persistence

### State Management
- React hooks for local state
- Optimistic UI updates
- Proper loading and error states

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in the server `.env` file
   - Update the frontend `VITE_API_BASE` accordingly

2. **CORS errors**
   - Ensure the backend is running before the frontend
   - Check that the API base URL matches the server port

3. **Authentication issues**
   - Clear browser localStorage
   - Check that JWT_SECRET is set in backend


## 📝 License

This project is open source and available under the ISC License.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Express.js](https://expressjs.com/) - Fast, unopinionated, minimalist web framework
- [Bootstrap](https://getbootstrap.com/) - The most popular CSS Framework
- [React Hook Form](https://react-hook-form.com/) - Performant, flexible and extensible forms
- [Zod](https://zod.dev/) - TypeScript-first schema validation

## 📞 Contact

- **GitHub**: [@mayurdev10](https://github.com/mayurdev10)
- **Project Link**: [https://github.com/mayurdev10/react-express-user-crud](https://github.com/mayurdev10/react-express-user-crud)