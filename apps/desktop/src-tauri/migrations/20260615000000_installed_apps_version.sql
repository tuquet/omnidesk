-- Add version column to user_installed_apps to track installed app versions
ALTER TABLE user_installed_apps ADD COLUMN version TEXT NOT NULL DEFAULT '1.0.0';
