# RentMatch AI — Next.js Frontend (TypeScript)

Full Next.js (App Router) + TypeScript implementation of the RentMatch AI frontend, migrated from Vite/React. Implements all deliverables for **Sprint 1 (User Authentication & Profile Management)** and **Sprint 2 (Property Listing & Management)**.

---

## 🚀 Key Implementations

### Sprint 1: User Authentication & Profile Management
- **Role-Based Registration & Login**:
  - Register as **Tenant / Renter** or **Property Lister / Landlord** (`UserRole` type).
  - Registration and login use the FastAPI API; passwords must be at least 8 characters.
  - Matches the **Sprint 1 State Machine** (`Validating Registration` ➔ `User Registered` / `Registration Failed` ➔ `Retry`).
- **Google OAuth**:
  - Google Identity Services returns an ID token, which the FastAPI backend verifies before creating or linking an account.
- **JWT Session**:
  - Access tokens are issued and validated by FastAPI and persisted in browser storage for the current session.
- **Role-Based Authorization & Protection**:
  - Restricts property creation, editing, and status toggles strictly to users with the `PROPERTY_LISTER` role.
  - Attempting unauthorized access triggers friendly **403 Forbidden** feedback.
- **Profile Management**:
  - Profile viewing, profile editing, and password change with hash verification.

---

### Sprint 2: Property Listing & Management
- **Property Listings**:
  - Public listing reads and authenticated create/edit/delete/status operations use the FastAPI API.
  - The API currently persists core property fields; images, amenities, match scores, and commute details are not persisted yet.
- **Public Feed vs. Lister Dashboard**:
  - Public Feed displays **Active** listings only.
  - Lister Dashboard (in Profile) displays both **Active** and **Inactive** properties with quick toggle switches, edit modals, and delete confirmations.
- **Ownership Enforcement**:
  - `OwnershipChecker` verifies only listing owners can edit, toggle, or delete their properties.

---

---

## 💻 How to Run

1. Open a terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   # Create .env.local from .env.example and set the API URL and Google Web client ID.
   npm run dev
   ```
2. Open your browser:
   ```
   http://localhost:3000/
   ```

   The default API URL is `http://localhost:8000/api/v1`. Configure the same Google Web client ID
   in `frontend/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and in `backend/.env` as
   `GOOGLE_CLIENT_ID`. Add the frontend origin (for example, `http://localhost:3000`) to the
   OAuth client's authorized JavaScript origins in Google Cloud Console. Restart both servers after
   changing environment files. Features not yet supported by the backend
   (including password changes, shortlist persistence, messaging, and AI search) are
   not part of this integration.
3. To create an optimized production build:
   ```bash
   npm run build
   npm run start
   ```

---

## 📁 Project Structure (Next.js App Router)

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # RootLayout with SEO metadata & Viewport
│   │   ├── RootClientLayout.tsx      # Shared client app layout (Navbar, Footer, Modals)
│   │   ├── providers.tsx             # Context Providers (Auth + Property)
│   │   ├── globals.css               # RentMatch AI Design System & Tailwind CSS
│   │   ├── page.tsx                  # / (Discover & Hero Home Route)
│   │   ├── explore/
│   │   │   └── page.tsx              # /explore (Active Listings Search & Filter Feed)
│   │   ├── results/
│   │   │   └── page.tsx              # /results (Explore Alias Route)
│   │   ├── properties/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # /properties/:id (Dynamic Property Details Route)
│   │   ├── shortlist/
│   │   │   └── page.tsx              # /shortlist (Saved Homes Route)
│   │   └── profile/
│   │       └── page.tsx              # /profile (User Profile & Lister Dashboard Route)
│   ├── components/
│   │   ├── AuthModal.tsx             # Sprint 1 Login, Register, Google OAuth
│   │   ├── Navbar.tsx                # App Router Navigation bar & User Menu
│   │   ├── PropertyCard.tsx          # Card with owner actions (Edit, Toggle, Delete)
│   │   ├── PropertyFormModal.tsx     # Sprint 2 Create & Edit listing form
│   │   ├── DeleteConfirmModal.tsx    # Sprint 2 Permanent deletion warning
│   │   ├── EnquiryModal.tsx          # Contact owner modal
│   │   └── ToastNotification.tsx     # Action feedback alerts
│   ├── constants/
│   │   └── initialData.ts            # Typed roles, models, seed users & properties
│   ├── context/
│   │   ├── AuthContext.tsx           # Global typed authentication state & session
│   │   └── PropertyContext.tsx       # Global properties, shortlist & modal coordinator
│   └── services/
│       ├── authService.ts            # JWT, Password Hasher, Auth & Profile Service
│       └── propertyService.ts        # Property CRUD, OwnershipChecker, Validator
├── package.json
├── tsconfig.json
└── next.config.ts
```
