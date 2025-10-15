import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function Ratings() {
  const { user, authFetch, loading } = useContext(AuthContext);
  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [ratings, setRatings] = useState([]);
  const [form, setForm] = useState({
    lecturer_id: "",
    module: "",
    score: "",
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all lecturers (for students only)
  const fetchLecturers = async () => {
    try {
      const data = await authFetch("http://localhost:5000/api/users/lecturer");
      setLecturers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching lecturers:", err);
      setLecturers([]);
    }
  };

  // Fetch ratings for selected lecturer or logged-in lecturer
  const fetchRatings = async (lecturerId) => {
    if (!lecturerId) return setRatings([]);
    try {
      let data;
      if (user.role === "lecturer") {
        // Lecturer sees ratings submitted for them
        data = await authFetch("http://localhost:5000/api/ratings/my");
      } else {
        // Student sees ratings for the lecturer they selected
        data = await authFetch(`http://localhost:5000/api/ratings/target/${lecturerId}`);
      }
      setRatings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching ratings:", err);
      setRatings([]);
    }
  };

  // Load lecturers if user is student
  useEffect(() => {
    if (user && user.role === "student") fetchLecturers();
  }, [user]);

  // Load ratings automatically if user is lecturer
  useEffect(() => {
    if (user && user.role === "lecturer") {
      setSelectedLecturer(user.id);
      fetchRatings(user.id);
    }
  }, [user]);

  // Handle rating submission (students only)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!form.lecturer_id || !form.module || !form.score) {
      return alert("Please fill all required fields.");
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch("http://localhost:5000/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.message) alert("✅ " + res.message);

      // Reset form but keep lecturer selected
      const currentLecturer = form.lecturer_id;
      setForm({ lecturer_id: currentLecturer, module: "", score: "", comment: "" });
      fetchRatings(currentLecturer); // refresh ratings
    } catch (err) {
      alert("❌ Error submitting rating: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in to access ratings.</p>;

  return (
    <main className="classes-container">
      {/* Student form */}
      {user.role === "student" && (
        <div className="form-card">
          <h2>Submit Rating</h2>
          <form onSubmit={handleSubmit}>
            <select
              value={form.lecturer_id}
              onChange={(e) => {
                setForm({ ...form, lecturer_id: e.target.value });
                setSelectedLecturer(e.target.value);
                fetchRatings(e.target.value);
              }}
              required
            >
              <option value="">-- Select Lecturer --</option>
              {lecturers.map((lect) => (
                <option key={lect.id} value={lect.id}>
                  {lect.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Module Name"
              value={form.module}
              onChange={(e) => setForm({ ...form, module: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Score (1-10)"
              min="1"
              max="10"
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              required
            />

            <textarea
              placeholder="Comment"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />

            <button className="btn" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </button>
          </form>
        </div>
      )}

      {/* Ratings Table */}
      {ratings.length > 0 && (
        <div className="list-card">
          <h2>
            Ratings {user.role === "student"
              ? lecturers.find((l) => l.id === Number(selectedLecturer))?.name
              : ""}
          </h2>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Score</th>
                <th>Comment</th>
                <th>Rater</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((r) => (
                <tr key={r.id}>
                  <td>{r.module}</td>
                  <td>{r.score}</td>
                  <td>{r.comment}</td>
                  <td>{r.rater_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
