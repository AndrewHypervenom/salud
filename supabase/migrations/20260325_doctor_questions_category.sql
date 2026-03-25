-- Agregar columna category a doctor_questions para categorizar preguntas por especialidad
ALTER TABLE doctor_questions ADD COLUMN IF NOT EXISTS category text;
