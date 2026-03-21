const mongoose = require('mongoose');

const CoWorkSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    address:{
        type: String,
        required: [true, 'Please add an address']
    },
    district:{
        type: String,
        required: [true, 'Please add a district']
    },
    province:{
        type: String,
        required: [true, 'Please add a province']
    },
    postalcode:{
        type: String,
        required: [true, 'Please add a postalcode'],
        maxlength: [5, 'Postal Code can not be more than 5 digits']
    },
    tel:{
        type: String
    },
    picture:{
        type: String,
        required: [true, 'Please add a Picture']
    },
    opentime:{
        type: String,
        required: [true, 'Please add an open time'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use HH:mm format'] // ex: 09:00, 18:30
    },
    closetime:{
        type: String,
        required: [true, 'Please add a close time'],
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use HH:mm format']
    }
},{
    toJSON: {virtuals:true},
    toObject: {virtuals:true}
});

CoWorkSchema.virtual('reservations', {
    ref: 'Reservation',
    localField: '_id',
    foreignField: 'cowork',
    justOne: false
});

module.exports=mongoose.model('CoWork',CoWorkSchema);