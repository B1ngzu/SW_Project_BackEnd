const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

//Load env vars
dotenv.config({path:'./config/config.env'});

const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');



//route file
const coworks = require('./routes/coworks');
const reservations = require('./routes/reservations');
const auth = require('./routes/auth');





//connect to database
connectDB();

const app=express();

app.set('query parser','extended')

app.use(cors());

//Body parser
app.use(express.json());

//Cookie parser
app.use (cookieParser());


app.use('/api/v1/coworks',coworks);
app.use('/api/v1/reservations',reservations);
app.use('/api/v1/auth',auth);



const PORT=process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));



//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    //Close server & exit process
    server.close(() => process.exit(1));
});
