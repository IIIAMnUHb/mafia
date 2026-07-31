# Database

## `mafia`

Contains the following collections:

```text
mafia
├── events    # All active games
├── servers   # Mafia servers
└── votes     # Kick votes
```

## Structure

> [!IMPORTANT]
> Only documents in the `servers` collection are created manually.
> The `events` and `votes` collections are created and updated automatically.

### `servers`

```js
{
    _id: "GUILD_ID",
    name: "Server name",
    status: "notallocated",
    roles: [
        "ROLE_ID of host",
        "ROLE_ID of don",
        "ROLE_ID of mafia"
    ]
}
```

| Field    | Type       | Description                                    |
| :------- | :--------- | :--------------------------------------------- |
| `_id`    | `string`   | Discord server ID (`GUILD_ID`).                |
| `name`   | `string`   | Server name (can be anything).                 |
| `status` | `string`   | Server status. Defaults to `notallocated`.     |
| `roles`  | `string[]` | Array of role IDs used by the system.          |
