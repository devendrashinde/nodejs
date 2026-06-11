# v2 to v3 Migration

Playlists and advanced features added in v3.

## Details

SQL migration files:
- `sql/migration_v2_to_v3_mysql.sql`
- `sql/migration_v2_to_v3_mariadb.sql`

For detailed implementation information, see archived documentation:
- [../archive/PLAYLIST_IMPLEMENTATION.md](../archive/PLAYLIST_IMPLEMENTATION.md)

## Quick Run

```bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v2_to_v3_mysql.sql
```
