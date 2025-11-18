# Budget Buddy

A comprehensive personal finance management application that helps you track your income, manage expenses, set budget goals, and receive AI-powered financial advice.

## Features

### 📊 Dashboard
- Real-time overview of your financial health
- Visual representations of income vs expenses
- Spending trends and category breakdowns
- Monthly financial summaries

### 💰 Income Tracking
- Add and manage multiple income sources
- Track income by date and description
- View income history and trends

### 💳 Expense Management
- Categorized expense tracking
- Receipt scanning with AI (automatically extract amounts and categories)
- Custom expense categories
- Add notes and details to expenses
- Edit and delete expense records

### 🎯 Budget Goals
- Set spending limits by category
- Track progress against budget targets
- Monthly and weekly budget periods
- Visual progress indicators

### 🤖 AI Financial Advisor
- Personalized budget recommendations
- Spending pattern analysis
- Financial insights based on your data
- Smart suggestions for savings

### ⚙️ Settings
- Multi-currency support with auto-detection
- Customizable expense categories
- Profile management
- Secure authentication

## Technologies Used

This project is built with modern web technologies:

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (Database, Authentication, Storage, Edge Functions)
- **AI Integration**: AI-powered receipt scanning and financial advice
- **Routing**: React Router
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd budget-buddy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase credentials.

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
├── pages/            # Main application pages
├── utils/            # Utility functions
├── integrations/     # Third-party integrations
└── lib/              # Library configurations

supabase/
├── functions/        # Edge functions for AI features
└── config.toml       # Supabase configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Receipt Scanning
Upload a photo of your receipt, and the AI will automatically extract:
- Total amount
- Expense category
- Additional notes

### Currency Auto-Detection
The app automatically detects your currency based on your location, supporting multiple international currencies.

### Secure Authentication
User data is protected with secure authentication and row-level security policies.

## Contributing

This is a school project. For any questions or suggestions, please contact the project maintainer.

## License

This project is created for educational purposes.
