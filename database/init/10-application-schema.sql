-- PI-CUBE application schema baseline (schema only, no business data).
-- Captured on 2026-08-23 for independent local deployment.

--
-- PostgreSQL database dump
--

\restrict 9DNx5XB1SqcwUuZEn1gidrHGKa90wKt8CkHCqchAAAk2Zert8JwuIqK5Q3Vk86A

-- Dumped from database version 14.22 (Ubuntu 14.22-1.pgdg24.04+1)
-- Dumped by pg_dump version 14.24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_auxiliary_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_auxiliary_settings (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    account_id character varying(36) NOT NULL,
    auxiliary_type_id character varying(36) NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: alipay_auth_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alipay_auth_tokens (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(36) NOT NULL,
    alipay_user_id character varying(64) NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_in integer NOT NULL,
    re_expires_in integer NOT NULL,
    token_type character varying(20) DEFAULT 'Bearer'::character varying,
    auth_time timestamp without time zone NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    refresh_expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: auxiliary_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auxiliary_balances (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    ledger_id character varying(36) NOT NULL,
    account_id character varying(36) NOT NULL,
    account_code character varying(20) NOT NULL,
    auxiliary_type_id character varying(36) NOT NULL,
    auxiliary_item_id character varying(36) NOT NULL,
    auxiliary_item_code character varying(50) NOT NULL,
    auxiliary_item_name character varying(200) NOT NULL,
    period character varying(20) NOT NULL,
    beginning_debit numeric(18,2) DEFAULT '0'::numeric NOT NULL,
    beginning_credit numeric(18,2) DEFAULT '0'::numeric NOT NULL,
    current_debit numeric(18,2) DEFAULT '0'::numeric NOT NULL,
    current_credit numeric(18,2) DEFAULT '0'::numeric NOT NULL,
    ending_debit numeric(18,2) DEFAULT '0'::numeric NOT NULL,
    ending_credit numeric(18,2) DEFAULT '0'::numeric NOT NULL,
    direction character varying(10) NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: auxiliary_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auxiliary_items (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    type_id character varying(36) NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    parent_id character varying(36),
    full_code character varying(200),
    full_name character varying(500),
    is_leaf boolean DEFAULT true NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    remark text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: auxiliary_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auxiliary_types (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: bases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bases (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    address_template text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    management_company_name character varying(255),
    management_company_credit_code character varying(50),
    management_company_legal_person character varying(100),
    management_company_address character varying(500),
    management_company_phone character varying(50),
    property_fee_mode character varying(20) DEFAULT 'charged'::character varying NOT NULL,
    property_fee_billing_cycle character varying(20) DEFAULT 'annual'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: chart_of_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chart_of_accounts (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    ledger_id character varying(36) NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    parent_id character varying(36),
    level integer DEFAULT 1 NOT NULL,
    type character varying(20) NOT NULL,
    direction character varying(10) NOT NULL,
    is_leaf boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    remark text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: contract_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    page_range character varying(50),
    source_file_url text,
    source_file_name character varying(255),
    auto_detected boolean DEFAULT false,
    required boolean DEFAULT false,
    "order" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    storage_key text
);


--
-- Name: contract_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    field_key character varying(100) NOT NULL,
    field_label character varying(200) NOT NULL,
    field_type character varying(20) DEFAULT 'text'::character varying NOT NULL,
    default_value text,
    options jsonb,
    required boolean DEFAULT false,
    placeholder text,
    position_hint jsonb,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: contract_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) DEFAULT 'tenant'::character varying NOT NULL,
    style_config jsonb DEFAULT '{"font": {"size": 12, "family": "SimSun", "lineHeight": 1.8}, "colors": {"text": "#333333", "border": "#e5e5e5", "primary": "#1a1a1a", "headerBg": "#f5f5f5", "secondary": "#666666"}, "layout": {"showLogo": true, "footerHeight": 40, "headerHeight": 60, "logoPosition": "center", "showPageNumber": true, "pageNumberPosition": "center"}, "margins": {"top": 25, "left": 20, "right": 20, "bottom": 25}, "pageSize": "A4", "titleFont": {"size": 18, "family": "SimHei", "weight": "bold"}, "clauseStyle": {"indent": 24, "spacing": 12, "numberingStyle": "decimal"}, "orientation": "portrait"}'::jsonb NOT NULL,
    clauses jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    attachments jsonb DEFAULT '[]'::jsonb,
    source_file_url text,
    source_file_name character varying(255),
    source_file_type character varying(20),
    parse_status character varying(20) DEFAULT 'pending'::character varying,
    parse_error text,
    field_definitions jsonb DEFAULT '[]'::jsonb,
    status character varying(20) DEFAULT 'published'::character varying,
    draft_data jsonb,
    base_id uuid,
    storage_key text
);


--
-- Name: contract_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    enterprise_id character varying(36) NOT NULL,
    application_id character varying(36),
    contract_no character varying(50),
    contract_type character varying(20) NOT NULL,
    rent_amount numeric(12,2),
    deposit_amount numeric(12,2),
    tax_commitment numeric(12,2),
    start_date date,
    end_date date,
    signed_date date,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    contract_file_url text,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencies (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(50) NOT NULL,
    symbol character varying(10),
    exchange_rate numeric(18,6) DEFAULT '1'::numeric NOT NULL,
    is_base boolean DEFAULT false NOT NULL,
    decimal_places integer DEFAULT 2 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    sort_order integer DEFAULT 0,
    remark text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: customer_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_follows (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    type character varying(50) NOT NULL,
    content text,
    next_follow_date timestamp without time zone,
    status character varying(20) DEFAULT 'completed'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    contact_person character varying(128) NOT NULL,
    contact_phone character varying(20) NOT NULL,
    email character varying(255),
    address text,
    sales_id character varying(36),
    status character varying(20) DEFAULT 'potential'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: enterprises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enterprises (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    credit_code character varying(50),
    legal_person character varying(100),
    phone character varying(20),
    industry character varying(100),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    type character varying(20) DEFAULT 'tenant'::character varying NOT NULL,
    registered_address character varying(500),
    business_address character varying(500),
    settled_date timestamp without time zone,
    remarks text
);


--
-- Name: exchange_rate_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rate_history (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    currency_id character varying(36) NOT NULL,
    currency_code character varying(10) NOT NULL,
    rate_date date NOT NULL,
    exchange_rate numeric(18,6) NOT NULL,
    source character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fees (
    id character varying NOT NULL,
    enterprise_id character varying NOT NULL,
    fee_type character varying,
    amount numeric DEFAULT 0,
    payment_method character varying,
    payment_date date,
    status character varying DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: finances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(20) NOT NULL,
    amount numeric NOT NULL,
    enterprise_id uuid,
    summary character varying(500) NOT NULL,
    remarks text,
    created_at timestamp with time zone DEFAULT now(),
    category character varying(50),
    application_id uuid,
    enterprise_name character varying(255)
);


--
-- Name: health_check; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.health_check (
    id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: health_check_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.health_check_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: health_check_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.health_check_id_seq OWNED BY public.health_check.id;


--
-- Name: industries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.industries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: ledgers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ledgers (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    customer_id character varying(36) NOT NULL,
    accountant_id character varying(36) NOT NULL,
    year integer NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: meters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meters (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    base_id character varying(36) NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255),
    electricity_enabled boolean DEFAULT false NOT NULL,
    electricity_number character varying(50),
    electricity_type character varying(20) DEFAULT 'base'::character varying,
    water_enabled boolean DEFAULT false NOT NULL,
    water_number character varying(50),
    water_type character varying(20) DEFAULT 'base'::character varying,
    heating_enabled boolean DEFAULT false NOT NULL,
    heating_number character varying(50),
    heating_type character varying(20) DEFAULT 'base'::character varying,
    area numeric(10,2),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    property_fee_enabled boolean DEFAULT false NOT NULL,
    property_fee_type character varying(20) DEFAULT 'base'::character varying,
    property_fee_enterprise_id character varying(36),
    network_enabled boolean DEFAULT false NOT NULL,
    network_number character varying(50),
    network_type character varying(20) DEFAULT 'base'::character varying,
    network_enterprise_id character varying(36),
    electricity_balance numeric(10,2),
    electricity_balance_updated_at timestamp without time zone,
    water_balance numeric(10,2),
    water_balance_updated_at timestamp without time zone,
    network_status character varying(20) DEFAULT 'normal'::character varying,
    heating_status character varying(20) DEFAULT 'full_paid'::character varying
);

CREATE TABLE public.base_fee_types (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    base_id character varying(36) NOT NULL REFERENCES public.bases(id) ON DELETE CASCADE,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    billing_cycle character varying(20) DEFAULT 'monthly'::character varying NOT NULL,
    is_builtin boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    CONSTRAINT base_fee_types_pkey PRIMARY KEY (id),
    CONSTRAINT base_fee_types_base_code_unique UNIQUE (base_id, code),
    CONSTRAINT base_fee_types_cycle_check CHECK (billing_cycle IN ('monthly', 'annual'))
);

CREATE INDEX base_fee_types_base_idx ON public.base_fee_types USING btree (base_id, is_active, sort_order);

CREATE TABLE public.meter_fee_configs (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    meter_id character varying(36) NOT NULL REFERENCES public.meters(id) ON DELETE CASCADE,
    fee_type_id character varying(36) NOT NULL REFERENCES public.base_fee_types(id) ON DELETE CASCADE,
    enabled boolean DEFAULT false NOT NULL,
    responsibility_type character varying(20) DEFAULT 'base'::character varying NOT NULL,
    enterprise_id character varying(36),
    account_number character varying(100),
    provider character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone,
    CONSTRAINT meter_fee_configs_pkey PRIMARY KEY (id),
    CONSTRAINT meter_fee_configs_meter_type_unique UNIQUE (meter_id, fee_type_id),
    CONSTRAINT meter_fee_configs_responsibility_check CHECK (responsibility_type IN ('base', 'customer'))
);

CREATE INDEX meter_fee_configs_meter_idx ON public.meter_fee_configs USING btree (meter_id, enabled);


--
-- Name: COLUMN meters.electricity_balance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.meters.electricity_balance IS '电表余额（支付宝获取）';


--
-- Name: COLUMN meters.electricity_balance_updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.meters.electricity_balance_updated_at IS '电表余额更新时间';


--
-- Name: COLUMN meters.water_balance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.meters.water_balance IS '水表余额（支付宝获取）';


--
-- Name: COLUMN meters.water_balance_updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.meters.water_balance_updated_at IS '水表余额更新时间';


--
-- Name: COLUMN meters.network_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.meters.network_status IS '网络状态: normal=正常, arrears=欠费, unused=未使用';


--
-- Name: COLUMN meters.heating_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.meters.heating_status IS '取暖状态: full_paid=全额缴纳, base_paid=基础缴纳, arrears=欠费, off_season=未到取暖季';


--
-- Name: pi_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pi_contracts (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    enterprise_id character varying(36) NOT NULL,
    application_id character varying(36),
    contract_no character varying(50),
    contract_type character varying(20) NOT NULL,
    rent_amount numeric(12,2),
    deposit_amount numeric(12,2),
    tax_commitment numeric(12,2),
    start_date date,
    end_date date,
    signed_date date,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    contract_file_url text,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: pi_registered_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pi_registered_addresses (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    full_address character varying(500) NOT NULL,
    building character varying(100),
    floor character varying(20),
    room character varying(50),
    area numeric(10,2),
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    enterprise_id character varying(36),
    assigned_at timestamp without time zone,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: pi_settlement_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pi_settlement_applications (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    enterprise_name character varying(255) NOT NULL,
    contact_person character varying(100),
    contact_phone character varying(20),
    application_type character varying(20) NOT NULL,
    settlement_type character varying(20) NOT NULL,
    approval_form_url text,
    approval_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    approval_date timestamp without time zone,
    rejection_reason text,
    address_id character varying(36),
    address_assigned_at timestamp without time zone,
    enterprise_id character varying(36),
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: pi_settlement_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pi_settlement_payments (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    enterprise_id character varying(36),
    application_id character varying(36),
    contract_id character varying(36),
    payment_type character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2),
    payment_method character varying(20),
    payment_date timestamp without time zone,
    payment_voucher text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: pi_settlement_processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pi_settlement_processes (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    application_id character varying(36) NOT NULL,
    enterprise_id character varying(36),
    process_type character varying(20) NOT NULL,
    current_stage character varying(50),
    stage_progress jsonb,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: pi_share_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pi_share_links (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    token character varying(64) NOT NULL,
    application_id character varying(36) NOT NULL,
    created_by character varying(36),
    expires_at timestamp without time zone,
    is_used boolean DEFAULT false NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: profit_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profit_rules (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    sales_rate integer NOT NULL,
    accountant_rate integer NOT NULL,
    base_amount integer DEFAULT 0,
    conditions json,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: profit_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profit_shares (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying(36),
    ledger_id character varying(36),
    sales_id character varying(36),
    accountant_id character varying(36),
    profit_rule_id character varying(36) NOT NULL,
    total_amount integer NOT NULL,
    sales_amount integer NOT NULL,
    accountant_amount integer NOT NULL,
    period character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    paid_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: reg_numbers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reg_numbers (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    space_id character varying(36) NOT NULL,
    code character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    enterprise_id character varying(36),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: registered_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registered_addresses (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    full_address character varying(500) NOT NULL,
    building character varying(100),
    floor character varying(20),
    room character varying(50),
    area numeric(10,2),
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    enterprise_id character varying(36),
    assigned_at timestamp without time zone,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: registration_numbers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registration_numbers (
    id character varying NOT NULL,
    code character varying NOT NULL,
    space_id character varying,
    enterprise_id character varying,
    available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    property_owner character varying(200),
    management_company character varying(200),
    manual_code character varying(50),
    assigned_enterprise_name character varying(255)
);


--
-- Name: settlement_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settlement_applications (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    enterprise_name character varying(255) NOT NULL,
    contact_person character varying(100),
    contact_phone character varying(20),
    application_type character varying(20) NOT NULL,
    settlement_type character varying(20) NOT NULL,
    approval_form_url text,
    approval_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    approval_date timestamp without time zone,
    rejection_reason text,
    address_id character varying(36),
    address_assigned_at timestamp without time zone,
    enterprise_id character varying(36),
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: settlement_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settlement_payments (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    enterprise_id character varying(36),
    application_id character varying(36),
    contract_id character varying(36),
    payment_type character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2),
    payment_method character varying(20),
    payment_date timestamp without time zone,
    payment_voucher text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: settlement_processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settlement_processes (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    application_id character varying(36) NOT NULL,
    enterprise_id character varying(36),
    process_type character varying(20) NOT NULL,
    current_stage character varying(50),
    stage_progress jsonb,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: spaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spaces (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    meter_id character varying(36) NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255),
    area numeric(10,2),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(128) NOT NULL,
    role character varying(20) DEFAULT 'accountant'::character varying NOT NULL,
    phone character varying(20),
    avatar character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    metadata json,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: work_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_orders (
    id character varying(36) DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    description text,
    customer_id character varying(36),
    ledger_id character varying(36),
    assigned_to character varying(36) NOT NULL,
    created_by character varying(36) NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    due_date timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: health_check id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_check ALTER COLUMN id SET DEFAULT nextval('public.health_check_id_seq'::regclass);


--
-- Name: account_auxiliary_settings account_auxiliary_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_auxiliary_settings
    ADD CONSTRAINT account_auxiliary_settings_pkey PRIMARY KEY (id);


--
-- Name: alipay_auth_tokens alipay_auth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alipay_auth_tokens
    ADD CONSTRAINT alipay_auth_tokens_pkey PRIMARY KEY (id);


--
-- Name: auxiliary_balances auxiliary_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auxiliary_balances
    ADD CONSTRAINT auxiliary_balances_pkey PRIMARY KEY (id);


--
-- Name: auxiliary_items auxiliary_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auxiliary_items
    ADD CONSTRAINT auxiliary_items_pkey PRIMARY KEY (id);


--
-- Name: auxiliary_types auxiliary_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auxiliary_types
    ADD CONSTRAINT auxiliary_types_pkey PRIMARY KEY (id);


--
-- Name: bases bases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bases
    ADD CONSTRAINT bases_pkey PRIMARY KEY (id);


--
-- Name: chart_of_accounts chart_of_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id);


--
-- Name: contract_attachments contract_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_attachments
    ADD CONSTRAINT contract_attachments_pkey PRIMARY KEY (id);


--
-- Name: contract_fields contract_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_fields
    ADD CONSTRAINT contract_fields_pkey PRIMARY KEY (id);


--
-- Name: contract_templates contract_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT contract_templates_pkey PRIMARY KEY (id);


--
-- Name: contract_types contract_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_types
    ADD CONSTRAINT contract_types_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_code_key UNIQUE (code);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: customer_follows customer_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_follows
    ADD CONSTRAINT customer_follows_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: enterprises enterprises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprises
    ADD CONSTRAINT enterprises_pkey PRIMARY KEY (id);


--
-- Name: exchange_rate_history exchange_rate_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rate_history
    ADD CONSTRAINT exchange_rate_history_pkey PRIMARY KEY (id);


--
-- Name: fees fees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fees
    ADD CONSTRAINT fees_pkey PRIMARY KEY (id);


--
-- Name: finances finances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finances
    ADD CONSTRAINT finances_pkey PRIMARY KEY (id);


--
-- Name: health_check health_check_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_check
    ADD CONSTRAINT health_check_pkey PRIMARY KEY (id);


--
-- Name: industries industries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.industries
    ADD CONSTRAINT industries_pkey PRIMARY KEY (id);


--
-- Name: ledgers ledgers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledgers
    ADD CONSTRAINT ledgers_pkey PRIMARY KEY (id);


--
-- Name: meters meters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meters
    ADD CONSTRAINT meters_pkey PRIMARY KEY (id);


--
-- Name: pi_contracts pi_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pi_contracts
    ADD CONSTRAINT pi_contracts_pkey PRIMARY KEY (id);


--
-- Name: pi_registered_addresses pi_registered_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pi_registered_addresses
    ADD CONSTRAINT pi_registered_addresses_pkey PRIMARY KEY (id);


--
-- Name: pi_settlement_applications pi_settlement_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pi_settlement_applications
    ADD CONSTRAINT pi_settlement_applications_pkey PRIMARY KEY (id);


--
-- Name: pi_settlement_payments pi_settlement_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pi_settlement_payments
    ADD CONSTRAINT pi_settlement_payments_pkey PRIMARY KEY (id);


--
-- Name: pi_settlement_processes pi_settlement_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pi_settlement_processes
    ADD CONSTRAINT pi_settlement_processes_pkey PRIMARY KEY (id);


--
-- Name: pi_share_links pi_share_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pi_share_links
    ADD CONSTRAINT pi_share_links_pkey PRIMARY KEY (id);


--
-- Name: profit_rules profit_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profit_rules
    ADD CONSTRAINT profit_rules_pkey PRIMARY KEY (id);


--
-- Name: profit_shares profit_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profit_shares
    ADD CONSTRAINT profit_shares_pkey PRIMARY KEY (id);


--
-- Name: reg_numbers reg_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reg_numbers
    ADD CONSTRAINT reg_numbers_pkey PRIMARY KEY (id);


--
-- Name: registered_addresses registered_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registered_addresses
    ADD CONSTRAINT registered_addresses_pkey PRIMARY KEY (id);


--
-- Name: registration_numbers registration_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registration_numbers
    ADD CONSTRAINT registration_numbers_pkey PRIMARY KEY (id);


--
-- Name: settlement_applications settlement_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlement_applications
    ADD CONSTRAINT settlement_applications_pkey PRIMARY KEY (id);


--
-- Name: settlement_payments settlement_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlement_payments
    ADD CONSTRAINT settlement_payments_pkey PRIMARY KEY (id);


--
-- Name: settlement_processes settlement_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlement_processes
    ADD CONSTRAINT settlement_processes_pkey PRIMARY KEY (id);


--
-- Name: spaces spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_pkey PRIMARY KEY (id);


--
-- Name: account_auxiliary_settings uq_account_auxiliary; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_auxiliary_settings
    ADD CONSTRAINT uq_account_auxiliary UNIQUE (account_id, auxiliary_type_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);


--
-- Name: aas_account_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aas_account_id_idx ON public.account_auxiliary_settings USING btree (account_id);


--
-- Name: aas_auxiliary_type_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aas_auxiliary_type_id_idx ON public.account_auxiliary_settings USING btree (auxiliary_type_id);


--
-- Name: ab_account_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ab_account_id_idx ON public.auxiliary_balances USING btree (account_id);


--
-- Name: ab_auxiliary_item_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ab_auxiliary_item_id_idx ON public.auxiliary_balances USING btree (auxiliary_item_id);


--
-- Name: ab_auxiliary_type_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ab_auxiliary_type_id_idx ON public.auxiliary_balances USING btree (auxiliary_type_id);


--
-- Name: ab_ledger_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ab_ledger_id_idx ON public.auxiliary_balances USING btree (ledger_id);


--
-- Name: ab_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ab_period_idx ON public.auxiliary_balances USING btree (period);


--
-- Name: ab_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ab_unique_idx ON public.auxiliary_balances USING btree (ledger_id, account_id, auxiliary_type_id, auxiliary_item_id, period);


--
-- Name: ai_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_code_idx ON public.auxiliary_items USING btree (code);


--
-- Name: ai_full_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_full_code_idx ON public.auxiliary_items USING btree (full_code);


--
-- Name: ai_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_parent_id_idx ON public.auxiliary_items USING btree (parent_id);


--
-- Name: ai_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_status_idx ON public.auxiliary_items USING btree (status);


--
-- Name: ai_type_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_type_id_idx ON public.auxiliary_items USING btree (type_id);


--
-- Name: alipay_auth_tokens_alipay_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alipay_auth_tokens_alipay_user_id_idx ON public.alipay_auth_tokens USING btree (alipay_user_id);


--
-- Name: alipay_auth_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alipay_auth_tokens_user_id_idx ON public.alipay_auth_tokens USING btree (user_id);


--
-- Name: at_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX at_code_idx ON public.auxiliary_types USING btree (code);


--
-- Name: at_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX at_status_idx ON public.auxiliary_types USING btree (status);


--
-- Name: bases_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bases_name_idx ON public.bases USING btree (name);


--
-- Name: bases_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bases_status_idx ON public.bases USING btree (status);


--
-- Name: coa_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX coa_code_idx ON public.chart_of_accounts USING btree (code);


--
-- Name: coa_ledger_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX coa_ledger_id_idx ON public.chart_of_accounts USING btree (ledger_id);


--
-- Name: coa_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX coa_level_idx ON public.chart_of_accounts USING btree (level);


--
-- Name: coa_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX coa_parent_id_idx ON public.chart_of_accounts USING btree (parent_id);


--
-- Name: coa_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX coa_type_idx ON public.chart_of_accounts USING btree (type);


--
-- Name: contracts_application_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contracts_application_id_idx ON public.contracts USING btree (application_id);


--
-- Name: contracts_contract_no_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contracts_contract_no_idx ON public.contracts USING btree (contract_no);


--
-- Name: contracts_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contracts_enterprise_id_idx ON public.contracts USING btree (enterprise_id);


--
-- Name: contracts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contracts_status_idx ON public.contracts USING btree (status);


--
-- Name: currency_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX currency_code_idx ON public.currencies USING btree (code);


--
-- Name: currency_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX currency_status_idx ON public.currencies USING btree (status);


--
-- Name: customer_follows_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_follows_created_at_idx ON public.customer_follows USING btree (created_at);


--
-- Name: customer_follows_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_follows_customer_id_idx ON public.customer_follows USING btree (customer_id);


--
-- Name: customer_follows_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customer_follows_user_id_idx ON public.customer_follows USING btree (user_id);


--
-- Name: customers_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_name_idx ON public.customers USING btree (name);


--
-- Name: customers_sales_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_sales_id_idx ON public.customers USING btree (sales_id);


--
-- Name: customers_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_status_idx ON public.customers USING btree (status);


--
-- Name: enterprises_credit_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enterprises_credit_code_idx ON public.enterprises USING btree (credit_code);


--
-- Name: enterprises_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enterprises_name_idx ON public.enterprises USING btree (name);


--
-- Name: enterprises_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enterprises_status_idx ON public.enterprises USING btree (status);


--
-- Name: enterprises_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enterprises_type_idx ON public.enterprises USING btree (type);


--
-- Name: ledgers_accountant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ledgers_accountant_id_idx ON public.ledgers USING btree (accountant_id);


--
-- Name: ledgers_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ledgers_customer_id_idx ON public.ledgers USING btree (customer_id);


--
-- Name: ledgers_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ledgers_status_idx ON public.ledgers USING btree (status);


--
-- Name: ledgers_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ledgers_year_idx ON public.ledgers USING btree (year);


--
-- Name: meters_base_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX meters_base_id_idx ON public.meters USING btree (base_id);


--
-- Name: meters_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX meters_code_idx ON public.meters USING btree (code);


--
-- Name: pi_contracts_application_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_contracts_application_id_idx ON public.pi_contracts USING btree (application_id);


--
-- Name: pi_contracts_contract_no_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_contracts_contract_no_idx ON public.pi_contracts USING btree (contract_no);


--
-- Name: pi_contracts_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_contracts_enterprise_id_idx ON public.pi_contracts USING btree (enterprise_id);


--
-- Name: pi_contracts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_contracts_status_idx ON public.pi_contracts USING btree (status);


--
-- Name: pi_registered_addresses_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_registered_addresses_code_idx ON public.pi_registered_addresses USING btree (code);


--
-- Name: pi_registered_addresses_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_registered_addresses_enterprise_id_idx ON public.pi_registered_addresses USING btree (enterprise_id);


--
-- Name: pi_registered_addresses_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_registered_addresses_status_idx ON public.pi_registered_addresses USING btree (status);


--
-- Name: pi_settlement_applications_address_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_applications_address_id_idx ON public.pi_settlement_applications USING btree (address_id);


--
-- Name: pi_settlement_applications_application_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_applications_application_type_idx ON public.pi_settlement_applications USING btree (application_type);


--
-- Name: pi_settlement_applications_approval_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_applications_approval_status_idx ON public.pi_settlement_applications USING btree (approval_status);


--
-- Name: pi_settlement_applications_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_applications_enterprise_id_idx ON public.pi_settlement_applications USING btree (enterprise_id);


--
-- Name: pi_settlement_applications_enterprise_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_applications_enterprise_name_idx ON public.pi_settlement_applications USING btree (enterprise_name);


--
-- Name: pi_settlement_payments_application_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_payments_application_id_idx ON public.pi_settlement_payments USING btree (application_id);


--
-- Name: pi_settlement_payments_contract_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_payments_contract_id_idx ON public.pi_settlement_payments USING btree (contract_id);


--
-- Name: pi_settlement_payments_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_payments_enterprise_id_idx ON public.pi_settlement_payments USING btree (enterprise_id);


--
-- Name: pi_settlement_payments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_payments_status_idx ON public.pi_settlement_payments USING btree (status);


--
-- Name: pi_settlement_processes_application_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_processes_application_id_idx ON public.pi_settlement_processes USING btree (application_id);


--
-- Name: pi_settlement_processes_current_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_processes_current_stage_idx ON public.pi_settlement_processes USING btree (current_stage);


--
-- Name: pi_settlement_processes_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pi_settlement_processes_enterprise_id_idx ON public.pi_settlement_processes USING btree (enterprise_id);


--
-- Name: profit_rules_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profit_rules_is_active_idx ON public.profit_rules USING btree (is_active);


--
-- Name: profit_rules_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profit_rules_type_idx ON public.profit_rules USING btree (type);


--
-- Name: profit_shares_accountant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profit_shares_accountant_id_idx ON public.profit_shares USING btree (accountant_id);


--
-- Name: profit_shares_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profit_shares_customer_id_idx ON public.profit_shares USING btree (customer_id);


--
-- Name: profit_shares_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profit_shares_period_idx ON public.profit_shares USING btree (period);


--
-- Name: profit_shares_sales_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profit_shares_sales_id_idx ON public.profit_shares USING btree (sales_id);


--
-- Name: profit_shares_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profit_shares_status_idx ON public.profit_shares USING btree (status);


--
-- Name: reg_numbers_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reg_numbers_code_idx ON public.reg_numbers USING btree (code);


--
-- Name: reg_numbers_space_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reg_numbers_space_id_idx ON public.reg_numbers USING btree (space_id);


--
-- Name: reg_numbers_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reg_numbers_status_idx ON public.reg_numbers USING btree (status);


--
-- Name: registered_addresses_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registered_addresses_code_idx ON public.registered_addresses USING btree (code);


--
-- Name: registered_addresses_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registered_addresses_enterprise_id_idx ON public.registered_addresses USING btree (enterprise_id);


--
-- Name: registered_addresses_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX registered_addresses_status_idx ON public.registered_addresses USING btree (status);


--
-- Name: settlement_applications_address_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_applications_address_id_idx ON public.settlement_applications USING btree (address_id);


--
-- Name: settlement_applications_application_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_applications_application_type_idx ON public.settlement_applications USING btree (application_type);


--
-- Name: settlement_applications_approval_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_applications_approval_status_idx ON public.settlement_applications USING btree (approval_status);


--
-- Name: settlement_applications_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_applications_enterprise_id_idx ON public.settlement_applications USING btree (enterprise_id);


--
-- Name: settlement_applications_enterprise_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_applications_enterprise_name_idx ON public.settlement_applications USING btree (enterprise_name);


--
-- Name: settlement_payments_application_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_payments_application_id_idx ON public.settlement_payments USING btree (application_id);


--
-- Name: settlement_payments_contract_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_payments_contract_id_idx ON public.settlement_payments USING btree (contract_id);


--
-- Name: settlement_payments_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_payments_enterprise_id_idx ON public.settlement_payments USING btree (enterprise_id);


--
-- Name: settlement_payments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_payments_status_idx ON public.settlement_payments USING btree (status);


--
-- Name: settlement_processes_application_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_processes_application_id_idx ON public.settlement_processes USING btree (application_id);


--
-- Name: settlement_processes_current_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_processes_current_stage_idx ON public.settlement_processes USING btree (current_stage);


--
-- Name: settlement_processes_enterprise_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX settlement_processes_enterprise_id_idx ON public.settlement_processes USING btree (enterprise_id);


--
-- Name: spaces_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX spaces_code_idx ON public.spaces USING btree (code);


--
-- Name: spaces_meter_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX spaces_meter_id_idx ON public.spaces USING btree (meter_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: work_orders_assigned_to_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX work_orders_assigned_to_idx ON public.work_orders USING btree (assigned_to);


--
-- Name: work_orders_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX work_orders_customer_id_idx ON public.work_orders USING btree (customer_id);


--
-- Name: work_orders_ledger_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX work_orders_ledger_id_idx ON public.work_orders USING btree (ledger_id);


--
-- Name: work_orders_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX work_orders_priority_idx ON public.work_orders USING btree (priority);


--
-- Name: work_orders_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX work_orders_status_idx ON public.work_orders USING btree (status);


--
-- Name: contract_attachments contract_attachments_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_attachments
    ADD CONSTRAINT contract_attachments_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.contract_templates(id) ON DELETE CASCADE;


--
-- Name: contract_fields contract_fields_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_fields
    ADD CONSTRAINT contract_fields_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.contract_templates(id) ON DELETE CASCADE;


--
-- Name: account_auxiliary_settings fk_aas_auxiliary_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_auxiliary_settings
    ADD CONSTRAINT fk_aas_auxiliary_type FOREIGN KEY (auxiliary_type_id) REFERENCES public.auxiliary_types(id) ON DELETE CASCADE;


--
-- Name: auxiliary_balances fk_ab_auxiliary_item; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auxiliary_balances
    ADD CONSTRAINT fk_ab_auxiliary_item FOREIGN KEY (auxiliary_item_id) REFERENCES public.auxiliary_items(id) ON DELETE CASCADE;


--
-- Name: auxiliary_balances fk_ab_auxiliary_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auxiliary_balances
    ADD CONSTRAINT fk_ab_auxiliary_type FOREIGN KEY (auxiliary_type_id) REFERENCES public.auxiliary_types(id) ON DELETE CASCADE;


--
-- Name: auxiliary_items fk_auxiliary_item_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auxiliary_items
    ADD CONSTRAINT fk_auxiliary_item_type FOREIGN KEY (type_id) REFERENCES public.auxiliary_types(id) ON DELETE CASCADE;


--
-- Name: meters fk_meters_base; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meters
    ADD CONSTRAINT fk_meters_base FOREIGN KEY (base_id) REFERENCES public.bases(id) ON DELETE CASCADE;


--
-- Name: reg_numbers fk_reg_numbers_enterprise; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reg_numbers
    ADD CONSTRAINT fk_reg_numbers_enterprise FOREIGN KEY (enterprise_id) REFERENCES public.enterprises(id) ON DELETE SET NULL;


--
-- Name: reg_numbers fk_reg_numbers_space; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reg_numbers
    ADD CONSTRAINT fk_reg_numbers_space FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE;


--
-- Name: spaces fk_spaces_meter; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT fk_spaces_meter FOREIGN KEY (meter_id) REFERENCES public.meters(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9DNx5XB1SqcwUuZEn1gidrHGKa90wKt8CkHCqchAAAk2Zert8JwuIqK5Q3Vk86A
