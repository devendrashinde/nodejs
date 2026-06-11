# v3 to v4 Migration

Latest version with all advanced features.

## Details

SQL migration files:
- `sql/migration_v3_to_v4_mysql.sql`
- `sql/migration_v3_to_v4_mariadb.sql`

See [DEPLOYMENT_CHECKLIST.md](../../DEPLOYMENT_CHECKLIST.md) for detailed deployment steps.

## Quick Run

```bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v3_to_v4_mysql.sql
```
