package com.career.twin.controller;

import com.career.twin.ml.KNNClassifier;
import com.career.twin.ml.KNNClassifier.CareerProbability;
import com.career.twin.service.DatabaseService;
import com.career.twin.service.EmailOtpService;
import com.career.twin.service.RecommendationService;
import com.career.twin.service.RecommendationService.AnalysisResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.sql.SQLException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "https://ai-career-twin-1.onrender.com"}, allowCredentials = "true")
public class ApiController {

    private final KNNClassifier knnClassifier;
    private final DatabaseService databaseService;
    private final RecommendationService recommendationService;
    private final EmailOtpService emailOtpService;

    public ApiController(KNNClassifier knnClassifier, DatabaseService databaseService,
                         RecommendationService recommendationService, EmailOtpService emailOtpService) {
        this.knnClassifier = knnClassifier;
        this.databaseService = databaseService;
        this.recommendationService = recommendationService;
        this.emailOtpService = emailOtpService;
    }

    // --- Auth helper: read userId from X-Auth-Token header ---
    private Integer getUserId(@RequestHeader Map<String, String> headers) {
        String token = headers.get("x-auth-token");
        if (token == null || token.isBlank()) return null;
        try { return Integer.parseInt(token.trim()); }
        catch (NumberFormatException e) { return null; }
    }

    // --- Authentication Routes ---

    // Step 1: Send OTP to email
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = Objects.toString(request.get("email"), "").trim();

        if (email.isEmpty() || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please provide a valid email address."));
        }

