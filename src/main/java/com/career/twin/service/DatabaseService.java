package com.career.twin.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.*;
import java.util.*;

@Service
public class DatabaseService {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPass;

    public DatabaseService() {
    }

    @PostConstruct
    public void init() {
        initDb();
    }

    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUrl, dbUser, dbPass);
    }

    private void initDb() {
        String createUsersTable = "CREATE TABLE IF NOT EXISTS users (" +
                "id INT AUTO_INCREMENT PRIMARY KEY, " +
                "username VARCHAR(255) UNIQUE NOT NULL, " +
                "password VARCHAR(255) NOT NULL, " +
                "plain_password VARCHAR(255), " +
                "role VARCHAR(20) DEFAULT 'STUDENT', " +
                "full_name VARCHAR(255), " +
                "mobile VARCHAR(20), " +
                "last_login DATETIME, " +
                "login_count INT DEFAULT 0, " +
                "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
                ");";

        String createProfilesTable = "CREATE TABLE IF NOT EXISTS profiles (" +
                "user_id INT PRIMARY KEY, " +
                "cgpa DOUBLE, " +
                "projects INT, " +
                "certifications INT, " +
                "apt_analytical DOUBLE, " +
                "apt_coding DOUBLE, " +
                "apt_communication DOUBLE, " +
                "apt_problem_solving DOUBLE, " +
                "skills VARCHAR(2000), " +
                "interests VARCHAR(2000), " +
                "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE" +
                ");";

        String createLoginHistoryTable = "CREATE TABLE IF NOT EXISTS login_history (" +
                "id INT AUTO_INCREMENT PRIMARY KEY, " +
                "user_id INT, " +
                "login_time DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                "ip_address VARCHAR(50), " +
                "user_agent VARCHAR(500), " +
                "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE" +
                ");";

        String createActivityLogTable = "CREATE TABLE IF NOT EXISTS activity_log (" +
                "id INT AUTO_INCREMENT PRIMARY KEY, " +
                "user_id INT, " +
                "username VARCHAR(255), " +
                "action VARCHAR(100), " +
                "details VARCHAR(2000), " +
                "timestamp DATETIME DEFAULT CURRENT_TIMESTAMP" +
                ");";

        try (Connection conn = getConnection();
                Statement stmt = conn.createStatement()) {
            stmt.execute(createUsersTable);
            
            // Try to add plain_password column to users table if it doesn't exist (migration for existing databases)
            try {
                stmt.execute("ALTER TABLE users ADD COLUMN plain_password VARCHAR(255)");
                System.out.println("Database migration: Added plain_password column to users table.");
            } catch (SQLException e) {
                // Ignore if column already exists
            }

            stmt.execute(createProfilesTable);
            stmt.execute(createLoginHistoryTable);
            stmt.execute(createActivityLogTable);

            // Create default admin account if not exists
            String checkAdmin = "SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'";
            ResultSet rs = stmt.executeQuery(checkAdmin);
            if (rs.next() && rs.getInt("count") == 0) {
                String insertAdmin = "INSERT INTO users (username, password, role, full_name, plain_password) VALUES (?, ?, 'ADMIN', 'Administrator', ?)";
                try (PreparedStatement pstmt = conn.prepareStatement(insertAdmin)) {
                    pstmt.setString(1, "admin@careertwin.com");
                    pstmt.setString(2, hashPassword("admin123"));
                    pstmt.setString(3, "admin123");
                    pstmt.executeUpdate();
                    System.out.println("Default admin account created: admin@careertwin.com / admin123");
                } catch (SQLException ignore) {
                    // Ignore if it already exists as a student
                }
            }

            // Forcefully ensure the admin account has the ADMIN role if they registered
            // manually
            String forceAdmin = "UPDATE users SET role = 'ADMIN' WHERE username = 'admin@careertwin.com'";
            try (PreparedStatement pstmt = conn.prepareStatement(forceAdmin)) {
                pstmt.executeUpdate();
            }

            System.out.println("MySQL tables successfully initialized.");
        } catch (SQLException e) {
            System.err.println("Database initialization failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Hash passwords using SHA-256
    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(password.getBytes());
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }

    // Register user with role
    public void registerUser(String username, String password, String fullName, String mobile, String role) throws SQLException {
        String sql = "INSERT INTO users (username, password, plain_password, full_name, mobile, role) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            pstmt.setString(2, hashPassword(password));
            pstmt.setString(3, password);
            pstmt.setString(4, fullName);
            pstmt.setString(5, mobile);
            pstmt.setString(6, role != null ? role : "STUDENT");
            pstmt.executeUpdate();

            // Log registration activity
            logActivity(null, username, "REGISTRATION", "New student registered: "
                    + (fullName != null && !fullName.trim().isEmpty() ? fullName : username));
        }
    }

    // Backward compatibility
    public void registerUser(String username, String password) throws SQLException {
        registerUser(username, password, null, null, "STUDENT");
    }

    // Login user - Returns user info map or null
    public Map<String, Object> loginUser(String username, String password) {
        String sql = "SELECT id, username, role, full_name FROM users WHERE username = ? AND password = ?";
        try (Connection conn = getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            pstmt.setString(2, hashPassword(password));
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    int userId = rs.getInt("id");

                    // Update last login and login count
                    String updateSql = "UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?";
                    try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                        updateStmt.setInt(1, userId);
                        updateStmt.executeUpdate();
                    }

                    // Record login history
                    String historySql = "INSERT INTO login_history (user_id) VALUES (?)";
                    try (PreparedStatement historyStmt = conn.prepareStatement(historySql)) {
                        historyStmt.setInt(1, userId);
                        historyStmt.executeUpdate();
                    }

                    // Log login activity
                    String role = rs.getString("role");

                    // HARD OVERRIDE: If the username is admin or admin@careertwin.com, force it to
                    // be ADMIN
                    if ("admin@careertwin.com".equalsIgnoreCase(username) || "admin".equalsIgnoreCase(username)) {
                        role = "ADMIN";
                        // Update the database to reflect this permanently
                        try (PreparedStatement forceStmt = conn
                                .prepareStatement("UPDATE users SET role = 'ADMIN' WHERE id = ?")) {
                            forceStmt.setInt(1, userId);
                            forceStmt.executeUpdate();
                        }
                    }

                    logActivity(userId, rs.getString("username"), "LOGIN",
                            role.equals("ADMIN") ? "Admin logged in" : "Student logged in");

                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", userId);
                    userInfo.put("username", rs.getString("username"));
                    userInfo.put("role", role);
                    userInfo.put("full_name", rs.getString("full_name"));
                    return userInfo;
                }
            }
        } catch (SQLException e) {
            System.err.println("Login database query failed: " + e.getMessage());
        }
        return null;
    }

    // Get user by ID (for token-based auth)
    public Map<String, Object> getUserById(int userId) {
        String sql = "SELECT id, username, role, full_name FROM users WHERE id = ?";
        try (Connection conn = getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> user = new HashMap<>();
                    user.put("id", rs.getInt("id"));
                    user.put("username", rs.getString("username"));
                    user.put("role", rs.getString("role"));
                    user.put("full_name", rs.getString("full_name"));
                    return user;
                }
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch user by id: " + e.getMessage());
        }
        return null;
    }

    // Get all students for admin dashboard
    public List<Map<String, Object>> getAllStudents() {
        List<Map<String, Object>> students = new ArrayList<>();
        String sql = "SELECT u.id, u.username, u.plain_password, u.full_name, u.mobile, u.created_at, u.last_login, u.login_count, " +
                "p.cgpa, p.projects, p.certifications FROM users u " +
                "LEFT JOIN profiles p ON u.id = p.user_id WHERE u.role = 'STUDENT' ORDER BY u.created_at DESC";

        try (Connection conn = getConnection();
                Statement stmt = conn.createStatement();
                ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Map<String, Object> student = new HashMap<>();
                student.put("id", rs.getInt("id"));
                student.put("username", rs.getString("username"));
                student.put("plain_password", rs.getString("plain_password"));
                student.put("full_name", rs.getString("full_name"));
                student.put("mobile", rs.getString("mobile"));
                student.put("created_at", rs.getString("created_at"));
                student.put("last_login", rs.getString("last_login"));
                student.put("login_count", rs.getInt("login_count"));
                student.put("cgpa", rs.getObject("cgpa"));
                student.put("projects", rs.getObject("projects"));
                student.put("certifications", rs.getObject("certifications"));
                student.put("has_profile", rs.getObject("cgpa") != null);
                students.add(student);
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch students: " + e.getMessage());
        }
        return students;
    }

    // Get login history for admin
    public List<Map<String, Object>> getLoginHistory(int limit) {
        List<Map<String, Object>> history = new ArrayList<>();
        String sql = "SELECT lh.login_time, u.username, u.full_name, u.role " +
                "FROM login_history lh JOIN users u ON lh.user_id = u.id " +
                "ORDER BY lh.login_time DESC LIMIT ?";

        try (Connection conn = getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, limit);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> record = new HashMap<>();
                    record.put("login_time", rs.getString("login_time"));
                    record.put("username", rs.getString("username"));
                    record.put("full_name", rs.getString("full_name"));
                    record.put("role", rs.getString("role"));
                    history.add(record);
                }
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch login history: " + e.getMessage());
        }
        return history;
    }

    // Get dashboard stats for admin
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();

        try (Connection conn = getConnection();
                Statement stmt = conn.createStatement()) {

            // Total students
            ResultSet rs1 = stmt.executeQuery("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'");
            if (rs1.next())
                stats.put("total_students", rs1.getInt("count"));

            // Students with profiles
            ResultSet rs2 = stmt.executeQuery("SELECT COUNT(*) as count FROM profiles");
            if (rs2.next())
                stats.put("students_with_profiles", rs2.getInt("count"));

            // Total logins today
            ResultSet rs3 = stmt
                    .executeQuery("SELECT COUNT(*) as count FROM login_history WHERE CAST(login_time AS DATE) = CURRENT_DATE");
            if (rs3.next())
                stats.put("logins_today", rs3.getInt("count"));

            // New signups today
            ResultSet rs4 = stmt.executeQuery(
                    "SELECT COUNT(*) as count FROM users WHERE CAST(created_at AS DATE) = CURRENT_DATE AND role = 'STUDENT'");
            if (rs4.next())
                stats.put("signups_today", rs4.getInt("count"));

        } catch (SQLException e) {
            System.err.println("Failed to fetch admin stats: " + e.getMessage());
        }
        return stats;
    }

    // Delete user (admin only)
    public boolean deleteUser(int userId) {
        String username = "";
        String fetchSql = "SELECT username FROM users WHERE id = ?";
        try (Connection conn = getConnection();
                PreparedStatement pstmt = conn.prepareStatement(fetchSql)) {
            pstmt.setInt(1, userId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    username = rs.getString("username");
                }
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch username for logging deletion: " + e.getMessage());
        }

        try (Connection conn = getConnection()) {
            // Delete profile first (also handled by ON DELETE CASCADE, but explicit is
            // safer)
            String deleteProfile = "DELETE FROM profiles WHERE user_id = ?";
            try (PreparedStatement pstmt = conn.prepareStatement(deleteProfile)) {
                pstmt.setInt(1, userId);
                pstmt.executeUpdate();
            }

            // Delete login history
            String deleteHistory = "DELETE FROM login_history WHERE user_id = ?";
            try (PreparedStatement pstmt = conn.prepareStatement(deleteHistory)) {
                pstmt.setInt(1, userId);
                pstmt.executeUpdate();
            }

            // Delete user
            String deleteUser = "DELETE FROM users WHERE id = ? AND role = 'STUDENT'";
            try (PreparedStatement pstmt = conn.prepareStatement(deleteUser)) {
                pstmt.setInt(1, userId);
                int affected = pstmt.executeUpdate();
                if (affected > 0) {
                    logActivity(null, "system", "USER_DELETION",
                            "Deleted student account: " + username + " (ID: " + userId + ")");
                    return true;
                }
                return false;
            }
        } catch (SQLException e) {
            System.err.println("Failed to delete user: " + e.getMessage());
            return false;
        }
    }

    // Save or update profile details
    public boolean saveProfile(
            int userId, double cgpa, int projects, int certifications,
            double analytical, double coding, double communication, double problemSolving,
            Set<String> skills, Set<String> interests) {

        String skillsStr = String.join(",", skills);
        String interestsStr = String.join(",", interests);

        // MySQL/H2 upsert using INSERT ... ON DUPLICATE KEY UPDATE
        String sql = "INSERT INTO profiles " +
                "(user_id, cgpa, projects, certifications, apt_analytical, apt_coding, apt_communication, apt_problem_solving, skills, interests) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE " +
                "cgpa=VALUES(cgpa), projects=VALUES(projects), certifications=VALUES(certifications), " +
                "apt_analytical=VALUES(apt_analytical), apt_coding=VALUES(apt_coding), " +
                "apt_communication=VALUES(apt_communication), apt_problem_solving=VALUES(apt_problem_solving), " +
                "skills=VALUES(skills), interests=VALUES(interests)";

        try (Connection conn = getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            pstmt.setDouble(2, cgpa);
            pstmt.setInt(3, projects);
            pstmt.setInt(4, certifications);
            pstmt.setDouble(5, analytical);
            pstmt.setDouble(6, coding);
            pstmt.setDouble(7, communication);
            pstmt.setDouble(8, problemSolving);
            pstmt.setString(9, skillsStr);
            pstmt.setString(10, interestsStr);
            pstmt.executeUpdate();

            // Log profile activity
            String username = "";
            try (PreparedStatement uPstmt = conn.prepareStatement("SELECT username FROM users WHERE id = ?")) {
                uPstmt.setInt(1, userId);
                try (ResultSet rs = uPstmt.executeQuery()) {
                    if (rs.next())
                        username = rs.getString("username");
                }
            } catch (SQLException e) {
                System.err.println("Failed to fetch username for profile log: " + e.getMessage());
            }
            logActivity(userId, username, "PROFILE_UPDATE", "Updated career assessment profile (CGPA: " + cgpa + ")");

            return true;
        } catch (SQLException e) {
            System.err.println("Failed to save profile: " + e.getMessage());
            return false;
        }
    }

    // Retrieve user profile
    public Map<String, Object> getProfile(int userId) {
        String sql = "SELECT * FROM profiles WHERE user_id = ?";
        try (Connection conn = getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, userId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> profile = new HashMap<>();
                    profile.put("cgpa", rs.getDouble("cgpa"));
                    profile.put("projects", rs.getInt("projects"));
                    profile.put("certifications", rs.getInt("certifications"));
                    profile.put("apt_analytical", rs.getDouble("apt_analytical"));
                    profile.put("apt_coding", rs.getDouble("apt_coding"));
                    profile.put("apt_communication", rs.getDouble("apt_communication"));
                    profile.put("apt_problem_solving", rs.getDouble("apt_problem_solving"));

                    String skillsStr = rs.getString("skills");
                    Set<String> skills = new HashSet<>();
                    if (skillsStr != null && !skillsStr.trim().isEmpty()) {
                        skills.addAll(Arrays.asList(skillsStr.split(",")));
                    }
                    profile.put("skills", skills);

                    String interestsStr = rs.getString("interests");
                    Set<String> interests = new HashSet<>();
                    if (interestsStr != null && !interestsStr.trim().isEmpty()) {
                        interests.addAll(Arrays.asList(interestsStr.split(",")));
                    }
                    profile.put("interests", interests);

                    return profile;
                }
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch profile: " + e.getMessage());
        }
        return null;
    }

    // Log system activity
    public void logActivity(Integer userId, String username, String action, String details) {
        String sql = "INSERT INTO activity_log (user_id, username, action, details) VALUES (?, ?, ?, ?)";
        try (Connection conn = getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            if (userId != null) {
                pstmt.setInt(1, userId);
            } else {
                pstmt.setNull(1, Types.INTEGER);
            }
            pstmt.setString(2, username != null ? username : "anonymous");
            pstmt.setString(3, action);
            pstmt.setString(4, details);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    // Get recent activity logs for admin dashboard
    public List<Map<String, Object>> getRecentActivities(int limit) {
        List<Map<String, Object>> activities = new ArrayList<>();
        String sql = "SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT ?";
        try (Connection conn = getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, limit);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> activity = new HashMap<>();
                    activity.put("id", rs.getInt("id"));
                    activity.put("user_id", rs.getObject("user_id"));
                    activity.put("username", rs.getString("username"));
                    activity.put("action", rs.getString("action"));
                    activity.put("details", rs.getString("details"));
                    activity.put("timestamp", rs.getString("timestamp"));
                    activities.add(activity);
                }
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch activity logs: " + e.getMessage());
        }
        return activities;
    }
}
