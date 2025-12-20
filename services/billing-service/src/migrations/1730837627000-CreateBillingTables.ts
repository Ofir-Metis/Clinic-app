import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBillingTables1730837627000 implements MigrationInterface {
    name = 'CreateBillingTables1730837627000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create subscription_plans table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "subscription_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "price_per_month" numeric(10,2) NOT NULL,
                "price_per_quarter" numeric(10,2) NOT NULL,
                "price_per_year" numeric(10,2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'ILS',
                "max_clients" integer NOT NULL DEFAULT 50,
                "features" jsonb NOT NULL DEFAULT '[]',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_subscription_plans" PRIMARY KEY ("id")
            )
        `);

        // Create coach_subscriptions table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "coach_subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "coach_id" uuid NOT NULL,
                "plan_id" uuid NOT NULL,
                "status" character varying(50) NOT NULL DEFAULT 'active',
                "billing_cycle" character varying(20) NOT NULL DEFAULT 'monthly',
                "start_date" date NOT NULL,
                "end_date" date,
                "next_billing_date" date NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'ILS',
                "discount_percentage" numeric(5,2) NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_coach_subscriptions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_coach_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Create subscription_invoices table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "subscription_invoices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "subscription_id" uuid NOT NULL,
                "invoice_number" character varying(50) NOT NULL UNIQUE,
                "amount" numeric(10,2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'ILS',
                "status" character varying(50) NOT NULL DEFAULT 'pending',
                "due_date" date NOT NULL,
                "paid_date" date,
                "billing_period_start" date NOT NULL,
                "billing_period_end" date NOT NULL,
                "payment_method" character varying(50),
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_subscription_invoices" PRIMARY KEY ("id"),
                CONSTRAINT "FK_subscription_invoices_subscription" FOREIGN KEY ("subscription_id") REFERENCES "coach_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

        // Create client_coach_payment table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "client_coach_payment" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "client_id" uuid NOT NULL,
                "coach_id" uuid NOT NULL,
                "session_id" uuid,
                "amount" numeric(10,2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'ILS',
                "payment_method" character varying(50) NOT NULL,
                "status" character varying(50) NOT NULL DEFAULT 'pending',
                "transaction_id" character varying(100),
                "payment_date" TIMESTAMP,
                "refund_amount" numeric(10,2) DEFAULT 0,
                "refund_date" TIMESTAMP,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_client_coach_payment" PRIMARY KEY ("id")
            )
        `);

        // Create coach_pricing table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "coach_pricing" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "coach_id" uuid NOT NULL,
                "session_type" character varying(50) NOT NULL,
                "price" numeric(10,2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'ILS',
                "duration_minutes" integer NOT NULL DEFAULT 60,
                "is_active" boolean NOT NULL DEFAULT true,
                "description" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_coach_pricing" PRIMARY KEY ("id")
            )
        `);

        // Create tax_compliance_record table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tax_compliance_record" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "entity_id" uuid NOT NULL,
                "entity_type" character varying(50) NOT NULL,
                "tax_year" integer NOT NULL,
                "tax_quarter" integer,
                "gross_revenue" numeric(12,2) NOT NULL DEFAULT 0,
                "vat_collected" numeric(12,2) NOT NULL DEFAULT 0,
                "vat_rate" numeric(5,4) NOT NULL DEFAULT 0.18,
                "net_revenue" numeric(12,2) NOT NULL DEFAULT 0,
                "withholding_tax" numeric(12,2) DEFAULT 0,
                "report_generated_at" TIMESTAMP,
                "report_filed_at" TIMESTAMP,
                "status" character varying(50) NOT NULL DEFAULT 'draft',
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tax_compliance_record" PRIMARY KEY ("id")
            )
        `);

        // Create payment_transaction table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "payment_transaction" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "payment_id" uuid NOT NULL,
                "transaction_id" character varying(100) NOT NULL UNIQUE,
                "provider" character varying(50) NOT NULL,
                "amount" numeric(10,2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'ILS',
                "status" character varying(50) NOT NULL,
                "payment_method" character varying(50) NOT NULL,
                "processor_response" jsonb,
                "error_message" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_transaction" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for better query performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coach_subscriptions_coach_id" ON "coach_subscriptions" ("coach_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coach_subscriptions_status" ON "coach_subscriptions" ("status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscription_invoices_subscription_id" ON "subscription_invoices" ("subscription_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscription_invoices_status" ON "subscription_invoices" ("status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_client_coach_payment_client_id" ON "client_coach_payment" ("client_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_client_coach_payment_coach_id" ON "client_coach_payment" ("coach_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_coach_pricing_coach_id" ON "coach_pricing" ("coach_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tax_compliance_entity" ON "tax_compliance_record" ("entity_id", "entity_type")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_transaction_payment_id" ON "payment_transaction" ("payment_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_transaction_payment_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tax_compliance_entity"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coach_pricing_coach_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_client_coach_payment_coach_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_client_coach_payment_client_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_invoices_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_invoices_subscription_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coach_subscriptions_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_coach_subscriptions_coach_id"`);

        // Drop tables in reverse order (respecting foreign keys)
        await queryRunner.query(`DROP TABLE IF EXISTS "payment_transaction"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tax_compliance_record"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "coach_pricing"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "client_coach_payment"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "subscription_invoices"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "coach_subscriptions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plans"`);
    }
}
