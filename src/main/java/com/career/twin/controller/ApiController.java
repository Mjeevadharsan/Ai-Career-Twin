package com.career.twin.controller;

import com.career.twin.ml.KNNClassifier;
import com.career.twin.ml.KNNClassifier.CareerProbability;
import com.career.twin.service.DatabaseService;
import com.career.twin.service.RecommendationService;
import com.career.twin.service.RecommendationService.AnalysisResult;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/")
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

    // --- Authentication Routes ---

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = Objects.toString(request.get("username"), "").trim();
        String password = Objects.toString(request.get("password"), "").trim();
        String fullName = Objects.toString(
            request.get("fullName") != null ? request.get("fullName") : request.get("full_name"), ""
        ).trim();
        String mobile   = Objects.toString(request.get("mobile"), "").trim();

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
    public ResponseEntity<?> login(@RequestBody Map<String, String> request, HttpSession session) {
        String username = request.getOrDefault("username", "").trim();
        String password = request.getOrDefault("password", "").trim();

        Map<String, Object> userInfo = databaseService.loginUser(username, password);
        if (userInfo != null) {
            session.setAttribute("userId", userInfo.get("id"));
            session.setAttribute("username", userInfo.get("username"));
            session.setAttribute("role", userInfo.get("role"));
            session.setAttribute("full_name", userInfo.get("full_name"));
            return ResponseEntity.ok(Map.of(
                "message", "Login successful!", 
                "username", userInfo.get("username"),
                "role", userInfo.get("role"),
                "full_name", userInfo.get("full_name") != null ? userInfo.get("full_name") : ""
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid username or password."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }

    // --- Profile & Twin Routes ---

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized access. Please log in."));
        }

        Map<String, Object> prof = databaseService.getProfile(userId);
        if (prof == null) {
            return ResponseEntity.ok(Map.of(
                "has_profile", false,
                "username", session.getAttribute("username") != null ? session.getAttribute("username") : "",
                "role", session.getAttribute("role") != null ? session.getAttribute("role") : "STUDENT",
                "full_name", session.getAttribute("full_name") != null ? session.getAttribute("full_name") : ""
            ));
        }

        double cgpa = (double) prof.get("cgpa");
        int projects = (int) prof.get("projects");
        int certifications = (int) prof.get("certifications");
        double analytical = (double) prof.get("apt_analytical");
        double coding = (double) prof.get("apt_coding");
        double communication = (double) prof.get("apt_communication");
        double problemSolving = (double) prof.get("apt_problem_solving");
        Set<String> skills = (Set<String>) prof.get("skills");
        Set<String> interests = (Set<String>) prof.get("interests");

        // Run ML KNN prediction
        List<CareerProbability> probs = knnClassifier.predict(
                cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests
        );

        // Generate skill gap & recommendations roadmap
        AnalysisResult analysis = recommendationService.analyze(
                probs, cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests
        );

        Map<String, Object> response = new HashMap<>(prof);
        response.put("has_profile", true);
        response.put("analysis", analysis);
        response.put("username", session.getAttribute("username") != null ? session.getAttribute("username") : "");
        response.put("role", session.getAttribute("role") != null ? session.getAttribute("role") : "STUDENT");
        response.put("full_name", session.getAttribute("full_name") != null ? session.getAttribute("full_name") : "");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(@RequestBody Map<String, Object> request, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized access. Please log in."));
        }

        try {
            double cgpa = Double.parseDouble(request.getOrDefault("cgpa", "7.5").toString());
            int projects = Integer.parseInt(request.getOrDefault("projects", "0").toString());
            int certifications = Integer.parseInt(request.getOrDefault("certifications", "0").toString());
            double analytical = Double.parseDouble(request.getOrDefault("apt_analytical", "70").toString());
            double coding = Double.parseDouble(request.getOrDefault("apt_coding", "70").toString());
            double communication = Double.parseDouble(request.getOrDefault("apt_communication", "70").toString());
            double problemSolving = Double.parseDouble(request.getOrDefault("apt_problem_solving", "70").toString());

            List<String> skillsList = (List<String>) request.getOrDefault("skills", new ArrayList<>());
            List<String> interestsList = (List<String>) request.getOrDefault("interests", new ArrayList<>());

            Set<String> skills = new HashSet<>(skillsList);
            Set<String> interests = new HashSet<>(interestsList);

            // Save to MySQL
            databaseService.saveProfile(
                userId, cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests
            );

            // Compute Prediction
            List<CareerProbability> probs = knnClassifier.predict(
                cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests
            );

            AnalysisResult analysis = recommendationService.analyze(
                probs, cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests
            );

            return ResponseEntity.ok(Map.of("message", "Profile saved successfully!", "analysis", analysis));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid data input format: " + e.getMessage()));
        }
    }

    // --- Anonymous API Route for Prediction ---

    @PostMapping("/predict")
    public ResponseEntity<?> predict(@RequestBody Map<String, Object> request) {
        try {
            double cgpa = Double.parseDouble(request.getOrDefault("cgpa", "7.5").toString());
            int projects = Integer.parseInt(request.getOrDefault("projects", "0").toString());
            int certifications = Integer.parseInt(request.getOrDefault("certifications", "0").toString());
            double analytical = Double.parseDouble(request.getOrDefault("apt_analytical", "70").toString());
            double coding = Double.parseDouble(request.getOrDefault("apt_coding", "70").toString());
            double communication = Double.parseDouble(request.getOrDefault("apt_communication", "70").toString());
            double problemSolving = Double.parseDouble(request.getOrDefault("apt_problem_solving", "70").toString());

            List<String> skillsList = (List<String>) request.getOrDefault("skills", new ArrayList<>());
            List<String> interestsList = (List<String>) request.getOrDefault("interests", new ArrayList<>());

            Set<String> skills = new HashSet<>(skillsList);
            Set<String> interests = new HashSet<>(interestsList);

            // Compute Prediction
            List<CareerProbability> probs = knnClassifier.predict(
                cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests
            );

            AnalysisResult analysis = recommendationService.analyze(
                probs, cgpa, projects, certifications, analytical, coding, communication, problemSolving, skills, interests
            );

            return ResponseEntity.ok(analysis);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid data input format: " + e.getMessage()));
        }
    }

    // --- Admin Routes ---

    private boolean isAdmin(HttpSession session) {
        String role = (String) session.getAttribute("role");
        return role != null && role.equals("ADMIN");
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminStats(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied. Admins only."));
        }
        return ResponseEntity.ok(databaseService.getAdminStats());
    }

    @GetMapping("/admin/students")
    public ResponseEntity<?> getAdminStudents(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied. Admins only."));
        }
        return ResponseEntity.ok(databaseService.getAllStudents());
    }

    @DeleteMapping("/admin/students/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable("id") int id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied. Admins only."));
        }
        boolean success = databaseService.deleteUser(id);
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Student deleted successfully."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Student not found or cannot be deleted."));
        }
    }

    @GetMapping("/admin/login-history")
    public ResponseEntity<?> getLoginHistory(@RequestParam(value = "limit", defaultValue = "50") int limit, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied. Admins only."));
        }
        return ResponseEntity.ok(databaseService.getLoginHistory(limit));
    }

    @GetMapping("/admin/activities")
    public ResponseEntity<?> getActivities(@RequestParam(value = "limit", defaultValue = "50") int limit, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied. Admins only."));
        }
        return ResponseEntity.ok(databaseService.getRecentActivities(limit));
    }
}



