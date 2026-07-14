package com.career.twin.entity;

import java.util.HashSet;
import java.util.Set;

/**
 * Entity representing a student's career assessment profile.
 * Maps to the 'profiles' database table.
 */
public class Profile {

    private int userId;
    private double cgpa;
    private int projects;
    private int certifications;
    private double aptAnalytical;
    private double aptCoding;
    private double aptCommunication;
    private double aptProblemSolving;
    private Set<String> skills;
    private Set<String> interests;

    public Profile() {
        this.skills = new HashSet<>();
        this.interests = new HashSet<>();
    }

    public Profile(int userId, double cgpa, int projects, int certifications,
                   double aptAnalytical, double aptCoding, double aptCommunication,
                   double aptProblemSolving, Set<String> skills, Set<String> interests) {
        this.userId = userId;
        this.cgpa = cgpa;
        this.projects = projects;
        this.certifications = certifications;
        this.aptAnalytical = aptAnalytical;
        this.aptCoding = aptCoding;
        this.aptCommunication = aptCommunication;
        this.aptProblemSolving = aptProblemSolving;
        this.skills = skills != null ? skills : new HashSet<>();
        this.interests = interests != null ? interests : new HashSet<>();
    }

    // Getters and Setters

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public double getCgpa() {
        return cgpa;
    }

    public void setCgpa(double cgpa) {
        this.cgpa = cgpa;
    }

    public int getProjects() {
        return projects;
    }

    public void setProjects(int projects) {
        this.projects = projects;
    }

    public int getCertifications() {
        return certifications;
    }

    public void setCertifications(int certifications) {
        this.certifications = certifications;
    }

    public double getAptAnalytical() {
        return aptAnalytical;
    }

    public void setAptAnalytical(double aptAnalytical) {
        this.aptAnalytical = aptAnalytical;
    }

    public double getAptCoding() {
        return aptCoding;
    }

    public void setAptCoding(double aptCoding) {
        this.aptCoding = aptCoding;
    }

    public double getAptCommunication() {
        return aptCommunication;
    }

    public void setAptCommunication(double aptCommunication) {
        this.aptCommunication = aptCommunication;
    }

    public double getAptProblemSolving() {
        return aptProblemSolving;
    }

    public void setAptProblemSolving(double aptProblemSolving) {
        this.aptProblemSolving = aptProblemSolving;
    }

    public Set<String> getSkills() {
        return skills;
    }

    public void setSkills(Set<String> skills) {
        this.skills = skills;
    }

    public Set<String> getInterests() {
        return interests;
    }

    public void setInterests(Set<String> interests) {
        this.interests = interests;
    }

    @Override
    public String toString() {
        return "Profile{" +
                "userId=" + userId +
                ", cgpa=" + cgpa +
                ", projects=" + projects +
                ", certifications=" + certifications +
                ", skills=" + skills +
                ", interests=" + interests +
                '}';
    }
}
