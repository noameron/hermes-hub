# Options considered

## Recommended: modular hub with typed expense domain and minimal generic Hermes records

Why it wins:

- Fits the stated product direction exactly.
- Keeps Expenses first-class without hard-coding the whole app around it.
- Leaves room for reports, news, and events without inventing a universal data model.

Trade-offs:

- Slightly more structure up front than an expense-only app.
- Requires a small amount of placeholder code for future routes.

## Option 2: expense-first app with later refactor into a hub

Why it lost:

- Cheapest short-term start.
- Wrong long-term shape for the stated product.
- Likely forces route, navigation, and data-model churn later.

## Option 3: generic content platform from day one

Why it lost:

- Too much speculative abstraction.
- Slows the only production module that matters now, Expenses.
- Increases the chance of vague data models and weak analytics support.
