package com.odiparpack.models;

public class Client {
    private String clientId;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;

    public Client(String clientId, String firstName, String lastName, String phone, String email) {
        this.clientId = clientId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.email = email;
    }

    // Getters
    public String getClientId() { return clientId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
}