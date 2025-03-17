import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: function () { return !this.walletAddress; } // Required for non-MetaMask users
    },
    lname: {
        type: String,
        required: function () { return !this.walletAddress; } // Required for non-MetaMask users
    },
    username: {
        type: String,
        required: function () { return !this.walletAddress; } // Required for non-MetaMask users
    },
    email: {
        type: String,
        unique: true,
        sparse: true 
    },
    password: {
        type: String,
        default: null // Only for credential-based users
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Google users only
    },
    picture: {
        type: String,
        default: '' // Google profile picture
    },
    avatarSrc: {
        type: String,
        default: ''
    },
    birthday:{
        type: Date,
        default: null
    },
    gender:{
        type: String,
        default: null
    },
    phone:{
        type: String,
        default: null
    },
    country:{
        type: String,
        default: null
    },
    walletAddress: {
        type: String,
        unique: true,
        sparse: true // MetaMask users only
    },
    authProvider: {
        type: String,
        enum: ["google", "credentials", "metamask"],
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin", "moderator"],
        default: "user"
    },
    verifyOtp: {
        type: String,
        default: ''
    },
    verifyOtpExpireAt: {
        type: Number,
        default: 0
    },
    isAccountVerified: {
        type: Boolean,
        default: false
    },
    resetOtp: {
        type: String,
        default: ''
    },
    resetOtpExpireAt: {
        type: Number,
        default: 0
    }
}, { timestamps: true });


const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
