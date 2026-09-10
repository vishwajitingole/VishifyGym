import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    eggs: { type: Number, default: 0, min: 0 },
    dahiBowls: { type: Number, default: 0, min: 0 },
    waterGlasses: { type: Number, default: 0, min: 0 },
    bodyweight: { type: Number, min: 0 },
    notes: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });
export default mongoose.model('DailyLog', dailyLogSchema);