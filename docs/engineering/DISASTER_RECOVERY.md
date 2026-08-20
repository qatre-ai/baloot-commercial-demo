# Disaster Recovery

Application/database backups are created in the configured backup directory and tracked by `BackupRecord`. Backup files include checksums and restore operations verify integrity before replacing the active database.

Repository rollback archives are stored outside the project at:

```text
D:\work\project\_Baloot_Backups
```

The baseline archive was created before this hardening pass. A final archive is created after verification.

