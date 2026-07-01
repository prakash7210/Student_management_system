import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function getApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL || "/api/students";
  const trimmedUrl = configuredUrl.replace(/\/$/, "");

  return trimmedUrl.endsWith("/api/students") ? trimmedUrl : `${trimmedUrl}/api/students`;
}

const API_URL = getApiUrl();

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  age: "",
  course: "",
};

async function apiRequest(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (text && contentType.includes("application/json")) {
    data = JSON.parse(text);
  } else if (text.trim().toLowerCase().startsWith("<!doctype html")) {
    throw new Error(
      "The app received the frontend HTML instead of the backend API. Set VITE_API_URL to your backend /api/students URL and rebuild.",
    );
  } else if (text) {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}.`);
  }

  return data;
}

function getErrorMessage(error) {
  if (error.message === "Failed to fetch") {
    return "Could not connect to the backend. Start the backend server on port 5000, then try again.";
  }

  if (error instanceof SyntaxError) {
    return "The backend returned an invalid response. Please restart the backend and try again.";
  }

  return error.message || "Something went wrong.";
}

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const sortedStudents = useMemo(
    () =>
      [...students].sort((first, second) =>
        first.name.localeCompare(second.name, undefined, { sensitivity: "base" }),
      ),
    [students],
  );

  async function fetchStudents() {
    setLoading(true);
    setMessage("");

    try {
      const data = await apiRequest(API_URL);

      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      ...form,
      age: Number(form.age),
    };

    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const method = editingId ? "PUT" : "POST";

    try {
      await apiRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setMessage(editingId ? "Student updated successfully." : "Student added successfully.");
      resetForm();
      fetchStudents();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(student) {
    setEditingId(student._id);
    setForm({
      name: student.name,
      email: student.email,
      phone: student.phone,
      age: student.age,
      course: student.course,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteStudent(id) {
    setMessage("");

    try {
      await apiRequest(`${API_URL}/${id}`, { method: "DELETE" });

      setStudents((current) => current.filter((student) => student._id !== id));
      setMessage("Student deleted successfully.");

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="app">
      <section className="topbar">
        <div>
          <p className="eyebrow">Student Management</p>
          <h1>Manage student records</h1>
        </div>
        <button className="secondary-button" onClick={fetchStudents} type="button">
          Refresh
        </button>
      </section>

      {message && <p className="notice">{message}</p>}

      <section className="content-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>{editingId ? "Edit student" : "Add student"}</h2>
            {editingId && (
              <button className="text-button" onClick={resetForm} type="button">
                Cancel
              </button>
            )}
          </div>

          <label>
            Name
            <input name="name" onChange={handleChange} required value={form.name} />
          </label>

          <label>
            Email
            <input name="email" onChange={handleChange} required type="email" value={form.email} />
          </label>

          <label>
            Phone
            <input name="phone" onChange={handleChange} required value={form.phone} />
          </label>

          <label>
            Age
            <input min="1" name="age" onChange={handleChange} required type="number" value={form.age} />
          </label>

          <label>
            Course
            <input name="course" onChange={handleChange} required value={form.course} />
          </label>

          <button className="primary-button" disabled={saving} type="submit">
            {saving ? "Saving..." : editingId ? "Update student" : "Add student"}
          </button>
        </form>

        <section className="panel list-panel">
          <div className="panel-heading">
            <h2>Students</h2>
            <span>{students.length} total</span>
          </div>

          {loading ? (
            <p className="muted">Loading students...</p>
          ) : sortedStudents.length === 0 ? (
            <p className="muted">No students found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Age</th>
                    <th>Course</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student) => (
                    <tr key={student._id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.phone}</td>
                      <td>{student.age}</td>
                      <td>{student.course}</td>
                      <td>
                        <div className="actions">
                          <button onClick={() => startEdit(student)} type="button">
                            Edit
                          </button>
                          <button className="danger-button" onClick={() => deleteStudent(student._id)} type="button">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
