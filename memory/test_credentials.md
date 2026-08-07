# iFLARE — Test Credentials

iFLARE is now restricted to Indian university email domains.
For testing the new university-scoped visibility, register two accounts
from different universities and one more from the same university to verify:

Suggested test accounts (agent should REGISTER these fresh via /register):

- Scaler user A:
  - Name: Alice Scaler
  - Email: alice.test@sst.scaler.com
  - Password: password123
  - Interests: sports, music, food

- Scaler user B (same university as A):
  - Name: Bob Scaler
  - Email: bob.test@sst.scaler.com
  - Password: password123
  - Interests: sports, tech, learning

- IIT KGP user C (different university, must NOT see Scaler flares):
  - Name: Chandan KGP
  - Email: chandan.test@iitkgp.ac.in
  - Password: password123
  - Interests: sports, music, tech

Blocked-domain test:
- Registering any @gmail.com / @yahoo.com / @outlook.com etc. must fail with
  a 400 and an error message pointing the user to use a university email.
