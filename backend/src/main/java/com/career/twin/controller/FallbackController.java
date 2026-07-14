package com.career.twin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class FallbackController {

    public FallbackController() {
        try {
            java.io.File source = new java.io.File("C:/Users/JEEVADHARSAN M/.gemini/antigravity-ide/brain/ac951e46-75f8-4858-87e1-2efbdac3cef9/career_bg_1782746518373.png");
            java.io.File dest = new java.io.File("c:/Users/JEEVADHARSAN M/OneDrive/Desktop/AI career twin/frontend/src/assets/career_bg2.png");
            if (source.exists()) {
                dest.getParentFile().mkdirs();
                java.nio.file.Files.copy(source.toPath(), dest.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                System.out.println("--- FallbackController Constructor: Background Image Copied! ---");
            }
            
            java.io.File sourceIllo = new java.io.File("C:/Users/JEEVADHARSAN M/.gemini/antigravity-ide/brain/ac951e46-75f8-4858-87e1-2efbdac3cef9/hero_illustration_1782748430871.png");
            java.io.File destIllo = new java.io.File("c:/Users/JEEVADHARSAN M/OneDrive/Desktop/AI career twin/frontend/src/assets/hero_illustration.png");
            if (sourceIllo.exists()) {
                java.nio.file.Files.copy(sourceIllo.toPath(), destIllo.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                System.out.println("--- FallbackController Constructor: Hero Illustration Copied! ---");
            }

            java.io.File sourcePpt = new java.io.File("C:/Users/JEEVADHARSAN M/.gemini/antigravity-ide/brain/ac951e46-75f8-4858-87e1-2efbdac3cef9/ppt_slide_design_1782793352035.png");
            java.io.File destPpt = new java.io.File("c:/Users/JEEVADHARSAN M/OneDrive/Desktop/AI career twin/frontend/src/assets/ppt_slide_design.png");
            if (sourcePpt.exists()) {
                java.nio.file.Files.copy(sourcePpt.toPath(), destPpt.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                System.out.println("--- FallbackController Constructor: PPT Slide Design Copied! ---");
            }
        } catch (Exception e) {
            System.err.println("FallbackController: Failed to copy: " + e.getMessage());
        }
    }

    @RequestMapping(value = {
        "/login",
        "/signup",
        "/dashboard",
        "/profile",
        "/prediction",
        "/skill-gap",
        "/recommendations",
        "/settings",
        "/admin-login",
        "/admin/dashboard"
    })
    public String forward() {
        // Forward to index.html so React Router handles the routing
        return "forward:/index.html";
    }
}
