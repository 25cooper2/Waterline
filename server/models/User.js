import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, default: null },
  surname: { type: String, default: null },
  displayName: { type: String, default: null },
  username: { type: String, unique: true, sparse: true, lowercase: true },
  bio: { type: String, default: null, maxlength: 200 },
  avatarColor: { type: String, default: '165' },
  profilePhotoUrl: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  blockedBoats: [String],
  blockedUsers: [mongoose.Schema.Types.ObjectId],
  hiddenUsers: [mongoose.Schema.Types.ObjectId],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  mooringLat: { type: Number, default: null },
  mooringLng: { type: Number, default: null },
  mooringLocation: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.passwordHash);
};

// Return user without password
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', userSchema);
