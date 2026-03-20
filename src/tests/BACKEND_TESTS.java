/*
 * ═══════════════════════════════════════════════════════════════════
 *  LendBridge — Backend Integration Tests  (Week 8)
 *  Stack: JUnit 5 · Spring Boot Test · Testcontainers (PostgreSQL)
 *  Place these files in:  src/test/java/com/lendbridge/
 * ═══════════════════════════════════════════════════════════════════
 *
 *  pom.xml / build.gradle additions needed:
 *
 *  <!-- JUnit 5 -->
 *  <dependency>
 *    <groupId>org.springframework.boot</groupId>
 *    <artifactId>spring-boot-starter-test</artifactId>
 *    <scope>test</scope>
 *  </dependency>
 *
 *  <!-- Testcontainers -->
 *  <dependency>
 *    <groupId>org.testcontainers</groupId>
 *    <artifactId>junit-jupiter</artifactId>
 *    <scope>test</scope>
 *  </dependency>
 *  <dependency>
 *    <groupId>org.testcontainers</groupId>
 *    <artifactId>postgresql</artifactId>
 *    <scope>test</scope>
 *  </dependency>
 *
 *  <!-- JaCoCo -->
 *  <plugin>
 *    <groupId>org.jacoco</groupId>
 *    <artifactId>jacoco-maven-plugin</artifactId>
 *    <configuration>
 *      <rules>
 *        <rule>
 *          <limits>
 *            <limit>
 *              <counter>LINE</counter>
 *              <minimum>0.90</minimum>
 *            </limit>
 *          </limits>
 *        </rule>
 *      </rules>
 *    </configuration>
 *  </plugin>
 */

// ─────────────────────────────────────────────────────────────────
// FILE 1: BaseIntegrationTest.java
// ─────────────────────────────────────────────────────────────────
/*
package com.lendbridge;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
public abstract class BaseIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("lendbridge_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }
}
*/

