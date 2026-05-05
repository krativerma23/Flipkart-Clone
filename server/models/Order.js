import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  items: [{
    product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productId: { type: String },   // snapshot — keeps display working if product is deleted
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    mrp:       { type: Number },
    quantity:  { type: Number, required: true, min: 1 },
    image:     { type: String },
  }],

  shippingAddress: {
    fullName: { type: String, required: true },
    phone:    { type: String, required: true },
    street:   { type: String, required: true },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true },
  },

  paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

  status: {
    type:    String,
    enum:    ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'placed',
  },

  total: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
