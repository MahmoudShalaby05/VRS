package com.example.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String brand;
    private String category;
    private Integer modelYear;
    private String city;
    private Integer seats;
    private String transmission;
    private String fuel;
    private String engine;
    private String luggage;
    private Integer dailyKm;
    private Double rating;
    private Integer matchScore;
    private String badge;
    private String imageUrl;
    private String description;
    private Double pricePerDay;

    public Vehicle() {
    }

    public Vehicle(String name, String brand, String category, Integer modelYear, String city, Integer seats, String transmission, String fuel, String engine, String luggage, Integer dailyKm, Double rating, Integer matchScore, String badge, String imageUrl, String description, Double pricePerDay) {
        this.name = name;
        this.brand = brand;
        this.category = category;
        this.modelYear = modelYear;
        this.city = city;
        this.seats = seats;
        this.transmission = transmission;
        this.fuel = fuel;
        this.engine = engine;
        this.luggage = luggage;
        this.dailyKm = dailyKm;
        this.rating = rating;
        this.matchScore = matchScore;
        this.badge = badge;
        this.imageUrl = imageUrl;
        this.description = description;
        this.pricePerDay = pricePerDay;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getModelYear() {
        return modelYear;
    }

    public void setModelYear(Integer modelYear) {
        this.modelYear = modelYear;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Integer getSeats() {
        return seats;
    }

    public void setSeats(Integer seats) {
        this.seats = seats;
    }

    public String getTransmission() {
        return transmission;
    }

    public void setTransmission(String transmission) {
        this.transmission = transmission;
    }

    public String getFuel() {
        return fuel;
    }

    public void setFuel(String fuel) {
        this.fuel = fuel;
    }

    public String getEngine() {
        return engine;
    }

    public void setEngine(String engine) {
        this.engine = engine;
    }

    public String getLuggage() {
        return luggage;
    }

    public void setLuggage(String luggage) {
        this.luggage = luggage;
    }

    public Integer getDailyKm() {
        return dailyKm;
    }

    public void setDailyKm(Integer dailyKm) {
        this.dailyKm = dailyKm;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Integer matchScore) {
        this.matchScore = matchScore;
    }

    public String getBadge() {
        return badge;
    }

    public void setBadge(String badge) {
        this.badge = badge;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPricePerDay() {
        return pricePerDay;
    }

    public void setPricePerDay(Double pricePerDay) {
        this.pricePerDay = pricePerDay;
    }
}