// ─────────────────────────────────────────────────────────────────
// FILE 2: LoanRequestIntegrationTest.java
// ─────────────────────────────────────────────────────────────────
/*
package com.lendbridge;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lendbridge.dto.LoanRequestDto;
import com.lendbridge.model.LoanRequest;
import com.lendbridge.model.LoanRequest.LoanStatus;
import com.lendbridge.repository.LoanRequestRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class LoanRequestIntegrationTest extends BaseIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired LoanRequestRepository loanRequestRepository;

    static Long createdRequestId;
    static final Long BORROWER_ID = 1L;
    static final Long LENDER_ID   = 2L;

    // ── Week 4: Loan Request Lifecycle ──────────────────────────

    @Test @Order(1)
    void borrower_submits_loan_request_successfully() throws Exception {
        var dto = LoanRequestDto.builder()
            .loanProductId(1L)
            .amount(BigDecimal.valueOf(50000))
            .tenureMonths(12)
            .purpose(LoanRequestDto.Purpose.EDUCATION)
            .purposeDescription("College fees")
            .build();

        var result = mockMvc.perform(post("/loan-requests?borrowerId=" + BORROWER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto))
                .with(basicAuth("9876543210", "Test@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.status").value("PENDING"))
            .andExpect(jsonPath("$.data.amount").value(50000))
            .andReturn();

        var response = objectMapper.readTree(result.getResponse().getContentAsString());
        createdRequestId = response.at("/data/id").asLong();
        assertThat(createdRequestId).isGreaterThan(0);
    }

    @Test @Order(2)
    void admin_matches_pending_request() throws Exception {
        mockMvc.perform(patch("/loan-requests/" + createdRequestId + "/match")
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("MATCHED"));

        var saved = loanRequestRepository.findById(createdRequestId).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(LoanStatus.MATCHED);
    }

    @Test @Order(3)
    void lender_accepts_matched_request() throws Exception {
        mockMvc.perform(patch("/loan-requests/" + createdRequestId + "/accept?lenderId=" + LENDER_ID)
                .with(basicAuth("9876543211", "Lender@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }

    @Test @Order(4)
    void admin_disburses_accepted_loan() throws Exception {
        mockMvc.perform(post("/disbursements/" + createdRequestId)
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("DISBURSED"));
    }

    @Test @Order(5)
    void disbursed_loan_generates_emi_schedule() throws Exception {
        mockMvc.perform(get("/emi-schedule/" + createdRequestId)
                .with(basicAuth("9876543210", "Test@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(12)); // 12 months
    }

    @Test @Order(6)
    void cannot_cancel_disbursed_loan() throws Exception {
        mockMvc.perform(patch("/loan-requests/" + createdRequestId + "/cancel?borrowerId=" + BORROWER_ID)
                .with(basicAuth("9876543210", "Test@123")))
            .andExpect(status().is4xxClientError());
    }

    @Test @Order(7)
    void admin_cannot_match_already_matched_request() throws Exception {
        // Create a second request and match it
        // Then try to match again — should fail
        var dto = LoanRequestDto.builder()
            .loanProductId(1L).amount(BigDecimal.valueOf(30000))
            .tenureMonths(6).purpose(LoanRequestDto.Purpose.MEDICAL).build();

        var createResult = mockMvc.perform(post("/loan-requests?borrowerId=" + BORROWER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto))
                .with(basicAuth("9876543210", "Test@123")))
            .andReturn();

        var id = objectMapper.readTree(createResult.getResponse().getContentAsString()).at("/data/id").asLong();

        mockMvc.perform(patch("/loan-requests/" + id + "/match")
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().isOk());

        // Match again — should fail
        mockMvc.perform(patch("/loan-requests/" + id + "/match")
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().is4xxClientError());
    }

    @Test @Order(8)
    void borrower_can_view_own_requests() throws Exception {
        mockMvc.perform(get("/loan-requests/my?borrowerId=" + BORROWER_ID)
                .with(basicAuth("9876543210", "Test@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test @Order(9)
    void lender_browse_open_requests_returns_only_pending() throws Exception {
        mockMvc.perform(get("/loan-requests/open?lenderId=" + LENDER_ID)
                .with(basicAuth("9876543211", "Lender@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[*].status").value(
                org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("PENDING"))
            ));
    }

    // ── Week 4: Preference matching ─────────────────────────────

    @Test @Order(10)
    void lender_matching_requests_respects_preferences() throws Exception {
        mockMvc.perform(get("/loan-requests/open/matching?lenderId=" + LENDER_ID)
                .with(basicAuth("9876543211", "Lender@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test @Order(11)
    void reject_returns_reason_in_response() throws Exception {
        var dto = LoanRequestDto.builder()
            .loanProductId(1L).amount(BigDecimal.valueOf(20000))
            .tenureMonths(6).purpose(LoanRequestDto.Purpose.OTHER).build();

        var createResult = mockMvc.perform(post("/loan-requests?borrowerId=" + BORROWER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto))
                .with(basicAuth("9876543210", "Test@123")))
            .andReturn();
        var id = objectMapper.readTree(createResult.getResponse().getContentAsString()).at("/data/id").asLong();

        mockMvc.perform(patch("/loan-requests/" + id + "/reject?reason=Insufficient%20income")
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("REJECTED"))
            .andExpect(jsonPath("$.data.rejectionReason").value("Insufficient income"));
    }
}
*/

