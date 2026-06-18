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
import { useTranslation } from "react-i18next";
import { useAuth, useTheme } from "../../contexts";
import WelcomeAnimation from "../../components/common/WelcomeAnimation";
import adminService from "../../services/adminService";
import resourceService from "../../services/resourceService";
import type { PlatformStats } from "../../types";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { t } = useTranslation();

  const [stats, setStats] = React.useState<PlatformStats | null>(null);
  const [resourceCount, setResourceCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let active = true;
    Promise.all([
      adminService.getPlatformStats(),
      resourceService.getResources({ page_size: 1 } as any),
    ])
      .then(([platformStats, resources]) => {
        if (!active) return;
        setStats(platformStats);
        setResourceCount(resources.count);
      })
      .catch(() => {
        /* leave placeholders if the request fails */
      });
    return () => {
      active = false;
    };
  }, []);

  // Render a stat value, falling back to a dash until data arrives.
  const fmt = (value: number | null | undefined) =>
    typeof value === "number" ? value.toLocaleString() : "-";

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
            {t('dashboard.admin.title')}
          </h1>
          <p style={{ opacity: 0.9 }}>
            {t('dashboard.admin.welcome', { name: user?.first_name || user?.username })}
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
          {t('dashboard.admin.administration')}
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
              <h3 className="font-semibold">{t('dashboard.admin.users')}</h3>
              <p className="text-sm text-secondary">{t('dashboard.admin.usersDesc')}</p>
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
              <h3 className="font-semibold">{t('dashboard.admin.organizations')}</h3>
              <p className="text-sm text-secondary">{t('dashboard.admin.organizationsDesc')}</p>
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
              <h3 className="font-semibold">{t('dashboard.admin.quizzes')}</h3>
              <p className="text-sm text-secondary">{t('dashboard.admin.quizzesDesc')}</p>
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
              <h3 className="font-semibold">{t('dashboard.admin.analytics')}</h3>
              <p className="text-sm text-secondary">{t('dashboard.admin.analyticsDesc')}</p>
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
          <div className="stat-card-value">{fmt(stats?.users.total)}</div>
          <div className="stat-card-label">{t('dashboard.admin.totalUsers')}</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: iconBg, color: iconColor }}
          >
            <School size={24} strokeWidth={1.85} />
          </div>
          <div className="stat-card-value">{fmt(stats?.organizations.schools)}</div>
          <div className="stat-card-label">{t('dashboard.admin.schools')}</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: iconBg, color: iconColor }}
          >
            <ClipboardList size={24} strokeWidth={1.85} />
          </div>
          <div className="stat-card-value">{fmt(stats?.quizzes.total)}</div>
          <div className="stat-card-label">{t('dashboard.admin.quizzesLabel')}</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: iconBg, color: iconColor }}
          >
            <BookOpen size={24} strokeWidth={1.85} />
          </div>
          <div className="stat-card-value">{fmt(resourceCount)}</div>
          <div className="stat-card-label">{t('dashboard.admin.resources')}</div>
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
          {t('dashboard.admin.contentManagement')}
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
                {t('dashboard.admin.createQuiz')}
              </h3>
              <p className="text-sm text-secondary">
                {t('dashboard.admin.createQuizDesc')}
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
                {t('dashboard.admin.uploadResource')}
              </h3>
              <p className="text-sm text-secondary">{t('dashboard.admin.uploadResourceDesc')}</p>
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
                {t('dashboard.admin.createNews')}
              </h3>
              <p className="text-sm text-secondary">{t('dashboard.admin.createNewsDesc')}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
