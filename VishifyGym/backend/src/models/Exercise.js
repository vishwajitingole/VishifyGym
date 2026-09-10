import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['cardio', 'push', 'pull'], required: true },
    active: { type: Boolean, default: true },
    isSeeded: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

exerciseSchema.index({ userId: 1, name: 1, category: 1 }, { unique: true });
exerciseSchema.index({ userId: 1, category: 1, order: 1 });
export default mongoose.model('Exercise', exerciseSchema);