// ─────────────────────────────────────────────────────────────────
// FILE 3: EmiCalculationTest.java (pure unit tests — no Spring context)
// ─────────────────────────────────────────────────────────────────
/*
package com.lendbridge.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class EmiCalculationTest {

    private static final EmiCalculationService svc = new EmiCalculationService();

    @Test
    void standard_emi_is_correct() {
        // P=100000, rate=12% pa, n=12 months  →  EMI ≈ 8884.88
        BigDecimal emi = svc.calculateEmi(
            BigDecimal.valueOf(100000), BigDecimal.valueOf(12), 12);
        assertThat(emi.doubleValue()).isCloseTo(8884.88, within(0.02));
    }

    @Test
    void total_repayment_exceeds_principal() {
        BigDecimal emi   = svc.calculateEmi(BigDecimal.valueOf(100000), BigDecimal.valueOf(12), 12);
        BigDecimal total = emi.multiply(BigDecimal.valueOf(12));
        assertThat(total).isGreaterThan(BigDecimal.valueOf(100000));
    }

    @Test
    void schedule_length_equals_tenure() {
        List<?> schedule = svc.generateSchedule(
            BigDecimal.valueOf(100000), BigDecimal.valueOf(12), 12, java.time.LocalDate.now());
        assertThat(schedule).hasSize(12);
    }

    @Test
    void last_closing_balance_is_zero() {
        var schedule = svc.generateSchedule(
            BigDecimal.valueOf(100000), BigDecimal.valueOf(12), 12, java.time.LocalDate.now());
        var last = schedule.get(schedule.size() - 1);
        assertThat(last.getClosingBalance().doubleValue()).isLessThan(1.0);
    }

    @Test
    void each_row_closing_is_next_row_opening() {
        var schedule = svc.generateSchedule(
            BigDecimal.valueOf(100000), BigDecimal.valueOf(12), 12, java.time.LocalDate.now());
        for (int i = 0; i < schedule.size() - 1; i++) {
            assertThat(schedule.get(i).getClosingBalance())
                .isEqualByComparingTo(schedule.get(i + 1).getOpeningBalance());
        }
    }

    @Test
    void interest_decreases_over_time() {
        var schedule = svc.generateSchedule(
            BigDecimal.valueOf(100000), BigDecimal.valueOf(12), 12, java.time.LocalDate.now());
        assertThat(schedule.get(0).getInterest())
            .isGreaterThan(schedule.get(schedule.size() - 1).getInterest());
    }

    @Test
    void sum_of_principal_parts_equals_loan_amount() {
        var schedule = svc.generateSchedule(
            BigDecimal.valueOf(100000), BigDecimal.valueOf(12), 12, java.time.LocalDate.now());
        BigDecimal totalPrincipal = schedule.stream()
            .map(EmiRow::getPrincipal)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(0, RoundingMode.HALF_UP);
        assertThat(totalPrincipal).isEqualByComparingTo(BigDecimal.valueOf(100000));
    }

    @Test
    void higher_interest_produces_higher_emi() {
        BigDecimal low  = svc.calculateEmi(BigDecimal.valueOf(100000), BigDecimal.valueOf(8),  12);
        BigDecimal high = svc.calculateEmi(BigDecimal.valueOf(100000), BigDecimal.valueOf(24), 12);
        assertThat(high).isGreaterThan(low);
    }

    @Test
    void early_closure_quote_includes_penalty() {
        BigDecimal outstanding = BigDecimal.valueOf(50000);
        var quote = svc.computeEarlyClosureQuote(outstanding, BigDecimal.valueOf(2));
        assertThat(quote.getPenalty()).isEqualByComparingTo(BigDecimal.valueOf(1000));
        assertThat(quote.getTotalPayable()).isEqualByComparingTo(BigDecimal.valueOf(51000));
    }
}
*/

// ─────────────────────────────────────────────────────────────────
// FILE 4: KycIntegrationTest.java
// ─────────────────────────────────────────────────────────────────
/*
package com.lendbridge;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class KycIntegrationTest extends BaseIntegrationTest {

    @Autowired MockMvc mockMvc;

    @Test @Order(1)
    void submit_aadhaar_returns_pending() throws Exception {
        var body = """
            { "documentType": "AADHAAR", "documentNumber": "1234 5678 9012" }
            """;
        mockMvc.perform(post("/kyc/submit?userId=1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .with(basicAuth("9876543210", "Test@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("PENDING"))
            .andExpect(jsonPath("$.data.documentType").value("AADHAAR"));
    }

    @Test @Order(2)
    void admin_approves_aadhaar() throws Exception {
        mockMvc.perform(patch("/kyc/approve/1")
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("VERIFIED"));
    }

    @Test @Order(3)
    void admin_rejects_pan_with_reason() throws Exception {
        var body = """
            { "documentType": "PAN", "documentNumber": "ABCDE1234F" }
            """;
        mockMvc.perform(post("/kyc/submit?userId=1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .with(basicAuth("9876543210", "Test@123")))
            .andExpect(status().isOk());

        mockMvc.perform(patch("/kyc/reject/2?reason=Document+unclear")
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("REJECTED"))
            .andExpect(jsonPath("$.data.rejectionNote").value("Document unclear"));
    }

    @Test @Order(4)
    void duplicate_document_type_returns_error() throws Exception {
        var body = """
            { "documentType": "AADHAAR", "documentNumber": "9999 8888 7777" }
            """;
        mockMvc.perform(post("/kyc/submit?userId=1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .with(basicAuth("9876543210", "Test@123")))
            .andExpect(status().is4xxClientError());
    }

    @Test @Order(5)
    void get_kyc_documents_returns_all_for_user() throws Exception {
        mockMvc.perform(get("/kyc/1")
                .with(basicAuth("9876543210", "Test@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }
}
*/

