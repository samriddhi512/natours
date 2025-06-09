# Natours - Tour Booking Application

A full-stack tour booking application built with Node.js, Express, MongoDB, and modern web technologies. This application allows users to browse, book, and review tours while providing tour operators with a robust management system.

## 🚀 Features

- **User Authentication & Authorization**
  - Secure login/signup system
  - Password reset functionality
  - Role-based access control
  - JWT-based authentication

- **Tour Management**
  - Browse available tours
  - Search and filter tours
  - Detailed tour information
  - Tour booking system
  - Interactive maps with Leaflet
  - Basic image upload

- **User Features**
  - User profile management
  - Tour reviews and ratings
  - Booking history
  - Password updates
  - Basic profile photo upload

- **Security Features**
  - Rate limiting
  - Data sanitization
  - XSS protection
  - MongoDB query injection prevention
  - Secure HTTP headers
  - Password encryption

## 🛠️ Tech Stack

- **Backend**
  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - JWT Authentication
  - Nodemailer for emails
  - Multer for basic file uploads
  - Sharp for basic image resizing

- **Frontend**
  - Pug template engine
  - Parcel bundler
  - Modern JavaScript (ES6+)
  - Leaflet for interactive maps
  - Responsive design

- **Development Tools**
  - ESLint
  - Prettier
  - Nodemon
  - Parcel

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd natours
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `config.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=8000
   DATABASE=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
   DATABASE_PASSWORD=<your-database-password>
   JWT_SECRET=<your-jwt-secret>
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES_IN=90
   EMAIL_USERNAME=<your-email>
   EMAIL_PASSWORD=<your-email-password>
   EMAIL_HOST=<your-smtp-host>
   EMAIL_PORT=<your-smtp-port>
   ```

4. Import development data (optional):
   ```bash
   npm run importData
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm start
```

### Production Mode
```bash
npm run start:prod
```

### Build Frontend Assets
```bash
npm run watch:js  # For development with hot reloading
npm run build:js  # For production build
```

## 📁 Project Structure

```
natours/
├── controllers/     # Route controllers
├── models/         # Database models
├── routes/         # API routes
├── views/          # Pug templates
├── public/         # Static files
│   ├── css/       # Stylesheets
│   ├── js/        # Client-side JavaScript
│   └── img/       # Images
├── utils/          # Utility functions
├── dev-data/       # Development data and import scripts
├── extra-index/    # Additional frontend resources [learning]
├── app.js          # Express app setup
└── server.js       # Server entry point
```

## 🔒 Security Features

- Rate limiting to prevent brute force attacks
- Data sanitization against NoSQL query injection
- XSS protection
- Secure HTTP headers with Helmet
- Password encryption with bcrypt
- JWT-based authentication
- Cookie security

## ⚠️ Security Notes

- All sensitive configuration values should be stored in environment variables
- Never commit API keys or tokens directly in the code
- Review all client-side code for any exposed sensitive information

## 🧪 Development

- **Linting**
  ```bash
  npm run lint
  ```

- **Watch Mode for JavaScript**
  ```bash
  npm run watch:js
  ```

- **Import/Delete Development Data**
  ```bash
  npm run importData  # Import sample data
  npm run deleteData  # Delete sample data
  ```

## 📝 API Documentation

The API follows RESTful principles and is versioned (v1). Main endpoints include:

- `/api/v1/tours` - Tour management
- `/api/v1/users` - User management
- `/api/v1/reviews` - Review management

## 👤 Author

Samriddhi

---

Built with ❤️ using Node.js and Express

