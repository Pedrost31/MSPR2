"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const env_1 = require("../config/env");
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HealthAI Coach API',
            version: '1.0.0',
            description: 'API REST pour la gestion de la santé, nutrition et activités physiques avec recommandations IA. ' +
                'Authentification via JWT Bearer token.',
            contact: { name: 'HealthAI Team', email: 'contact@healthai.com' },
        },
        servers: [{ url: `http://localhost:${env_1.env.PORT}/api`, description: 'Développement local' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {},
                        message: { type: 'string' },
                        errors: { type: 'array', items: { type: 'string' } },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        age: { type: 'integer' },
                        weight: { type: 'number', description: 'kg' },
                        height: { type: 'number', description: 'cm' },
                        gender: { type: 'string', enum: ['male', 'female', 'other'] },
                        activityLevel: { type: 'string', enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
                        goal: { type: 'string', enum: ['lose', 'maintain', 'gain'] },
                        dailyCalorieTarget: { type: 'integer' },
                    },
                },
                AuthTokens: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' },
                    },
                },
                FoodEntry: {
                    type: 'object',
                    required: ['name', 'calories', 'mealType'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        calories: { type: 'number' },
                        protein: { type: 'number' },
                        carbs: { type: 'number' },
                        fat: { type: 'number' },
                        fiber: { type: 'number' },
                        mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
                        date: { type: 'string', format: 'date-time' },
                    },
                },
                ActivityEntry: {
                    type: 'object',
                    required: ['name', 'duration', 'caloriesBurned'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        duration: { type: 'integer', description: 'Durée en minutes' },
                        caloriesBurned: { type: 'number' },
                        type: { type: 'string', enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'] },
                        date: { type: 'string', format: 'date-time' },
                    },
                },
                GoalSettings: {
                    type: 'object',
                    properties: {
                        dailyCalorieTarget: { type: 'integer' },
                        dailyProteinTarget: { type: 'number' },
                        dailyCarbsTarget: { type: 'number' },
                        dailyFatTarget: { type: 'number' },
                        weeklyWorkoutTarget: { type: 'integer' },
                        targetWeight: { type: 'number' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentification et gestion des tokens' },
            { name: 'Users', description: 'Profil utilisateur' },
            { name: 'Food', description: 'Suivi nutritionnel' },
            { name: 'Activities', description: 'Suivi des activités sportives' },
            { name: 'Goals', description: 'Objectifs de santé' },
            { name: 'AI', description: 'Recommandations par intelligence artificielle' },
        ],
        paths: {
            '/auth/register': {
                post: {
                    tags: ['Auth'], summary: 'Créer un compte', security: [],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                                    type: 'object', required: ['email', 'password', 'name'],
                                    properties: {
                                        email: { type: 'string', format: 'email', example: 'alice@example.com' },
                                        password: { type: 'string', minLength: 8, example: 'Secret123!' },
                                        name: { type: 'string', example: 'Alice' },
                                        age: { type: 'integer', example: 28 },
                                        weight: { type: 'number', example: 65 },
                                        height: { type: 'number', example: 168 },
                                        gender: { type: 'string', enum: ['male', 'female', 'other'] },
                                        activityLevel: { type: 'string', enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
                                        goal: { type: 'string', enum: ['lose', 'maintain', 'gain'] },
                                    },
                                } } },
                    },
                    responses: {
                        201: { description: 'Compte créé', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/AuthTokens' } } }] } } } },
                        409: { description: 'Email déjà utilisé' },
                        422: { description: 'Données invalides' },
                    },
                },
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'], summary: 'Se connecter', security: [],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                                    type: 'object', required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email', example: 'alice@example.com' },
                                        password: { type: 'string', example: 'Secret123!' },
                                    },
                                } } },
                    },
                    responses: {
                        200: { description: 'Connexion réussie', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/AuthTokens' } } }] } } } },
                        401: { description: 'Identifiants incorrects' },
                    },
                },
            },
            '/auth/refresh': {
                post: {
                    tags: ['Auth'], summary: 'Rafraîchir le token', security: [],
                    requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Tokens rafraîchis' }, 401: { description: 'Token invalide ou expiré' } },
                },
            },
            '/auth/logout': {
                post: {
                    tags: ['Auth'], summary: 'Se déconnecter',
                    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } } },
                    responses: { 200: { description: 'Déconnexion réussie' } },
                },
            },
            '/users/me': {
                get: { tags: ['Users'], summary: 'Obtenir son profil', responses: { 200: { description: 'Profil utilisateur', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/User' } } }] } } } } } },
                put: { tags: ['Users'], summary: 'Modifier son profil', requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, responses: { 200: { description: 'Profil mis à jour' } } },
                delete: { tags: ['Users'], summary: 'Supprimer son compte', responses: { 200: { description: 'Compte supprimé' } } },
            },
            '/food-entries': {
                get: {
                    tags: ['Food'], summary: 'Lister les entrées alimentaires',
                    parameters: [
                        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-06-01' },
                        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-06-30' },
                        { name: 'mealType', in: 'query', schema: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] } },
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
                    ],
                    responses: { 200: { description: 'Liste des entrées' } },
                },
                post: {
                    tags: ['Food'], summary: 'Ajouter une entrée alimentaire',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/FoodEntry' } } } },
                    responses: { 201: { description: 'Entrée créée' }, 422: { description: 'Données invalides' } },
                },
            },
            '/food-entries/daily-summary': {
                get: {
                    tags: ['Food'], summary: 'Résumé nutritionnel journalier',
                    parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'YYYY-MM-DD (défaut : aujourd\'hui)' }],
                    responses: { 200: { description: 'Résumé calorique et macros du jour' } },
                },
            },
            '/food-entries/{id}': {
                get: { tags: ['Food'], summary: 'Obtenir une entrée', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Entrée alimentaire' }, 404: { description: 'Introuvable' } } },
                put: { tags: ['Food'], summary: 'Modifier une entrée', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/FoodEntry' } } } }, responses: { 200: { description: 'Mise à jour réussie' } } },
                delete: { tags: ['Food'], summary: 'Supprimer une entrée', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Suppression réussie' } } },
            },
            '/activities': {
                get: {
                    tags: ['Activities'], summary: 'Lister les activités',
                    parameters: [
                        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
                        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
                        { name: 'type', in: 'query', schema: { type: 'string', enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'] } },
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
                    ],
                    responses: { 200: { description: 'Liste des activités' } },
                },
                post: {
                    tags: ['Activities'], summary: 'Enregistrer une activité',
                    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ActivityEntry' } } } },
                    responses: { 201: { description: 'Activité créée' } },
                },
            },
            '/activities/weekly-summary': {
                get: { tags: ['Activities'], summary: 'Résumé hebdomadaire d\'activité', responses: { 200: { description: 'Calories brûlées, durée totale, nb de séances' } } },
            },
            '/activities/{id}': {
                get: { tags: ['Activities'], summary: 'Obtenir une activité', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Activité' }, 404: { description: 'Introuvable' } } },
                put: { tags: ['Activities'], summary: 'Modifier une activité', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ActivityEntry' } } } }, responses: { 200: { description: 'Mise à jour' } } },
                delete: { tags: ['Activities'], summary: 'Supprimer une activité', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Suppression réussie' } } },
            },
            '/goals': {
                get: { tags: ['Goals'], summary: 'Obtenir les objectifs', responses: { 200: { description: 'Objectifs de santé', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { properties: { data: { $ref: '#/components/schemas/GoalSettings' } } }] } } } } } },
                put: { tags: ['Goals'], summary: 'Mettre à jour les objectifs', requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/GoalSettings' } } } }, responses: { 200: { description: 'Objectifs mis à jour' } } },
            },
            '/ai/recommend': {
                post: {
                    tags: ['AI'], summary: 'Générer une recommandation IA',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', enum: ['nutrition', 'activity', 'general'], default: 'general' },
                                        context: { type: 'string', maxLength: 500, description: 'Contexte optionnel (ex: "J\'ai un repas de famille demain")' },
                                    },
                                } } },
                    },
                    responses: {
                        200: { description: 'Recommandation générée (OpenAI ou mode mock)' },
                        429: { description: 'Trop de requêtes IA (10/heure max)' },
                    },
                },
            },
            '/ai/history': {
                get: {
                    tags: ['AI'], summary: 'Historique des recommandations',
                    parameters: [
                        { name: 'type', in: 'query', schema: { type: 'string', enum: ['nutrition', 'activity', 'general'] } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
                    ],
                    responses: { 200: { description: 'Historique des recommandations IA (stockées dans MongoDB)' } },
                },
            },
        },
    },
    apis: [],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map