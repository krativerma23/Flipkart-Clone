import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: String,
  price:       { type: Number, required: true },
  mrp:         { type: Number, required: true },
  images:      [String],
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand:       String,
  stock:       { type: Number, default: 0 },
  ratings:     { type: Number, default: 0 },
  numReviews:  { type: Number, default: 0 },
  specs:       { type: Map, of: String },
  isFeatured:  { type: Boolean, default: false },
}, { timestamps: true });

productSchema.index({ name: 'text', brand: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);
