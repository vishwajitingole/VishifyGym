import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // Local YYYY-MM-DD, one personal log per day
    eggs: { type: Number, default: 0, min: 0 },
    dahiBowls: { type: Number, default: 0, min: 0 },
    waterGlasses: { type: Number, default: 0, min: 0 },
    bodyweight: { type: Number, min: 0 },
    proteinTarget: { type: Number, default: 130 },
    calorieTarget: { type: Number, default: 2400 },
    cardioTargetMinutes: { type: Number, default: 20 },
    notes: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

export default mongoose.model('DailyLog', dailyLogSchema);
