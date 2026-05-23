--
-- PostgreSQL database dump
--


-- Dumped from database version 15.12
-- Dumped by pg_dump version 15.16

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
-- Name: prj_XGifn2wdU7K9; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "prj_XGifn2wdU7K9";


--
-- Name: prj_XGifn2wdU7K9_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "prj_XGifn2wdU7K9_auth";


--
-- Name: prj_XGifn2wdU7K9_storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "prj_XGifn2wdU7K9_storage";


--
-- Name: auth_uid(); Type: FUNCTION; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE FUNCTION "prj_XGifn2wdU7K9_auth".auth_uid() RETURNS uuid
    LANGUAGE sql
    AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;


--
-- Name: role(); Type: FUNCTION; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE FUNCTION "prj_XGifn2wdU7K9_auth".role() RETURNS text
    LANGUAGE sql
    AS $$
  SELECT COALESCE(current_setting('request.jwt.claim.role', true), 'anon')
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

CREATE FUNCTION "prj_XGifn2wdU7K9_storage".foldername(name text) RETURNS text[]
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT string_to_array(name, '/')
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actividades; Type: TABLE; Schema: prj_XGifn2wdU7K9; Owner: -
--

CREATE TABLE "prj_XGifn2wdU7K9".actividades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    titulo text NOT NULL,
    fecha date NOT NULL,
    hora text,
    descripcion text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: clientes; Type: TABLE; Schema: prj_XGifn2wdU7K9; Owner: -
--

CREATE TABLE "prj_XGifn2wdU7K9".clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nombre text NOT NULL,
    telefono text,
    email text,
    direccion text,
    tipo_proyecto text,
    estado text DEFAULT 'Potencial'::text,
    notas text,
    fecha date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: proyectos; Type: TABLE; Schema: prj_XGifn2wdU7K9; Owner: -
--

CREATE TABLE "prj_XGifn2wdU7K9".proyectos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nombre text NOT NULL,
    cliente text,
    tipo text,
    estado text DEFAULT 'Planeación'::text,
    presupuesto_total numeric DEFAULT 0,
    avance_fisico numeric DEFAULT 0,
    avance_financiero numeric DEFAULT 0,
    ingresos numeric DEFAULT 0,
    gastos numeric DEFAULT 0,
    pendiente_aportar numeric DEFAULT 0,
    fecha_inicio date,
    fecha_fin date,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: transacciones; Type: TABLE; Schema: prj_XGifn2wdU7K9; Owner: -
--

CREATE TABLE "prj_XGifn2wdU7K9".transacciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tipo text NOT NULL,
    descripcion text,
    cantidad numeric DEFAULT 1,
    unidad text,
    categoria text,
    costo_unitario numeric DEFAULT 0,
    costo_total numeric DEFAULT 0,
    fecha date DEFAULT CURRENT_DATE,
    proyecto_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: identities; Type: TABLE; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE TABLE "prj_XGifn2wdU7K9_auth".identities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    provider text NOT NULL,
    identity_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE TABLE "prj_XGifn2wdU7K9_auth".users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    encrypted_password text,
    email_confirmed_at timestamp with time zone,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    is_anonymous boolean DEFAULT false,
    phone_confirmed_at timestamp with time zone,
    confirmation_token text,
    confirmation_sent_at timestamp with time zone,
    recovery_token text,
    recovery_sent_at timestamp with time zone
);


--
-- Name: buckets; Type: TABLE; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

CREATE TABLE "prj_XGifn2wdU7K9_storage".buckets (
    id text NOT NULL,
    name text NOT NULL,
    public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    file_size_limit bigint,
    allowed_mime_types text[]
);


--
-- Name: objects; Type: TABLE; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

CREATE TABLE "prj_XGifn2wdU7K9_storage".objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    path_tokens text[],
    version text
);


--
-- Data for Name: actividades; Type: TABLE DATA; Schema: prj_XGifn2wdU7K9; Owner: -
--

COPY "prj_XGifn2wdU7K9".actividades (id, user_id, titulo, fecha, hora, descripcion, created_at) FROM stdin;
7efc59f5-27bd-4e2e-813d-783647eab1ff	54d03640-178d-4a88-87f8-6c75b2b69ea1	Visita obra Z14	2026-05-22	09:00	Revisión avance de losa	2026-05-22 15:19:25.687019+00
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: prj_XGifn2wdU7K9; Owner: -
--

