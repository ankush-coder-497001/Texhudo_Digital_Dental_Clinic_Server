require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

//middlewares 
app.use(cors());

// Stripe webhook endpoint must be before express.json() middleware
// because Stripe webhooks need the raw body to verify the signature
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const appointmentController = require('./controllers/Appointment.ctrl');
app.post('/webhook', express.raw({type: 'application/json'}), appointmentController.handlePaymentSuccess);

app.use(express.json());

//mongoose connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

//routes
const userRoutes = require('./routes/User.route');
const doctorRoutes = require('./routes/Doctor.route');
const appointmentRoutes = require('./routes/Appointment.route');

app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

//starting the server
const PORT = process.env.PORT || 6600;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});