const User = require("../models/userModel");
const Role = require("../models/roleModel");
const UserToken = require("../models/userTokenModel");
const createError = require("../middleware/error");
const createSuccess = require("../middleware/success");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const otpGenerator = require('otp-generator');



//to signup

// const signUp = async (req, res, next) => {


//   try {
//     const newUser = new User({
//       fullName: req.body.fullName,
//       email: req.body.email,
//       password: req.body.password,
//       phoneNumber: req.body.phoneNumber,
//       confirmPassword: req.body.confirmPassword,
//       state: req.body.state,
//     });
//     await newUser.save();
//     return next(createSuccess(200, "User Registered Successfully"));
//   }
//    catch (error) {
//     return next(createError(500, "Something went wrong"));
//   }
// };
const signUp = async (req, res, next) => {
  try {
    // Check if email already exists in the database
    const existingUser = await User.findOne({ email: req.body.email });
    
    if (existingUser) {
      // If the email is already registered, return an error
      return next(createError(400, "Email is already registered"));
    }

    // If email is not taken, create a new user
    const newUser = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      confirmPassword: req.body.confirmPassword,
      state: req.body.state,
    });

    // Save the new user to the database
    await newUser.save();

    // Return success message
    return next(createSuccess(200, "User Registered Successfully"));
  } catch (error) {
    // Handle errors, such as database or server issues
    return next(createError(500, "Something went wrong"));
  }
};


const login = async (req, res, next) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      // If user is not found
      return next(createError(404, "User Not Found"));
    }
    
    // Check if the provided password matches the user's password
    const isPasswordMatch = user.password === req.body.password;
    
    if (!isPasswordMatch) {
      // If password is incorrect
      return next(createError(404, "Password is Incorrect"));
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin }, // Removed roles and roles-related code
      process.env.JWT_SECRET
    );
    
    // Send response with the token
    res.cookie("access_token", token, { httpOnly: true }).status(200).json({
      status: 200,
      message: "Login Success",
      data: user,
      token,
    });
  } catch (error) {
    // Handle server errors
    return next(createError(500, "Something went wrong"));
  }
};

//Register Admin
const registerAdmin = async (req, res, next) => {
  try {
    const role = await Role.find({});
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      mobileNumber: req.body.mobileNumber,
      jobTitle: req.body.jobTitle,
      isAdmin: true,
      roles: role,
    });
    await newUser.save();
    //return res.status(200).send("User Registered Successfully")
    return next(createSuccess(200, "Admin Registered Successfully"));
  } catch (error) {
    //return res.status(500).send("Something went wrong")
    return next(createError(500, "Something went wrong"));
  }
};

const generateOTP = () => {
  return otpGenerator.generate(6, { upperCase: false, specialChars: false });
};

//send reset mail

const sendEmail = async (req, res, next) => {
  const email = req.body.email;
  const user = await User.findOne({ email: { $regex: "^" + email + "$", $options: "i" } });

  if (!user) {
    return next(createError(404, "User Not found"));
  }

  const otp = generateOTP();
  const expiryTime = Date.now() + 15 * 60 * 1000; // 15 minutes in milliseconds
  
  // Save OTP and expiry time to UserToken model
  const newToken = new UserToken({
    userId: user._id,
    token: otp, // Save OTP as token
    expiry: Date.now() + expiryTime, // Expiry time in milliseconds
  });

  const mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ut.gupta29@gmail.com",
      pass: "yver vjuu fvbb hcot",
    },
  });

  const mailDetails = {
    from: "ut.gupta29@gmail.com",
    subject: "Reset Password Request",
    to: email,
    text: `Your OTP for password reset is: ${otp}`,
    html: `
      <html>
      <head><title>Password Reset Request</title></head>
      <body>
        <h1>Password Reset Request</h1>
        <p>Dear ${user.username},</p>
        <p>We have received a request to reset your password. Use the OTP below to complete the process:</p>
        <p><b>Your OTP:</b> ${otp}</p>
        <p>This OTP is valid for 15 minutes. If you did not request this, please ignore this email.</p>
        <p>Thank you,</p>
        <p>Your Application Team</p>
      </body>
      </html>
    `,
  };

  mailTransporter.sendMail(mailDetails, async (err, data) => {
    if (err) {
      console.log(err);
      return next(createError(500, "Something went wrong"));
    } else {
      console.log("Email sent successfully!");
      await newToken.save(); // Save OTP in the database
      return next(createSuccess(200, "Email Sent Successfully"));
    }
  });
};


// verify OTP
const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email: { $regex: "^" + email + "$", $options: "i" } });

    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Find the OTP entry for this user
    const userToken = await UserToken.findOne({ userId: user._id, token: otp });

    if (!userToken) {
      return next(createError(400, "Invalid or expired OTP"));
    }

    // Check if OTP has expired
    if (userToken.expiry < Date.now()) {
      return next(createError(400, "OTP has expired"));
    }

    // OTP is valid, generate a JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // If OTP is valid, you might want to delete it from the database
    await UserToken.deleteOne({ _id: userToken._id });

    // Send response with token and redirect URL
    res.status(200).json({
      message: "OTP verified successfully",
      token,
      redirectTo: `/resetPassword?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
    });

  } catch (error) {
    next(createError(500, "Internal Server Error"));
  }
};




// Reset Password
const resetPassword = (req, res, next) => {
  const token = req.body.token;
  const newPassword = req.body.password;

  jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
    if (err) {
      return next(createError(500, "Password Reset Link is Expired!"));
    } else {
      const response = data;
      const user = await User.findOne({
        email: { $regex: "^" + response.email + "$", $options: "i" },
      });
      user.password = newPassword;
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $set: user },
          { new: true }
        );

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        return next(createSuccess(200, "Password Reset Success!"));
      } catch (error) {
        return next(
          createError(500, "Something went wrong while resetting the password!")
        );
      }
    }
  });
};


module.exports = {
  signUp,
  login,
  registerAdmin,
  sendEmail,
  resetPassword,
  verifyOTP,
  
};
