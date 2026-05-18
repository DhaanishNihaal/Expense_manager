package com.bezkoder.springjwt;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== RUNNING PRODUCTION DATABASE MIGRATIONS ===");
        try {
            // Drop NOT NULL constraints on expense_transactions
            jdbcTemplate.execute("ALTER TABLE expense_transactions ALTER COLUMN expense_id DROP NOT NULL;");
            System.out.println("SUCCESS: Dropped NOT NULL constraint on expense_id");
        } catch (Exception e) {
            System.out.println("INFO: Failed to drop NOT NULL on expense_id (might already be dropped): " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE expense_transactions ALTER COLUMN payment_group_id DROP NOT NULL;");
            System.out.println("SUCCESS: Dropped NOT NULL constraint on payment_group_id");
        } catch (Exception e) {
            System.out.println("INFO: Failed to drop NOT NULL on payment_group_id (might already be dropped): " + e.getMessage());
        }

        try {
            // Drop message type check constraint
            jdbcTemplate.execute("ALTER TABLE message DROP CONSTRAINT IF EXISTS message_type_check;");
            System.out.println("SUCCESS: Dropped check constraint message_type_check");
        } catch (Exception e) {
            System.out.println("INFO: Failed to drop check constraint message_type_check: " + e.getMessage());
        }
        System.out.println("=== DATABASE MIGRATIONS COMPLETED ===");
    }
}
