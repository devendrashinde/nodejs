# v1 to v2 Migration

Core schema migration for Photo Gallery v1 to v2.

## Details

SQL migration file: `sql/migration_v1_to_v2.sql`

For detailed implementation information, see archived documentation:
- [../archive/ADVANCED_FEATURES.md](../archive/ADVANCED_FEATURES.md)

## Quick Run

```bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v1_to_v2.sql
```
