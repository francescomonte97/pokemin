# POKEMIN Save Recovery Worker

This Worker accepts recovery requests using only the account username. It
resolves the UUID from `player_accounts` on the server, then creates manually
approved, one-time recovery codes. Codes expire after 30 minutes and are
stored in Firestore only as SHA-256 hashes.

The public request alone is not proof of ownership. Before approving it,
verify the account owner through your normal support channel.

## Firebase service account

In Firebase Console open:

`Project settings -> Service accounts -> Generate new private key`

Give that service account the minimum Firestore role required to read and
write the two recovery collections. Keep the downloaded JSON private.

## Cloudflare secrets

Create a Firebase service account in the `chat-personalizzata` project and add:

```sh
npx wrangler secret put FIREBASE_CLIENT_EMAIL
npx wrangler secret put FIREBASE_PRIVATE_KEY
npx wrangler secret put ADMIN_API_KEY
npx wrangler secret put TOKEN_HASH_SALT
npx wrangler secret put REQUEST_HASH_SALT
npx wrangler secret put REGISTRATION_HASH_SALT
```

Never commit these values. `FIREBASE_PRIVATE_KEY` must contain the complete
PEM private key from the service-account JSON.

Generate long random values for `ADMIN_API_KEY`, `TOKEN_HASH_SALT`, and
`REQUEST_HASH_SALT`, and `REGISTRATION_HASH_SALT`. They must all be different.

## Deploy

```sh
npx wrangler deploy
```

The expected URL for the current client configuration is:

```text
https://pokemin-save-recovery.montefortefrancesco50.workers.dev
```

CORS accepts the production origin configured in `ALLOWED_ORIGIN` and local
development origins on `localhost`, `127.0.0.1`, or `[::1]`.

Verify it:

```sh
curl "https://pokemin-save-recovery.montefortefrancesco50.workers.dev/health"
```

Verify the Firebase service-account connection without creating data:

```sh
curl "https://pokemin-save-recovery.montefortefrancesco50.workers.dev/health?deep=1"
```

## Approve a request

Open `recovery-admin.html`, enter `ADMIN_API_KEY`, and approve a pending
request. The key is retained only in the browser tab's `sessionStorage`.

The equivalent API call is:

Use the `requestId` displayed in the Firestore `save_restore_requests`
collection:

```sh
curl -X POST "https://pokemin-save-recovery.<account>.workers.dev/admin/approve" \
  -H "Authorization: Bearer <ADMIN_API_KEY>" \
  -H "Content-Type: application/json" \
  --data '{"requestId":"<REQUEST_ID>"}'
```

The response contains the one-time `recoveryCode`. Send only that code to the
verified account owner. It expires after 30 minutes and becomes invalid after
its first successful use.

The user enters that code, their username, and a new password on
`restore.html`. The Worker stores only a PBKDF2-SHA256 verifier and consumes
the recovery code atomically. The new password is a POKEMIN cloud password;
it does not change the legacy Pokelike server password.

## Firestore rules

The Worker uses its service account and does not require client access to the
recovery collections. Keep both collections private:

```text
match /save_restore_requests/{document} {
  allow read, write: if false;
}

match /save_restore_tokens/{document} {
  allow read, write: if false;
}

match /registration_ip_limits/{document} {
  allow read, write: if false;
}
```

## Registration limit

The game sends new registrations through this Worker. It stores only a
salted SHA-256 hash of `CF-Connecting-IP`, never the raw address or password.
After a successful registration, subsequent registration attempts from the
same public IP receive HTTP 429.

Set the registration salt before deploying:

```sh
npx wrangler secret put REGISTRATION_HASH_SALT
```

This protects registrations made through the POKEMIN client. The legacy
`save.pokelike.xyz/register` endpoint must enforce its own limit if it remains
publicly reachable.
