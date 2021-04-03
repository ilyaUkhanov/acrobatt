package com.g6.acrobatteAPI.models.challenge;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import lombok.Data;

@Data
public class ChallengeEditModel {
    @NotBlank(message = "Vous devez précisez le nom du challenge")
    private String name;

    @NotBlank(message = "Vous devez précisez la description du challenge")
    private String description;

    private String shortDescription;

    @NotNull(message = "Vous devez précisez l'échelle du challenge")
    private double scale;
}
