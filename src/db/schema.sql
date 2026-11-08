-- =========================================================
-- SVARGA — Skema Basis Data (PostgreSQL)
-- Sesuai ERD (Gambar 6 pada proposal / Skema Basis Data Miro)
-- Pekan 1: Database
-- =========================================================

-- Ekstensi opsional untuk PK berbasis UUID bila dibutuhkan di masa depan
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------
-- USER
-- ---------------------------------------------------------
CREATE TABLE "user" (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR UNIQUE,
  role          VARCHAR NOT NULL DEFAULT 'guest', -- guest | warga | admin
  google_id     VARCHAR UNIQUE,
  password_hash VARCHAR,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- GREEN_SPACE (Taman Sritanjung, Taman Blambangan, dst.)
-- ---------------------------------------------------------
CREATE TABLE green_space (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR NOT NULL,
  location_type VARCHAR,          -- taman | koridor | plaza
  description   TEXT,
  latitude      DECIMAL(9,6) NOT NULL,
  longitude     DECIMAL(9,6) NOT NULL,
  address       VARCHAR,
  shade_score   REAL,             -- 0–100
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------
-- KORIDOR (mis. Koridor 1: Sritanjung–Blambangan)
-- ---------------------------------------------------------
CREATE TABLE koridor (
  id               BIGSERIAL PRIMARY KEY,
  user_id          INT REFERENCES "user"(id),
  koridor_name     VARCHAR NOT NULL,
  start_latitude   DECIMAL(9,6),
  start_longitude  DECIMAL(9,6),
  end_latitude     DECIMAL(9,6),
  end_longitude    DECIMAL(9,6),
  distance_meter   REAL,
  estimate_minutes SMALLINT,
  shade_score      REAL,
  air_quality_score REAL,
  noise_score      REAL,
  comfort_score    REAL,
  created_at       TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- GREEN_SPACE_REVIEWS
-- ---------------------------------------------------------
CREATE TABLE green_space_reviews (
  id             BIGSERIAL PRIMARY KEY,
  user_id        INT REFERENCES "user"(id),
  green_space_id INT REFERENCES green_space(id),
  rating         SMALLINT CHECK (rating BETWEEN 1 AND 5),
  review_text    VARCHAR,
  created_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- USER_VISITS
-- ---------------------------------------------------------
CREATE TABLE user_visits (
  id              BIGSERIAL PRIMARY KEY,
  user_id         INT REFERENCES "user"(id),
  green_space_id  INT REFERENCES green_space(id),
  check_in_at     TIMESTAMP,
  check_out_at    TIMESTAMP,
  duration_minutes SMALLINT,
  source          VARCHAR -- qr_scan | geofencing | manual
);

-- ---------------------------------------------------------
-- BFEST (Banyuwangi Festival)
-- ---------------------------------------------------------
CREATE TABLE bfest (
  id             SERIAL PRIMARY KEY,
  green_space_id INT REFERENCES green_space(id),
  bfest_name     VARCHAR NOT NULL,
  location_type  VARCHAR,
  date           DATE
);

-- ---------------------------------------------------------
-- MOOD_LOGS (Mood Tracker)
-- ---------------------------------------------------------
CREATE TABLE mood_logs (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            INT REFERENCES "user"(id),
  green_space_id     INT REFERENCES green_space(id),
  mood_score         SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  anonymous_session_id VARCHAR, -- dipakai bila user tidak login (mode tamu)
  logged_at          TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------
CREATE TABLE events (
  id             SERIAL PRIMARY KEY,
  green_space_id INT REFERENCES green_space(id),
  title          VARCHAR NOT NULL,
  description    TEXT,
  event_date     DATE,
  organizer      VARCHAR,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------
-- UMKMS
-- ---------------------------------------------------------
CREATE TABLE umkms (
  id             SERIAL PRIMARY KEY,
  green_space_id INT REFERENCES green_space(id),
  koridor_id     BIGINT REFERENCES koridor(id),
  umkm_name      VARCHAR,
  business_name  VARCHAR,
  business_type  VARCHAR,
  address        VARCHAR,
  contact        VARCHAR,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------
-- SENSOR_DEVICES (ESP32 per titik / diorama)
-- ---------------------------------------------------------
CREATE TABLE sensor_devices (
  id             SERIAL PRIMARY KEY,
  green_space_id INT REFERENCES green_space(id),
  device_code    VARCHAR UNIQUE NOT NULL,
  device_type    VARCHAR, -- esp32_node | gateway
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at   TIMESTAMP
);

-- ---------------------------------------------------------
-- SENSOR_READINGS (time-series, satu baris per metrik per waktu)
-- ---------------------------------------------------------
CREATE TABLE sensor_readings (
  id          BIGSERIAL PRIMARY KEY,
  device_id   INT REFERENCES sensor_devices(id),
  metric_type SMALLINT NOT NULL, -- 1=suhu 2=kelembaban 3=uv 4=kebisingan 5=pm2.5 ...
  value       REAL NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_sensor_readings_device_time ON sensor_readings (device_id, recorded_at DESC);

-- ---------------------------------------------------------
-- GEOFENCES
-- ---------------------------------------------------------
CREATE TABLE geofences (
  id             SERIAL PRIMARY KEY,
  green_space_id INT REFERENCES green_space(id),
  soundscape_id  INT, -- FK ditambahkan di bawah setelah tabel soundscapes ada
  name           VARCHAR NOT NULL,
  latitude       DECIMAL(9,6) NOT NULL,
  longitude      DECIMAL(9,6) NOT NULL,
  radius_meter   REAL NOT NULL DEFAULT 25,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------
-- SOUNDSCAPES (audio terapi Using Banyuwangi)
-- ---------------------------------------------------------
CREATE TABLE soundscapes (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR NOT NULL,
  category   VARCHAR, -- gamelan_using | alam | ambient
  audio_url  VARCHAR NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE geofences
  ADD CONSTRAINT fk_geofences_soundscape
  FOREIGN KEY (soundscape_id) REFERENCES soundscapes(id);