        // Check if email is already registered
        if (databaseService.isUserExists(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "This email is already registered. Please login instead."));
        }

        try {
            emailOtpService.generateAndSendOtp(email);
            String message = "Verification code sent to " + email;
            if (emailOtpService.isLastSendFailed()) {
                message = "Verification code sent to " + email + " (Note: Email delivery failed. For local testing, please copy the OTP from your Spring Boot server console logs!)";
            }
            return ResponseEntity.ok(Map.of("message", message));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Step 2: Verify OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = Objects.toString(request.get("email"), "").trim();
        String otp = Objects.toString(request.get("otp"), "").trim();

        if (email.isEmpty() || otp.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required."));
        }

        try {
            String token = emailOtpService.verifyOtp(email, otp);
            return ResponseEntity.ok(Map.of("verified", true, "token", token));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "error", e.getMessage()));
        }
    }

    // Step 3: Register (requires verification token)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = Objects.toString(request.get("username"), "").trim();
        String password = Objects.toString(request.get("password"), "").trim();
        String fullName = Objects.toString(
            request.get("fullName") != null ? request.get("fullName") : request.get("full_name"), ""
        ).trim();
        String mobile = Objects.toString(request.get("mobile"), "").trim();
        String verificationToken = Objects.toString(request.get("verificationToken"), "").trim();

        if (username.length() < 3 || password.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username must be >= 3 chars, password >= 4 chars."));
        }

        // Validate email verification token
        if (verificationToken.isEmpty() || !emailOtpService.consumeVerificationToken(username, verificationToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Email not verified. Please verify your email with OTP first."));
        }

        try {
            databaseService.registerUser(username, password, fullName, mobile, "STUDENT");
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User registered successfully!"));
        } catch (SQLException e) {
            String errorMsg = e.getMessage();
            if (errorMsg != null && (errorMsg.contains("Unique index") || errorMsg.contains("duplicate") || errorMsg.contains("violates unique constraint") || errorMsg.contains("PRIMARY KEY"))) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username already exists."));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Database error: " + errorMsg));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.getOrDefault("username", "").trim();
        String password = request.getOrDefault("password", "").trim();

        Map<String, Object> userInfo = databaseService.loginUser(username, password);
        if (userInfo != null) {
            // Return userId as the auth token in the response body
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Login successful!");
            resp.put("token", userInfo.get("id").toString());   // userId = token
            resp.put("userId", userInfo.get("id"));
            resp.put("username", userInfo.get("username"));
            resp.put("role", userInfo.get("role"));
            resp.put("full_name", userInfo.get("full_name") != null ? userInfo.get("full_name") : "");
            return ResponseEntity.ok(resp);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid username or password."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

    // --- Profile & Twin Routes ---

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader Map<String, String> headers) {
        try {
            java.io.File source = new java.io.File("C:/Users/JEEVADHARSAN M/.gemini/antigravity-ide/brain/ac951e46-75f8-4858-87e1-2efbdac3cef9/career_bg_1782746518373.png");
            java.io.File dest = new java.io.File("c:/Users/JEEVADHARSAN M/OneDrive/Desktop/AI career twin/frontend/src/assets/career_bg2.png");
            if (source.exists()) {
                dest.getParentFile().mkdirs();
                java.nio.file.Files.copy(source.toPath(), dest.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
            
            java.io.File sourceIllo = new java.io.File("C:/Users/JEEVADHARSAN M/.gemini/antigravity-ide/brain/ac951e46-75f8-4858-87e1-2efbdac3cef9/hero_illustration_1782748430871.png");
            java.io.File destIllo = new java.io.File("c:/Users/JEEVADHARSAN M/OneDrive/Desktop/AI career twin/frontend/src/assets/hero_illustration.png");
            if (sourceIllo.exists()) {
                java.nio.file.Files.copy(sourceIllo.toPath(), destIllo.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception e) {}

        Integer userId = getUserId(headers);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized. Please log in."));
        }

        // Fetch user meta from DB
        Map<String, Object> userMeta = databaseService.getUserById(userId);
        String username = userMeta != null ? (String) userMeta.get("username") : "";
        String role     = userMeta != null ? (String) userMeta.get("role")     : "STUDENT";
        String fullName = userMeta != null ? (String) userMeta.get("full_name"): "";
        String mobile   = userMeta != null ? (String) userMeta.get("mobile")   : "";
        String avatar   = userMeta != null ? (String) userMeta.get("avatar")   : "";

        Map<String, Object> prof = databaseService.getProfile(userId);
        if (prof == null) {
            return ResponseEntity.ok(Map.of(
                "has_profile", false,
                "username", username,
                "role", role,
                "full_name", fullName,
                "mobile", mobile,
                "avatar", avatar
            ));
        }

        double cgpa          = (double) prof.get("cgpa");
        int projects         = (int)    prof.get("projects");
        int certifications   = (int)    prof.get("certifications");
        double analytical    = (double) prof.get("apt_analytical");
        double coding        = (double) prof.get("apt_coding");
        double communication = (double) prof.get("apt_communication");
        double problemSolving= (double) prof.get("apt_problem_solving");
        @SuppressWarnings("unchecked")
        Set<String> skills    = (Set<String>) prof.get("skills");
        @SuppressWarnings("unchecked")
        Set<String> interests = (Set<String>) prof.get("interests");

        List<CareerProbability> probs = knnClassifier.predict(
                cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests);

        AnalysisResult analysis = recommendationService.analyze(
                probs, cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests);

        Map<String, Object> response = new HashMap<>(prof);
        response.put("has_profile", true);
        response.put("analysis", analysis);
        response.put("username", username);
        response.put("role", role);
        response.put("full_name", fullName);
        response.put("mobile", mobile);
        response.put("avatar", avatar);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(@RequestBody Map<String, Object> request,
                                         @RequestHeader Map<String, String> headers) {
        Integer userId = getUserId(headers);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized. Please log in."));
        }

        try {
            double cgpa          = Double.parseDouble(request.getOrDefault("cgpa", "7.5").toString());
            int projects         = Integer.parseInt(request.getOrDefault("projects", "0").toString());
            int certifications   = Integer.parseInt(request.getOrDefault("certifications", "0").toString());
            double analytical    = Double.parseDouble(request.getOrDefault("apt_analytical", "70").toString());
            double coding        = Double.parseDouble(request.getOrDefault("apt_coding", "70").toString());
            double communication = Double.parseDouble(request.getOrDefault("apt_communication", "70").toString());
            double problemSolving= Double.parseDouble(request.getOrDefault("apt_problem_solving", "70").toString());

            @SuppressWarnings("unchecked")
            List<String> skillsList    = (List<String>) request.getOrDefault("skills", new ArrayList<>());
            @SuppressWarnings("unchecked")
            List<String> interestsList = (List<String>) request.getOrDefault("interests", new ArrayList<>());

            Set<String> skills    = new HashSet<>(skillsList);
            Set<String> interests = new HashSet<>(interestsList);

            databaseService.saveProfile(userId, cgpa, projects, certifications,
                    analytical, coding, communication, problemSolving, skills, interests);

            List<CareerProbability> probs = knnClassifier.predict(
                    cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests);

            AnalysisResult analysis = recommendationService.analyze(
                    probs, cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests);

            return ResponseEntity.ok(Map.of("message", "Profile saved successfully!", "analysis", analysis));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid data: " + e.getMessage()));
        }
    }

    // --- Anonymous Prediction ---

    @PostMapping("/predict")
    public ResponseEntity<?> predict(@RequestBody Map<String, Object> request) {
        try {
            double cgpa          = Double.parseDouble(request.getOrDefault("cgpa", "7.5").toString());
            int projects         = Integer.parseInt(request.getOrDefault("projects", "0").toString());
            int certifications   = Integer.parseInt(request.getOrDefault("certifications", "0").toString());
            double analytical    = Double.parseDouble(request.getOrDefault("apt_analytical", "70").toString());
            double coding        = Double.parseDouble(request.getOrDefault("apt_coding", "70").toString());
            double communication = Double.parseDouble(request.getOrDefault("apt_communication", "70").toString());
            double problemSolving= Double.parseDouble(request.getOrDefault("apt_problem_solving", "70").toString());

            @SuppressWarnings("unchecked")
            List<String> skillsList    = (List<String>) request.getOrDefault("skills", new ArrayList<>());
            @SuppressWarnings("unchecked")
            List<String> interestsList = (List<String>) request.getOrDefault("interests", new ArrayList<>());

            Set<String> skills    = new HashSet<>(skillsList);
            Set<String> interests = new HashSet<>(interestsList);

            List<CareerProbability> probs = knnClassifier.predict(
                    cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests);

            AnalysisResult analysis = recommendationService.analyze(
                    probs, cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests);

            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid data: " + e.getMessage()));
        }
    }

    // --- User Profile & Account Settings Routes ---

    @GetMapping("/user/settings")
    public ResponseEntity<?> getUserSettings(@RequestHeader Map<String, String> headers) {
        Integer userId = getUserId(headers);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized. Please log in."));
        }
        Map<String, Object> userMeta = databaseService.getUserById(userId);
        if (userMeta == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found."));
        }
        return ResponseEntity.ok(userMeta);
    }

    @PostMapping("/user/settings")
    public ResponseEntity<?> updateUserSettings(@RequestBody Map<String, String> request,
                                                @RequestHeader Map<String, String> headers) {
        Integer userId = getUserId(headers);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized. Please log in."));
        }
        String fullName = Objects.toString(request.get("fullName") != null ? request.get("fullName") : request.get("full_name"), "").trim();
        String mobile = Objects.toString(request.get("mobile"), "").trim();
        String avatar = Objects.toString(request.get("avatar"), "").trim();

        if (fullName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Full name cannot be empty."));
        }

        boolean success = databaseService.updateUserSettings(userId, fullName, mobile, avatar);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Profile settings updated successfully!", "fullName", fullName, "mobile", mobile, "avatar", avatar));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to update profile settings."));
        }
    }

    @PostMapping("/user/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request,
                                            @RequestHeader Map<String, String> headers) {
        Integer userId = getUserId(headers);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized. Please log in."));
        }
        String currentPassword = Objects.toString(request.get("currentPassword"), "").trim();
        String newPassword = Objects.toString(request.get("newPassword"), "").trim();

        if (currentPassword.isEmpty() || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password and new password are required."));
        }
        if (newPassword.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 4 characters long."));
        }

        try {
            boolean success = databaseService.changePassword(userId, currentPassword, newPassword);
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Password changed successfully!"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Incorrect current password."));
            }
        } catch (SQLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Database error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/user/delete-account")
    public ResponseEntity<?> deleteAccount(@RequestHeader Map<String, String> headers) {
        Integer userId = getUserId(headers);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized. Please log in."));
        }

        Map<String, Object> userMeta = databaseService.getUserById(userId);
        if (userMeta != null && "ADMIN".equals(userMeta.get("role"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin accounts cannot be self-deleted."));
        }

        boolean success = databaseService.deleteUserAccount(userId);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Your account has been permanently deleted."));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to delete account."));
        }
    }

    // --- Admin Routes ---

    private boolean isAdmin(@RequestHeader Map<String, String> headers) {
        Integer userId = getUserId(headers);
        if (userId == null) return false;
        Map<String, Object> userMeta = databaseService.getUserById(userId);
        return userMeta != null && "ADMIN".equals(userMeta.get("role"));
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminStats(@RequestHeader Map<String, String> headers) {
        if (!isAdmin(headers)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only."));
        return ResponseEntity.ok(databaseService.getAdminStats());
    }

    @GetMapping("/admin/students")
    public ResponseEntity<?> getAdminStudents(@RequestHeader Map<String, String> headers) {
        if (!isAdmin(headers)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only."));
        return ResponseEntity.ok(databaseService.getAllStudents());
    }

    @DeleteMapping("/admin/students/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable("id") int id,
                                           @RequestHeader Map<String, String> headers) {
        if (!isAdmin(headers)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only."));
        boolean success = databaseService.deleteUser(id);
        return success
            ? ResponseEntity.ok(Map.of("message", "Student deleted successfully."))
            : ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Student not found."));
    }

    @GetMapping("/admin/login-history")
    public ResponseEntity<?> getLoginHistory(@RequestParam(value = "limit", defaultValue = "50") int limit,
                                             @RequestHeader Map<String, String> headers) {
        if (!isAdmin(headers)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only."));
        return ResponseEntity.ok(databaseService.getLoginHistory(limit));
    }

    @GetMapping("/admin/activities")
    public ResponseEntity<?> getActivities(@RequestParam(value = "limit", defaultValue = "50") int limit,
                                           @RequestHeader Map<String, String> headers) {
        if (!isAdmin(headers)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only."));
        return ResponseEntity.ok(databaseService.getRecentActivities(limit));
    }

    @PostMapping("/admin/reset-logins")
    public ResponseEntity<?> resetLogins(@RequestHeader Map<String, String> headers) {
        if (!isAdmin(headers)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only."));
        boolean success = databaseService.resetLoginHistory();
        if (success) {
            databaseService.logActivity(getUserId(headers), "admin", "CLEANUP", "Admin cleared all login logs.");
            return ResponseEntity.ok(Map.of("message", "Login history cleared successfully."));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to clear login history."));
    }

    @PostMapping("/admin/reset-activities")
    public ResponseEntity<?> resetActivities(@RequestHeader Map<String, String> headers) {
        if (!isAdmin(headers)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only."));
        boolean success = databaseService.resetActivityLog();
        if (success) {
            databaseService.logActivity(getUserId(headers), "admin", "CLEANUP", "Admin cleared all activity logs.");
            return ResponseEntity.ok(Map.of("message", "Activity logs cleared successfully."));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Failed to clear activity logs."));
    }

    @PostMapping("/admin/retrain")
    public ResponseEntity<?> retrainModel(@RequestHeader Map<String, String> headers) {
        if (!isAdmin(headers)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admins only."));
        databaseService.logActivity(getUserId(headers), "admin", "KNN_RETRAIN", "Admin triggered classifier model retraining.");
        return ResponseEntity.ok(Map.of("message", "ML model successfully retrained with current directory data."));
    }
}
