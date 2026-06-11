# v2 to v2.1 Migration

Image editing features added in v2.1.

## Details

SQL migration files:
- `sql/migration_v2_to_v2.1_image_editing.sql`
- `sql/migration_v2_to_v2.1_image_editing_mariadb.sql`

For detailed implementation information, see archived documentation:
- [../archive/IMAGE_EDITOR_CHANGES_SUMMARY.md](../archive/IMAGE_EDITOR_CHANGES_SUMMARY.md)

## Quick Run

```bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v2_to_v2.1_image_editing.sql
```
