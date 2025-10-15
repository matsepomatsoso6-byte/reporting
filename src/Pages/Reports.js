import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

export default function Reports() {
  const { user, authFetch, loading } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [prls, setPrls] = useState([]);
  const [form, setForm] = useState({
    class_id: "",
    topic_taught: "",
    actual_students_present: "",
    prl_id: "",
  });
  const [feedbacks, setFeedbacks] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔄 Fetch reports
  const fetchReports = async () => {
    try {
      const data = await authFetch("http://localhost:5000/api/reports");
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching reports:", err.message);
      setReports([]);
    }
  };

  // 📚 Fetch classes (lecturer’s assigned ones)
  const fetchClasses = async () => {
    try {
      const data = await authFetch("http://localhost:5000/api/my-classes");
      setClasses(Array.isArray(data) ? data : []);
    } catch {
      setClasses([]);
    }
  };

  // 👨‍🏫 Fetch PRLs for dropdown (✅ fixed route)
  const fetchPRLs = async () => {
    try {
      const data = await authFetch("http://localhost:5000/api/users/prl");
      setPrls(Array.isArray(data) ? data : []);
    } catch {
      setPrls([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchReports();
    if (user.role === "lecturer") {
      fetchClasses();
      fetchPRLs();
    }
  }, [user]);

  // 🧾 Handle lecturer report submission
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch("http://localhost:5000/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.message) alert("✅ " + res.message);
      setForm({ class_id: "", topic_taught: "", actual_students_present: "", prl_id: "" });
      await fetchReports(); // refresh list
    } catch (err) {
      alert("❌ Error submitting report: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 💬 Handle PRL feedback
  const handleFeedback = async (id) => {
    try {
      await authFetch(`http://localhost:5000/api/reports/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedbacks[id], status: "reviewed" }),
      });
      setFeedbacks((prev) => ({ ...prev, [id]: "" }));
      await fetchReports(); // refresh list
    } catch (err) {
      alert("❌ Error submitting feedback: " + err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in to view reports.</p>;

  return (
    <main className="classes-container">
      {/* 🧾 Lecturer Report Form */}
      {user.role === "lecturer" && (
        <div className="form-card">
          <h2>Submit Report</h2>
          <form onSubmit={handleSubmitReport}>
            <select
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              required
            >
              <option value="">-- Select Class --</option>
              {classes.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name} ({cl.course_name})
                </option>
              ))}
            </select>

            <input
              placeholder="Topic Taught"
              value={form.topic_taught}
              onChange={(e) => setForm({ ...form, topic_taught: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Actual Students Present"
              value={form.actual_students_present}
              onChange={(e) =>
                setForm({ ...form, actual_students_present: e.target.value })
              }
              required
            />

            <select
              value={form.prl_id}
              onChange={(e) => setForm({ ...form, prl_id: e.target.value })}
              required
            >
              <option value="">-- Select PRL --</option>
              {prls.map((prl) => (
                <option key={prl.id} value={prl.id}>
                  {prl.name}
                </option>
              ))}
            </select>

            <button className="btn" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      )}

      {/* 📊 Reports Table */}
      <div className="list-card">
        <h2>Reports</h2>
        {reports.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Course</th>
                <th>Topic</th>
                <th>Students Present</th>
                <th>Status</th>
                <th>PRL</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.class_name}</td>
                  <td>{r.course_name}</td>
                  <td>{r.topic_taught}</td>
                  <td>{r.actual_students_present}</td>
                  <td>{r.status}</td>
                  <td>{r.prl_name || "—"}</td>
                  <td>
                    {user.role === "prl" ? (
                      <>
                        <input
                          value={feedbacks[r.id] || ""}
                          onChange={(e) =>
                            setFeedbacks((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                          placeholder="Enter feedback"
                        />
                        <button
                          className="btn"
                          onClick={() => handleFeedback(r.id)}
                        >
                          Submit
                        </button>
                      </>
                    ) : (
                      r.prl_feedback || "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No reports yet.</p>
        )}
      </div>
    </main>
  );
}
