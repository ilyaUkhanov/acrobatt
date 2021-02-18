package com.g6.acrobatteAPI.controllers;

import javax.annotation.PostConstruct;
import javax.validation.Valid;

import com.g6.acrobatteAPI.entities.Challenge;
import com.g6.acrobatteAPI.entities.ChallengeFactory;
import com.g6.acrobatteAPI.entities.User;
import com.g6.acrobatteAPI.hateoas.ChallengeModelAssembler;
import com.g6.acrobatteAPI.models.challenge.ChallengeAddAdministratorModel;
import com.g6.acrobatteAPI.models.challenge.ChallengeCreateModel;
import com.g6.acrobatteAPI.models.challenge.ChallengeDetailProjection;
import com.g6.acrobatteAPI.models.challenge.ChallengeEditModel;
import com.g6.acrobatteAPI.models.challenge.ChallengeRemoveAdministratorModel;
import com.g6.acrobatteAPI.models.challenge.ChallengeResponseModel;
import com.g6.acrobatteAPI.repositories.ChallengeRepository;
import com.g6.acrobatteAPI.repositories.UserRepository;
import com.g6.acrobatteAPI.security.AuthenticationFacade;
import com.g6.acrobatteAPI.services.ChallengeService;

import org.modelmapper.ModelMapper;
import org.modelmapper.PropertyMap;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RequestMapping("challenges")
@Controller
public class ChallengeController {
    private final ChallengeService challengeService;
    private final ChallengeRepository challengeRepository;
    private final ModelMapper modelMapper;
    private final ChallengeModelAssembler modelAssembler;
    private final PagedResourcesAssembler<ChallengeResponseModel> pagedResourcesAssembler;
    private final UserRepository userRepository;
    private final AuthenticationFacade authenticationFacade;

    @PostConstruct
    public void initialize() {
        /**
         * Rajoute le mapping explicite de administratorsId entre l'entité et le modèle
         */
        PropertyMap<Challenge, ChallengeResponseModel> challengeMap = new PropertyMap<Challenge, ChallengeResponseModel>() {
            protected void configure() {
                map().setAdministratorsId(source.getAdministratorsId());
            }
        };
        modelMapper.addMappings(challengeMap);
    }

