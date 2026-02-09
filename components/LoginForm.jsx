"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log("Logging in with", email, password);
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      console.log("signIn response", res);

      console.log("signIn response", res);

      if (res.error) {
        setError("Invalid Credentials");
        return;
      }

      router.replace("dashboard");
    } catch (error) {
      console.log(error);
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
        <h1 className="text-xl font-bold my-4">Login</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            placeholder="Email"
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
          <button className="bg-purple-600 text-white font-bold cursor-pointer px-6 py-2">
            Login
          </button>
          {error && (
            <div className="bg-red-500 text-white w-fit text-sm py-1 px-3 rounded-md mt-2">
              {error}
            </div>
          )}

          <Link className="text-sm mt-3 text-right" href={"/register"}>
            Don't have an account? <span className="underline">Register</span>
          </Link>
        </form>
      </div>
    </div>
  );
}
