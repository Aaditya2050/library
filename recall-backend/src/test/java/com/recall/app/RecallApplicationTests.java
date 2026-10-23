package com.recall.app;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recall.app.dto.request.LoginRequest;
import com.recall.app.dto.request.NoteRequest;
import com.recall.app.dto.request.RegisterRequest;
import com.recall.app.dto.request.SectionRequest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RecallApplicationTests {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    static String token;
    static Long noteId;
    static Long sectionId;

    @Test
    @Order(1)
    void registerUser() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test User");
        req.setEmail("test@recall.app");
        req.setPassword("password123");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").exists())
            .andReturn();

        var body = objectMapper.readTree(result.getResponse().getContentAsString());
        token = body.get("token").asText();
        assertNotNull(token);
    }

    @Test
    @Order(2)
    void login() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@recall.app");
        req.setPassword("password123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andReturn();

        var body = objectMapper.readTree(result.getResponse().getContentAsString());
        token = body.get("token").asText();
    }

    @Test
    @Order(3)
    void loginWithWrongPassword_shouldReturn401() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@recall.app");
        req.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(4)
    void createSection() throws Exception {
        SectionRequest req = new SectionRequest();
        req.setName("Finance & Markets");
        req.setIcon("TrendingUp");
        req.setAccentColor("#10b981");

        MvcResult result = mockMvc.perform(post("/api/sections")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Finance & Markets"))
            .andReturn();

        var body = objectMapper.readTree(result.getResponse().getContentAsString());
        sectionId = body.get("id").asLong();
    }

    @Test
    @Order(5)
    void createNote() throws Exception {
        NoteRequest req = new NoteRequest();
        req.setTitle("US 10-Year Treasury Yield");
        req.setContent("The yield on the 10-year US Treasury bond is a benchmark interest rate.");
        req.setSimpleMeaning("The return you get for lending to the US government for 10 years.");
        req.setExample("When yield rises to 5%, bond prices fall accordingly.");
        req.setSectionId(sectionId);
        req.getTags().add("macroeconomics");
        req.getTags().add("bonds");

        MvcResult result = mockMvc.perform(post("/api/notes")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("US 10-Year Treasury Yield"))
            .andExpect(jsonPath("$.sectionName").value("Finance & Markets"))
            .andReturn();

        var body = objectMapper.readTree(result.getResponse().getContentAsString());
        noteId = body.get("id").asLong();
    }

    @Test
    @Order(6)
    void searchNoteByContent() throws Exception {
        mockMvc.perform(get("/api/notes/search?q=benchmark")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].title").value("US 10-Year Treasury Yield"));
    }

    @Test
    @Order(7)
    void toggleFavorite() throws Exception {
        mockMvc.perform(post("/api/notes/" + noteId + "/favorite")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.isFavorite").value(true));
    }

    @Test
    @Order(8)
    void getFavorites() throws Exception {
        mockMvc.perform(get("/api/notes/favorites")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    @Order(9)
    void enableReviewAndRate() throws Exception {
        // Enable review
        MvcResult r = mockMvc.perform(post("/api/reviews/notes/" + noteId + "/enable")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.intervalDays").value(1))
            .andReturn();

        // Submit rating
        mockMvc.perform(post("/api/reviews/notes/" + noteId + "/rate")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":\"GOOD\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.repetitions").value(1));
    }

    @Test
    @Order(10)
    void unauthorizedAccessBlocked() throws Exception {
        mockMvc.perform(get("/api/notes"))
            .andExpect(status().isForbidden());
    }

    @Test
    @Order(11)
    void deleteNote() throws Exception {
        mockMvc.perform(delete("/api/notes/" + noteId)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());
    }

    @Test
    @Order(12)
    void getDashboard() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalSections").value(1));
    }

    @Test
    @Order(13)
    void healthEndpoint() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk());
    }
}
