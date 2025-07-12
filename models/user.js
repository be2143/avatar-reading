// import mongoose, { Schema, models } from "mongoose";

// const userSchema = new Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true },
//     password: { type: String, required: true },
//     image: { type: String, required: false },
//   },
//   { timestamps: true, strict: true } 
// );

// const User = models.User || mongoose.model("User", userSchema);
// export default User;

import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String },

    students: [
      { type: Schema.Types.ObjectId, ref: "Student" }
    ],
  },
  { timestamps: true, strict: true }
);

const User = models.User || mongoose.model("User", userSchema);
export default User;
