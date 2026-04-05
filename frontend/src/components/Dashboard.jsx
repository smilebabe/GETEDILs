import React, { useEffect, useState } from "react";
import { registry } from "../core/Registry";
import { useAuth } from "../hooks/useAuth";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import * as XLSX from "xlsx"; // Excel export library

export default function Dashboard() {
  const { user, role } = useAuth();
  const [pillars, setPillars] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [states, setStates] = useState([]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubPillars = registry.on("pillars", (payload) => {
      setPillars((prev) => {
        if (payload.eventType === "INSERT") return [...prev, payload.new];
        if (payload.eventType === "UPDATE")
          return prev.map((p) => (p.id === payload.new.id ? payload.new : p));
        if (payload.eventType === "DELETE")
          return prev.filter((p) => p.id !== payload.old.id);
        return prev;
      });
    });

    const unsubLessons = registry.on("lessons", (payload) => {
      setLessons((prev) => {
        if (payload.eventType === "INSERT") return [...prev, payload.new];
        if (payload.eventType === "UPDATE")
          return prev.map((l) => (l.id === payload.new.id ? payload.new : l));
        if (payload.eventType === "DELETE")
          return prev.filter((l) => l.id !== payload.old.id);
        return prev;
      });
    });

    const unsubStates = registry.on("states", (payload) => {
      setStates((prev) => {
        if (payload.eventType === "INSERT") return [...prev, payload.new];
        if (payload.eventType === "UPDATE")
          return prev.map((s) => (s.id === payload.new.id ? payload.new : s));
        if (payload.eventType === "DELETE")
          return prev.filter((s) => s.id !== payload.old.id);
        return prev;
      });
    });

    return () => {
      unsubPillars();
      unsubLessons();
      unsubStates();
    };
  }, []);

  if (!user) {
    return <p style={{ color: "white" }}>You must be logged in to view the dashboard.</p>;
  }

  // Chart data
  const pillarData = pillars.map((p) => ({ name: p.name, value: p.description.length }));
  const lessonData = lessons.map((l) => ({ subject: l.subject, step: l.step }));
  const stateData = states.reduce((acc, s) => {
    acc[s.state] = (acc[s.state] || 0) + 1;
    return acc;
  }, {});
  const stateChartData = Object.entries(stateData).map(([state, count]) => ({ name: state, value: count }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA66CC"];

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ["Metric", "Count"],
      ["Pillars", pillars.length],
      ["Lessons", lessons.length],
      ["States", states.length],
      [],
      ["Pillar Name", "Description Length"],
      ...pillarData.map((p) => [p.name, p.value]),
      [],
      ["Lesson Subject", "Step"],
      ...lessonData.map((l) => [l.subject, l.step]),
      [],
      ["State", "Count"],
      ...stateChartData.map((s) => [s.name, s.value]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((r) => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "dashboard_report.csv";
    link.click();
  };

  // Export Excel (XLSX)
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Metric", "Count"],
      ["Pillars", pillars.length],
      ["Lessons", lessons.length],
      ["States", states.length],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // Pillars sheet
    const pillarSheet = XLSX.utils.json_to_sheet(pillarData);
    XLSX.utils.book_append_sheet(wb, pillarSheet, "Pillars");

    // Lessons sheet
    const lessonSheet = XLSX.utils.json_to_sheet(lessonData);
    XLSX.utils.book_append_sheet(wb, lessonSheet, "Lessons");

    // States sheet
    const stateSheet = XLSX.utils.json_to_sheet(stateChartData);
    XLSX.utils.book_append_sheet(wb, stateSheet, "States");

    XLSX.writeFile(wb, "dashboard_report.xlsx");
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h2>📊 Dashboard</h2>
      <p>
        Welcome <strong>{user.email}</strong> ({role})
      </p>

      {/* Summary Card */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          background: "#222",
          color: "white",
          padding: "1rem",
          borderRadius: "8px",
          marginTop: "1rem",
        }}
      >
        <div>
          <h3>🏛 Pillars</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{pillars.length}</p>
        </div>
        <div>
          <h3>📚 Lessons</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{lessons.length}</p>
        </div>
        <div>
          <h3>⚙ States</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{states.length}</p>
        </div>
      </div>

      {/* Export Buttons */}
      {role === "admin" && (
        <div style={{ marginTop: "1rem", textAlign: "right" }}>
          <button
            onClick={exportCSV}
            style={{
              background: "limegreen",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "1rem",
            }}
          >
            ⬇ Export Report (CSV)
          </button>
          <button
            onClick={exportExcel}
            style={{
              background: "#007acc",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ⬇ Export Report (Excel)
          </button>
        </div>
      )}

      {/* Charts */}
      <section style={{ marginTop: "2rem" }}>
        <h3>🏛 Governance Pillars</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pillarData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h3>📚 Tutor Lessons</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lessonData}>
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="step" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h3>⚙ Governance States</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={stateChartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {stateChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
