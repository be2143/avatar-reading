'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AddStudentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

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
    image: "", // This will hold the base64 string for Cloudinary upload
    userId: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      setFormData(prev => {
        if (prev.userId !== session.user.id) {
          return { ...prev, userId: session.user.id };
        }
        return prev;
      });
    } else if (status === 'unauthenticated') {
      setError("You must be logged in to add a student.");
    }
  }, [session, status, router]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store only the base64 part for Cloudinary
        setFormData(prev => ({ ...prev, image: reader.result.split(",")[1] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (status === 'loading') {
      setError("Authentication still loading. Please wait.");
      setLoading(false);
      return;
    }
    if (!formData.userId) {
      setError("User ID not available. Please ensure you are logged in and try again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/students/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || "Failed to add student");
      }

      setLoading(false);
      // Show success message and redirect
      alert("Student added successfully! Cartoon character generation is in progress and will be available shortly.");
      router.push("/dashboard/students");
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && !formData.userId)) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded shadow text-center text-gray-700">
        <p>Loading user session...</p>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded shadow text-center text-red-600">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You must be logged in to add a student.</p>
        <button onClick={() => router.push('/')} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="mt-10 mb-10 max-w-xl mx-auto p-6 bg-white rounded shadow">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 transition-colors duration-200 flex items-center gap-1 text-sm font-medium"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      <h1 className="text-2xl font-bold text-purple-700 mb-6">Add New Student</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Student's Name"
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age <span className="text-red-500">*</span></label>
          <input
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            type="number"
            placeholder="Age"
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">Diagnosis <span className="text-red-500">*</span></label>
          <input
            id="diagnosis"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            placeholder="Diagnosis (e.g., Autism Spectrum Disorder)"
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">Birthday</label>
          <input
            id="birthday"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
            type="date"
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="guardian" className="block text-sm font-medium text-gray-700">Guardian's Name</label>
          <input
            id="guardian"
            name="guardian"
            value={formData.guardian}
            onChange={handleChange}
            placeholder="Guardian's Name"
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact Number/Email</label>
          <input
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Guardian Contact"
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="comprehensionLevel" className="block text-sm font-medium text-gray-700">Comprehension Level (School Equivalent) <span className="text-red-500">*</span></label>
          <select
            id="comprehensionLevel"
            name="comprehensionLevel"
            value={formData.comprehensionLevel}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select level</option>
            <option value="prek_k">Pre-K / Kindergarten</option>
            <option value="early_elementary">Early Elementary (Grades 1-2)</option>
            <option value="mid_elementary">Mid Elementary (Grades 3-5)</option>
            <option value="middle_school">Middle School (Grades 6-8)</option>
            <option value="high_school">High School (Grades 9-12)</option>
            <option value="post_secondary">Post-Secondary / Adult</option>
          </select>
        </div>
        <div>
          <label htmlFor="preferredStoryLength" className="block text-sm font-medium text-gray-700">Preferred Story Length <span className="text-red-500">*</span></label>
          <select
            id="preferredStoryLength"
            name="preferredStoryLength"
            value={formData.preferredStoryLength}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select length</option>
            <option value="very_short">Very Short (~5 sentences)</option>
            <option value="short">Short (1-2 paragraphs)</option>
            <option value="medium">Medium (3-5 paragraphs)</option>
            <option value="long">Long (More than 5 paragraphs)</option>
          </select>
        </div>
        <div>
          <label htmlFor="preferredSentenceLength" className="block text-sm font-medium text-gray-700">Preferred Sentence Length <span className="text-red-500">*</span></label>
          <select
            id="preferredSentenceLength"
            name="preferredSentenceLength"
            value={formData.preferredSentenceLength}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select length</option>
            <option value="very_short">Very Short (1-5 words)</option>
            <option value="short">Short (6-10 words)</option>
            <option value="medium">Medium (11-15 words)</option>
            <option value="long">Long (More than 15 words)</option>
          </select>
        </div>
        <div>
          <label htmlFor="learningPreferences" className="block text-sm font-medium text-gray-700">Learning Preferences <span className="text-red-500">*</span></label>
          <textarea
            id="learningPreferences"
            name="learningPreferences"
            value={formData.learningPreferences}
            onChange={handleChange}
            placeholder="e.g., Visual aids, auditory instructions, hands-on activities"
            rows="3"
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="interests" className="block text-sm font-medium text-gray-700">Interests <span className="text-red-500">*</span></label>
          <textarea
            id="interests"
            name="interests"
            value={formData.interests}
            onChange={handleChange}
            placeholder="e.g., Animals, space, music, sports"
            rows="3"
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="challenges" className="block text-sm font-medium text-gray-700">Challenges <span className="text-red-500">*</span></label>
          <textarea
            id="challenges"
            name="challenges"
            value={formData.challenges}
            onChange={handleChange}
            placeholder="e.g., Difficulty with social cues, sensory sensitivities"
            rows="3"
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="goals" className="block text-sm font-medium text-gray-700">Goals <span className="text-red-500">*</span></label>
          <textarea
            id="goals"
            name="goals"
            value={formData.goals}
            onChange={handleChange}
            placeholder="e.g., Improve communication skills, manage emotions"
            rows="3"
            required
            className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Additional Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any other relevant information about the student"
            rows="4" className="w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="imageUpload" className="block mb-1 font-semibold text-gray-700">Student Image <span className="text-red-500">*</span>:</label>
          <input id="imageUpload" type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2 border border-gray-300 rounded" required />
          {imageFile && (
            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="mt-2 max-h-40 rounded object-cover" />
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !formData.userId || !formData.image || !formData.age || !formData.diagnosis}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Adding Student & Generating Cartoon..." : "Add Student"}
        </button>
        {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
      </form>
    </div>
  );
}