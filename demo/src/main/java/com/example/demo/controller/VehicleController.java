package com.example.demo.controller;

import com.example.demo.model.Vehicle;
import com.example.demo.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private static final SecureRandom RANDOM = new SecureRandom();

    public VehicleController(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    @GetMapping("/{id}")
    public Vehicle getVehicleById(@PathVariable Long id) {
        return vehicleRepository.findById(id).orElseThrow(() -> new NoSuchElementException("Vehicle not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Vehicle createVehicle(@RequestBody Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    @PutMapping("/{id}")
    public Vehicle updateVehicle(@PathVariable Long id, @RequestBody Vehicle updatedVehicle) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Vehicle not found"));

        existing.setName(updatedVehicle.getName());
        existing.setBrand(updatedVehicle.getBrand());
        existing.setCategory(updatedVehicle.getCategory());
        existing.setModelYear(updatedVehicle.getModelYear());
        existing.setCity(updatedVehicle.getCity());
        existing.setSeats(updatedVehicle.getSeats());
        existing.setTransmission(updatedVehicle.getTransmission());
        existing.setFuel(updatedVehicle.getFuel());
        existing.setEngine(updatedVehicle.getEngine());
        existing.setLuggage(updatedVehicle.getLuggage());
        existing.setDailyKm(updatedVehicle.getDailyKm());
        existing.setRating(updatedVehicle.getRating());
        existing.setMatchScore(updatedVehicle.getMatchScore());
        existing.setBadge(updatedVehicle.getBadge());
        existing.setImageUrl(updatedVehicle.getImageUrl());
        existing.setDescription(updatedVehicle.getDescription());
        existing.setPricePerDay(updatedVehicle.getPricePerDay());
        existing.setPlateNumber(updatedVehicle.getPlateNumber());
        existing.setAvailabilityStatus(updatedVehicle.getAvailabilityStatus());

        return vehicleRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVehicle(@PathVariable Long id) {
        if (!vehicleRepository.existsById(id)) {
            throw new NoSuchElementException("Vehicle not found");
        }
        vehicleRepository.deleteById(id);
    }

    @PostMapping("/randomize-plates")
    public List<Vehicle> randomizeVehiclePlates() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        Set<String> usedPlates = new HashSet<>();

        for (Vehicle vehicle : vehicles) {
            String plate = generateUniquePlate(usedPlates);
            vehicle.setPlateNumber(plate);
        }

        return vehicleRepository.saveAll(vehicles);
    }

    private String generateUniquePlate(Set<String> usedPlates) {
        String plate;
        do {
            plate = randomLetters(3) + "-" + randomNumbers(3);
        } while (!usedPlates.add(plate));
        return plate;
    }

    private String randomLetters(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append((char) ('A' + RANDOM.nextInt(26)));
        }
        return sb.toString();
    }

    private String randomNumbers(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}
