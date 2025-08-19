package com.showroom.management.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {
    private static final Logger logger = LoggerFactory.getLogger(ViewController.class);

    @Autowired
    private ApplicationContext applicationContext;
    @GetMapping({"/", "/app"})
    public String index(Model model) {
        model.addAttribute("apiBaseUrl", "/api");
        // Debug: Check if Thymeleaf is configured
        try {
            Resource template = applicationContext.getResource("classpath:/templates/index.html");
            logger.info("Template exists: {}", template.exists());
            logger.info("Template URL: {}", template.getURL());
        } catch (Exception e) {
            logger.error("Template check failed: {}", e.getMessage());
        }
        return "index"; // Returns src/main/resources/templates/index.html
    }

}