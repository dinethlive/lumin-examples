# Security

## Reporting

Email contact@lumin.guru. Please do not open a public issue for a vulnerability.

## Keys, in these examples

**`ANTHROPIC_API_KEY` and `LUMIN_API_KEY` are server-side only.** Every example calls the model from
a route handler (`export const runtime = "nodejs"`) precisely so the keys stay on the server. Never
move either into a `NEXT_PUBLIC_*` variable: Next inlines those into the client bundle, and the key
ships to every visitor.

`.env.local` is gitignored in every app. `.env.example` carries placeholders only, never a real key.

If you deploy one of these, set both keys as encrypted environment variables in your host's
dashboard. A Lumin key can be rotated at https://app.lumin.guru/developer.

## Birth data is personal data

Birth date, birth time and birth coordinates together are among the most identifying tuples a
product can hold, and in several jurisdictions the inferences drawn from them attract additional
protection. These examples do not persist anything: input arrives in a request, goes to the model,
and the response is returned without being written anywhere. **That is a property of the examples,
not of your product.** If you add storage, you inherit the obligations: a lawful basis, a retention
period, deletion on request, and disclosure in your privacy notice.

Three of the apps here (`today-panel`, `horary-desk`, `weather-windows`) collect no personal data at
all. If your feature can be built on one of those input classes, it is the cheaper path in every
sense.

## Model output is not trusted input

Every route validates the model's JSON against an explicit shape before rendering, and the commerce
examples join returned IDs against a real catalog server-side rather than rendering names and prices
the model produced. Keep both habits when you fork: they are what stops a hallucinated SKU, a
hallucinated price, or a malformed payload reaching a user.
