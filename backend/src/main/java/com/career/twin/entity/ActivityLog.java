package com.career.twin.entity;

import java.time.LocalDateTime;

/**
 * Entity representing a system activity log entry.
 * Maps to the 'activity_log' database table.
 */
public class ActivityLog {

    private int id;
    private Integer userId;
    private String username;
    private String action;
    private String details;
    private LocalDateTime timestamp;

    public ActivityLog() {
    }

    public ActivityLog(int id, Integer userId, String username, String action, String details, LocalDateTime timestamp) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.action = action;
        this.details = details;
        this.timestamp = timestamp;
    }

    // Getters and Setters

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "ActivityLog{" +
                "id=" + id +
                ", userId=" + userId +
                ", username='" + username + '\'' +
                ", action='" + action + '\'' +
                ", details='" + details + '\'' +
                '}';
    }
}
