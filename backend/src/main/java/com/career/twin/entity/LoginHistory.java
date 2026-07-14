package com.career.twin.entity;

import java.time.LocalDateTime;

/**
 * Entity representing a login history record.
 * Maps to the 'login_history' database table.
 */
public class LoginHistory {

    private int id;
    private int userId;
    private LocalDateTime loginTime;
    private String ipAddress;
    private String userAgent;

    public LoginHistory() {
    }

    public LoginHistory(int id, int userId, LocalDateTime loginTime, String ipAddress, String userAgent) {
        this.id = id;
        this.userId = userId;
        this.loginTime = loginTime;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    // Getters and Setters

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public LocalDateTime getLoginTime() {
        return loginTime;
    }

    public void setLoginTime(LocalDateTime loginTime) {
        this.loginTime = loginTime;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    @Override
    public String toString() {
        return "LoginHistory{" +
                "id=" + id +
                ", userId=" + userId +
                ", loginTime=" + loginTime +
                '}';
    }
}