COPY "prj_XGifn2wdU7K9".clientes (id, user_id, nombre, telefono, email, direccion, tipo_proyecto, estado, notas, fecha, created_at) FROM stdin;
c9922e8a-fa3e-4331-86a2-ed2e71313b28	54d03640-178d-4a88-87f8-6c75b2b69ea1	María Fernanda López	5544-8821	mf.lopez@gmail.com	Zona 14, Ciudad de Guatemala	Residencial	Activo	Casa de 2 niveles, 250m²	2025-08-15	2026-05-22 15:19:23.648581+00
3b52bd56-c817-4e8c-94fa-c0a2942b3d7f	54d03640-178d-4a88-87f8-6c75b2b69ea1	Inversiones del Pacífico S.A.	2245-1100	contacto@invpacifico.com	Zona 10, Edificio Géminis	Comercial	Activo	Plaza comercial 800m²	2025-07-22	2026-05-22 15:19:23.648581+00
a1d538ab-c88e-4251-9533-b45ef245684f	54d03640-178d-4a88-87f8-6c75b2b69ea1	Carlos Estuardo Méndez	4477-9912	cmendez@hotmail.com	Antigua Guatemala	Residencial	Potencial	Remodelación de casa colonial	2026-02-10	2026-05-22 15:19:23.648581+00
c48b2692-5efd-4b47-a2d5-cdb25c98bd26	54d03640-178d-4a88-87f8-6c75b2b69ea1	Distribuidora Logística GT	6655-3322	gerencia@distlog.gt	Mixco, Km 18.5	Industrial	Activo	Bodega de 1200m²	2025-09-05	2026-05-22 15:19:23.648581+00
\.


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: prj_XGifn2wdU7K9; Owner: -
--

COPY "prj_XGifn2wdU7K9".proyectos (id, user_id, nombre, cliente, tipo, estado, presupuesto_total, avance_fisico, avance_financiero, ingresos, gastos, pendiente_aportar, fecha_inicio, fecha_fin, created_at) FROM stdin;
303298fb-7bc3-4f72-8f2f-6fde4e9b4039	54d03640-178d-4a88-87f8-6c75b2b69ea1	Residencia López Z14	María Fernanda López	Residencial	Ejecución	950000	65	60	570000	425000	380000	2025-09-01	2026-06-30	2026-05-22 15:19:24.390889+00
7bbabbe0-b970-40e2-8f43-49e5614e5971	54d03640-178d-4a88-87f8-6c75b2b69ea1	Plaza Comercial Géminis	Inversiones del Pacífico S.A.	Comercial	Ejecución	2800000	42	45	1260000	980000	1540000	2025-08-15	2026-10-15	2026-05-22 15:19:24.390889+00
3502b2a7-0075-428b-8444-865c0809030f	54d03640-178d-4a88-87f8-6c75b2b69ea1	Bodega Industrial Mixco	Distribuidora Logística GT	Industrial	Ejecución	1850000	78	75	1387500	1180000	462500	2025-06-01	2026-05-30	2026-05-22 15:19:24.390889+00
3c25945e-a621-425c-81ba-8b69c1e2c838	54d03640-178d-4a88-87f8-6c75b2b69ea1	Remodelación Casa Antigua	Carlos Estuardo Méndez	Residencial	Planeación	680000	0	5	34000	12000	646000	2026-06-01	2027-02-28	2026-05-22 15:19:24.390889+00
\.


--
-- Data for Name: transacciones; Type: TABLE DATA; Schema: prj_XGifn2wdU7K9; Owner: -
--

COPY "prj_XGifn2wdU7K9".transacciones (id, user_id, tipo, descripcion, cantidad, unidad, categoria, costo_unitario, costo_total, fecha, proyecto_id, created_at) FROM stdin;
b48ebaf0-b3d3-4099-938e-d601cc1ca8b3	54d03640-178d-4a88-87f8-6c75b2b69ea1	gasto	Compra cemento UGC 4000PSI	250	sacos	materiales	85	21250	2025-09-15	admin	2026-05-22 15:19:25.050153+00
44a7ac7a-3e9d-41e4-a0cd-4b203d6ad575	54d03640-178d-4a88-87f8-6c75b2b69ea1	gasto	Pago de planilla quincena	12	jornales	mano-obra	1850	22200	2025-09-30	admin	2026-05-22 15:19:25.050153+00
230600d1-1bdb-4e35-966d-de3597e3b1af	54d03640-178d-4a88-87f8-6c75b2b69ea1	gasto	Alquiler oficina mensual	1	mes	fijos	4500	4500	2026-05-22	admin	2026-05-22 15:19:25.050153+00
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

