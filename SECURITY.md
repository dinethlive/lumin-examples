# Security

## Reporting

To report a vulnerability, email contact@lumin.guru. Please do not open a public issue for it.

## Keys in these examples

**`ANTHROPIC_API_KEY` and `LUMIN_API_KEY` stay on the server.** Every example calls the model from a
route handler (`export const runtime = "nodejs"`), so that the keys stay on the server. Never move
either key into a `NEXT_PUBLIC_*` variable. Next puts those variables into the client bundle, and
then the key goes to every visitor.

Git ignores `.env.local` in every app. `.env.example` holds placeholders only, never a real key.

If you deploy an example, set both keys as encrypted environment variables in your host's
dashboard. To rotate a Lumin key, create a new key and revoke the old one at
https://app.lumin.guru/api-keys.

## Birth data is personal data

Birth date, birth time and birth coordinates together are one of the most identifying combinations
of data that a product can hold. In several jurisdictions, the inferences from them get additional
protection.

These examples store nothing. Input arrives in a request and goes to the model. The route returns
the response and writes it nowhere. **That is a property of the examples, not of your product.** If
you add storage, you get these obligations:

- a lawful basis
- a retention period
- deletion on request
- disclosure in your privacy notice

Three of the apps need no birth data: `today-panel`, `horary-desk` and `weather-windows`. Two of
them, `today-panel` and `weather-windows`, collect no personal data at all. `horary-desk` asks the
browser for the asker's location. The person can refuse, or change the coordinates by hand. If you
can build your feature on one of these input classes, it is the cheaper path in every sense.

## Model output is not trusted input

Every route validates the model's JSON against an explicit shape before it renders. The commerce
examples also find each returned ID in a real catalog on the server. They do not render names and
prices that the model produced. Keep both habits when you fork. They stop a hallucinated SKU, a
hallucinated price or a malformed payload before it reaches a user.
