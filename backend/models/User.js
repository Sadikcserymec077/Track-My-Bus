const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  registrationId: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'driver', 'student', 'parent'], required: true },
  assignedBusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
  childStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  institution: { type: String, default: 'default' },
  fcmToken: { type: String, default: null },
  isFirstLogin: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save (promise-based, no next() conflicts)
userSchema.pre('save', function () {
  // Validate identifier
  if (!this.phone && !this.registrationId && !this.email) {
    return Promise.reject(new Error('User must have phone, registrationId, or email'));
  }
  // Only hash if password was modified
  if (!this.isModified('password')) return Promise.resolve();
  return bcrypt.hash(this.password, 12).then((hashed) => {
    this.password = hashed;
  });
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
