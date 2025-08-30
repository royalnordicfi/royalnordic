# Royal Nordic - Adventure Tours & Experiences

A modern web application for Royal Nordic, offering Northern Lights tours, snowshoe rentals, and customized adventure experiences in the Nordic region.

## Features

- **Northern Lights Tours**: Book guided tours to witness the aurora borealis
- **Snowshoe Rentals**: Rent snowshoes for winter adventures
- **Customized Tours**: Request personalized adventure experiences
- **Admin Panel**: Manage bookings and tour requests
- **Payment Integration**: Secure Stripe payment processing
- **Responsive Design**: Modern, mobile-friendly interface

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: Nodemailer
- **Deployment**: Vercel/Netlify ready

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/royalnordic.git
cd royalnordic
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env` file with the following variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

## Project Structure

```
royalnordic/
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utility libraries
│   └── App.tsx        # Main application
├── supabase/          # Database functions & migrations
├── public/            # Static assets
└── server.js          # Express server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary to Royal Nordic.

## Support

For support, contact the development team or create an issue in the repository.
