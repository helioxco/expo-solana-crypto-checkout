# VALA Mobile Developer Technical Assessment

## Overview
Build a React Native (Expo) application that demonstrates your ability to integrate Web3 authentication with e-commerce functionality. You'll create a demo app that allows users to authenticate with a crypto wallet and purchase Amazon products using cryptocurrency (SOL or USDC) through Crossmint's payment infrastructure on Solana Devnet.

**Time Estimate:** 12-16 hours  
**Deadline:** 3 business days from receipt

## Technical Requirements

### Required Stack
- **React Native** with **Expo SDK 53+** (managed workflow)
- **TypeScript** (strict mode)
- **Privy** for wallet authentication
- **Crossmint API** for payment processing
- **Zustand** for state management
- **React Query (TanStack Query)** for API calls
- **Expo Router** for navigation
- **Solana Web3.js** for blockchain interactions

### Optional Libraries
- **React Native Paper** for UI components
- **React Native Reanimated** for animations
- **Expo Secure Store** for secure storage

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Add your API keys to `.env`:
```
EXPO_PUBLIC_PRIVY_APP_ID=your_privy_app_id
CROSSMINT_CLIENT_SECRET=your_crossmint_testnet_secret
EXPO_PUBLIC_CROSSMINT_PROJECT_ID=your_crossmint_project_id
EXPO_PUBLIC_USE_TESTNET=true
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### 3. Run the Application
```bash
npx expo start
```

## Testnet Configuration

This app operates on **Solana Devnet** only. Users will need mock test tokens:
- **5 SOL** (Devnet)
- **100 USDC** (Devnet) 

### Getting Testnet Tokens
- **SOL Faucet:** https://faucet.solana.com/
- **USDC:** Automatically mocked for this assessment (100 USDC balance)

## Project Specifications

### Part 1: Setup & Authentication (25% of evaluation)

#### ✅ Project Setup
- Expo project initialized with TypeScript template
- Strict TypeScript configuration enabled
- Feature-based folder structure created

#### 📝 TODO: Privy Authentication Implementation
- [ ] Install and configure Privy React Native SDK
- [ ] Connect Solana wallet through Privy
- [ ] Display connected wallet address
- [ ] Show SOL and USDC balances (mocked for testnet)
- [ ] Implement logout functionality

#### 📝 TODO: Navigation Enhancement
- [ ] Complete tab/drawer navigation setup
- [ ] Add navigation to Profile/Settings screen

### Part 2: Product Display & Selection (25% of evaluation)

#### ✅ Product Data
Products are pre-configured in `src/utils/constants.ts`:
```typescript
const products = [
  {
    asin: "B0CHX1SZGK", // Echo Dot (5th Gen)
    name: "Echo Dot (5th Gen)",
    price: 49.99,
    image: "https://via.placeholder.com/200"
  },
  {
    asin: "B09B8V1LZ3", // Echo Show 8
    name: "Echo Show 8",
    price: 149.99,
    image: "https://via.placeholder.com/200"
  },
  {
    asin: "B08MQZXN1X", // Fire TV Stick 4K
    name: "Fire TV Stick 4K",
    price: 29.99,
    image: "https://via.placeholder.com/200"
  },
  {
    asin: "B07FZ8S74R", // Kindle Paperwhite
    name: "Kindle Paperwhite",
    price: 139.99,
    image: "https://via.placeholder.com/200"
  }
]
```

#### 📝 TODO: Product Features
- [ ] Complete product detail screen implementation
- [ ] Add product images (replace placeholders)
- [ ] Display prices in both USD and selected crypto (SOL/USDC)
- [ ] Implement quantity selector
- [ ] Add to cart with feedback

#### ✅ Cart Management
- Zustand store configured for cart state
- Add/remove/update quantity methods implemented
- Total calculation in USD and crypto

### Part 3: Crossmint Integration & Checkout (35% of evaluation)

#### 📝 TODO: Shipping Information
- [ ] Create shipping address form with validation
- [ ] Required fields: Name, Address Line 1 & 2, City, State, ZIP
- [ ] US addresses only
- [ ] Store in secure storage

#### 📝 TODO: Crossmint Order Creation
```typescript
// Example implementation for Solana payments
const createOrder = async () => {
  const response = await fetch('https://api.crossmint.com/api/2022-06-09/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-secret': process.env.CROSSMINT_CLIENT_SECRET
    },
    body: JSON.stringify({
      recipient: {
        email: userEmail,
        physicalAddress: shippingAddress
      },
      payment: {
        method: 'solana-devnet', // Using Solana Devnet
        currency: selectedPaymentCurrency // 'sol' or 'usdc'
      },
      lineItems: cartItems.map(item => ({
        productLocator: `amazon:${item.asin}`,
        quantity: item.quantity
      }))
    })
  });
  return response.json();
};
```

#### 📝 TODO: Payment Flow Implementation
- [ ] Display quote with expiration timer
- [ ] Update payer address from Privy wallet
- [ ] Sign transaction using Privy/Solana Web3.js
- [ ] Poll for payment status (2.5s intervals, max 5 minutes)
- [ ] Show success/failure screens

#### 📝 TODO: Error Handling
- [ ] Quote expiration handling
- [ ] Network failure recovery
- [ ] Invalid address validation
- [ ] Payment failure states
- [ ] Insufficient balance checks

### Part 4: Polish & Best Practices (15% of evaluation)

#### 📝 TODO: Code Quality
- [ ] Remove all TypeScript `any` types
- [ ] Add error boundaries
- [ ] Implement loading states
- [ ] Add keyboard avoiding views
- [ ] Implement pull-to-refresh

#### 📝 TODO: Performance
- [ ] Optimize re-renders with React.memo
- [ ] Implement list virtualization for products
- [ ] Add image caching
- [ ] Use useMemo/useCallback where appropriate

#### 📝 TODO: Security
- [ ] Verify no hardcoded API keys
- [ ] Validate all user inputs
- [ ] Implement secure storage for sensitive data

## Evaluation Criteria

### Must-Haves (Pass/Fail)
- [ ] Functional Privy authentication with Solana wallet
- [ ] Working cart functionality
- [ ] Crossmint API integration (at least quote creation)
- [ ] TypeScript with proper types
- [ ] Clean, readable code
- [ ] Basic error handling

### Quality Metrics (Scored 1-5)

1. **Architecture & Code Organization**
   - Feature-based folder structure ✅
   - Separation of concerns
   - Reusable components

2. **State Management**
   - Proper Zustand store structure ✅
   - React Query for server state
   - No prop drilling

3. **TypeScript Usage**
   - Strict mode compliance ✅
   - Custom types for domain objects ✅
   - No `any` types

4. **Error Handling & UX**
   - Loading states
   - Error messages
   - Form validation
   - Mobile-optimized interactions

5. **Security & Best Practices**
   - Environment variables ✅
   - Input sanitization
   - Secure storage usage

### Bonus Points
- Unit tests (Jest/React Native Testing Library)
- Animations with React Native Reanimated
- Biometric authentication
- Accessibility features
- Performance optimizations
- Clean UI with consistent design system

## Architecture Decisions

### State Management
- **Zustand** for local state (cart, user preferences)
- **React Query** for server state (orders, quotes)
- **Expo Secure Store** for sensitive data

### Payment Flow
1. User selects payment currency (SOL or USDC)
2. Create quote with Crossmint API
3. Sign transaction with Privy-connected Solana wallet
4. Submit signed transaction to Solana Devnet
5. Poll for payment confirmation
6. Display success/failure

### Folder Structure
```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # API integrations (Privy, Crossmint)
├── store/          # Zustand stores
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── utils/          # Helper functions and constants
└── app/            # Expo Router configuration
```

## API Resources

### Privy Setup
1. Create account at https://www.privy.io/
2. Create new app (select React Native)
3. Enable Solana chain support
4. Get your App ID from dashboard
5. Documentation: https://docs.privy.io/guide/react-native/

### Crossmint Setup
1. Create account at https://www.crossmint.com/
2. Get API keys from dashboard (use testnet)
3. Configure for Solana Devnet payments
4. Documentation: https://docs.crossmint.com/payments/headless/

### Solana Resources
- **Devnet RPC:** https://api.devnet.solana.com
- **Faucet:** https://faucet.solana.com/
- **Explorer:** https://explorer.solana.com/?cluster=devnet
- **Web3.js Docs:** https://solana-labs.github.io/solana-web3.js/

## Deliverables

### 1. GitHub Repository
- Clean commit history with atomic commits
- Proper `.gitignore` (already configured)
- No committed secrets or API keys
- README with setup instructions

### 2. Features Implemented Checklist
- [ ] Privy wallet authentication (Solana)
- [ ] Product listing and details
- [ ] Cart management with Zustand
- [ ] Shipping address form
- [ ] Payment currency selection (SOL/USDC)
- [ ] Crossmint quote creation
- [ ] Transaction signing with Privy
- [ ] Payment status polling
- [ ] Success/failure screens

### 3. Demo Video (Optional but Recommended)
- 3-5 minute screen recording
- Complete purchase flow demonstration
- Highlight any special features implemented

## Time Tracking
| Date | Hours | Section | Work Completed |
|------|-------|---------|----------------|
| | | Setup | Project initialization, dependencies |
| | | Auth | Privy integration |
| | | Products | Product screens, cart |
| | | Checkout | Crossmint integration |
| | | Polish | Error handling, UX improvements |
| | | **Total** | **X hours** |

## Known Limitations
Document any features not fully implemented or technical constraints encountered.

## Submission Instructions

1. **Add GitHub Collaborators**
   - Add evaluator GitHub usernames as collaborators

2. **Email Notification**
   Send to: rr@vala.finance
   - Subject: "Technical Assessment - [Your Name]"
   - GitHub repository link
   - Demo video link (if created)
   - Any setup notes for testing

3. **Test Credentials**
   Provide test wallet seed phrase or instructions for reviewers

## FAQ

**Q: Can I use Expo development build instead of Expo Go?**  
A: Yes, if Privy requires it. Document the build process in your README.

**Q: Should I implement actual payment processing?**  
A: Use Solana Devnet only. No real transactions should be possible.

**Q: What if I can't complete everything in time?**  
A: Focus on code quality over feature completeness. Document what you would implement given more time.

**Q: Which payment currency should be the default?**  
A: SOL is the default, but users should be able to switch between SOL and USDC.

**Q: How should I handle the exchange rates?**  
A: Use the mock rates provided: 1 SOL = $20, 1 USDC = $1

## Questions?
- Technical questions: rr@vala.finance
- Process questions: revi@vala.finance

---

Good luck! We're excited to see your implementation using Solana for Web3 payments.
