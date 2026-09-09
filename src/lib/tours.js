export const TOURS = {
  '/': {
    key: 'dashboard',
    steps: [
      { target: 'main h1', title: 'Welcome to Everbind', body: 'Your wedding planning hub. Track your countdown and jump into any tool from here.', placement: 'bottom' },
      { target: 'main .elegant-card', title: 'Your planning tools', body: 'Click any card to start planning — timeline, vows, guests, budget, and more.', placement: 'top' },
    ],
  },
  '/timeline': {
    key: 'timeline',
    steps: [
      { target: 'main h1', title: 'Timeline Builder', body: 'Add events like first look, ceremony, and reception to build your run-of-show. Use the Optimizer for AI-suggested pacing.', placement: 'bottom' },
    ],
  },
  '/vows': {
    key: 'vows',
    steps: [
      { target: 'main h1', title: 'Vow Writing Companion', body: 'Answer a few prompts about your relationship and we will help shape your vows into something personal.', placement: 'bottom' },
    ],
  },
  '/guests': {
    key: 'guests',
    steps: [
      { target: 'main h1', title: 'Guests & Seating', body: 'Add guests, track RSVPs and invitations, then drag them to tables to arrange your seating chart.', placement: 'bottom' },
    ],
  },
  '/budget': {
    key: 'budget',
    steps: [
      { target: 'main h1', title: 'Budget Tracker', body: 'Log estimated and actual costs per category to stay on top of spending.', placement: 'bottom' },
    ],
  },
  '/pricing': {
    key: 'pricing',
    steps: [
      { target: 'main h1', title: 'Plan & Tiers', body: 'Pick the plan that fits your celebration. Upgrade anytime as your needs grow.', placement: 'bottom' },
    ],
  },
  '/travel': {
    key: 'travel',
    steps: [
      { target: 'main h1', title: 'Destination Travel Suite', body: 'Switch between hotels, flights, guest itinerary, welcome bags, packing, and weather planning using the tabs above.', placement: 'bottom' },
    ],
  },
  '/rehearsal': {
    key: 'rehearsal',
    steps: [
      { target: 'main h1', title: 'Rehearsal Dinner Planner', body: 'Plan your rehearsal venue, schedule, guest list, toasts, and budget all in one place.', placement: 'bottom' },
    ],
  },
  '/vendors': {
    key: 'vendors',
    steps: [
      { target: 'main h1', title: 'Vendor Directory', body: 'Track contacts, booking status, and payment schedules for every vendor.', placement: 'bottom' },
    ],
  },
  '/moodboard': {
    key: 'moodboard',
    steps: [
      { target: 'main h1', title: 'Mood Board', body: 'Collect inspiration images, color palettes, and style notes for your wedding aesthetic.', placement: 'bottom' },
    ],
  },
  '/speeches': {
    key: 'speeches',
    steps: [
      { target: 'main h1', title: 'Speech Generator', body: 'Guide speakers through prompts and generate a heartfelt first draft for any role.', placement: 'bottom' },
    ],
  },
  '/ideas': {
    key: 'ideas',
    steps: [
      { target: 'main h1', title: 'Moment Ideas', body: 'Get AI-suggested moments to make your ceremony and reception memorable.', placement: 'bottom' },
    ],
  },
  '/optimizer': {
    key: 'optimizer',
    steps: [
      { target: 'main h1', title: 'Timeline Optimizer', body: 'Let AI suggest a paced run-of-show based on your wedding details and vendors.', placement: 'bottom' },
    ],
  },
  '/shotlist': {
    key: 'shotlist',
    steps: [
      { target: 'main h1', title: 'Shot List', body: 'Track must-have photos so nothing gets missed on the big day.', placement: 'bottom' },
    ],
  },
  '/reminders': {
    key: 'reminders',
    steps: [
      { target: 'main h1', title: 'Reminders', body: 'Keep track of deadlines and tasks leading up to your wedding.', placement: 'bottom' },
    ],
  },
  '/website': {
    key: 'website',
    steps: [
      { target: 'main h1', title: 'Wedding Website', body: 'Set up your public wedding page with details and RSVP for guests.', placement: 'bottom' },
    ],
  },
  '/checkout': {
    key: 'checkout',
    steps: [
      { target: 'main h1', title: 'Checkout', body: 'Review your selected tier and enter payment info to unlock your planning tools.', placement: 'bottom' },
    ],
  },
};