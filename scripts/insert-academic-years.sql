-- Insert academic years directly into the database
INSERT OR IGNORE INTO academic_years (id, year, startDate, endDate, isActive, isCurrent, description, createdAt, updatedAt)
VALUES 
  ('ay2023', '2023-2024', '2023-09-01T00:00:00.000Z', '2024-06-30T23:59:59.999Z', 1, 0, 'Academic Year 2023-2024', datetime('now'), datetime('now')),
  ('ay2024', '2024-2025', '2024-09-01T00:00:00.000Z', '2025-06-30T23:59:59.999Z', 1, 1, 'Academic Year 2024-2025 (Current)', datetime('now'), datetime('now')),
  ('ay2025', '2025-2026', '2025-09-01T00:00:00.000Z', '2026-06-30T23:59:59.999Z', 1, 0, 'Academic Year 2025-2026', datetime('now'), datetime('now'));

-- Verify the data was inserted
SELECT * FROM academic_years ORDER BY year;