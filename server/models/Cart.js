import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: { type: String },
  name:      { type: String },
  price:     { type: Number },
  mrp:       { type: Number },
  image:     { type: String },
  quantity:  { type: Number, default: 1, min: 1 },
}, { _id: false, strict: false }); // strict:false lets legacy items (product ObjectId) pass through

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);
