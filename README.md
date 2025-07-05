# CameroCare
This is a Cameroon community service platform where People can provide help and request help.

It's design in such a way where both those who help and request help choose the category of help they need or can provide then appears in a social media like form as a post with name of the person, the categories and his location an appear as a feed.

Those who request help would be limited to 3 categories but Helpers can't provide as many categories at their will.

## New Features

### 🤝 Enhanced "Offer Help" Experience
- **Step-by-step Modal Flow**: Guided 4-step process for offering help
- **Profile Showcase**: Helpers can display their skills, badges, and ratings
- **Trust Building**: Verification badges and rating system
- **Smart Messaging**: Pre-filled personalized messages with customization
- **Status Tracking**: Real-time tracking of offer status (Pending, Accepted, Declined)
- **Mobile-First Design**: Optimized for all screen sizes

### 📱 User Experience Improvements
- **Micro-interactions**: Smooth animations and hover effects
- **Trust Indicators**: Helper badges, ratings, and completion counts
- **Real-time Updates**: Live participant counts and status updates
- **Accessibility**: Screen reader friendly and keyboard navigation

## New API Endpoints

### Help Offers
- `POST /api/posts/[id]/offer-help` - Submit a help offer
- `GET /api/posts/[id]/offer-help` - Get help offers for a post (post author only)

### Database Schema Updates
```sql
-- Help Offers Table
CREATE TABLE help_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  helper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  availability TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  skills_offered TEXT[] DEFAULT '{}',
  helper_profile JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Bookmarks Table
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- User Shares Table
CREATE TABLE user_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Getting Started
Installing packages :
```bash
npm install @headlessui/react@^2.2.0 @heroicons/react@^2.2.0 @prisma/client@^6.2.1 @radix-ui/react-tabs@^1.1.2 bcrypt@^5.1.1 bcryptjs@^2.4.3 clsx@^2.1.1 date-fns@^4.1.0 lodash@^4.17.21 lucide-react@^0.471.1 mongodb@^6.12.0 mongoose@^8.9.5 next@^15.1.4 next-auth@^4.24.11 react@^19.0.0 react-dom@^19.0.0 react-icons@^5.4.0 socket.io-client@^4.8.1 tailwind-merge@^2.6.0

npm install -D @eslint/eslintrc@^3 @types/bcrypt@^5.0.2 @types/bcryptjs@^2.4.6 @types/lodash@^4.17.14 @types/next@^8.0.7 @types/node@^20 @types/react@^19 @types/react-dom@^19 eslint@^9 eslint-config-next@15.1.4 postcss@^8 tailwindcss@^3.4.1 typescript@^5

```

If the package.json is properly configured and contains the dependencies, you can install them all at once by running:

```bash

npm install

```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## connecting with mongodb locally for the authentification
create a database on the MongoDB compass 
copy the string link (e.g "mongodb://localhost:27017/your-database")
create a an environment variable .env.local and put :
```javascript
MONGODB_URI=mongodb://localhost:27017/CameroCare
NEXTAUTH_URL=http://localhost:3000

```


## Technologies Used

- **Frontend**: [typescript] [javascript]
- **Styling**: [Tailwind]
- **Hosting**: Deployed using [Github] / [vercel]


## screenshot
[SIGNIN]
![Signin page Screenshot](./screenshot/signin.png)

[SIGNUP]
![Signup page Screenshot](./screenshot/signup.png)

[PAGE_LAYOUT]
![Main page Screenshot](./screenshot/sec.png)

[Feed_HelpRequst]
![HelpRequst page Screenshot](./screenshot/feed_help_request1.png)
![HelpRequst page Screenshot](./screenshot/feed_help_request2.png)

[Feed_helpoffer]
![helpoffer page Screenshot](./screenshot/feed_help_offer1.png)
![helpoffer page Screenshot](./screenshot/feef_help_offer2.png)

## Contact

Feel free to reach out with feedback or inquiries:

- **Email**: [e.bryandze@gmail.com]
- **X** : [https://x.com/dze_bryan]
- **LinkedIn**: [www.linkedin.com/in/dzebryan237]
- **GitHub**: [https://github.com/G-Bryan237]

---

Thank you for visiting my website!

## UI/UX Design Principles

### Trust & Safety
- **Verification Badges**: Quick responder, verified helper, top rated
- **Rating System**: 5-star rating with completion count
- **Profile Transparency**: Skills, bio, and help history
- **Secure Communication**: All messages through platform initially

### Engagement Features
- **Gamification**: Badges for helping, response time, completions
- **Social Proof**: Helper count, ratings, and testimonials
- **Progress Tracking**: Visual progress through help offer steps
- **Instant Feedback**: Real-time status updates and notifications

### Mobile-First Approach
- **Touch-Friendly**: Large buttons and easy navigation
- **Responsive Design**: Works perfectly on all screen sizes
- **Fast Loading**: Optimized for mobile data connections
- **Offline Support**: Cache important data for offline viewing

