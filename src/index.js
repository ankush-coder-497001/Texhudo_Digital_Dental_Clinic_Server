require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

//middlewares 
app.use(cors());
app.use(express.json());

//mongoose connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

//routes
const userRoutes = require('./routes/User.route');
const doctorRoutes = require('./routes/Doctor.route');
const appointmentRoutes = require('./routes/Appointment.route');
const pharmacistRoutes = require('./routes/Pharmacist.route');
const medicineRoutes = require('./routes/Medicine.route');
const superAdminRoutes = require('./routes/SuperAdmin.route');

app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/pharmacists', pharmacistRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/admin', superAdminRoutes);

//starting the server
const PORT = process.env.PORT || 6600;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});