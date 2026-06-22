package com.career.twin.controller;

import com.career.twin.ml.KNNClassifier;
import com.career.twin.ml.KNNClassifier.CareerProbability;
import com.career.twin.service.DatabaseService;
import com.career.twin.service.RecommendationService;
import com.career.twin.service.RecommendationService.AnalysisResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "https://ai-career-twin-1.onrender.com"}, allowCredentials = "true")
public class ApiController {

    private final KNNClassifier knnClassifier;
    private final DatabaseService databaseService;
    private final RecommendationService recommendationService;

    public ApiController(KNNClassifier knnClassifier, DatabaseService databaseService, RecommendationService recommendationService) {
        this.knnClassifier = knnClassifier;
        this.databaseService = databaseService;
        this.recommendationService = recommendationService;
    }

    // --- Auth helper: read userId from X-Auth-Token header ---
    private Integer getUserId(@RequestHeader Map<String, String> headers) {
        String token = headers.get("x-auth-token");
        if (token == null || token.isBlank()) return null;
        try { return Integer.parseInt(token.trim()); }
        catch (NumberFormatException e) { return null; }
    }

    // --- Authentication Routes ---

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = Objects.toString(request.get("username"), "").trim();
        String password = Objects.toString(request.get("password"), "").trim();
        String fullName = Objects.toString(
            request.get("fullName") != null ? request.get("fullName") : request.get("full_name"), ""
        ).trim();
        String mobile = Objects.toString(request.get("mobile"), "").trim();

        if (username.length() < 3 || password.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username must be >= 3 chars, password >= 4 chars."));
        }

        boolean success = databaseService.registerUser(username, password, fullName, mobile, "STUDENT");
        if (success) {
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User registered successfully!"));
        } else {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username already exists."));
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
        Integer userId = getUserId(headers);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized. Please log in."));
        }

        // Fetch user meta from DB
        Map<String, Object> userMeta = databaseService.getUserById(userId);
        String username = userMeta != null ? (String) userMeta.get("username") : "";
        String role     = userMeta != null ? (String) userMeta.get("role")     : "STUDENT";
        String fullName = userMeta != null ? (String) userMeta.get("full_name"): "";

        Map<String, Object> prof = databaseService.getProfile(userId);
        if (prof == null) {
            return ResponseEntity.ok(Map.of(
                "has_profile", false,
                "username", username,
                "role", role,
                "full_name", fullName
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
}