    @GetMapping
    public ResponseEntity<PagedModel<EntityModel<ChallengeResponseModel>>> getAllChallenges(Pageable pageable) {
        Page<Challenge> challengesPage = challengeRepository.findAll(pageable);

        // Transformer la page d'entités en une page de modèles
        Page<ChallengeResponseModel> challengesResponsePage = challengesPage
                .map((challenge) -> modelMapper.map(challenge, ChallengeResponseModel.class));

        // Transformer la page de modèles en page HATEOAS
        PagedModel<EntityModel<ChallengeResponseModel>> pagedModel = pagedResourcesAssembler
                .toModel(challengesResponsePage, modelAssembler);

        return ResponseEntity.ok().body(pagedModel);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<ChallengeResponseModel>> getChallenge(@PathVariable("id") Long id) {
        Challenge challenge = challengeService.findChallenge(id);

        // Transformerl'entité en un modèle
        ChallengeResponseModel model = modelMapper.map(challenge, ChallengeResponseModel.class);

        // Transformer le modèle en un modèle HATEOAS
        EntityModel<ChallengeResponseModel> hateoasModel = modelAssembler.toModel(model);

        return ResponseEntity.ok().body(hateoasModel);
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<ChallengeDetailProjection> getChallengeDetail(@PathVariable("id") Long id) {

        ChallengeDetailProjection challenge = challengeService.findChallengeDetail(id);

        return ResponseEntity.ok().body(challenge);
    }

    @PostMapping
    public ResponseEntity<Object> createChallenge(@RequestBody @Valid ChallengeCreateModel challengeCreateModel) {

        User user = authenticationFacade.getUser().get();

        ChallengeDetailProjection challengeResponse = challengeService.create(challengeCreateModel, user);

        if (challengeResponse == null) {
            return ResponseEntity.badRequest().body("Erreur lors de la création du challenge");
        }

        return ResponseEntity.ok().body(challengeResponse);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<ChallengeResponseModel>> editChallenge(@PathVariable("id") Long id,
            @RequestBody @Valid ChallengeEditModel challengeEditModel) {
        Challenge challengeToEdit = challengeService.findChallenge(id);
        if (challengeToEdit == null) {
            throw new IllegalArgumentException("Le challenge avec cet id n'existe pas");
        }

        String name = challengeEditModel.getName();

        if (name != null && !name.equals("")) {
            challengeToEdit.setName(name);
        }

        String description = challengeEditModel.getDescription();
        if (description != null) {
            challengeToEdit.setDescription(description);
        }

        challengeService.edit(challengeToEdit);

        // Transformerl'entité en un modèle
        ChallengeResponseModel model = modelMapper.map(challengeToEdit, ChallengeResponseModel.class);

        // Transformer le modèle en un modèle HATEOAS
        EntityModel<ChallengeResponseModel> hateoasModel = modelAssembler.toModel(model);

        return ResponseEntity.ok().body(hateoasModel);
    }

    @PutMapping("/{id}/admin")
    public ResponseEntity<EntityModel<ChallengeResponseModel>> addAdministrator(@PathVariable("id") Long id,
            @RequestBody @Valid ChallengeAddAdministratorModel challengeAddAdministratorModel) {
        Challenge challengeToEdit = challengeService.findChallenge(id);
        if (challengeToEdit == null) {
            throw new IllegalArgumentException("Le challenge avec cet id n'existe pas");
        }

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = ((UserDetails) principal).getUsername();
        User user = userRepository.findByEmail(email).get();

        if (!challengeToEdit.getAdministrators().contains(user)) {
            throw new IllegalArgumentException("Vous n'êtes pas administrateur du challenge");
        }

        Long adminId = challengeAddAdministratorModel.getAdminId();
        User admin = null;
        try {
            admin = userRepository.findById(adminId).get();
        } catch (Exception e) {
            throw new IllegalArgumentException("L'Utilisateur que vous essayez d'ajouter n'existe pas");
        }

        if (challengeToEdit.getAdministrators().contains(admin)) {
            throw new IllegalArgumentException("L'Utilisateur que vous essayez d'ajouter et déjà administrateur");
        }

        challengeToEdit.addAdministrator(admin);
        challengeService.edit(challengeToEdit);

        // Transformerl'entité en un modèle
        ChallengeResponseModel model = modelMapper.map(challengeToEdit, ChallengeResponseModel.class);

        // Transformer le modèle en un modèle HATEOAS
        EntityModel<ChallengeResponseModel> hateoasModel = modelAssembler.toModel(model);

        return ResponseEntity.ok().body(hateoasModel);
    }

    @DeleteMapping("/{id}/admin")
    public ResponseEntity<EntityModel<ChallengeResponseModel>> removeAdministrator(@PathVariable("id") Long id,
            ChallengeRemoveAdministratorModel challengeRemoveAdministratorModel) {
        Challenge challengeToEdit = challengeService.findChallenge(id);
        if (challengeToEdit == null) {
            throw new IllegalArgumentException("Le challenge avec cet id n'existe pas");
        }

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String email = ((UserDetails) principal).getUsername();
        User user = userRepository.findByEmail(email).get();

        if (!challengeToEdit.getAdministrators().contains(user)) {
            throw new IllegalArgumentException("Vous n'êtes pas administrateur du challenge");
        }

        Long adminId = challengeRemoveAdministratorModel.getAdminId();
        User admin = null;
        try {
            admin = userRepository.findById(adminId).get();
        } catch (Exception e) {
            throw new IllegalArgumentException("L'Utilisateur que vous essayez d'enlever n'existe pas");
        }

        if (!challengeToEdit.getAdministrators().contains(admin)) {
            throw new IllegalArgumentException("L'Utilisateur que vous essayez d'enlever n'est pas administrateur");
        }

        challengeToEdit.removeAdministrator(admin);
        challengeService.edit(challengeToEdit);

        // Transformerl'entité en un modèle
        ChallengeResponseModel model = modelMapper.map(challengeToEdit, ChallengeResponseModel.class);

        // Transformer le modèle en un modèle HATEOAS
        EntityModel<ChallengeResponseModel> hateoasModel = modelAssembler.toModel(model);

        return ResponseEntity.ok().body(hateoasModel);
    }
}
