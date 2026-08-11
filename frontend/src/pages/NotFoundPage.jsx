import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../utils/constants';
import { Compass, ArrowRight, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <Card variant="warm" className="max-w-md w-full text-center p-8 space-y-6 shadow-soft">
        <div className="mx-auto w-12 h-12 rounded-xl bg-brand-sage/20 border border-brand-sage/40 flex items-center justify-center text-brand-dark">
          <Compass className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="text-meta-sm font-semibold uppercase tracking-widest text-muted-text-light">
            404 — Page Not Found
          </span>
          <h1 className="text-app-xl font-semibold text-brand-dark">
            A quiet, uncharted path
          </h1>
          <p className="text-body-md text-muted-text leading-relaxed">
            The page you are looking for does not exist or has been peacefully relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to={ROUTES.DASHBOARD} className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full" icon={Home}>
              Dashboard
            </Button>
          </Link>
          <Link to={ROUTES.HOME} className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full">
              Public Overview
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
