-- Add new columns to browser_profiles for enhanced profile management
ALTER TABLE browser_profiles ADD COLUMN notes TEXT DEFAULT '';
ALTER TABLE browser_profiles ADD COLUMN tags TEXT DEFAULT '[]';
ALTER TABLE browser_profiles ADD COLUMN pid INTEGER DEFAULT NULL;
ALTER TABLE browser_profiles ADD COLUMN cdp_url TEXT DEFAULT NULL;
