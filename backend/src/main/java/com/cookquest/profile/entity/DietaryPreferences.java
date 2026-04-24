package com.cookquest.profile.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DietaryPreferences {
    private String diet = "none";
    private List<String> allergens = new ArrayList<>();
    private List<String> dislikes = new ArrayList<>();
    private String customNote = "";
}