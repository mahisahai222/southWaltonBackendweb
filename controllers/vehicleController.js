const Vehicle = require("../models/vehicleModel")
const getVehicles = async (req, res) => {
    try {
        let vehicles = await Vehicle.find();
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const changeStatus = async(req,res) => {
    try {
        const { id } = req.params;
        // const { Addtocart } = req.body;
        // const newStatus = Addtocart === true ? false : true;
        const vehicle = await Vehicle.findById(id);
        const newStatus = true;
        console.log('status', newStatus);
        const updatedData = await Vehicle.findByIdAndUpdate(
            id,
            { Addtocart: newStatus },  // Fixed syntax here
            { new: true }  // This option returns the updated document
        );
        if (!updatedData) {
            return res.status(404).json({
                 message: 'Vehicle not found'
                });
        }
        res.json(updatedData);  // Respond with the updated data
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const removecart = async(req,res) => {
    try {
        const { id } = req.params;
        // const { Addtocart } = req.body;
        // const newStatus = Addtocart === true ? false : true;
        const vehicle = await Vehicle.findById(id);
        const newStatus = false;
        console.log('status', newStatus);
        const updatedData = await Vehicle.findByIdAndUpdate(
            id,
            { Addtocart: newStatus },  // Fixed syntax here
            { new: true }  // This option returns the updated document
        );
        if (!updatedData) {
            return res.status(404).json({
                 message: 'Vehicle not found'
                });
        }
        res.json(updatedData);  // Respond with the updated data
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getVehicles, changeStatus, removecart
}

