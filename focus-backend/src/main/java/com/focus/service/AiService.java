package com.focus.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiService {

    @Value("${groq.api.key:}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL    = "llama-3.3-70b-versatile";

    private static final List<String> CATEGORIAS = List.of(
        "hidratação", "recuperação muscular", "treino",
        "nutrição esportiva", "mentalidade atlética", "corrida", "sono e descanso"
    );

    public String generateTip() {
        if (groqApiKey == null || groqApiKey.isBlank()) return null;

        String categoria = CATEGORIAS.get(new Random().nextInt(CATEGORIAS.size()));
        String prompt = """
            ## Especialidade
            Você é um especialista em performance esportiva e saúde para atletas amadores e profissionais.

            ## Tarefa
            Gere UMA dica prática e motivadora sobre o tema: "%s"

            ## Regras
            - A dica deve ser objetiva, entre 1 e 2 frases
            - Máximo de 180 caracteres no total
            - Inclua um dado concreto quando possível (percentuais, tempo, números)
            - Tom direto e motivador, sem saudações ou despedidas

            ## Resposta
            Responda APENAS com o texto da dica, nada mais.
            """.formatted(categoria);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = Map.of(
            "model", MODEL,
            "messages", List.of(Map.of("role", "user", "content", prompt)),
            "max_tokens", 200,
            "temperature", 0.7
        );

        try {
            RestTemplate rest = new RestTemplate();
            ResponseEntity<Map> resp = rest.postForEntity(GROQ_URL, new HttpEntity<>(body, headers), Map.class);
            List<?> choices = (List<?>) resp.getBody().get("choices");
            Map<?, ?> choice  = (Map<?, ?>) choices.get(0);
            Map<?, ?> message = (Map<?, ?>) choice.get("message");
            return ((String) message.get("content")).trim();
        } catch (Exception e) {
            return null;
        }
    }
}
