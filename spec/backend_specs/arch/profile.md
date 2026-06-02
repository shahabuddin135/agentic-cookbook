# arch/profile.md — Profile Module (WARM)

```slc
@block ARCH profile_module
priority: high
intent: "User profile read/update + GDPR right-to-access + right-to-erasure"
scope: module
depends_on: [arch/database.database_module, arch/auth.auth_module, arch/conversations.conversations_module]

content:
  files:
    - "backend/app/models/user.py"
    - "backend/app/models/compliance.py"
    - "backend/app/routers/profile.py"

  data_model:
    User_ReadOnly:
      note: "Read-only SQLModel class — mirrors Better Auth user table. No writes except name."
      tablename: "user"
      fields:
        id: "str — PK"
        name: "str"
        email: "str"
        created_at: "datetime"

    DataDeletionRequest:
      tablename: "data_deletion_request"
      fields:
        id: "str — UUID PK"
        user_id: "str — indexed"
        requested_at: "datetime — default=datetime.utcnow"
        completed_at: "Optional[datetime] = None"
        status: "str = 'pending' — pending | processing | completed | failed"

  flows:
    get_profile: >
      stmt = select(User).where(User.id == user_id)
      user = await db.exec(stmt).first()
      return {id, name, email, created_at}

    update_profile: >
      stmt = update(User).where(User.id == user_id).values(name=body.name)
      await db.exec(stmt); await db.commit()
      return updated user row

    export_data: >
      Collect user row + all Conversation rows + all Message rows for user.
      Build export_dict = {exported_at, user, conversations: [{...conv, messages:[...]}]}
      Return StreamingResponse(iter([json.dumps(export_dict, default=str).encode()]),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=my-data.json"})

    request_deletion: >
      req = DataDeletionRequest(id=str(uuid4()), user_id=user_id, status='pending')
      db.add(req); await db.commit()
      Return Response(status_code=202, content=json.dumps({message: "...30 days..."}))

  boundaries:
    - "email is READ-ONLY — never accept it in PUT body"
    - "Deletion is async queue (202) — not immediate delete"
    - "Export includes all user-owned data for portability (GDPR Art. 20)"
    - "FastAPI reads user table but does not CREATE users (Better Auth owns that)"
    - "DataDeletionRequest retained 3 years (audit trail)"
@end
```
