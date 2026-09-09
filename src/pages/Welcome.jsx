import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Heart, Users, DollarSign, Sparkles, Plane, ArrowRight, Check } from 'lucide-react';

const TIERS = [
  { name: 'Single Day', price: 199, tagline: 'For one perfect day', features: ['Timeline builder', 'Vow writing companion', 'Moment idea generator', 'Budget tracker', 'Guest list & seating', 'Countdown & reminders'] },
  { name: 'Multiday', price: 299, tagline: 'For a full weekend', features: ['Everything in Single Day', 'Speech generator', 'Mood board', 'Vendor directory', 'Rehearsal dinner planner', 'Timeline optimizer'] },
  { name: 'Destination', price: 399, tagline: 'For a far-from-home celebration', features: ['Everything in Multiday', 'Destination Travel Suite', 'Hotel & flight tracker', 'Guest itinerary page', 'Packing & document checklist', 'Weather & backup plan'] },
];

export default function Welcome() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          <p className="text-[11px] tracking-[0.3em] uppercase text-primary mb-4">Wedding Planning, Beautifully Simple</p>
          <h1 className="serif-heading text-5xl sm:text-6xl text-foreground leading-tight max-w-3xl mx-auto">
            Plan every moment of your wedding in one elegant place
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
            Everbind brings your timeline, budget, guests, vows, and travel plans together — so you can focus on each other, not the spreadsheets.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <Link to="/register"><Button size="lg" className="bg-primary hover:bg-primary/90">Start planning <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="serif-heading text-3xl text-center text-foreground mb-3">Everything you need, nothing you don't</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">From the first save-the-date to the final send-off, Everbind guides you through every step.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Calendar, title: 'Timeline Builder', body: 'Arrange your day-of moments into a clear, paced schedule.' },
              { icon: Heart, title: 'Vow Companion', body: 'Answer a few prompts and shape vows that sound like you.' },
              { icon: Users, title: 'Guests & Seating', body: 'Manage your list, track RSVPs, and drag-and-drop tables.' },
              { icon: DollarSign, title: 'Budget Tracker', body: 'Log estimates and actuals so there are no surprises.' },
              { icon: Sparkles, title: 'Moment Ideas', body: 'AI-suggested touches to make your day uniquely yours.' },
              { icon: Plane, title: 'Travel Suite', body: 'Hotels, flights, itinerary, and packing for destination weddings.' },
            ].map((f) => (
              <div key={f.title} className="elegant-card p-6">
                <f.icon className="w-7 h-7 text-primary mb-3" />
                <h3 className="serif-heading text-lg text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="serif-heading text-3xl text-center text-foreground mb-3">Choose your experience</h2>
          <p className="text-center text-muted-foreground mb-12">One-time purchase. No subscriptions, no surprises.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((t) => (
              <div key={t.name} className="elegant-card p-7 flex flex-col">
                <h3 className="serif-heading text-xl text-foreground">{t.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t.tagline}</p>
                <p className="serif-heading text-4xl text-primary mb-5">${t.price}</p>
                <ul className="space-y-2 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6"><Button variant="outline" className="w-full">Get started</Button></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="serif-heading text-3xl mb-3">Ready to begin?</h2>
          <p className="text-primary-foreground/80 mb-8">Create your account and start planning in minutes.</p>
          <Link to="/register"><Button size="lg" variant="secondary">Start planning <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </div>
      </section>
    </div>
  );
}