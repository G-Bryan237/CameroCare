// models/User.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide your first name'],
  },
  lastName: {
    type: String,
    required: [true, 'Please provide your last name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
});

userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;