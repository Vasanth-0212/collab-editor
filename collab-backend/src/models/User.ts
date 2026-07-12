import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: String,
  image: String,

  googleId: String,

  emailVerified: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("User", UserSchema);