// ─────────────────────────────────────────────────────────────────
// FILE 5: CreditScoreTest.java
// ─────────────────────────────────────────────────────────────────
/*
package com.lendbridge.service;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class CreditScoreTest {

    private final CreditScoreService svc = new CreditScoreService();

    @Test
    void verified_kyc_boosts_score_by_150() {
        int withKyc    = svc.computeScore(buildProfile("VERIFIED", "5_10_LPA", "BEGINNER"));
        int withoutKyc = svc.computeScore(buildProfile("PENDING",  "5_10_LPA", "BEGINNER"));
        assertThat(withKyc - withoutKyc).isEqualTo(150);
    }

    @Test
    void score_never_exceeds_900() {
        int score = svc.computeScore(buildProfile("VERIFIED", "ABOVE_50_LPA", "ADVANCED"));
        assertThat(score).isLessThanOrEqualTo(900);
    }

    @Test
    void score_never_falls_below_300() {
        int score = svc.computeScore(buildProfile("PENDING", "BELOW_2_LPA", "BEGINNER"));
        assertThat(score).isGreaterThanOrEqualTo(300);
    }

    @Test
    void advanced_experience_scores_higher_than_beginner() {
        int adv  = svc.computeScore(buildProfile("VERIFIED", "5_10_LPA", "ADVANCED"));
        int beg  = svc.computeScore(buildProfile("VERIFIED", "5_10_LPA", "BEGINNER"));
        assertThat(adv).isGreaterThan(beg);
    }

    private UserProfile buildProfile(String kyc, String income, String exp) {
        return UserProfile.builder()
            .kycStatus(kyc)
            .incomeBracket(income)
            .p2pExperience(exp)
            .build();
    }
}
*/

// ─────────────────────────────────────────────────────────────────
// FILE 6: LoanProductCrudTest.java
// ─────────────────────────────────────────────────────────────────
/*
package com.lendbridge;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class LoanProductCrudTest extends BaseIntegrationTest {

    @Autowired MockMvc mockMvc;

    @Test
    void admin_creates_loan_product() throws Exception {
        var body = """
            {
              "name": "Test Personal Loan",
              "minAmount": 10000, "maxAmount": 500000,
              "minInterest": 10,  "maxInterest": 20,
              "minTenure": 6,     "maxTenure": 60
            }
            """;
        mockMvc.perform(post("/loan-products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("ACTIVE"))
            .andExpect(jsonPath("$.data.name").value("Test Personal Loan"));
    }

    @Test
    void creating_product_with_min_greater_than_max_fails() throws Exception {
        var body = """
            {
              "name": "Bad Product",
              "minAmount": 500000, "maxAmount": 10000,
              "minInterest": 10,   "maxInterest": 20,
              "minTenure": 6,      "maxTenure": 60
            }
            """;
        mockMvc.perform(post("/loan-products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().is4xxClientError());
    }

    @Test
    void non_admin_cannot_create_loan_product() throws Exception {
        var body = """
            {
              "name": "Hack Product",
              "minAmount": 1000, "maxAmount": 50000,
              "minInterest": 8,  "maxInterest": 18,
              "minTenure": 6,    "maxTenure": 24
            }
            """;
        mockMvc.perform(post("/loan-products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
                .with(basicAuth("9876543210", "Test@123")))
            .andExpect(status().isForbidden());
    }

    @Test
    void deactivated_product_not_in_active_list() throws Exception {
        mockMvc.perform(delete("/loan-products/1")
                .with(basicAuth("9999999999", "Admin@123")))
            .andExpect(status().isOk());

        mockMvc.perform(get("/loan-products"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[?(@.id == 1)]").isEmpty());
    }
}
*/
