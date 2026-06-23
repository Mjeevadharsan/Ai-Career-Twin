package com.career.twin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class FallbackController {

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