COPY "prj_XGifn2wdU7K9_auth".identities (id, user_id, provider, identity_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

COPY "prj_XGifn2wdU7K9_auth".users (id, email, encrypted_password, email_confirmed_at, phone, created_at, updated_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_anonymous, phone_confirmed_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at) FROM stdin;
54d03640-178d-4a88-87f8-6c75b2b69ea1	salazaroliveros@gmail.com	$2b$10$yDPljyii6pZ6mzE/cOvbZuv3jdYm2PDitUub0.Z9wWejfm0XqLXdu	2026-05-22 15:18:10.842+00	\N	2026-05-22 15:18:10.842+00	2026-05-22 15:18:10.842+00	\N	{}	{}	f	\N	\N	\N	\N	\N
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

COPY "prj_XGifn2wdU7K9_storage".buckets (id, name, public, created_at, updated_at, file_size_limit, allowed_mime_types) FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

COPY "prj_XGifn2wdU7K9_storage".objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, path_tokens, version) FROM stdin;
\.


--
-- Name: actividades actividades_pkey; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9".actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9".clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9".proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- Name: transacciones transacciones_pkey; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9".transacciones
    ADD CONSTRAINT transacciones_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9_auth".identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9_auth".users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9_auth".users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_name_key; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9_storage".buckets
    ADD CONSTRAINT buckets_name_key UNIQUE (name);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9_storage".buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: objects objects_bucket_id_name_key; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9_storage".objects
    ADD CONSTRAINT objects_bucket_id_name_key UNIQUE (bucket_id, name);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9_storage".objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: idx_identities_user_id; Type: INDEX; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE INDEX idx_identities_user_id ON "prj_XGifn2wdU7K9_auth".identities USING btree (user_id);


--
-- Name: actividades actividades_user_id_fkey; Type: FK CONSTRAINT; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9".actividades
    ADD CONSTRAINT actividades_user_id_fkey FOREIGN KEY (user_id) REFERENCES "prj_XGifn2wdU7K9_auth".users(id) ON DELETE CASCADE;


--
-- Name: proyectos proyectos_user_id_fkey; Type: FK CONSTRAINT; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9".proyectos
    ADD CONSTRAINT proyectos_user_id_fkey FOREIGN KEY (user_id) REFERENCES "prj_XGifn2wdU7K9_auth".users(id) ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9_auth".identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES "prj_XGifn2wdU7K9_auth".users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucket_id_fkey; Type: FK CONSTRAINT; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

ALTER TABLE ONLY "prj_XGifn2wdU7K9_storage".objects
    ADD CONSTRAINT objects_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES "prj_XGifn2wdU7K9_storage".buckets(id) ON DELETE CASCADE;


--
-- Name: actividades; Type: ROW SECURITY; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE "prj_XGifn2wdU7K9".actividades ENABLE ROW LEVEL SECURITY;

--
-- Name: actividades actividades_owner; Type: POLICY; Schema: prj_XGifn2wdU7K9; Owner: -
--

CREATE POLICY actividades_owner ON "prj_XGifn2wdU7K9".actividades USING (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = user_id)) WITH CHECK (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = user_id));


--
-- Name: clientes; Type: ROW SECURITY; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE "prj_XGifn2wdU7K9".clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: clientes clientes_owner; Type: POLICY; Schema: prj_XGifn2wdU7K9; Owner: -
--

CREATE POLICY clientes_owner ON "prj_XGifn2wdU7K9".clientes USING (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = user_id)) WITH CHECK (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = user_id));


--
-- Name: proyectos; Type: ROW SECURITY; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE "prj_XGifn2wdU7K9".proyectos ENABLE ROW LEVEL SECURITY;

--
-- Name: proyectos proyectos_owner; Type: POLICY; Schema: prj_XGifn2wdU7K9; Owner: -
--

CREATE POLICY proyectos_owner ON "prj_XGifn2wdU7K9".proyectos USING (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = user_id)) WITH CHECK (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = user_id));


