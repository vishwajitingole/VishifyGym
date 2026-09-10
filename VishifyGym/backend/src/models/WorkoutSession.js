import mongoose from 'mongoose';

const setSchema = new mongoose.Schema(
  {
    reps: { type: Number, min: 0, default: 0 },
    weight: { type: Number, min: 0, default: 0 },
    completed: { type: Boolean, default: true }
  },
  { _id: false }
);

const exerciseLogSchema = new mongoose.Schema(
  {
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    exerciseName: { type: String, required: true },
    sets: { type: [setSchema], default: [] },
    supersetWith: { type: String, default: null },
    maxReps: { type: Number, default: 0 },
    volume: { type: Number, default: 0 }
  },
  { _id: false }
);

const workoutSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    type: { type: String, enum: ['cardio', 'push', 'pull', 'pushups'], required: true },
    durationMinutes: { type: Number, min: 0 },
    speed: { type: Number, min: 0 },
    exerciseLogs: { type: [exerciseLogSchema], default: [] },
    totalVolume: { type: Number, default: 0 },
    completed: { type: Boolean, default: true }
  },
  { timestamps: true }
);

workoutSessionSchema.index({ userId: 1, date: -1, type: 1 });
workoutSessionSchema.index({ userId: 1, 'exerciseLogs.exerciseName': 1, date: -1 });
export default mongoose.model('WorkoutSession', workoutSessionSchema);