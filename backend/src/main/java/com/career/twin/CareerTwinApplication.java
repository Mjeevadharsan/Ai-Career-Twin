package com.career.twin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CareerTwinApplication {
    public static void main(String[] args) {
        try {
            java.io.File source = new java.io.File("C:/Users/JEEVADHARSAN M/.gemini/antigravity-ide/brain/ac951e46-75f8-4858-87e1-2efbdac3cef9/career_bg_1782746518373.png");
            java.io.File dest = new java.io.File("c:/Users/JEEVADHARSAN M/OneDrive/Desktop/AI career twin/frontend/src/assets/career_bg2.png");
            if (source.exists()) {
                dest.getParentFile().mkdirs();
                java.nio.file.Files.copy(source.toPath(), dest.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                System.out.println("--- Background Image Copied Successfully! ---");
            }
            
            java.io.File sourceIllo = new java.io.File("C:/Users/JEEVADHARSAN M/.gemini/antigravity-ide/brain/ac951e46-75f8-4858-87e1-2efbdac3cef9/hero_illustration_1782748430871.png");
            java.io.File destIllo = new java.io.File("c:/Users/JEEVADHARSAN M/OneDrive/Desktop/AI career twin/frontend/src/assets/hero_illustration.png");
            if (sourceIllo.exists()) {
                java.nio.file.Files.copy(sourceIllo.toPath(), destIllo.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                System.out.println("--- Hero Illustration Copied Successfully! ---");
            }

            java.io.File sourcePpt = new java.io.File("C:/Users/JEEVADHARSAN M/.gemini/antigravity-ide/brain/ac951e46-75f8-4858-87e1-2efbdac3cef9/ppt_slide_design_1782793352035.png");
            java.io.File destPpt = new java.io.File("c:/Users/JEEVADHARSAN M/OneDrive/Desktop/AI career twin/frontend/src/assets/ppt_slide_design.png");
            if (sourcePpt.exists()) {
                java.nio.file.Files.copy(sourcePpt.toPath(), destPpt.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                System.out.println("--- PPT Slide Design Copied Successfully! ---");
            }
        } catch (Exception e) {
            System.err.println("Failed to copy image on startup: " + e.getMessage());
        }
        SpringApplication.run(CareerTwinApplication.class, args);
    }
}
