// require('dotenv').config();
require('dotenv').config()
const express = require('express') 
const path = require('path');
const mongoose = require('mongoose')
// const companyLoginRoutes = require('./routes/companyLoginRoutes')
const roleRoute = require('./routes/roleRoute')
const authRoute = require('./routes/authRoute')
const userRoute = require('./routes/userRoute')
const signRoutes = require('./routes/signRoute');
const vehicleRoutes = require('./routes/vehicleRoute');
const contactRoutes = require('./routes/contactUsRoute');
const checkoutRoutes= require('./routes/checkoutRoute')
const payment = require('./routes/paymentRoute');
const pay=require('./routes/payRoute');


//

const bodyParser = require('body-parser')
// const itemInventoryRoute = require('./routes/itemInventoryRoute')
// const errorMiddleware = require('./middleware/errorMiddleware')
const PORT = process.env.PORT || 5000
const MONGO_URL = process.env.MONGO_URL
const FRONTEND = process.env.FRONTEND
const cookieParser = require('cookie-parser')
var cors = require('cors')
var app = express();
var corsOptions = {
    origin: "*",
    methods:"GET,POST, PUT, DELETE",
    // some legacy browsers (IE11, various SmartTVs) choke on 204
    Credentials: true
}
app.use(bodyParser.json());
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
// app.use('/api/login', companyLoginRoutes)
//to create roles
app.use('/api/role', roleRoute)
//to register and login
app.use('/api/auth', authRoute)
//to list users
app.use('/api/user', userRoute)

app.use('/api/sign', signRoutes);

app.use('/api/vehicle', vehicleRoutes);

// to create bookingForm

app.use('/api/book',checkoutRoutes)

// to create contactForm
app.use('/api/create',contactRoutes)

//payment creation

app.use('/api/payment',payment);
app.use('',pay);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Response handler Middleware

app.use((obj, req, res, next) => {
    const statusCode = obj.status || 5000;
    const message = obj.message || "Something went wrong!";
    return res.status(statusCode).json({
        success: [200, 201, 204].some(a => a === obj.status) ? true : false,
        status: statusCode,
        message: message,
        data: obj.data
    })
})
// app.use(errorMiddleware);

//database connect

mongoose.set("strictQuery", false)
mongoose.
    connect(MONGO_URL)
    .then(() => {
        console.log('connected to MongoDB')
        app.listen(PORT, () => {
            console.log(`Node API app is running on port ${PORT}`)
        });
    }).catch((error) => {
        console.log(error)
    })
