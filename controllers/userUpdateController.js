import userModel from "../models/userModel.js"

export const updatefname = async (req, res) =>{
    try{
        const {fname} = req.body
        const user = await userModel.findById(req.user.id) // req.user.id is set by the userAuth middleware
        if(!user) return res.status(404).json({success: false, message: "User not found"});
        user.fname = fname
        await user.save()
        res.status(200).json({success: true, message: "First name updated successfully"})
    }catch(error){
        return res.status(500).json({success: false, message: error.message});
    }
}

export const updatelname = async (req, res) =>{
    try{
        const {lname} = req.body
        const user = await userModel.findById(req.user.id) 
        if(!user) return res.status(404).json({success: false, message: "User not found"});
        user.lname = lname
        await user.save()
        res.status(200).json({success: true, message: "Last name updated successfully"})
    }catch(error){
        return res.status(500).json({success: false, message: error.message});
    }
}

export const updateUsername = async (req, res) =>{
    try{
        const {username} = req.body
        const user = await userModel.findById(req.user.id) 
        if(!user) return res.status(404).json({success: false, message: "User not found"});
        user.username = username
        await user.save()
        res.status(200).json({success: true, message: "User name updated successfully"})
    }catch(error){
        return res.status(500).json({success: false, message: error.message});
    }
}

export const updateGender = async (req, res) =>{
    try{
        const {gender} = req.body
        const user = await userModel.findById(req.user.id) 
        if(!user) return res.status(404).json({success: false, message: "User not found"});
        user.gender = gender
        await user.save()
        res.status(200).json({success: true, message: "Gender updated successfully"})
    }catch(error){
        return res.status(500).json({success: false, message: error.message});
    }
}

export const updateBirthday = async (req, res) =>{
    try{
        const {birthday} = req.body
        const user = await userModel.findById(req.user.id) 
        if(!user) return res.status(404).json({success: false, message: "User not found"});
        user.birthday = birthday
        await user.save()
        res.status(200).json({success: true, message: "Birthday updated successfully"})
    }catch(error){
        return res.status(500).json({success: false, message: error.message});
    }
}