import mongoose from "mongoose";

const sliderSchema = new mongoose.Schema({
  heading: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  addedDate: { 
    type: Date, 
    default: Date.now 
  },
  image: {
    data: Buffer,
    contentType: String,
    filename: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  order: {
    type: Number,
    default: 0
  }
});

sliderSchema.index({ addedDate: -1 });
sliderSchema.index({ status: 1, order: 1 });

export default mongoose.model("Slider", sliderSchema);