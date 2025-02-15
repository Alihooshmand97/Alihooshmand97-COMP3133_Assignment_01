const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Set the fallback for bcrypt if WebCryptoAPI is unavailable
bcrypt.setRandomFallback(require('crypto').randomBytes);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Hash the password before saving the user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();  // Make sure it's modified
  if (!this.password) {
    throw new Error('Password is required');
  }

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next();
  } catch (err) {
    return next(err);  // Pass error if hashing fails
  }
});

// Method to compare entered password with the stored password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
