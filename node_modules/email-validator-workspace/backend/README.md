# Backend Notes

## Collections Used
- `users`
- `subscriptions`
- `validations`
- `transactions`
- `paypal_webhooks`

## Login Requirement
`/api/auth/login` expects users with:
- `email`
- `passwordHash` (bcrypt hash)
- optional `firstName`, `lastName`

## PayPal Webhook Mapping
Webhook handler resolves user and plan from payload fields:
- `resource.custom_id` (expected format includes user id)
- fallback `resource.subscriber.payer_id`

Plan mapping supports Starter/Professional/Enterprise and resets credits to monthly allowance on subscription create/update events.
