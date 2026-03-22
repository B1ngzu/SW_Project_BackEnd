const Reservation = require('../models/Reservation');

const CoWork = require('../models/CoWork');


//@desc     Get all reservations
//@route    GET /api/v1/reservations
//@access   Public
exports.getReservations = async (req, res, next) => {
    let query;
    //General users can see only their reservations!
    if(req.user.role !== 'admin'){
        query = Reservation.find({user: req.user.id}).populate({
            path: 'cowork',
            select: 'name address district province postalcode tel opentime closetime picture'
        });

    } else { //If you are an admin, you can see all!
       if (req.params.coworkId) {
            console.log(req.params.coworkId);
            query = Reservation.find({ cowork: req.params.coworkId }).populate({
                path: "cowork",
                select: "name address district province postalcode tel opentime closetime"
            });
       }else{
            query = Reservation.find().populate({
                path: 'cowork',
                select: 'name address district province postalcode tel opentime closetime picture'
            });
       }
    }

    try {
        const reservations = await query;
        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Cannot find Reservation"});
    }
};


//@desc     Get single reservation
//@route    GET /api/v1/reservations/:id
//@access   Public
exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'cowork',
            select: 'name address district province postalcode tel opentime closetime picture'
        });

        if(!reservation){
            return res.status(404).json({success:false, message:`No reservation with the id of ${req.params.id}`});
        }

        res.status(200).json({
            success:true,
            data: reservation
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, message:"Cannot find Reservation"});
    }
};

//@desc     Add reservation
//@route    POST /api/v1/coworks/:coworkId/reservation
//@access   Private
exports.addReservation = async (req, res, next) => {
    try {
        // ดึง coworkId จาก URL มาใส่ใน req.body เพื่อเตรียมเซฟลง Database
        req.body.cowork = req.params.coworkId;

        // ค้นหาว่า cowork นี้มีอยู่จริงไหม
        const cowork = await CoWork.findById(req.params.coworkId);

        if (!cowork) {
            return res.status(404).json({
                success: false,
                message: `No cowork with the id of ${req.params.coworkId}`
            });
        }

        //add user Id to req.body
        req.body.user=req.user.id;

        //Check for existed reservation
        const existedReservations=await Reservation.find({user:req.user.id ,status:'active'});

        //If the user is not an admin, they can only create 3 reservation.
        if(existedReservations.length >= 3 && req.user.role !== 'admin'){
            return res.status(400).json({success:false,message:`The user with ID ${req.user.id} has already made 3 reservations`});
        }


        // สร้างการนัดหมายใหม่
        const reservation = await Reservation.create(req.body);

        res.status(200).json({
            success: true,
            data: reservation
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot create Reservation"
        });
    }
};

//@desc     Update reservation
//@route    PUT /api/v1/reservations/:id
//@access   Private
exports.updateReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false, 
                message: `No reservation with the id of ${req.params.id}`
            });
        }

        //Make sure user is the reservation owner
        if(reservation.user.toString()!== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success:false,message:`User ${req.user.id} is not authorized to update this reservation`});
        }

        if (reservation.status === 'cancelled') {
            return res.status(400).json({
            success:false,
            message:"Cannot update cancelled reservation"
            });
        }


        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false, 
            message: "Cannot update Reservation"
        });
    }
};

//@desc     Delete reservation
//@route    DELETE /api/v1/reservations/:id
//@access   Private
exports.deleteReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: `No reservation with the id of ${req.params.id}`
            });
        }

        //Make sure user is the reservation owner
        if(reservation.user.toString()!== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success:false,message:`User ${req.user.id} is not authorized to delete this reservation`});
        }



        await reservation.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Cannot delete Reservation"
        });
    }
};


//@desc     Cancel reservation
//@route    PUT /api/v1/reservations/:id/cancel
//@access   Private
exports.cancelReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found"
            });
        }

        // เช็คสิทธิ์ (เจ้าของ หรือ admin)
        if (
            reservation.user.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(401).json({
                success: false,
                message: "Not authorized"
            });
        }

        // ถ้าถูก cancel ไปแล้ว
        if (reservation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Reservation already cancelled"
            });
        }

        reservation.status = 'cancelled';
        await reservation.save();

        res.status(200).json({
            success: true,
            data: reservation
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Cannot cancel reservation"
        });
    }
};


















