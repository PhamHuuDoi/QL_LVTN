import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", {
        username,
        password,
      });
      localStorage.setItem("token", res.data.token);
      setMessage("Login successful!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input
          type="text"
          placeholder="Username"
          className="border p-2 mb-3 w-full"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 mb-3 w-full"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full">
          Login
        </button>
        {message && <p className="mt-3 text-center">{message}</p>}
      </form>
    </div>
  );
}