# Smart Clinic Application Server

A comprehensive backend server for managing a modern medical clinic, handling appointments, medical records, pharmacy operations, and user management.

## Features

### User Management
- Multi-user support (Patients, Doctors, Pharmacists, Super Admin)
- Secure authentication using JWT
- Profile management with image upload
- Password reset functionality with OTP verification

### Appointment System
- Online appointment booking
- Unique appointment reference system (APP-XXXX-YYYY-ZZZZ format)
- Appointment status tracking (booked, confirmed, completed, cancelled)
- Treatment records linked to appointments

### Doctor Management
- Schedule management
- Specialization and fees setup
- Patient appointment history
- Earnings tracking and financial reports

### Pharmacy System
- Medicine inventory management
- Stock tracking with low-stock alerts
- Sales management and tracking
- Financial reporting for pharmacy sales

### Security Features
- Password hashing using bcrypt
- JWT-based authentication
- Role-based access control
- Secure file uploads

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Image Storage**: Cloudinary
- **Email Service**: Nodemailer
- **Password Hashing**: bcryptjs

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Cloudinary account
- Gmail account for email services

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd Smart-Clinic-Application-Server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file based on .env.demo:
   ```
   MONGODB_URI = 'your_mongodb_uri'
   PORT = 6000
   JWT_SECRET = 'your_jwt_secret_key'
   JWT_SECRET_EXPIRY = '1h'
   
   GMAIL_COMPANY = 'your_gmail'
   GMAIL_PASSWORD = 'your_app_password'
   
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   SUPER_ADMIN_NAME=Super Admin
   SUPER_ADMIN_EMAIL=admin@smartclinic.com
   SUPER_ADMIN_PASSWORD=your_secure_password
   SUPER_ADMIN_PHONE=1234567890
   ```

4. Create Super Admin account:
   ```bash
   npm run create-admin
   ```

5. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes

#### Users
- POST `/api/users/register` - Register new user
- POST `/api/users/login` - User login
- POST `/api/users/Send-OTP` - Send OTP for password reset
- POST `/api/users/forget-password` - Reset password with OTP

#### Doctors
- POST `/api/doctors/register` - Register new doctor
- POST `/api/doctors/login` - Doctor login
- Similar password reset endpoints as users

#### Pharmacists
- POST `/api/pharmacists/register` - Register new pharmacist
- POST `/api/pharmacists/login` - Pharmacist login
- Similar password reset endpoints as users

### Protected Routes

#### Users/Doctors/Pharmacists
- GET `/api/[users|doctors|pharmacists]/profile` - Get profile
- PUT `/api/[users|doctors|pharmacists]/profile` - Update profile
- POST `/api/[users|doctors|pharmacists]/profile-picture` - Upload profile picture

#### Appointments
- POST `/api/appointments/book` - Book new appointment
- GET `/api/appointments/my-appointments` - List user's appointments
- GET `/api/appointments/details/:id` - Get appointment details
- PUT `/api/appointments/status/:id` - Update appointment status
- DELETE `/api/appointments/:id` - Cancel appointment

#### Medicine Management
- POST `/api/medicines` - Add new medicine
- PUT `/api/medicines/:id` - Update medicine details
- GET `/api/medicines` - List all medicines
- GET `/api/medicines/low-stock` - Get low stock alerts
- POST `/api/medicines/sales` - Record medicine sale

#### Super Admin
- GET `/api/admin/dashboard` - Get dashboard statistics
- GET `/api/admin/users` - List all users
- GET `/api/admin/doctors` - List all doctors
- GET `/api/admin/pharmacists` - List all pharmacists
- GET `/api/admin/financial-report` - Get financial reports

## Error Handling

The API uses consistent error response format:
```json
{
    "success": false,
    "message": "Error description",
    "error": "Detailed error message"
}
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## File Upload

- Supports image uploads for profile pictures
- Uses Cloudinary for image storage
- Maximum file size: 5MB
- Accepted formats: All image formats

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License.