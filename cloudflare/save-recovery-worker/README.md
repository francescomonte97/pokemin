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
```

Never commit these values. `FIREBASE_PRIVATE_KEY` must contain the complete
PEM private key from the service-account JSON.

Generate long random values for `ADMIN_API_KEY`, `TOKEN_HASH_SALT`, and
`REQUEST_HASH_SALT`. They must all be different.

## Deploy

```sh
npx wrangler deploy
```

The expected URL for the current client configuration is:

```text
https://pokemin-save-recovery.montefortefrancesco50.workers.dev
```

Verify it:

```sh
curl "https://pokemin-save-recovery.montefortefrancesco50.workers.dev/health"
```

Verify the Firebase service-account connection without creating data:

```sh
curl "https://pokemin-save-recovery.montefortefrancesco50.workers.dev/health?deep=1"
```

## Approve a request

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
```
