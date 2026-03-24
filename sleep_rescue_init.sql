CREATE DATABASE IF NOT EXISTS sleep_rescue DEFAULT CHARSET=utf8mb4;
USE sleep_rescue;

CREATE TABLE tb_user (
  user_idx INT AUTO_INCREMENT PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(50),
  gender CHAR(1),
  birthdate DATE,
  email VARCHAR(100),
  role VARCHAR(20),
  joined_at DATETIME DEFAULT NOW()
);

CREATE TABLE tb_lifelog (
  lifelog_idx INT AUTO_INCREMENT PRIMARY KEY,
  user_idx INT NOT NULL,
  exec_hours DECIMAL(4,1),
  phone_hours DECIMAL(4,1),
  work_hours DECIMAL(4,1),
  caffeine INT,
  sleep_hours DECIMAL(4,1),
  sleep_score DECIMAL(4,1),
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_idx) REFERENCES tb_user(user_idx)
);

CREATE TABLE tb_plan (
  plan_idx INT AUTO_INCREMENT PRIMARY KEY,
  user_idx INT NOT NULL,
  plan_type INT,
  start_date DATETIME,
  FOREIGN KEY (user_idx) REFERENCES tb_user(user_idx)
);

CREATE TABLE tb_plan_detail (
  detail_idx INT AUTO_INCREMENT PRIMARY KEY,
  plan_idx INT NOT NULL,
  user_idx INT NOT NULL,
  day_number INT,
  plan_task TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (plan_idx) REFERENCES tb_plan(plan_idx),
  FOREIGN KEY (user_idx) REFERENCES tb_user(user_idx)
);

CREATE TABLE tb_file (
  file_idx INT AUTO_INCREMENT PRIMARY KEY,
  user_idx INT NOT NULL,
  file_name VARCHAR(255),
  file_size INT,
  file_ext VARCHAR(10),
  uploaded_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_idx) REFERENCES tb_user(user_idx)
);

CREATE TABLE tb_fatigue (
  fatigue_idx INT AUTO_INCREMENT PRIMARY KEY,
  file_idx INT NOT NULL,
  lifelog_idx INT NOT NULL,
  fatigue_score DECIMAL(4,1),
  fatigue_reason TEXT,
  fatigue_level VARCHAR(10),
  analysis_result TEXT,
  analyzed_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (file_idx) REFERENCES tb_file(file_idx),
  FOREIGN KEY (lifelog_idx) REFERENCES tb_lifelog(lifelog_idx)
);

CREATE TABLE tb_darkcircle (
  dc_idx INT AUTO_INCREMENT PRIMARY KEY,
  file_idx INT NOT NULL,
  user_idx INT NOT NULL,
  dc_score DECIMAL(4,1),
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (file_idx) REFERENCES tb_file(file_idx),
  FOREIGN KEY (user_idx) REFERENCES tb_user(user_idx)
);
