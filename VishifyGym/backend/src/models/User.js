import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  proteinTarget: { type: Number, default: 130 },
  calorieTarget: { type: Number, default: 2400 },
  cardioTargetMinutes: { type: Number, default: 20 }
}, { timestamps: true });

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.createUser = async function (name, email, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  return new this({ name, email: email.toLowerCase(), passwordHash }).save();
};

export default mongoose.model('User', userSchema);