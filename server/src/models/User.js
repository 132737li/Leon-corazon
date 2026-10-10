const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 80, default: '' },
    // immutable : Mongoose refuse toute modification de l'e-mail après la création
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      immutable: true,
    },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    passwordHash: { type: String, required: true },
    // Photo de profil : petite image JPEG/PNG/WebP encodée en data URL (256x256 côté site)
    photo: { type: String, default: '', maxlength: 300000 },
    resetTokenHash: { type: String, default: '' },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
