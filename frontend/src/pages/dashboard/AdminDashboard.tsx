import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  School,
  ClipboardList,
  BarChart3,
  BookOpen,
  FilePlus,
  Upload,
  Newspaper,
} from "lucide-react";
import { useAuth, useTheme } from "../../contexts";
import WelcomeAnimation from "../../components/common/WelcomeAnimation";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  // Icon swatches mirror the light-mode relationship (soft tinted fill + cobalt
  // glyph): light uses #EAEDFE wash + #2F55F0 icon; dark uses the dark cobalt
  // wash (#20243a) + the dark cobalt accent (#6e8bff) icon.
  const iconBg = isDarkMode ? "#20243a" : "#EAEDFE";
  const iconColor = isDarkMode ? "#6e8bff" : "#2F55F0";

  return (
    <div>
      {/* Welcome Section */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#2F55F0",
          borderRadius: "var(--radius-2xl)",
          padding: "var(--space-8)",
          marginBottom: "var(--space-8)",
          color: "white",
        }}
      >
        <WelcomeAnimation variant="admin" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "var(--font-size-3xl)",
              marginBottom: "var(--space-2)",
            }}
          >
            Admin Dashboard
          </h1>
          <p style={{ opacity: 0.9 }}>
            Welcome, {user?.first_name || user?.username}. You have full access
            to all platform features.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h2
          style={{
            fontSize: "var(--font-size-xl)",
            marginBottom: "var(--space-4)",
          }}
        >
          Administration
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="card"
            style={{ textDecoration: "none" }}
          >
            <div className="card-body flex flex-col items-center text-center">
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: iconBg,
                  color: iconColor,
                  borderRadius: "var(--radius-xl)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  marginBottom: "var(--space-3)",
                }}
              >
                <Users size={28} strokeWidth={1.85} />
              </div>
              <h3 className="font-semibold">Users</h3>
              <p className="text-sm text-secondary">Manage all users</p>
            </div>
          </Link>

          <Link
            to="/admin/organizations"
            className="card"
            style={{ textDecoration: "none" }}
          >
            <div className="card-body flex flex-col items-center text-center">
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: iconBg,
                  color: iconColor,
                  borderRadius: "var(--radius-xl)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  marginBottom: "var(--space-3)",
                }}
              >
                <School size={28} strokeWidth={1.85} />
              </div>
              <h3 className="font-semibold">Organizations</h3>
              <p className="text-sm text-secondary">Schools & Classes</p>
            </div>
          </Link>

          <Link
            to="/quizzes"
            className="card"
            style={{ textDecoration: "none" }}
          >
            <div className="card-body flex flex-col items-center text-center">
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: iconBg,
                  color: iconColor,
                  borderRadius: "var(--radius-xl)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  marginBottom: "var(--space-3)",
                }}
              >
                <ClipboardList size={28} strokeWidth={1.85} />
              </div>
              <h3 className="font-semibold">Quizzes</h3>
              <p className="text-sm text-secondary">All assessments</p>
            </div>
          </Link>

          <Link
            to="/admin/stats"
            className="card"
            style={{ textDecoration: "none" }}
          >
            <div className="card-body flex flex-col items-center text-center">
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: iconBg,
                  color: iconColor,
                  borderRadius: "var(--radius-xl)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                  marginBottom: "var(--space-3)",
                }}
              >
                <BarChart3 size={28} strokeWidth={1.85} />
              </div>
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-secondary">Platform statistics</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div
        className="grid grid-cols-4 gap-6"
        style={{ marginBottom: "var(--space-8)" }}
      >
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: iconBg, color: iconColor }}
          >
            <Users size={24} strokeWidth={1.85} />
          </div>
          <div className="stat-card-value">-</div>
          <div className="stat-card-label">Total Users</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: iconBg, color: iconColor }}
          >
            <School size={24} strokeWidth={1.85} />
          </div>
          <div className="stat-card-value">-</div>
          <div className="stat-card-label">Schools</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: iconBg, color: iconColor }}
          >
            <ClipboardList size={24} strokeWidth={1.85} />
          </div>
          <div className="stat-card-value">-</div>
          <div className="stat-card-label">Quizzes</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: iconBg, color: iconColor }}
          >
            <BookOpen size={24} strokeWidth={1.85} />
          </div>
          <div className="stat-card-value">-</div>
          <div className="stat-card-label">Resources</div>
        </div>
      </div>

      {/* Content Management */}
      <div>
        <h2
          style={{
            fontSize: "var(--font-size-xl)",
            marginBottom: "var(--space-4)",
          }}
        >
          Content Management
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Link
            to="/quizzes/create"
            className="card"
            style={{ textDecoration: "none" }}
          >
            <div className="card-body">
              <h3
                className="font-semibold"
                style={{ marginBottom: "var(--space-2)" }}
              >
                <FilePlus
                  size={18}
                  strokeWidth={1.85}
                  style={{ verticalAlign: "text-bottom" }}
                />{" "}
                Create Quiz
              </h3>
              <p className="text-sm text-secondary">
                Build new assessments for students
              </p>
            </div>
          </Link>

          <Link
            to="/resources/upload"
            className="card"
            style={{ textDecoration: "none" }}
          >
            <div className="card-body">
              <h3
                className="font-semibold"
                style={{ marginBottom: "var(--space-2)" }}
              >
                <Upload
                  size={18}
                  strokeWidth={1.85}
                  style={{ verticalAlign: "text-bottom" }}
                />{" "}
                Upload Resource
              </h3>
              <p className="text-sm text-secondary">Add learning materials</p>
            </div>
          </Link>

          <Link
            to="/news/create"
            className="card"
            style={{ textDecoration: "none" }}
          >
            <div className="card-body">
              <h3
                className="font-semibold"
                style={{ marginBottom: "var(--space-2)" }}
              >
                <Newspaper
                  size={18}
                  strokeWidth={1.85}
                  style={{ verticalAlign: "text-bottom" }}
                />{" "}
                Create News
              </h3>
              <p className="text-sm text-secondary">Post announcements</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
