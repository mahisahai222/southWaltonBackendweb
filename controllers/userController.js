const User = require('../models/userModel');

const Role = require('../models/roleModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success');
// to update-password
const updatePassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;


        const user = await User.findById(id);
        if (!user) {
            return next(createError(404, "User not found"))

        }
        user.password = newPassword;
        await user.save();

        return next(createSuccess(200, "password Updated Succesfully", user))
    }
    catch (error) {
        return next(createError(500, "Internal Server Error"))
    }
};




//to Create user 
const register = async (req, res, next) => {
    try {
        const role = await Role.find({ role: 'User' });
        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            mobileNumber: req.body.mobileNumber,
            jobTitle: req.body.jobTitle,
            roles: role
        })
        await newUser.save();
        // return res.status(200).json("User Registered Successfully")
        return next(createSuccess(200, "User Registered Successfully"))
    }
    catch (error) {
        //return res.status(500).send("Something went wrong")
        return next(createError(500, "Something went wrong"))
    }
}
//get users
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        return next(createSuccess(200, "All Users", users));

    } catch (error) {
        return next(createError(500, "Internal Server Error!"))
    }
}
//get user
const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(createError(404, "User Not Found"));
        }
        return next(createSuccess(200, "Single User", user));
    } catch (error) {
        return next(createError(500, "Internal Server Error1"))
    }
}

//update user
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        // const image = req.file ? `http://3.111.163.2:5001/api/user/uploads/${req.file.filename}`:null;
        if (req.file) {
            const host = req.hostname;
            const port = process.env.PORT || 5001;
            imageUrl = `${req.protocol}://${host}:${port}/uploads/${req.file.filename}`;
        }
        console.log('image', imageUrl);
        const updatedData = { ...req.body, image: imageUrl };
        const user = await User.findByIdAndUpdate(id, updatedData, { new: true });
        if (!user) {
            return next(createError(404, "User Not Found"));
        }
        return next(createSuccess(200, "User Details Updated", user));
    } catch (error) {
        return next(createError(500, "Internal Server Error1"))
    }
}

// const updateImage = async (req, res, next) => {
//     try{
//         const {id} = req.params;
//         // const image = req.file ? '/uploads/${req.file.filename}':null;
//         const user = await User.findByIdAndUpdate(id, {image:image});
//         if (!user) {
//             return next(createError(404, "User Not Found"));
//         }
//         return next(createSuccess(200, "Image Updated",user));
//     } catch (error) {
//         return next(createError(500, "Internal Server Error1"))
//     }
// }


//delete user
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return next(createError(404, "User Not Found"));
        }
        return next(createSuccess(200, "User Deleted", user));
    } catch (error) {
        return next(createError(500, "Internal Server Error1"))
    }
}


module.exports = {
    getAllUsers, getUser, deleteUser, updateUser, register,updatePassword
}