--
-- Name: transacciones; Type: ROW SECURITY; Schema: prj_XGifn2wdU7K9; Owner: -
--

ALTER TABLE "prj_XGifn2wdU7K9".transacciones ENABLE ROW LEVEL SECURITY;

--
-- Name: transacciones transacciones_owner; Type: POLICY; Schema: prj_XGifn2wdU7K9; Owner: -
--

CREATE POLICY transacciones_owner ON "prj_XGifn2wdU7K9".transacciones USING (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = user_id)) WITH CHECK (((NULLIF(current_setting('request.jwt.claim.sub'::text, true), ''::text))::uuid = user_id));


--
-- Name: users Admin can delete all users; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Admin can delete all users" ON "prj_XGifn2wdU7K9_auth".users FOR DELETE TO "prj_XGifn2wdU7K9_role" USING (true);


--
-- Name: identities Admin can delete identities; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Admin can delete identities" ON "prj_XGifn2wdU7K9_auth".identities FOR DELETE TO "prj_XGifn2wdU7K9_role" USING (true);


--
-- Name: users Admin can insert users; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Admin can insert users" ON "prj_XGifn2wdU7K9_auth".users FOR INSERT TO "prj_XGifn2wdU7K9_role" WITH CHECK (true);


--
-- Name: users Admin can update all users; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Admin can update all users" ON "prj_XGifn2wdU7K9_auth".users FOR UPDATE TO "prj_XGifn2wdU7K9_role" USING (true);


--
-- Name: users Admin can view all users; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Admin can view all users" ON "prj_XGifn2wdU7K9_auth".users FOR SELECT TO "prj_XGifn2wdU7K9_role" USING (true);


--
-- Name: identities Users can delete own identities; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Users can delete own identities" ON "prj_XGifn2wdU7K9_auth".identities FOR DELETE USING ((user_id = "prj_XGifn2wdU7K9_auth".auth_uid()));


--
-- Name: users Users can delete own profile; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Users can delete own profile" ON "prj_XGifn2wdU7K9_auth".users FOR DELETE USING ((id = "prj_XGifn2wdU7K9_auth".auth_uid()));


--
-- Name: identities Users can insert own identities; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Users can insert own identities" ON "prj_XGifn2wdU7K9_auth".identities FOR INSERT WITH CHECK ((user_id = "prj_XGifn2wdU7K9_auth".auth_uid()));


--
-- Name: users Users can insert own profile; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Users can insert own profile" ON "prj_XGifn2wdU7K9_auth".users FOR INSERT WITH CHECK ((id = "prj_XGifn2wdU7K9_auth".auth_uid()));


--
-- Name: identities Users can update own identities; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Users can update own identities" ON "prj_XGifn2wdU7K9_auth".identities FOR UPDATE USING ((user_id = "prj_XGifn2wdU7K9_auth".auth_uid()));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Users can update own profile" ON "prj_XGifn2wdU7K9_auth".users FOR UPDATE USING ((id = "prj_XGifn2wdU7K9_auth".auth_uid()));


--
-- Name: identities Users can view own identities; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Users can view own identities" ON "prj_XGifn2wdU7K9_auth".identities FOR SELECT USING ((user_id = "prj_XGifn2wdU7K9_auth".auth_uid()));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

CREATE POLICY "Users can view own profile" ON "prj_XGifn2wdU7K9_auth".users FOR SELECT USING ((id = "prj_XGifn2wdU7K9_auth".auth_uid()));


--
-- Name: identities; Type: ROW SECURITY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

ALTER TABLE "prj_XGifn2wdU7K9_auth".identities ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: prj_XGifn2wdU7K9_auth; Owner: -
--

ALTER TABLE "prj_XGifn2wdU7K9_auth".users ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets Service role can manage buckets; Type: POLICY; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

CREATE POLICY "Service role can manage buckets" ON "prj_XGifn2wdU7K9_storage".buckets USING (true);


--
-- Name: objects Service role can manage objects; Type: POLICY; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

CREATE POLICY "Service role can manage objects" ON "prj_XGifn2wdU7K9_storage".objects USING (true);


--
-- Name: buckets; Type: ROW SECURITY; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

ALTER TABLE "prj_XGifn2wdU7K9_storage".buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: prj_XGifn2wdU7K9_storage; Owner: -
--

ALTER TABLE "prj_XGifn2wdU7K9_storage".objects ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


