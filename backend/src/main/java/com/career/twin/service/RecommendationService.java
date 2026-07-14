package com.career.twin.service;

import com.career.twin.ml.KNNClassifier.CareerProbability;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class RecommendationService {
    // Career standard skillsets
    private static final Map<String, List<String>> CAREER_REQUIRED_SKILLS = new HashMap<>();
    // Educational resource mapping
    private static final Map<String, SkillRecommendation> SKILL_RECS = new HashMap<>();
    // Career-specific course pathways
    private static final Map<String, List<String>> CAREER_COURSES = new HashMap<>();
    static {
        CAREER_REQUIRED_SKILLS.put("AI Engineer", Arrays.asList("Python", "SQL", "Machine_Learning", "Deep_Learning"));
        CAREER_REQUIRED_SKILLS.put("Data Scientist", Arrays.asList("Python", "SQL", "Machine_Learning"));
        CAREER_REQUIRED_SKILLS.put("Software Developer", Arrays.asList("Java", "JavaScript", "HTML_CSS", "C++"));
        CAREER_REQUIRED_SKILLS.put("Cybersecurity Analyst", Arrays.asList("Networking", "Linux", "SQL"));
        CAREER_REQUIRED_SKILLS.put("Cloud Engineer", Arrays.asList("Cloud_Computing", "Linux", "Networking", "SQL"));
        CAREER_REQUIRED_SKILLS.put("UI/UX Designer", Arrays.asList("UI_UX_Design", "HTML_CSS", "JavaScript"));
        // User-defined Career Course Pathways
        CAREER_COURSES.put("AI Engineer", Arrays.asList(
                "Machine Learning Fundamentals",
                "Deep Learning Specialization",
                "Natural Language Processing (NLP)",
                "Computer Vision Basics",
                "Generative AI and Large Language Models"));
        CAREER_COURSES.put("Data Scientist", Arrays.asList(
                "Data Analysis with Python",
                "Statistics for Data Science",
                "SQL for Data Analytics",
                "Data Visualization using Power BI/Tableau",
                "Advanced Machine Learning"));
        CAREER_COURSES.put("Software Developer", Arrays.asList(
                "Java Full Stack Development",
                "Data Structures and Algorithms",
                "Spring Boot Framework",
                "Web Development (HTML, CSS, JavaScript)",
                "Software Testing"));
        CAREER_COURSES.put("Cybersecurity Analyst", Arrays.asList(
                "Ethical Hacking",
                "Network Security",
                "Cybersecurity Fundamentals",
                "Penetration Testing",
                "Security Operations Center (SOC)"));
        CAREER_COURSES.put("Cloud Engineer", Arrays.asList(
                "Cloud Computing Fundamentals",
                "AWS Certified Solutions Architect",
                "DevOps CI/CD Pipelines (Docker & Jenkins)",
                "Kubernetes and Container Orchestration",
                "Linux System Administration"));
        CAREER_COURSES.put("UI/UX Designer", Arrays.asList(
                "UI/UX Design Principles & Design Thinking",
                "Interaction Design Essentials",
                "Figma Essentials and Prototyping",
                "User Research & Usability Testing Case Studies",
                "Information Architecture & Wireframing"));
        SKILL_RECS.put("Python", new SkillRecommendation(
                Arrays.asList("Python for Data Science & AI (Coursera)", "Complete Python Developer Bootcamp (Udemy)"),
                Arrays.asList("Text Analyzer Tool", "Automated Web Scraper"),
                Arrays.asList("PCEP Python Entry-Level Programmer")));
        SKILL_RECS.put("Java", new SkillRecommendation(
                Arrays.asList("Java Programming Masterclass (Udemy)", "Introduction to Java (edX)"),
                Arrays.asList("Student Record Management System", "Inventory Control Desktop App"),
                Arrays.asList("Oracle Certified Associate Java SE Programmer")));
        SKILL_RECS.put("SQL", new SkillRecommendation(
                Arrays.asList("SQL for Data Analysis (Udemy)", "SQL (Basic) Certificate (HackerRank)"),
                Arrays.asList("E-commerce Database Design", "Sales Performance Analytics Query Suite"),
                Arrays.asList("Microsoft Certified: Azure Data Fundamentals")));
        SKILL_RECS.put("C++", new SkillRecommendation(
                Arrays.asList("Beginning C++ Programming (Udemy)", "C++ Programming: Basic Skills (Codio)"),
                Arrays.asList("Simple Command-Line RPG Game", "Memory Management Simulator"),
                Arrays.asList("C++ Certified Associate Programmer (CLA)")));
        SKILL_RECS.put("HTML_CSS", new SkillRecommendation(
                Arrays.asList("Responsive Web Design Certification (freeCodeCamp)",
                        "Build Responsive Real-World Websites (Udemy)"),
                Arrays.asList("Personal Portfolio Webpage", "Sleek Landing Page with CSS Grid/Flexbox"),
                Arrays.asList("W3Schools HTML & CSS Developer Certificates")));
        SKILL_RECS.put("JavaScript", new SkillRecommendation(
                Arrays.asList("The Complete JavaScript Course (Udemy)",
                        "JavaScript Algorithms and Data Structures (freeCodeCamp)"),
                Arrays.asList("Interactive Task Dashboard (To-Do List)", "Weather Forecasting App (fetching API)"),
                Arrays.asList("OpenJS Node.js Application Developer (JSNAD)")));
        SKILL_RECS.put("Machine_Learning", new SkillRecommendation(
                Arrays.asList("Machine Learning Specialization by Andrew Ng (Coursera)",
                        "Intro to Machine Learning (Kaggle)"),
                Arrays.asList("House Price Prediction Model", "Customer Segmentation using K-Means Clustering"),
                Arrays.asList("Google Cloud Professional ML Engineer")));
        SKILL_RECS.put("Deep_Learning", new SkillRecommendation(
                Arrays.asList("Deep Learning Specialization (Coursera)",
                        "Practical Deep Learning for Coders (Fast.ai)"),
                Arrays.asList("Image Classification App (using CNNs)",
                        "AI Chatbot (using simple LSTM/Transformer model)"),
                Arrays.asList("DeepLearning.AI Certification")));
        SKILL_RECS.put("Networking", new SkillRecommendation(
                Arrays.asList("Google IT Support: Bits and Bytes of Networking (Coursera)",
                        "Introduction to Networks (Cisco Networking Academy)"),
                Arrays.asList("Home Lab Network Setup Simulator", "Subnet Calculator Tool"),
                Arrays.asList("Cisco Certified Network Associate (CCNA)")));
        SKILL_RECS.put("Linux", new SkillRecommendation(
                Arrays.asList("Linux Command Line Basics (Udemy)", "NDG Linux Essentials (Cisco Academy)"),
                Arrays.asList("Automated Linux System Backup Script", "Configuring a Linux Web Server (Apache/Nginx)"),
                Arrays.asList("Linux Foundation Certified IT Associate (LFCA)")));
        SKILL_RECS.put("Cloud_Computing", new SkillRecommendation(
                Arrays.asList("AWS Cloud Practitioner Essentials", "Microsoft Azure Fundamentals (AZ-900)"),
                Arrays.asList("Static Website Hosting on AWS S3", "Multi-Tier Web App on Cloud Instances"),
                Arrays.asList("AWS Certified Cloud Practitioner")));
        SKILL_RECS.put("UI_UX_Design", new SkillRecommendation(
                Arrays.asList("Google UX Design Professional Certificate (Coursera)",
                        "UI/UX Design Specialization (Coursera)"),
                Arrays.asList("Interactive App Wireframe in Figma", "Redesigning a Local Service Website Case Study"),
                Arrays.asList("Google UX Design Certificate")));
    }

    public static class SkillRecommendation {
        public List<String> courses;
        public List<String> projects;
        public List<String> certifications;

        public SkillRecommendation(List<String> courses, List<String> projects, List<String> certifications) {
            this.courses = courses;
            this.projects = projects;
            this.certifications = certifications;
        }
    }

    public static class AnalysisResult {
        public List<CareerProbability> predictions;
        public String topCareer;
        public List<String> missingSkills;
        public List<String> courses;
        public List<String> projects;
        public List<String> certifications;
        public Map<String, Double> twinDimensions;
        public List<String> strengths;
        public List<String> weaknesses;
    }

    public AnalysisResult analyze(
            List<CareerProbability> predictions,
            double cgpa, int projectsCount, int certificationsCount,
            double analytical, double coding, double communication, double problemSolving,
            Set<String> activeSkills, Set<String> activeInterests) {
        AnalysisResult res = new AnalysisResult();
        res.predictions = predictions;
        res.topCareer = predictions.get(0).career;
        // Perform Skill Gap Analysis
        List<String> required = CAREER_REQUIRED_SKILLS.getOrDefault(res.topCareer, new ArrayList<>());
        res.missingSkills = new ArrayList<>();
        for (String reqSkill : required) {
            if (!activeSkills.contains(reqSkill)) {
                res.missingSkills.add(reqSkill);
            }
        }
        // Gather course, project, and certification recommendations
        res.courses = new ArrayList<>(CAREER_COURSES.getOrDefault(res.topCareer, new ArrayList<>()));
        res.projects = new ArrayList<>();
        res.certifications = new ArrayList<>();
        for (String ms : res.missingSkills) {
            SkillRecommendation rec = SKILL_RECS.get(ms);
            if (rec != null) {
                res.projects.addAll(rec.projects);
                res.certifications.addAll(rec.certifications);
            }
        }
        // Fallbacks if certifications/projects are empty
        if (res.projects.isEmpty()) {
            res.projects.add("Comprehensive Portfolio Capstone Project in " + res.topCareer);
        }
        if (res.certifications.isEmpty()) {
            res.certifications.add("Industry Standard Professional Certification in " + res.topCareer);
        }
        // Compute strengths and weaknesses
        res.strengths = new ArrayList<>();
        res.weaknesses = new ArrayList<>();
        if (cgpa >= 8.5)
            res.strengths.add("Exceptional academic record (CGPA: " + cgpa + ")");
        if (projectsCount >= 3)
            res.strengths.add("Solid hands-on project portfolio (" + projectsCount + " items)");
        if (activeSkills.size() >= 5)
            res.strengths.add("Highly diversified tech stack");
        if (!res.missingSkills.isEmpty()) {
            res.weaknesses.add("Skill gap detected: " + String.join(", ", res.missingSkills));
        }
        if (coding < 60)
            res.weaknesses.add("Coding proficiency requires additional practice");
        if (communication < 65)
            res.weaknesses.add("Communication skills could be improved for coding interviews");
        // Calculate radar chart dimension scores
        Map<String, Double> dims = new LinkedHashMap<>();
        boolean holdsCodingSkill = activeSkills.contains("Python") || activeSkills.contains("Java")
                || activeSkills.contains("C++") || activeSkills.contains("JavaScript");
        double dimCoding = coding * 0.7 + (holdsCodingSkill ? 30.0 : 0.0);
        dims.put("Coding & Logic", Math.min(100.0, Math.round(dimCoding * 10) / 10.0));
        boolean holdsDataSkill = activeSkills.contains("Machine_Learning") || activeSkills.contains("Deep_Learning")
                || activeSkills.contains("SQL");
        double dimData = analytical * 0.7 + (holdsDataSkill ? 30.0 : 0.0);
        dims.put("Data & Analytics", Math.min(100.0, Math.round(dimData * 10) / 10.0));
        double dimInfra = 30.0 + (activeSkills.contains("Cloud_Computing") ? 25.0 : 0.0)
                + (activeSkills.contains("Linux") ? 25.0 : 0.0) + (activeSkills.contains("Networking") ? 20.0 : 0.0);
        dims.put("Cloud & Infrastructure", Math.min(100.0, Math.round(dimInfra * 10) / 10.0));

        double dimDesign = 30.0 + (activeSkills.contains("UI_UX_Design") ? 45.0 : 0.0)
                + (activeSkills.contains("HTML_CSS") ? 25.0 : 0.0);
        dims.put("Design & UX", Math.min(100.0, Math.round(dimDesign * 10) / 10.0));

        dims.put("Communication", Math.min(100.0, Math.round(communication * 10) / 10.0));
        dims.put("Problem Solving", Math.min(100.0, Math.round(problemSolving * 10) / 10.0));

        res.twinDimensions = dims;

        // Add dimension strength
        String maxDim = "Problem Solving";
        double maxScore = -1;
        for (Map.Entry<String, Double> entry : dims.entrySet()) {
            if (entry.getValue() > maxScore) {
                maxScore = entry.getValue();
                maxDim = entry.getKey();
            }
        }
        res.strengths.add(0, "Primary core capability: " + maxDim + " (" + maxScore + "%)");

        return res;
    }
}
