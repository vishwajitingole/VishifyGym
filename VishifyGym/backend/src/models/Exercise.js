import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['cardio', 'push', 'pull'], required: true },
    active: { type: Boolean, default: true },
    isSeeded: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

exerciseSchema.index({ name: 1, category: 1 }, { unique: true });
export default mongoose.model('Exercise', exerciseSchema);
