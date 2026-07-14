package com.career.twin.ml;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class KNNClassifier {

    public static final List<String> SKILLS_LIST = Arrays.asList(
        "Python", "Java", "SQL", "C++", "HTML_CSS", "JavaScript",
        "Machine_Learning", "Deep_Learning", "Networking", "Linux",
        "Cloud_Computing", "UI_UX_Design"
    );

    public static final List<String> INTERESTS_LIST = Arrays.asList(
        "Interest_AI", "Interest_Web", "Interest_Cybersecurity",
        "Interest_DataScience", "Interest_Cloud", "Interest_UIUX"
    );

    public static final List<String> CAREER_CLASSES = Arrays.asList(
        "AI Engineer", "Software Developer", "Cybersecurity Analyst",
        "Data Scientist", "Cloud Engineer", "UI/UX Designer"
    );

    private List<StudentInstance> trainingData = new ArrayList<>();
    private final int K = 15; // K value for KNN

    // Inner class representing a student profile instance
    public static class StudentInstance {
        public double cgpa;
        public int projects;
        public int certifications;
        public double aptAnalytical;
        public double aptCoding;
        public double aptCommunication;
        public double aptProblemSolving;
        public Set<String> skills = new HashSet<>();
        public Set<String> interests = new HashSet<>();
        public String careerLabel;

        public StudentInstance() {}
    }

    public static class CareerProbability {
        public String career;
        public double probability;

        public CareerProbability(String career, double probability) {
            this.career = career;
            this.probability = probability;
        }

        public String getCareer() { return career; }
        public double getProbability() { return probability; }
    }

    // Constructor initiates synthetic data generation
    public KNNClassifier() {
        generateTrainingData(1200);
        System.out.println("KNN Classifier successfully trained with " + trainingData.size() + " synthetic records.");
    }

    private void generateTrainingData(int size) {
        Random rand = new Random(42); // Seeded for reproducibility

        for (int i = 0; i < size; i++) {
            StudentInstance inst = new StudentInstance();
            
            // Academic and aptitude features
            inst.cgpa = 6.0 + (rand.nextDouble() * 4.0); // 6.0 to 10.0
            inst.projects = rand.nextInt(6); // 0 to 5
            inst.certifications = rand.nextInt(6); // 0 to 5
            
            inst.aptAnalytical = 40 + rand.nextDouble() * 60; // 40 to 100
            inst.aptCoding = 40 + rand.nextDouble() * 60; // 40 to 100
            inst.aptCommunication = 40 + rand.nextDouble() * 60; // 40 to 100
            inst.aptProblemSolving = 40 + rand.nextDouble() * 60; // 40 to 100

            // Choose primary interest
            int primaryIntIdx = rand.nextInt(INTERESTS_LIST.size());
            String primaryInterest = INTERESTS_LIST.get(primaryIntIdx);
            inst.interests.add(primaryInterest);

            // 30% chance of secondary interest
            if (rand.nextDouble() < 0.3) {
                int secIntIdx = rand.nextInt(INTERESTS_LIST.size());
                if (secIntIdx != primaryIntIdx) {
                    inst.interests.add(INTERESTS_LIST.get(secIntIdx));
                }
            }

            // Generate skills biased by primary interest
            for (String skill : SKILLS_LIST) {
                if (rand.nextDouble() < 0.15) {
                    inst.skills.add(skill); // Base chance of having any skill
                }
            }

            // Add strong skills based on primary interest
            switch (primaryInterest) {
                case "Interest_AI":
                    if (rand.nextDouble() < 0.85) inst.skills.add("Python");
                    if (rand.nextDouble() < 0.80) inst.skills.add("Machine_Learning");
                    if (rand.nextDouble() < 0.60) inst.skills.add("Deep_Learning");
                    if (rand.nextDouble() < 0.50) inst.skills.add("SQL");
                    break;
                case "Interest_DataScience":
                    if (rand.nextDouble() < 0.85) inst.skills.add("Python");
                    if (rand.nextDouble() < 0.80) inst.skills.add("SQL");
                    if (rand.nextDouble() < 0.70) inst.skills.add("Machine_Learning");
                    break;
                case "Interest_Web":
                    if (rand.nextDouble() < 0.90) inst.skills.add("HTML_CSS");
                    if (rand.nextDouble() < 0.85) inst.skills.add("JavaScript");
                    if (rand.nextDouble() < 0.65) inst.skills.add("Java");
                    break;
                case "Interest_Cybersecurity":
                    if (rand.nextDouble() < 0.85) inst.skills.add("Networking");
                    if (rand.nextDouble() < 0.80) inst.skills.add("Linux");
                    if (rand.nextDouble() < 0.50) inst.skills.add("SQL");
                    break;
                case "Interest_Cloud":
                    if (rand.nextDouble() < 0.85) inst.skills.add("Cloud_Computing");
                    if (rand.nextDouble() < 0.75) inst.skills.add("Linux");
                    if (rand.nextDouble() < 0.60) inst.skills.add("Networking");
                    break;
                case "Interest_UIUX":
                    if (rand.nextDouble() < 0.90) inst.skills.add("UI_UX_Design");
                    if (rand.nextDouble() < 0.65) inst.skills.add("HTML_CSS");
                    break;
            }

            // Calculate suitability scores for each career class
            Map<String, Double> scores = new HashMap<>();

            scores.put("AI Engineer", 
                0.35 * (inst.interests.contains("Interest_AI") ? 1 : 0) +
                0.20 * (inst.skills.contains("Machine_Learning") ? 1 : 0) +
                0.20 * (inst.skills.contains("Deep_Learning") ? 1 : 0) +
                0.10 * (inst.skills.contains("Python") ? 1 : 0) +
                0.08 * (inst.aptCoding / 100.0) +
                0.07 * (inst.aptAnalytical / 100.0)
            );

            scores.put("Data Scientist", 
                0.35 * (inst.interests.contains("Interest_DataScience") ? 1 : 0) +
                0.20 * (inst.skills.contains("Python") ? 1 : 0) +
                0.15 * (inst.skills.contains("SQL") ? 1 : 0) +
                0.15 * (inst.skills.contains("Machine_Learning") ? 1 : 0) +
                0.08 * (inst.aptAnalytical / 100.0) +
                0.07 * (inst.aptProblemSolving / 100.0)
            );

            scores.put("Software Developer", 
                0.35 * (inst.interests.contains("Interest_Web") ? 1 : 0) +
                0.15 * (inst.skills.contains("Java") ? 1 : 0) +
                0.15 * (inst.skills.contains("JavaScript") ? 1 : 0) +
                0.10 * (inst.skills.contains("C++") ? 1 : 0) +
                0.10 * (inst.skills.contains("HTML_CSS") ? 1 : 0) +
                0.15 * (inst.aptCoding / 100.0)
            );

            scores.put("Cybersecurity Analyst", 
                0.35 * (inst.interests.contains("Interest_Cybersecurity") ? 1 : 0) +
                0.25 * (inst.skills.contains("Networking") ? 1 : 0) +
                0.20 * (inst.skills.contains("Linux") ? 1 : 0) +
                0.10 * (inst.skills.contains("SQL") ? 1 : 0) +
                0.10 * (inst.aptProblemSolving / 100.0)
            );

            scores.put("Cloud Engineer", 
                0.35 * (inst.interests.contains("Interest_Cloud") ? 1 : 0) +
                0.30 * (inst.skills.contains("Cloud_Computing") ? 1 : 0) +
                0.15 * (inst.skills.contains("Linux") ? 1 : 0) +
                0.10 * (inst.skills.contains("Networking") ? 1 : 0) +
                0.10 * (inst.cgpa / 10.0)
            );

            scores.put("UI/UX Designer", 
                0.40 * (inst.interests.contains("Interest_UIUX") ? 1 : 0) +
                0.30 * (inst.skills.contains("UI_UX_Design") ? 1 : 0) +
                0.15 * (inst.skills.contains("HTML_CSS") ? 1 : 0) +
                0.15 * (inst.aptCommunication / 100.0)
            );

            // Label instance with highest suitability score + minor noise
            String finalCareer = "Software Developer";
            double maxScore = -999;
            for (String career : CAREER_CLASSES) {
                double score = scores.get(career) + (rand.nextGaussian() * 0.05); // Add variance
                if (score > maxScore) {
                    maxScore = score;
                    finalCareer = career;
                }
            }
            inst.careerLabel = finalCareer;
            trainingData.add(inst);
        }
    }

    // Predict suitable careers using KNN classification
    public List<CareerProbability> predict(
            double cgpa, int projects, int certifications,
            double analytical, double coding, double communication, double problemSolving,
            Set<String> activeSkills, Set<String> activeInterests) {

        // Compute distances to all instances
        List<NeighborDistance> distances = new ArrayList<>();
        for (StudentInstance inst : trainingData) {
            double dist = computeDistance(
                cgpa, projects, certifications, analytical, coding, communication, problemSolving,
                activeSkills, activeInterests, inst
            );
            distances.add(new NeighborDistance(inst, dist));
        }

        // Sort by distance ascending
        Collections.sort(distances, Comparator.comparingDouble(nd -> nd.distance));

        // Get Top K neighbors and count class frequencies
        Map<String, Integer> counts = new HashMap<>();
        for (String c : CAREER_CLASSES) {
            counts.put(c, 0);
        }

        for (int i = 0; i < K && i < distances.size(); i++) {
            String label = distances.get(i).instance.careerLabel;
            counts.put(label, counts.get(label) + 1);
        }

        // Map frequencies to probabilities
        List<CareerProbability> results = new ArrayList<>();
        for (String c : CAREER_CLASSES) {
            double prob = (double) counts.get(c) / K;
            results.add(new CareerProbability(c, prob));
        }

        // Sort by probability descending
        results.sort(Comparator.comparingDouble(CareerProbability::getProbability).reversed());

        return results;
    }

    // Weighted distance function
    private double computeDistance(
            double cgpa, int projects, int certifications,
            double analytical, double coding, double communication, double problemSolving,
            Set<String> activeSkills, Set<String> activeInterests, StudentInstance inst) {

        double dist = 0.0;

        // Numerical features normalized difference squared
        dist += 1.5 * Math.pow((cgpa - inst.cgpa) / 4.0, 2);
        dist += 1.0 * Math.pow((projects - inst.projects) / 5.0, 2);
        dist += 1.0 * Math.pow((certifications - inst.certifications) / 5.0, 2);
        
        dist += 0.2 * Math.pow((analytical - inst.aptAnalytical) / 60.0, 2);
        dist += 0.2 * Math.pow((coding - inst.aptCoding) / 60.0, 2);
        dist += 0.2 * Math.pow((communication - inst.aptCommunication) / 60.0, 2);
        dist += 0.2 * Math.pow((problemSolving - inst.aptProblemSolving) / 60.0, 2);

        // Skills distances (higher weight since key skills are paramount)
        for (String s : SKILLS_LIST) {
            int currentVal = activeSkills.contains(s) ? 1 : 0;
            int instVal = inst.skills.contains(s) ? 1 : 0;
            dist += 4.5 * Math.pow(currentVal - instVal, 2);
        }

        // Interests distances (highest weight representing target alignment)
        for (String i : INTERESTS_LIST) {
            int currentVal = activeInterests.contains(i) ? 1 : 0;
            int instVal = inst.interests.contains(i) ? 1 : 0;
            dist += 9.0 * Math.pow(currentVal - instVal, 2);
        }

        return Math.sqrt(dist);
    }

    private static class NeighborDistance {
        public StudentInstance instance;
        public double distance;

        public NeighborDistance(StudentInstance instance, double distance) {
            this.instance = instance;
            this.distance = distance;
        }
    }
}
