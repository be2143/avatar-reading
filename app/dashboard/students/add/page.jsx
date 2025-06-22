'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddStudentPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    diagnosis: "",
    birthday: "",
    guardian: "",
    contact: "",
    comprehensionLevel: "",
    preferredStoryLength: "",
    preferredSentenceLength: "",
    learningPreferences: "",
    interests: "",
    challenges: "",
    goals: "",
    notes: "",
    image: "", // base64 string for now
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result.split(",")[1] })); // base64 without metadata prefix
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add student");
      }

      setLoading(false);
      router.push("/dashboard/students"); // or wherever you want to redirect after add
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Add New Student</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="age"
          value={formData.age}
          onChange={handleChange}
          type="number"
          placeholder="Age"
          className="w-full p-2 border rounded"
        />
        <input
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          placeholder="Diagnosis"
          className="w-full p-2 border rounded"
        />
        <input
          name="birthday"
          value={formData.birthday}
          onChange={handleChange}
          type="date"
          placeholder="Birthday"
          className="w-full p-2 border rounded"
        />
        <input
          name="guardian"
          value={formData.guardian}
          onChange={handleChange}
          placeholder="Guardian"
          className="w-full p-2 border rounded"
        />
        <input
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          placeholder="Contact"
          className="w-full p-2 border rounded"
        />
        <input
          name="comprehensionLevel"
          value={formData.comprehensionLevel}
          onChange={handleChange}
          placeholder="Comprehension Level"
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="preferredStoryLength"
          value={formData.preferredStoryLength}
          onChange={handleChange}
          placeholder="Preferred Story Length"
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="preferredSentenceLength"
          value={formData.preferredSentenceLength}
          onChange={handleChange}
          placeholder="Preferred Sentence Length"
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="learningPreferences"
          value={formData.learningPreferences}
          onChange={handleChange}
          placeholder="Learning Preferences"
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="interests"
          value={formData.interests}
          onChange={handleChange}
          placeholder="Interests"
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="challenges"
          value={formData.challenges}
          onChange={handleChange}
          placeholder="Challenges"
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="goals"
          value={formData.goals}
          onChange={handleChange}
          placeholder="Goals"
          required
          className="w-full p-2 border rounded"
        />
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Notes"
          required
          className="w-full p-2 border rounded"
        />
        
        {/* Image Upload */}
        <div>
          <label className="block mb-1 font-semibold">Student Image (optional):</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imageFile && (
            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="mt-2 max-h-40 rounded" />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
        >
          {loading ? "Adding..." : "Add Student"}
        </button>

        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  );
}
