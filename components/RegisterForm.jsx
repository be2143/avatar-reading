"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are necessary.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Profile image is optional

    try {
      const resUserExists = await fetch("api/userExists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const { user } = await resUserExists.json();
      if (user) {
        setError("User already exists.");
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (image) {
        formData.append("image", image);
      }

      const res = await fetch("api/register", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        e.target.reset();
        router.push("/");
      } else {
        console.log("User registration failed.");
        setError("Registration failed.");
      }
    } catch (err) {
      console.log("Error during registration:", err);
      setError("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="flex flex-row items-center gap-2">
      {/* <img src="/app_logo.png" alt="Lab Logo" className="h-36" /> */}
        <img src="/lab_logo.png" alt="Lab Logo" className="w-20 h-20" />
        <img src="/nyu_logo.png" alt="NYU Logo" className="h-16" />
      </div>
      <p className="text-xs text-gray-500 text-center px-4">Welcome to AdaptED Stories! Instantly create and personalize social stories.</p>
      <div className="shadow-lg p-5 rounded-lg">
        <h1 className="text-xl font-bold my-4">Register</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" encType="multipart/form-data">
          <input
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Full Name"
          />
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
          <input
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="Confirm Password"
          />
          <label htmlFor="imageUpload" className="block font-semibold text-gray-700">Profile Image (Optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
          <button className="bg-purple-600 text-white font-bold cursor-pointer px-6 py-2">
            Register
          </button>

          {error && (
            <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
              {error}
            </div>
          )}

          <Link className="text-sm mt-3 text-right" href={"/"}>
            Already have an account? <span className="underline">Login</span>
          </Link>
        </form>
      </div>
    </div>
  );
}
